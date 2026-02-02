// Audio service for real-time audio processing and playback
// Handles microphone input, audio streaming, and playback management

import { apiService } from './apiService'

interface AudioPlaybackQueue {
  base64Audio: string
  chunkNumber?: number
}

class AudioService {
  private audioContext: AudioContext | null = null
  private audioProcessor: ScriptProcessorNode | null = null
  private mediaStream: MediaStream | null = null
  private currentAudioSource: AudioBufferSourceNode | null = null
  private sharedAudioContext: AudioContext | null = null
  private isAudioPlaying = false
  private audioQueue: AudioPlaybackQueue[] = []
  private isProcessingAudioQueue = false
  private shouldSendAudio: () => boolean = () => true // Callback to check if audio should be sent
  private processedChunks = new Set<string>() // Track processed audio chunks to prevent duplicates
  private isAudioEnabled = true // Flag to globally enable/disable audio playback
  
  // Interruption detection states
  private voiceActivityThreshold = 0.01 // Threshold for voice detection
  private voiceActivityBuffer: number[] = []
  private readonly voiceActivityBufferSize = 10 // Sample buffer for smoothing
  private isUserSpeaking = false
  private onUserSpeakingCallback: ((isSpeaking: boolean) => void) | null = null
  
  // Audio playing state callback
  private onAudioPlayingCallback: ((isPlaying: boolean) => void) | null = null

  constructor() {
  }

  // Set callback to determine when audio should be sent
  setShouldSendAudioCallback(callback: () => boolean): void {
    this.shouldSendAudio = callback
  }

  // Set callback for user speaking events (for interruption handling)
  setUserSpeakingCallback(callback: (isSpeaking: boolean) => void): void {
    this.onUserSpeakingCallback = callback
  }

  // Set callback for audio playing state changes
  setAudioPlayingCallback(callback: (isPlaying: boolean) => void): void {
    this.onAudioPlayingCallback = callback
  }

  // Enable/disable audio playback globally
  setAudioEnabled(enabled: boolean): void {
    this.isAudioEnabled = enabled
    if (!enabled) {
      this.stopCurrentAudio()
      this.clearAudioQueue()
    }
  }

  // Check if audio playback is enabled
  isAudioPlaybackEnabled(): boolean {
    return this.isAudioEnabled
  }

  // Clear processed chunks cache
  clearProcessedChunks(): void {
    this.processedChunks.clear()
  }


