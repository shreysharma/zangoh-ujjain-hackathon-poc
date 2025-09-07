'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useGlobalConversation } from '../providers/ConversationProvider'
import { apiService, type StreamResponse } from '../services/apiService'
import { audioService } from '../services/audioService'

export const useConnectionManager = (showNotification: (message: string, type?: 'success' | 'error' | 'info') => void) => {
  const { 
    addHumanMessage, 
    addBotMessage, 
    addToolMessage,
    addProductLinks,
    updateOrAddBotMessage,
    finalizeStreamingMessage,
    clearProductMessages
  } = useGlobalConversation()
  
  // Backend connection states
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [responseModality, setResponseModality] = useState<'AUDIO' | 'TEXT'>('AUDIO')
  
  // Stream processing states
  const [currentTurnActive, setCurrentTurnActive] = useState(false)
  const [currentTextBuffer, setCurrentTextBuffer] = useState('')
  const [currentTranscriptionBuffer, setCurrentTranscriptionBuffer] = useState('')
  
  // Audio-transcript sync states
  const [currentTranscriptText, setCurrentTranscriptText] = useState('')
  const [displayTranscript, setDisplayTranscript] = useState('')
  
  
  // Audio-transcription sync states
  const [isAudioMode, setIsAudioMode] = useState(false)
  const [shouldShowTranscription, setShouldShowTranscription] = useState(false)

  // Store the latest values in refs to avoid stale closures
  const currentTextBufferRef = useRef(currentTextBuffer)
  const currentTranscriptionBufferRef = useRef(currentTranscriptionBuffer)
  const currentTurnActiveRef = useRef(currentTurnActive)
  const currentTranscriptTextRef = useRef(currentTranscriptText)
  
  // Update refs when state changes
  useEffect(() => {
    currentTextBufferRef.current = currentTextBuffer
    currentTranscriptionBufferRef.current = currentTranscriptionBuffer
    currentTurnActiveRef.current = currentTurnActive
    currentTranscriptTextRef.current = currentTranscriptText
  }, [currentTextBuffer, currentTranscriptionBuffer, currentTurnActive, currentTranscriptText])

  // Handle streaming responses from backend (stabilized to prevent render-time updates)
  const handleStreamResponse = useCallback((data: StreamResponse) => {
    // console.log('📡 handleStreamResponse called with:', data)
    switch (data.type) {
      case 'connected':
        setCurrentTurnActive(false)
        break
        
      case 'text_chunk':
        setCurrentTurnActive(true)
        setCurrentTextBuffer(prev => {
          const newBuffer = prev + (data.text || '')
          updateOrAddBotMessage(newBuffer, false)
          return newBuffer
        })
        break
        
      case 'audio_chunk':
        console.log('🔊 Received audio_chunk:', { 
          chunk_number: data.chunk_number, 
          audio_length: data.audio_data?.length || 0,
          chunk_size: data.chunk_size,
          has_audio_data: !!data.audio_data,
          audio_data_sample: data.audio_data ? data.audio_data.substring(0, 50) + '...' : 'NO DATA'
        })
        setCurrentTurnActive(true)
        setIsAudioMode(true)
        if (data.audio_data) {
          console.log('🎵 Calling audioService.playAudioResponse with chunk:', data.chunk_number)
          
          // Display the current transcription text for all chunks of this transcript
          setDisplayTranscript(currentTranscriptTextRef.current)
          console.log('🎯 Playing chunk', data.chunk_number, 'with current text:', currentTranscriptTextRef.current)
          
          
          // Check if audio context is ready before trying to play
          if (!audioService.isAudioContextReady() || !audioService.isAudioPlaybackEnabled()) {
            console.log('🚨 Audio chunk received but audio context not ready - attempting auto-activation')
            
            // Try auto-activation based on user history
            audioService.tryAutoActivateFromHistory().then(activated => {
              if (activated) {
                console.log('✅ Auto-activated audio for incoming chunk!')
                audioService.setAudioEnabled(true)
                // Try playing the chunk again
                audioService.playAudioResponse(data.audio_data!, data.chunk_number)
              } else {
                console.log('⚠️ Auto-activation failed - showing user prompt')
                // The button in header will be shown as red to prompt user
              }
            }).catch(error => {
              console.log('❌ Auto-activation error:', error)
            })
          }
          
          try {
            audioService.playAudioResponse(data.audio_data, data.chunk_number)
            console.log('✅ audioService.playAudioResponse called successfully')
          } catch (error) {
            console.error('❌ Error calling playAudioResponse:', error)
          }
        } else {
          console.warn('⚠️ Audio chunk received but no audio_data')
        }
        break

      case 'input_transcription':
        if (data.text && data.text.trim()) {
          addHumanMessage(data.text.trim())
          if (currentTurnActiveRef.current) {
            setCurrentTurnActive(false)
          }
          
          // Clear any lingering text from previous turn when new input starts
          setCurrentTranscriptText('')
          setDisplayTranscript('')
          setCurrentTextBuffer('')
          setCurrentTranscriptionBuffer('')
          
          // Don't clear processed chunks - we removed duplicate detection
          // audioService.clearProcessedChunks()
          console.log('🎤 New input transcription received, cleared previous text')
        }
        break

      case 'output_transcription':
        setCurrentTurnActive(true)
        if (data.text && 
            typeof data.text === 'string' && 
            data.text.trim() !== '' && 
            data.text !== 'null' && 
            data.text !== 'undefined' &&
            data.text.toLowerCase() !== 'null' &&
            data.text.length > 0) {
          
          // Store current transcription text for the upcoming audio chunks
          setCurrentTranscriptText(data.text)
          console.log('📝 New transcription text:', data.text)
          
          setCurrentTranscriptionBuffer(prev => {
            const newBuffer = prev + data.text
            // Always update transcription buffer for live display
            return newBuffer
          })
          
          // Always store bot messages to localStorage (as UTF-8 original)
          updateOrAddBotMessage(data.text, true)
        }
        break
        
      case 'turn_complete':
        setCurrentTurnActive(false)
        
        if (data.has_text && currentTextBufferRef.current && currentTextBufferRef.current.trim()) {
          finalizeStreamingMessage(currentTextBufferRef.current, false)
        }
        
        // In audio mode, don't show transcription - just store it for chat view
        if (isAudioMode && currentTranscriptionBufferRef.current && currentTranscriptionBufferRef.current.trim()) {
          const cleanedBuffer = currentTranscriptionBufferRef.current.replace(/^null/gi, '').trim()
          if (cleanedBuffer && cleanedBuffer !== 'null') {
            // Store transcription silently for chat view without displaying in audio view
            finalizeStreamingMessage(cleanedBuffer, true)
          }
        } else if (currentTranscriptionBufferRef.current && currentTranscriptionBufferRef.current.trim()) {
          // Text mode - show immediately
          const cleanedBuffer = currentTranscriptionBufferRef.current.replace(/^null/gi, '').trim()
          if (cleanedBuffer && cleanedBuffer !== 'null') {
            finalizeStreamingMessage(cleanedBuffer, true)
          }
        }
        
        // Don't clear text immediately - wait for audio to finish playing
        // Only clear buffers if not in audio mode or if audio queue is empty
        if (!isAudioMode || audioService.getQueueLength() === 0) {
          // Text mode or no audio - clear after a longer delay to ensure text is visible
          setTimeout(() => {
            setCurrentTextBuffer('')
            setCurrentTranscriptionBuffer('')
            setIsAudioMode(false)
            setShouldShowTranscription(false)
            
            // Clear transcript tracking
            setCurrentTranscriptText('')
            setDisplayTranscript('')
            console.log('🧹 Cleared transcript tracking on turn complete (no audio)')
          }, 2000) // Longer delay for text visibility
        } else {
          // Audio mode - don't clear text until audio finishes
          console.log('🎵 Keeping text visible while audio plays')
          // The text will be cleared when the next turn starts or on interruption
        }
        break
        
      case 'interrupted':
      case 'interruption_triggered':
        console.log('🛑 AI response interrupted:', data.message)
        setCurrentTurnActive(false)
        setCurrentTextBuffer('')
        setCurrentTranscriptionBuffer('')
        setIsAudioMode(false)
        setShouldShowTranscription(false)
        
        // Clear transcript tracking on interruption
        setCurrentTranscriptText('')
        setDisplayTranscript('')
        
        // Stop any ongoing audio playback
        audioService.stopCurrentAudio()
        audioService.clearAudioQueue()
        break
        
      case 'tool_call_start':
        addToolMessage('🔍 Processing your request...')
        break
        
      case 'tool_call_complete':
        break
        
      case 'product_links':
        if (data.links && data.links.length > 0) {
          addProductLinks(data.links, data.function_name)
        }
        break
        
      case 'heartbeat':
        break
        
      case 'input_transcription':
        // Handle user's speech transcription
        if (data.text && data.text.trim()) {
          console.log('🎤 ConnectionManager: User said:', data.text)
          addHumanMessage(data.text)
          // Clear any existing buffers when user speaks
          setCurrentTextBuffer('')
          setCurrentTranscriptionBuffer('')
          setCurrentTranscriptText('')
          setDisplayTranscript('')
        }
        break
        
      case 'output_transcription':
        // Handle bot's speech transcription
        if (data.text) {
          console.log('📝 ConnectionManager: Bot said:', data.text)
          setCurrentTranscriptionBuffer(data.text)
          setCurrentTranscriptText(data.text)
          // Update or add bot message with transcription
          updateOrAddBotMessage(data.text, true)
        }
        break
        
      default:
        break
    }
  }, [addHumanMessage, addBotMessage, addToolMessage, addProductLinks, updateOrAddBotMessage, finalizeStreamingMessage])

  // Manual connect function
  const handleConnect = useCallback(async () => {
    if (isConnecting || isConnected) return
    
    setIsConnecting(true)
    showNotification('Connecting to AI backend...')
    
    try {
      console.log('🔌 Connecting with response modality:', responseModality)
      await apiService.connect(responseModality)
      setIsConnected(true)
      // showNotification(`Connected to AI backend in ${responseModality} mode!`, 'success')
      
      // Clear product messages when manually connecting
      clearProductMessages()
      console.log('🗑️ Cleared product messages on manual connect')
      
      apiService.startEventStream(handleStreamResponse)
      
    } catch (error) {
      console.error('Connection error:', error)
      setIsConnected(false)
      showNotification(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
    } finally {
      setIsConnecting(false)
    }
  }, [isConnecting, isConnected, responseModality, showNotification])

  // Manual disconnect function
  const handleDisconnect = useCallback(async () => {
    try {
      await apiService.disconnect()
      setIsConnected(false)
      showNotification('Disconnected from AI backend')
      
      audioService.stopAudioProcessing()
      audioService.clearAudioQueue()
    } catch (error) {
      console.error('Disconnect error:', error)
      showNotification('Disconnect error')
    }
  }, [showNotification])

  // Handle connection toggle
  const handleConnectionToggle = useCallback(async () => {
    if (isConnecting) return
    
    if (isConnected) {
      await handleDisconnect()
      
      const nextModality = responseModality === 'AUDIO' ? 'AUDIO' : 'AUDIO'
      setResponseModality(nextModality)
      
      setTimeout(async () => {
        await handleConnect()
      }, 500)
    } else {
      await handleConnect()
    }
  }, [isConnecting, isConnected, responseModality, handleDisconnect, handleConnect])

  // Chat message handler
  const handleChatMessage = useCallback(async (message: string) => {
    if (!message.trim()) return
    
    addHumanMessage(message)
    
    if (!isConnected) {
      // showNotification('Not connected to AI backend - using local mode')
      setTimeout(() => {
        addBotMessage("I'm not connected to the AI backend right now. Please check the connection and try again.")
      }, 1000)
      return
    }
    
    if (currentTurnActiveRef.current) {
      const startTime = Date.now()
      const maxWaitMs = 5000
      
      while (currentTurnActiveRef.current && (Date.now() - startTime) < maxWaitMs) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      if (currentTurnActiveRef.current) {
        setCurrentTurnActive(false)
      }
    }
    
    audioService.clearAudioQueue()
    if (audioService.isPlaying) {
      audioService.stopCurrentAudio()
    }
    
    setCurrentTextBuffer('')
    setCurrentTranscriptionBuffer('')
    setCurrentTurnActive(false)
    
    try {
      await apiService.sendText(message)
    } catch (error) {
      console.error('Failed to send message:', error)
      showNotification(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [isConnected, addHumanMessage, addBotMessage, showNotification])

  // File upload handler
  const handleFileUpload = useCallback(async (file: File) => {
    const fileUrl = URL.createObjectURL(file)
    
    const fileInfo = {
      name: file.name,
      type: file.type,
      url: fileUrl
    }
    
    if (file.type.startsWith('image/')) {
      addHumanMessage('', fileInfo)
    } else {
      addHumanMessage(`📎 Uploaded file: ${file.name}`, fileInfo)
    }
    
    if (file.type.startsWith('image/') && isConnected) {
      try {
        const reader = new FileReader()
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1]
          await apiService.sendImage(base64)
          // showNotification('Image sent to AI for analysis')
        }
        reader.readAsDataURL(file)
      } catch (error) {
        console.error('Failed to send image to backend:', error)
        // showNotification('Failed to send image to AI')
      }
    } else if (!isConnected) {
      // showNotification('File uploaded (AI not connected)')
    }
  }, [isConnected, addHumanMessage, showNotification])

  // Monitor audio playback to clear text when audio finishes
  useEffect(() => {
    if (isAudioMode && !currentTurnActive) {
      const checkInterval = setInterval(() => {
        // Check if audio has finished playing
        if (!audioService.isPlaying && audioService.getQueueLength() === 0) {
          console.log('🎵 Audio finished, clearing display text')
          setCurrentTranscriptText('')
          setDisplayTranscript('')
          setIsAudioMode(false)
          clearInterval(checkInterval)
        }
      }, 500) // Check every 500ms
      
      return () => clearInterval(checkInterval)
    }
  }, [isAudioMode, currentTurnActive])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      apiService.disconnect()
      audioService.stopAudioProcessing()
      audioService.clearAudioQueue()
    }
  }, [])

  return {
    isConnected,
    isConnecting,
    responseModality,
    currentTurnActive,
    currentTranscriptionBuffer,
    displayTranscript,
    isAudioMode,
    handleConnect,
    handleDisconnect,
    handleConnectionToggle,
    handleChatMessage,
    handleFileUpload
  }
}