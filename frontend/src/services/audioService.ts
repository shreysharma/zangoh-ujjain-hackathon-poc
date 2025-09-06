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

  constructor() {
    console.log('🎵 AudioService initialized with isAudioEnabled:', this.isAudioEnabled)
  }

  // Set callback to determine when audio should be sent
  setShouldSendAudioCallback(callback: () => boolean): void {
    this.shouldSendAudio = callback
  }

  // Set callback for user speaking events (for interruption handling)
  setUserSpeakingCallback(callback: (isSpeaking: boolean) => void): void {
    this.onUserSpeakingCallback = callback
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
      
      console.log('Audio processing setup completed - sending all audio chunks immediately')
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
    
    // Trigger interruption if user starts speaking
    if (!wasUserSpeaking && this.isUserSpeaking) {
      console.log('🔊 User started speaking - triggering interruption')
      this.triggerInterruption()
    } else if (wasUserSpeaking && !this.isUserSpeaking) {
      console.log('🤫 User stopped speaking')
    }
    
    // Notify callback about speaking state change
    if (wasUserSpeaking !== this.isUserSpeaking && this.onUserSpeakingCallback) {
      this.onUserSpeakingCallback(this.isUserSpeaking)
    }
    
    // Send ALL audio chunks immediately to backend (no filtering or voice detection)
    apiService.sendAudio(pcmData)
    console.log(`🎤 Sent audio chunk immediately - frame size: ${pcmData.length} samples, RMS: ${rms.toFixed(4)}`)
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

  // Trigger interruption when user starts speaking
  private triggerInterruption(): void {
    if (this.isAudioPlaying) {
      console.log('🛑 Interrupting bot speech - user is speaking')
      this.stopCurrentAudio()
      this.clearAudioQueue()
      
      // Send interruption signal to backend
      apiService.sendInterruption()
    }
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
    console.log('🧹 Audio processing stopped and caches cleared')
    
    console.log('Audio processing stopped')
  }

  // Clear session storage flag (call when user explicitly disconnects)
  clearAudioActivationMemory(): void {
    sessionStorage.removeItem('audioActivated')
    console.log('🗑️ Cleared audio activation memory from session storage')
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
        console.log('🗓️ User interaction too old (>30 days), requiring new interaction')
        return false
      }
    }
    
    console.log('📊 User interaction history:', { hasInteracted, autoPlayEnabled, daysSince: lastInteraction ? Math.floor((Date.now() - parseInt(lastInteraction)) / (1000 * 60 * 60 * 24)) : 'unknown' })
    return hasInteracted && autoPlayEnabled
  }

  // Try automatic audio activation based on user history
  async tryAutoActivateFromHistory(): Promise<boolean> {
    if (!this.hasUserInteractedWithAudio()) {
      console.log('🔇 No previous user interaction found - cannot auto-activate')
      return false
    }

    console.log('🎯 User has previously interacted with audio - attempting auto-activation')
    try {
      const activated = await this.activateAudioContext()
      if (activated) {
        console.log('✅ Auto-activation successful based on user history!')
        return true
      } else {
        console.log('⚠️ Auto-activation failed despite user history - browser still blocking')
        return false
      }
    } catch (error) {
      console.log('❌ Auto-activation error:', error)
      return false
    }
  }

  // Initialize or get shared audio context for playback
  private async getSharedAudioContext(): Promise<AudioContext> {
    if (!this.sharedAudioContext || this.sharedAudioContext.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      this.sharedAudioContext = new AudioContextClass()
      console.log('🔊 Created new shared audio context for playback')
    }
    
    // Resume audio context if suspended (required for browser autoplay policies)
    if (this.sharedAudioContext.state === 'suspended') {
      console.log('🔊 Resuming suspended audio context')
      try {
        await this.sharedAudioContext.resume()
        console.log('🔊 Audio context resumed successfully')
      } catch (error) {
        console.error('❌ Failed to resume audio context:', error)
      }
    }
    
    return this.sharedAudioContext
  }

  // Add audio to playback queue - PLAY ALL CHUNKS
  async playAudioResponse(base64Audio: string, chunkNumber?: number): Promise<void> {
    console.log('🎵 playAudioResponse called with:', {
      base64Length: base64Audio.length,
      chunkNumber,
      isAudioEnabled: this.isAudioEnabled,
      queueLength: this.audioQueue.length,
      isProcessing: this.isProcessingAudioQueue,
      isPlaying: this.isAudioPlaying
    })

    // Check if audio playback is enabled
    if (!this.isAudioEnabled) {
      console.log('🔇 Audio playback disabled, skipping audio chunk')
      return
    }

    // REMOVED DUPLICATE DETECTION - PLAY ALL CHUNKS
    const chunkId = chunkNumber !== undefined ? `chunk_${chunkNumber}` : `audio_${Date.now()}`
    
    console.log('🔊 Adding audio to queue, base64 length:', base64Audio.length, 'chunk:', chunkId)
    this.audioQueue.push({ base64Audio, chunkNumber })
    
    // Process queue immediately
    if (!this.isProcessingAudioQueue) {
      this.processAudioQueue()
    }
  }

  // Process audio queue sequentially
  private async processAudioQueue(): Promise<void> {
    console.log('🎵 processAudioQueue called:', {
      isAudioEnabled: this.isAudioEnabled,
      isProcessing: this.isProcessingAudioQueue,
      queueLength: this.audioQueue.length,
      sharedAudioContext: this.sharedAudioContext?.state
    })
    
    if (this.isProcessingAudioQueue || this.audioQueue.length === 0) {
      console.log('🔄 processAudioQueue skipped:', {
        isProcessing: this.isProcessingAudioQueue,
        queueLength: this.audioQueue.length
      })
      return
    }
    
    this.isProcessingAudioQueue = true
    console.log(`🎵 Processing audio queue with ${this.audioQueue.length} items`)
    
    while (this.audioQueue.length > 0) {
      const audioData = this.audioQueue.shift()
      if (!audioData) continue
      
      console.log('🎵 Waiting for current audio to finish...', {
        isPlaying: this.isAudioPlaying
      })
      
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
        console.log('🎵 Playing next audio chunk from queue')
        await this.playAudioImmediately(audioData.base64Audio)
      } catch (error) {
        console.error('❌ Error playing audio chunk:', error)
        this.isAudioPlaying = false // Reset flag on error
        // Continue with next chunk even if this one fails
      }
    }
    
    this.isProcessingAudioQueue = false
    console.log('✅ Audio queue processing completed')
  }

  // Play audio immediately (used by queue processor)
  private async playAudioImmediately(base64Audio: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('🔊 Playing audio immediately, base64 length:', base64Audio.length)
        
        // Decode base64 to bytes
        const audioBytes = atob(base64Audio)
        const audioArray = new Uint8Array(audioBytes.length)
        for (let i = 0; i < audioBytes.length; i++) {
          audioArray[i] = audioBytes.charCodeAt(i)
        }
        
        console.log('🔊 Audio array length:', audioArray.length)
        console.log('🔊 First 10 bytes:', Array.from(audioArray.slice(0, 10)))
        
        // Use shared audio context (async to handle resume)
        const audioContext = await this.getSharedAudioContext()
        console.log('🔊 Audio context state before play:', audioContext.state)
        
        // Force resume if suspended
        if (audioContext.state === 'suspended') {
          console.log('🔊 Audio context is suspended, resuming...')
          await audioContext.resume()
          console.log('🔊 Audio context state after resume:', audioContext.state)
        }
        
        // For PCM 24kHz 16-bit mono (Gemini Live output format)
        const sampleRate = 24000
        const channels = 1
        const frameCount = audioArray.length / 2 // 16-bit = 2 bytes per sample
        
        console.log(`🔊 Audio details: ${frameCount} frames, ${(frameCount/sampleRate).toFixed(2)} seconds, rate: ${sampleRate}Hz`)
        
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
        
        this.currentAudioSource.onended = () => {
          console.log('✅ Audio playback completed successfully')
          this.isAudioPlaying = false
          this.currentAudioSource = null
          resolve()
        }
        
        // Add error handler
        this.currentAudioSource.onerror = (error) => {
          console.error('❌ Audio source error:', error)
          this.isAudioPlaying = false
          this.currentAudioSource = null
          resolve() // Continue with next chunk even on error
        }
        
        // Start playback
        this.currentAudioSource.start(0)
        console.log(`🎵 Audio playback started: ${frameCount} frames, ${(frameCount/sampleRate).toFixed(2)} seconds duration`)
        
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
        console.log('Stopped current audio playback')
      } catch (error) {
        console.log('Audio source already stopped')
      }
      this.currentAudioSource = null
    }
    
    this.isAudioPlaying = false
  }

  // Clear audio queue
  clearAudioQueue(): void {
    this.audioQueue = []
    this.isProcessingAudioQueue = false
    console.log('Audio queue cleared')
  }

  // Get queue length
  getQueueLength(): number {
    return this.audioQueue.length
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
      console.log('🔊 Audio context activated:', audioContext.state)
      
      // Remember that user activated audio in this session
      if (audioContext.state === 'running') {
        sessionStorage.setItem('audioActivated', 'true')
        console.log('💾 Audio activation saved to session storage')
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
    console.log('🔊 Testing audio playback with a beep...')
    try {
      const audioContext = await this.getSharedAudioContext()
      console.log('🔊 Test audio context state:', audioContext.state)
      
      // Create a simple beep
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 440 // A4 note
      gainNode.gain.value = 0.3
      
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.2) // 200ms beep
      
      console.log('✅ Test beep played successfully')
      return new Promise(resolve => setTimeout(resolve, 300))
    } catch (error) {
      console.error('❌ Test audio playback failed:', error)
      throw error
    }
  }

  // Cleanup method to stop all audio processing
  cleanup(): void {
    console.log('🧹 Cleaning up audio service...')
    this.stopAudioProcessing()
    this.stopCurrentAudio()
    this.clearAudioQueue()
    
    if (this.sharedAudioContext && this.sharedAudioContext.state !== 'closed') {
      this.sharedAudioContext.close()
      this.sharedAudioContext = null
    }
    
    console.log('✅ Audio service cleanup completed')
  }
}

// Export singleton instance
export const audioService = new AudioService()

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).audioService = audioService
}