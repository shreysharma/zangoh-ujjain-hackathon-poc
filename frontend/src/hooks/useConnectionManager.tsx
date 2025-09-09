'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useGlobalConversation } from '../providers/ConversationProvider'
import { apiService, type StreamResponse } from '../services/apiService'
import { audioService } from '../services/audioService'
import { videoService } from '../services/videoService'
import { SessionManager } from '../utils/sessionManager'
import { useStreamConnection } from '../providers/StreamConnectionProvider'

export const useConnectionManager = (showNotification: (message: string, type?: 'success' | 'error' | 'info') => void) => {
  const { 
    addHumanMessage, 
    addBotMessage, 
    addToolMessage,
    addProductLinks,
    updateOrAddBotMessage,
    finalizeStreamingMessage,
    clearProductMessages,
    clearConversation,
    addStatusMessage
  } = useGlobalConversation()
  
  const { canMakeApiCalls, setStreamConnected, setStreamDisconnectionReason } = useStreamConnection()
  
  // Set up stream connection checker in apiService
  useEffect(() => {
    apiService.setStreamConnectionChecker(() => canMakeApiCalls)
  }, [canMakeApiCalls])
  
  // Backend connection states
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [responseModality, setResponseModality] = useState<'AUDIO' | 'TEXT'>('AUDIO')
  
  // Stream processing states
  const [currentTurnActive, setCurrentTurnActive] = useState(false)
  const [currentTextBuffer, setCurrentTextBuffer] = useState('')
  const [currentTranscriptionBuffer, setCurrentTranscriptionBuffer] = useState('')
  
  // Audio-transcript sync states
  const [currentTranscriptText, setCurrentTranscriptText] = useState('')
  const [displayTranscript, setDisplayTranscript] = useState('')
  
  // User input transcript for real-time display
  const [currentUserTranscript, setCurrentUserTranscript] = useState('')
  
  
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
    
    // Update stream connection state when receiving messages
    setStreamConnected(true)
    
    switch (data.type) {
      case 'connected':
        setCurrentTurnActive(false)
        setStreamConnected(true)
        break
        
      case 'disconnected':
      case 'error':
        setStreamConnected(false)
        setStreamDisconnectionReason(data.type === 'error' ? 'Stream error occurred' : 'Stream disconnected')
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
        setCurrentTurnActive(true)
        setIsAudioMode(true)
        if (data.audio_data) {
          
          // Display the current transcription text for all chunks of this transcript
          setDisplayTranscript(currentTranscriptTextRef.current)
          
          
          // Check if audio context is ready before trying to play
          if (!audioService.isAudioContextReady() || !audioService.isAudioPlaybackEnabled()) {
            
            // Try auto-activation based on user history
            audioService.tryAutoActivateFromHistory().then(activated => {
              if (activated) {
                audioService.setAudioEnabled(true)
                // Try playing the chunk again
                audioService.playAudioResponse(data.audio_data!, data.chunk_number)
              } else {
                // The button in header will be shown as red to prompt user
              }
            }).catch(error => {
            })
          }
          
          try {
            audioService.playAudioResponse(data.audio_data, data.chunk_number)
          } catch (error) {
            console.error('❌ Error calling playAudioResponse:', error)
          }
        } else {
          console.warn('⚠️ Audio chunk received but no audio_data')
        }
        break

      case 'input_transcription':
        if (data.text && data.text.trim()) {
          const userText = data.text.trim()
          // Clean HTML/XML tags from stream transcript  
          const cleanedUserText = userText.replace(/<[^>]*>/g, '').trim()
          
          if (cleanedUserText) {
            // Show cleaned user transcript for real-time display
            setCurrentUserTranscript(cleanedUserText)
            
            // Add to conversation and clear user transcript after a delay
            addHumanMessage(cleanedUserText)
            setTimeout(() => {
              setCurrentUserTranscript('')
            }, 2000) // Show for 2 seconds before clearing
            
            if (currentTurnActiveRef.current) {
              setCurrentTurnActive(false)
            }
          } else {
          }
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
          
          let newBuffer = ''
          setCurrentTranscriptionBuffer(prev => {
            newBuffer = prev + data.text
            // Always update transcription buffer for live display
            return newBuffer
          })
          
          // Update bot message with accumulated buffer (outside state setter to avoid render loops)
          updateOrAddBotMessage(newBuffer, true)
        }
        break
        
      case 'turn_complete':
        setCurrentTurnActive(false)
        
        // Finalize text buffer if available
        if (data.has_text && currentTextBufferRef.current && currentTextBufferRef.current.trim()) {
          finalizeStreamingMessage(currentTextBufferRef.current, false)
        }
        
        // Always finalize transcription buffer if it exists
        if (currentTranscriptionBufferRef.current && currentTranscriptionBufferRef.current.trim()) {
          const cleanedBuffer = currentTranscriptionBufferRef.current.replace(/^null/gi, '').trim()
          if (cleanedBuffer && cleanedBuffer !== 'null') {
            finalizeStreamingMessage(cleanedBuffer, true)
          }
        }
        
        // Reset states
        setCurrentTextBuffer('')
        setCurrentTranscriptionBuffer('')
        setIsAudioMode(false)
        setShouldShowTranscription(false)
        
        // Clear transcript tracking
        setCurrentTranscriptText('')
        setDisplayTranscript('')
        break
        
        
      case 'tool_call_start':
        // addToolMessage('🔍 Processing your request...')
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
      // const certOk = await apiService.checkCertificateStatus()
      
      // if (!certOk) {
      //   const userChoice = confirm(
      //     '🔒 SSL Certificate Setup Required\n\n' +
      //     'The backend server is using HTTPS with a self-signed certificate.\n' +
      //     'You need to accept this certificate in your browser first.\n\n' +
      //     '📋 Instructions:\n' +
      //     '1. Click OK to open the backend URL in a new tab\n' +
      //     '2. You\'ll see a security warning - click "Advanced"\n' +
      //     '3. Click "Proceed to localhost (unsafe)"\n' +
      //     '4. Return to this tab and click Connect again\n\n' +
      //     'Click OK to open backend URL, or Cancel to continue without backend.'
      //   )
        
      //   if (userChoice) {
      //     const { config } = await import('../config/appConfig')
      //     window.open(config.api.baseUrl + '/', '_blank')
      //     showNotification('Please accept the certificate in the new tab and click Connect again')
      //     setIsConnecting(false)
      //     return
      //   } else {
      //     setIsConnecting(false)
      //     showNotification('Connection cancelled')
      //     return
      //   }
      // }
      
      await apiService.connect(responseModality)
      setIsConnected(true)
      
      // Activate audio context if in audio mode and mic is already on
      if (responseModality === 'AUDIO') {
        try {
          const audioActivated = await audioService.activateAudioContext()
          if (audioActivated) {
          } else {
          }
        } catch (error) {
        }
      }
      
      // showNotification(`Connected to AI backend in ${responseModality} mode!`, 'success')
      
      // Update stream connection state
      setStreamConnected(true)
      
      // Add status message for successful connection
      // addStatusMessage('🔗 Connected to AI Assistant')
      
      // Create new conversation session when connecting
      const sessionId = SessionManager.createNewSession()
      SessionManager.updateSessionConnection(true, responseModality)
      
      // Clear product messages when manually connecting
      clearProductMessages()
      
      apiService.startEventStream(handleStreamResponse)

    } catch (error) {
      console.error('Connection error:', error)
      setIsConnected(false)
      
      // Update stream connection state with reason
      setStreamConnected(false)
      setStreamDisconnectionReason(error instanceof Error ? error.message : 'Connection failed')
      
      showNotification(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
      
      // Add status message for connection failure
      // addStatusMessage('❌ Connection Failed')
    } finally {
      setIsConnecting(false)
    }
  }, [isConnecting, isConnected, responseModality, showNotification])

  // Manual disconnect function
  const handleDisconnect = useCallback(async () => {
    // Prevent multiple disconnect calls
    if (isDisconnecting || !isConnected) {
      return
    }
    
    setIsDisconnecting(true)
    
    try {
      await apiService.disconnect()
      setIsConnected(false)
      
      // Update stream connection state
      setStreamConnected(false)
      setStreamDisconnectionReason('User disconnected')
      
      showNotification('Disconnected from AI backend')
      
      // Add status message for successful disconnection
      // addStatusMessage('🔌 Disconnected from AI Assistant')
      
      // End current conversation session when disconnecting
      await SessionManager.endCurrentSession()
      
      // Clear conversation from localStorage and memory
      clearConversation()
      
      audioService.stopAudioProcessing()
      audioService.clearAudioQueue()
      videoService.stopVideoStream()
    } catch (error) {
      console.error('Disconnect error:', error)
      showNotification('Disconnect error')
    } finally {
      setIsDisconnecting(false)
    }
  }, [isDisconnecting, isConnected, showNotification, clearConversation])

  // Handle connection toggle
  const handleConnectionToggle = useCallback(async () => {
    if (isConnecting) {
      return
    }
    
    if (isConnected) {
      await handleDisconnect()
    } else if (!isDisconnecting) {
      await handleConnect()
    } else {
    }
  }, [isConnecting, isDisconnecting, isConnected, handleDisconnect, handleConnect])

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
      console.error('❌ Failed to send message:', error)
      showNotification(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
    }
  }, [isConnected, addHumanMessage, addBotMessage, showNotification])

  // File upload handler  
  const handleFileUpload = useCallback(async (file: File) => {
    if (file.type.startsWith('image/')) {
      // For images, add message with file info for preview (but don't store large data in localStorage)
      const previewUrl = URL.createObjectURL(file)
      addHumanMessage(`📎 Uploaded image: ${file.name}`, {
        name: file.name,
        type: file.type,
        previewUrl: previewUrl  // This won't be stored in localStorage due to JSON.stringify limits
      })
      
      // Clean up the preview URL after 30 seconds to prevent memory leaks
      setTimeout(() => {
        URL.revokeObjectURL(previewUrl)
      }, 30000)
    } else {
      addHumanMessage(`📎 Uploaded file: ${file.name}`)
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Direct cleanup on unmount without using handleDisconnect to avoid dependency cycles
      apiService.disconnect()
      audioService.stopAudioProcessing()
      audioService.clearAudioQueue()
      videoService.stopVideoStream()
      clearConversation()
    }
  }, [clearConversation])

  return {
    isConnected,
    isConnecting,
    isDisconnecting,
    responseModality,
    currentTurnActive,
    currentTranscriptionBuffer,
    displayTranscript,
    currentUserTranscript,
    isAudioMode,
    handleConnect,
    handleDisconnect,
    handleConnectionToggle,
    handleChatMessage,
    handleFileUpload
  }
}