  // Initialize audio processing for microphone input
  async setupAudioProcessing(): Promise<void> {
    try {
      // Get microphone access with optimized constraints (like original frontend)
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,          // Gemini Live requirement
          channelCount: 1,           // Mono audio
          echoCancellation: true,    // Removes echo/feedback
          noiseSuppression: true,    // Reduces background noise
          autoGainControl: false     // Prevents volume pumping
        }
      })
      
      // Create audio context with 16kHz sample rate (Gemini Live requirement)
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ 
        sampleRate: 16000 
      })
      
      const source = this.audioContext.createMediaStreamSource(this.mediaStream)
      
      // Create script processor for real-time audio processing
      this.audioProcessor = this.audioContext.createScriptProcessor(4096, 1, 1)
      
      this.audioProcessor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0)
        const pcmData = new Int16Array(inputData.length)
        
        // Convert float32 to int16 PCM
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32767))
        }
        
        // Only process audio if callback allows it (check response modality)
        if (this.shouldSendAudio()) {
          this.processAudioFrame(pcmData)
        }
      }
      
      source.connect(this.audioProcessor)
      this.audioProcessor.connect(this.audioContext.destination)
      
      // Audio is now sent immediately, no batching needed
      
    } catch (error) {
      console.error('Audio processing setup error:', error)
      throw error
    }
  }

  // Process audio frame - send every chunk immediately
  private processAudioFrame(pcmData: Int16Array): void {
    // Calculate RMS for voice activity detection
    const rms = this.calculateRMS(pcmData)
    const wasUserSpeaking = this.isUserSpeaking
    
    // Update voice activity buffer
    this.voiceActivityBuffer.push(rms)
    if (this.voiceActivityBuffer.length > this.voiceActivityBufferSize) {
      this.voiceActivityBuffer.shift()
    }
    
    // Calculate smoothed average
    const avgActivity = this.voiceActivityBuffer.reduce((sum, val) => sum + val, 0) / this.voiceActivityBuffer.length
    this.isUserSpeaking = avgActivity > this.voiceActivityThreshold
    
    // Log user speaking state changes
    if (!wasUserSpeaking && this.isUserSpeaking) {
    } else if (wasUserSpeaking && !this.isUserSpeaking) {
    }
    
    // Notify callback about speaking state change
    if (wasUserSpeaking !== this.isUserSpeaking && this.onUserSpeakingCallback) {
      this.onUserSpeakingCallback(this.isUserSpeaking)
    }
    
    // Send ALL audio chunks immediately to backend (no filtering or voice detection)
    apiService.sendAudio(pcmData)
  }

  // Calculate RMS (Root Mean Square) for voice activity detection
  private calculateRMS(pcmData: Int16Array): number {
    let sum = 0
    for (let i = 0; i < pcmData.length; i++) {
      const sample = pcmData[i] / 32768 // Normalize to [-1, 1]
      sum += sample * sample
    }
    return Math.sqrt(sum / pcmData.length)
  }



  // Stop audio processing
  stopAudioProcessing(): void {
    if (this.audioProcessor) {
      this.audioProcessor.disconnect()
      this.audioProcessor = null
    }
    
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop())
      this.mediaStream = null
    }

    // Clear audio queue and processed chunks to prevent duplicates
    this.clearAudioQueue()
    this.clearProcessedChunks()
    
  }

  // Clear session storage flag (call when user explicitly disconnects)
  clearAudioActivationMemory(): void {
    sessionStorage.removeItem('audioActivated')
  }

  // Check if user has previously interacted with audio
  hasUserInteractedWithAudio(): boolean {
    const hasInteracted = localStorage.getItem('userHasInteractedWithAudio') === 'true'
    const autoPlayEnabled = localStorage.getItem('audioAutoPlayEnabled') === 'true'
    const lastInteraction = localStorage.getItem('lastAudioInteraction')
    
    // Check if interaction was within last 30 days
    if (lastInteraction) {
      const daysSinceInteraction = (Date.now() - parseInt(lastInteraction)) / (1000 * 60 * 60 * 24)
      if (daysSinceInteraction > 30) {
        return false
      }
    }
    
    return hasInteracted && autoPlayEnabled
  }

  // Try automatic audio activation based on user history
  async tryAutoActivateFromHistory(): Promise<boolean> {
    if (!this.hasUserInteractedWithAudio()) {
      return false
    }

    try {
      const activated = await this.activateAudioContext()
      if (activated) {
        return true
      } else {
        return false
      }
    } catch (error) {
      return false
    }
  }

  // Initialize or get shared audio context for playback
  private async getSharedAudioContext(): Promise<AudioContext> {
    if (!this.sharedAudioContext || this.sharedAudioContext.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      this.sharedAudioContext = new AudioContextClass()
    }
    
    // Resume audio context if suspended (required for browser autoplay policies)
    if (this.sharedAudioContext.state === 'suspended') {
      try {
        await this.sharedAudioContext.resume()
      } catch (error) {
        console.error('❌ Failed to resume audio context:', error)
      }
    }
    
    return this.sharedAudioContext
  }

  // Add audio to playback queue - PLAY ALL CHUNKS
  async playAudioResponse(base64Audio: string, chunkNumber?: number): Promise<void> {

    // Check if audio playback is enabled
    if (!this.isAudioEnabled) {
      return
    }

    // REMOVED DUPLICATE DETECTION - PLAY ALL CHUNKS
    const chunkId = chunkNumber !== undefined ? `chunk_${chunkNumber}` : `audio_${Date.now()}`
    
    this.audioQueue.push({ base64Audio, chunkNumber })
    
    // Process queue immediately
    if (!this.isProcessingAudioQueue) {
      this.processAudioQueue()
    }
  }

  // Process audio queue sequentially
  private async processAudioQueue(): Promise<void> {
    
    if (this.isProcessingAudioQueue || this.audioQueue.length === 0) {
      return
    }
    
    this.isProcessingAudioQueue = true
    
    while (this.audioQueue.length > 0) {
      const audioData = this.audioQueue.shift()
      if (!audioData) continue
      
       
      
      // Wait for any current audio to finish
      let waitCount = 0
      while (this.isAudioPlaying) {
        await new Promise(resolve => setTimeout(resolve, 50))
        waitCount++
        if (waitCount > 100) { // 5 seconds timeout
          console.error('⚠️ Audio playback timeout - force stopping')
          this.isAudioPlaying = false
          this.currentAudioSource = null
          break
        }
      }
      
      // Play the next audio chunk
      try {
        await this.playAudioImmediately(audioData.base64Audio)
      } catch (error) {
        console.error('❌ Error playing audio chunk:', error)
        this.isAudioPlaying = false // Reset flag on error
        // Continue with next chunk even if this one fails
      }
    }
    
    this.isProcessingAudioQueue = false
  }

  // Play audio immediately (used by queue processor)
  private async playAudioImmediately(base64Audio: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        
        // Decode base64 to bytes
        const audioBytes = atob(base64Audio)
        const audioArray = new Uint8Array(audioBytes.length)
        for (let i = 0; i < audioBytes.length; i++) {
          audioArray[i] = audioBytes.charCodeAt(i)
        }
        
        
        // Use shared audio context (async to handle resume)
        const audioContext = await this.getSharedAudioContext()
        
        // Force resume if suspended
        if (audioContext.state === 'suspended') {
          await audioContext.resume()
        }
        
        // For PCM 24kHz 16-bit mono (Gemini Live output format)
        const sampleRate = 24000
        const channels = 1
        const frameCount = audioArray.length / 2 // 16-bit = 2 bytes per sample
        
        
        if (frameCount === 0) {
          console.warn('⚠️ No audio frames to play')
          resolve()
          return
        }
        
        const audioBuffer = audioContext.createBuffer(channels, frameCount, sampleRate)
        const channelData = audioBuffer.getChannelData(0)
        
        // Convert 16-bit PCM to float32
        for (let i = 0; i < frameCount; i++) {
          const sample = (audioArray[i * 2] | (audioArray[i * 2 + 1] << 8))
          // Convert from signed 16-bit to float32 (-1 to 1)
          channelData[i] = sample < 32768 ? sample / 32768 : (sample - 65536) / 32768
        }
        
        // Create and configure audio source
        this.currentAudioSource = audioContext.createBufferSource()
        this.currentAudioSource.buffer = audioBuffer
        this.currentAudioSource.connect(audioContext.destination)
        
        // Set playing state and add event listeners
        this.isAudioPlaying = true
        this.onAudioPlayingCallback?.(true) // Notify that audio started playing
        
        this.currentAudioSource.onended = () => {
          this.isAudioPlaying = false
          this.onAudioPlayingCallback?.(false) // Notify that audio stopped playing
          this.currentAudioSource = null
          resolve()
        }
        
        // Add error handler
        this.currentAudioSource.onerror = (error) => {
          console.error('❌ Audio source error:', error)
          this.isAudioPlaying = false
          this.onAudioPlayingCallback?.(false) // Notify that audio stopped due to error
          this.currentAudioSource = null
          resolve() // Continue with next chunk even on error
        }
        
        // Start playback
        this.currentAudioSource.start(0)
        
      } catch (error) {
        console.error('❌ Audio playback error:', error)
        this.isAudioPlaying = false
        this.currentAudioSource = null
        reject(error)
      }
    })
  }

  // Stop current audio playback
  stopCurrentAudio(): void {
    if (this.currentAudioSource) {
      try {
        this.currentAudioSource.stop()
      } catch (error) {
      }
      this.currentAudioSource = null
    }
    
    this.isAudioPlaying = false
    this.onAudioPlayingCallback?.(false) // Notify that audio stopped
  }

  // Clear audio queue
  clearAudioQueue(): void {
    this.audioQueue = []
    this.isProcessingAudioQueue = false
  }

  // Get audio processing status
  get isProcessing(): boolean {
    return this.audioProcessor !== null
  }

  get isPlaying(): boolean {
    return this.isAudioPlaying
  }

  // Activate audio context (for browser autoplay policy compliance)
  async activateAudioContext(): Promise<boolean> {
    try {
      const audioContext = await this.getSharedAudioContext()
      
      // Remember that user activated audio in this session
      if (audioContext.state === 'running') {
        sessionStorage.setItem('audioActivated', 'true')
      }
      
      return audioContext.state === 'running'
    } catch (error) {
      console.error('❌ Failed to activate audio context:', error)
      return false
    }
  }

  // Check if audio context is ready
  isAudioContextReady(): boolean {
    return this.sharedAudioContext?.state === 'running'
  }

  // Test audio playback with a beep
  async testAudioPlayback(): Promise<void> {
    try {
      const audioContext = await this.getSharedAudioContext()
      
      // Create a simple beep
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 440 // A4 note
      gainNode.gain.value = 0.3
      
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.2) // 200ms beep
      
      return new Promise(resolve => setTimeout(resolve, 300))
    } catch (error) {
      console.error('❌ Test audio playback failed:', error)
      throw error
    }
  }
}

// Export singleton instance
export const audioService = new AudioService()

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).audioService = audioService
}