'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { apiService, type StreamResponse } from '../services/apiService'
import { audioService } from '../services/audioService'
import { useApp } from '../contexts/AppContext'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useConnectionManager } from '../hooks/useConnectionManager'
import { useGlobalConversation } from '../providers/ConversationProvider'
import ChatPage from './ChatPage'
import VideoCapturePage from './VideoCapturePage'

// Use the Message type from useConversation
import type { Message } from '../hooks/useConversation'

interface SarathiPageProps {
  onBack: () => void
}

const SarathiPage = ({ onBack }: SarathiPageProps) => {
  const { setCurrentPage, appState, setMicEnabled } = useApp()
  const [viewMode, setViewMode] = useState<'voice' | 'chat' | 'video'>('voice')
  const [displayedText, setDisplayedText] = useState('')
  
  // Get messages from ConversationProvider instead of local storage
  const { 
    messages, 
    addHumanMessage: globalAddHumanMessage,
    addBotMessage: globalAddBotMessage,
    clearConversation 
  } = useGlobalConversation()
  
  const [currentResponse, setCurrentResponse] = useState('')
  const [fullResponse, setFullResponse] = useState('')
  const fullResponseRef = useRef('')
  const audioChunksRef = useRef<string[]>([])
  const responseCompleteRef = useRef(true)
  const [isResponseActive, setIsResponseActive] = useState(false)
  const [isBotSpeaking, setIsBotSpeaking] = useState(false)
  const [userTranscript, setUserTranscript] = useState('')
  const [isUserSpeaking, setIsUserSpeaking] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const transcriptTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const viewModeRef = useRef(viewMode)
  const videoStreamHandlerRef = useRef<((data: StreamResponse) => void) | null>(null)
  
  // Advanced audio connection states - from smooth project
  const [isAudioEnabled, setIsAudioEnabled] = useState(false)
  // Use global microphone state instead of local state
  const isMicEnabled = appState.isMicEnabled
  const [showReconnectPopup, setShowReconnectPopup] = useState(false)
  const [displayTranscriptLocal, setDisplayTranscript] = useState('')
  
  // Notification function
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    console.log(`${type.toUpperCase()}: ${message}`)
  }
  
  // Advanced connection management - from smooth project
  const connectionManager = useConnectionManager(showNotification)
  const {
    isConnected,
    isConnecting,
    responseModality,
    currentTurnActive,
    currentTranscriptionBuffer,
    displayTranscript: connectionDisplayTranscript,
    isAudioMode,
    handleConnect,
    handleConnectionToggle,
  } = connectionManager
  
  // Direct microphone control
  const { isListening, isSupported, startListening, stopListening } = useSpeechRecognition()
  
  // Use connection display transcript if available, otherwise use local
  const displayTranscript = connectionDisplayTranscript || displayTranscriptLocal || userTranscript
  
  // Update ref when viewMode changes
  useEffect(() => {
    viewModeRef.current = viewMode
  }, [viewMode])

  // Handle back navigation with conversation reset
  const handleBack = useCallback(() => {
    console.log('🔄 handleBack clicked - navigating immediately...')
    
    // Navigate immediately - don't wait for cleanup
    onBack()
    
    // Then do cleanup in background
    setTimeout(() => {
      // Clear all conversation data
      clearConversation()
      
      // Disconnect from API
      if (apiService.connected) {
        apiService.disconnect()
      }
      
      // Clear audio service
      audioService.cleanup()
      
      // Reset all local states
      setCurrentResponse('')
      setFullResponse('')
      setDisplayedText('')
      setUserTranscript('')
      setUploadedImage(null)
      audioChunksRef.current = []
      fullResponseRef.current = ''
      responseCompleteRef.current = true
      
      console.log('🧹 Cleanup completed after navigation')
    }, 100)
  }, [clearConversation, onBack])
  
  // Configure audio service to respect mic toggle state
  useEffect(() => {
    audioService.setShouldSendAudioCallback(() => {
      const shouldSend = isMicEnabled && responseModality === 'AUDIO' && isConnected
      console.log(`🎤 Audio callback check - MicEnabled: ${isMicEnabled}, Mode: ${responseModality}, Connected: ${isConnected}, Result: ${shouldSend}`)
      return shouldSend
    })
    console.log(`🎤 Mic state updated - Enabled: ${isMicEnabled}, Connected: ${isConnected}, Mode: ${responseModality}`)
  }, [isMicEnabled, isConnected, responseModality])
  
  // Helper function to truncate text
  const truncateText = useCallback((text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text
    return '...' + text.slice(-maxLength)
  }, [])

  const initialText = ''

  // Track current page and disable body scroll
  useEffect(() => {
    setCurrentPage('sarathi')
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [])

  // Handle stream responses from API - OPTIMIZED VERSION
  const handleStreamResponse = useCallback((data: StreamResponse) => {
    console.log('📡 Sarathi received stream event:', data.type, 'View mode:', viewModeRef.current)
    
    // In video mode, pass ALL events to video handler and return
    if (videoStreamHandlerRef.current && viewModeRef.current === 'video') {
      videoStreamHandlerRef.current(data)
      return // Don't process anything here in video mode
    }
    
    // Only process events in voice/chat mode
    switch (data.type) {
      case 'connected':
        // Reset all accumulated state on fresh connection
        fullResponseRef.current = ''
        audioChunksRef.current = []
        responseCompleteRef.current = true
        console.log('✅ Connected to backend - state reset')
        break
        
      case 'input_transcription':
        if (data.text && data.text.trim()) {
          // Show user transcript in UI
          setUserTranscript(data.text)
          setIsUserSpeaking(true)
          setDisplayTranscript(data.text)
          
          // Clear after delay
          if (transcriptTimeoutRef.current) {
            clearTimeout(transcriptTimeoutRef.current)
          }
          transcriptTimeoutRef.current = setTimeout(() => {
            setIsUserSpeaking(false)
            setUserTranscript('')
            setDisplayTranscript('')
          }, 8000)
          
          // Clear previous response when user speaks
          if (responseCompleteRef.current) {
            audioChunksRef.current = []
          }
          fullResponseRef.current = ''
        }
        break
        
      case 'output_transcription':
        if (data.text) {
          setIsResponseActive(true)
          
          // For first load, treat as completely fresh
          if (responseCompleteRef.current || !fullResponseRef.current) {
            fullResponseRef.current = data.text
            audioChunksRef.current = []
            responseCompleteRef.current = false
          } else {
            // Accumulate text properly
            if (data.text.startsWith(fullResponseRef.current)) {
              fullResponseRef.current = data.text
            } else if (!fullResponseRef.current.includes(data.text)) {
              fullResponseRef.current = fullResponseRef.current + data.text
            }
          }
          
          const accumulatedText = fullResponseRef.current
          
          // Store and display text immediately - KEY OPTIMIZATION!
          fullResponseRef.current = accumulatedText
          setFullResponse(accumulatedText)
          const truncated = truncateText(accumulatedText)
          setCurrentResponse(truncated)
          setIsBotSpeaking(true) // Show immediately for smooth experience
        }
        break
        
      case 'turn_complete':
        // Keep text visible longer
        setTimeout(() => {
          setCurrentResponse('')
          setFullResponse('')
        }, 5000)
        setIsResponseActive(false)
        responseCompleteRef.current = true
        break
        
      case 'audio_playback_started':
        // States already set in output_transcription for smooth experience
        setIsBotSpeaking(true)
        setIsUserSpeaking(false)
        setDisplayTranscript('')
        break
        
      case 'audio_playback_completed':
        setIsBotSpeaking(false)
        setTimeout(() => {
          setCurrentResponse('')
        }, 5000)
        break
        
      case 'audio_chunk':
        if (data.audio_data && data.chunk_number !== undefined) {
          if (data.chunk_number === 1) {
            console.log('🔊 Starting audio chunks for response')
            // Show text immediately with first audio chunk if available
            if (fullResponseRef.current) {
              const truncated = truncateText(fullResponseRef.current)
              setCurrentResponse(truncated)
              setIsBotSpeaking(true)
            }
          }
          
          audioChunksRef.current.push(data.audio_data)
          
          // Play audio in voice mode
          console.log('🔊 Playing audio chunk', data.chunk_number)
          audioService.playAudioResponse(data.audio_data, data.chunk_number)
        }
        break
    }
  }, [])

  // Keep handleStreamResponse stable with a ref
  const streamHandlerRef = useRef(handleStreamResponse)
  useEffect(() => {
    streamHandlerRef.current = handleStreamResponse
  }, [handleStreamResponse])

  // REMOVED: This was causing duplicate stream handlers and echo
  // The connectionManager already sets up the stream handler
  // We just need to handle transcription events in our handleStreamResponse

  // Auto-connect and setup - from smooth project
  useEffect(() => {
    const checkForReconnect = () => {
      const audioAutoEnabled = localStorage.getItem('audioAutoEnabled')
      const microphoneAutoEnabled = localStorage.getItem('microphoneAutoEnabled')
      const lastActivation = localStorage.getItem('lastAudioActivation')
      
      if (audioAutoEnabled === 'true' && microphoneAutoEnabled === 'true' && lastActivation) {
        setShowReconnectPopup(true)
      } else {
        // Auto-connect for new users
        setTimeout(async () => {
          if (!isConnected && !isConnecting) {
            try {
              const audioActivated = await audioService.activateAudioContext()
              if (audioActivated) {
                setIsAudioEnabled(true)
                audioService.setAudioEnabled(true)
                localStorage.setItem('audioAutoEnabled', 'true')
                localStorage.setItem('microphoneAutoEnabled', 'true') 
                localStorage.setItem('lastAudioActivation', Date.now().toString())
              }
            } catch (error) {
              console.error('Failed to activate audio for new user:', error)
            }
            handleConnect()
          }
        }, 500)
      }
    }

    checkForReconnect()
  }, [])

  // Microphone toggle handler - optimized
  const handleMicToggle = async () => {
    if (!isAudioEnabled || !isConnected) {
      try {
        const activated = await audioService.activateAudioContext()

        if (activated) {
          localStorage.setItem('audioAutoEnabled', 'true')
          localStorage.setItem('microphoneAutoEnabled', 'true')
          localStorage.setItem('lastAudioActivation', Date.now().toString())

          setIsAudioEnabled(true)
          setMicEnabled(true)
          audioService.setAudioEnabled(true)
          audioService.setShouldSendAudioCallback(() => true)

          if (isConnected && responseModality === 'AUDIO' && !isListening) {
            try {
              audioService.setUserSpeakingCallback((isSpeaking: boolean) => {
                console.log(isSpeaking ? '🗣️ User speaking' : '🤫 User stopped')
              })
              await audioService.setupAudioProcessing()
              startListening()
            } catch (error) {
              console.error('Microphone setup failed:', error)
            }
          }
        }
      } catch (error) {
        console.error('Audio enable error:', error)
      }
    } else {
      // Toggle mic on/off
      const newMicState = !isMicEnabled
      setMicEnabled(newMicState)
      audioService.setShouldSendAudioCallback(() => newMicState && responseModality === 'AUDIO')
    }
  }

  // Reconnect handler
  const handleReconnectClick = async () => {
    try {
      setShowReconnectPopup(false)
      
      // First activate audio context
      const audioActivated = await audioService.activateAudioContext()
      if (audioActivated) {
        setIsAudioEnabled(true)
        audioService.setAudioEnabled(true)
        setMicEnabled(true)
        
        // Set up audio callback immediately
        audioService.setShouldSendAudioCallback(() => true)
      }
      
      // Connect to stream
      await handleConnect()
      
      // Wait a bit for connection to establish
      setTimeout(async () => {
        // Now set up microphone after connection is ready
        if (responseModality === 'AUDIO' && !isListening) {
          try {
            console.log('🎤 Setting up microphone after reconnect...')
            audioService.setUserSpeakingCallback((isSpeaking: boolean) => {
              console.log(isSpeaking ? '🗣️ User speaking' : '🤫 User stopped')
            })
            await audioService.setupAudioProcessing()
            startListening()
            console.log('✅ Microphone setup completed after reconnect')
          } catch (error) {
            console.error('Microphone setup failed after reconnect:', error)
          }
        }
      }, 1000)
    } catch (error) {
      console.error('Reconnect error:', error)
    }
  }

  // Start microphone when connected and audio enabled
  useEffect(() => {
    console.log(`🎤 Microphone effect triggered - ViewMode: ${viewMode}, IsListening: ${isListening}, Connected: ${isConnected}, AudioEnabled: ${isAudioEnabled}`)
    
    let mounted = true
    let micTimer: NodeJS.Timeout | null = null

    // Only setup in voice mode
    if (viewMode === 'voice' && isSupported && !isListening && isConnected && responseModality === 'AUDIO' && isAudioEnabled) {
      console.log('🎤 Setting up microphone in 1.5 seconds...')
      micTimer = setTimeout(async () => {
        if (mounted && viewMode === 'voice' && !isListening && isConnected && isAudioEnabled) {
          try {
            console.log('🎤 Actually setting up microphone now')
            audioService.setShouldSendAudioCallback(() => {
              return isMicEnabled && responseModality === 'AUDIO' && isConnected
            })
            audioService.setUserSpeakingCallback((isSpeaking: boolean) => {
              console.log(isSpeaking ? '🗣️ User speaking' : '🤫 User stopped')
            })
            await audioService.setupAudioProcessing()
            startListening()
            console.log('✅ Microphone setup completed')
          } catch (error) {
            console.error('Failed to setup audio streaming:', error)
          }
        } else {
          console.log('❌ Microphone setup cancelled - conditions changed')
        }
      }, 1500)
    }

    return () => {
      mounted = false
      if (micTimer) {
        clearTimeout(micTimer)
      }
    }
  }, [viewMode, isConnected, responseModality, isAudioEnabled, isListening, isMicEnabled])

  // Check audio status periodically
  useEffect(() => {
    const checkAudioStatus = () => {
      const isReady = audioService.isAudioContextReady()
      const audioEnabled = audioService.isAudioPlaybackEnabled()
      setIsAudioEnabled(isReady && audioEnabled)
    }

    checkAudioStatus()
    const interval = setInterval(checkAudioStatus, 2000)
    return () => clearInterval(interval)
  }, [])

  // Set initial text
  useEffect(() => {
    setDisplayedText(initialText)
  }, [])

  // Switch to chat mode - optimized
  const switchToChat = useCallback(async () => {
    console.log('🔄 Switching to chat - STOPPING all audio sending')
    
    // Stop all audio processing completely
    audioService.stopCurrentAudio()
    audioService.clearAudioQueue()
    audioService.stopAudioProcessing() // This stops microphone input
    
    // Set callback to never send
    audioService.setShouldSendAudioCallback(() => {
      console.log('🔇 CHAT MODE - blocking audio send')
      return false
    })
    
    // Stop listening if active
    if (isListening) {
      stopListening()
    }
    
    setViewMode('chat')
    console.log('✅ Chat mode set - audio should be stopped')
  }, [isListening, stopListening])

  const switchToVoice = useCallback(async () => {
    console.log('🔄 Switching back to voice mode - CLEANING UP FIRST to prevent echo')
    
    // CRITICAL: Clean up any existing audio processing first to prevent echo
    audioService.stopCurrentAudio()
    audioService.clearAudioQueue()
    audioService.stopAudioProcessing()
    
    // Stop any existing speech recognition
    if (isListening) {
      stopListening()
    }
    
    // Small delay to ensure complete cleanup
    await new Promise(resolve => setTimeout(resolve, 300))
    
    console.log('🔄 Connection states:', {
      isConnected,
      isConnecting,
      responseModality,
      isMicEnabled,
      isAudioEnabled,
      apiServiceConnected: apiService.connected
    })
    
    // Set view mode first so refs are updated
    setViewMode('voice')
    
    // Don't restart stream connection - it's already active
    // The stream was maintained in chat mode, just like video mode
    console.log('✅ Switching to voice - keeping existing stream connection')
    
    // Reset the audio callback properly
    audioService.setShouldSendAudioCallback(() => {
      return isMicEnabled && responseModality === 'AUDIO' && isConnected
    })
    
    console.log('✅ Voice mode enabled - audio cleaned up and re-initialized')
  }, [isMicEnabled, responseModality, isConnected, isConnecting, isAudioEnabled, handleConnect, isListening, stopListening])

  const switchToVideo = useCallback(async () => {
    setViewMode('video')
  }, [])

  // Handle playing audio for a message
  const handlePlayMessageAudio = useCallback(async (_message: any) => {
    console.log('⚠️ Audio playback for individual messages not yet implemented with new structure')
  }, [])

  // Handle sending message from chat
  const handleChatMessage = useCallback(async (text: string, image?: string) => {
    fullResponseRef.current = ''
    setFullResponse('')
    audioChunksRef.current = []
    
    // Add message with image in proper format
    if (image) {
      globalAddHumanMessage(text || 'Shared an image', {
        name: 'uploaded-image.png',
        type: 'image/png',
        url: image
      })
    } else {
      globalAddHumanMessage(text || '')
    }
    
    if (text) {
      try {
        await apiService.sendText(text)
      } catch (error) {
        console.error('Failed to send message:', error)
      }
    }
  }, [globalAddHumanMessage])

  // Render video page if in video mode
  if (viewMode === 'video') {
    return (
      <VideoCapturePage 
        onBack={() => setViewMode('voice')}
        messages={messages}
        onAddMessage={(message: any) => {
          if (message.isUser) {
            globalAddHumanMessage(message.text || '')
          } else {
            globalAddBotMessage(message.text || '')
          }
        }}
        onRegisterStreamHandler={(handler: ((data: StreamResponse) => void) | null) => {
          videoStreamHandlerRef.current = handler
        }}
        onSwitchToChat={async () => {
          audioService.stopAudioProcessing()
          audioService.clearAudioQueue()
          
          try {
            await audioService.setupAudioProcessing()
            await audioService.activateAudioContext()
            audioService.setAudioEnabled(true)
          } catch (error) {
            console.error('❌ Failed to initialize audio for video-to-chat transition:', error)
          }
          
          setViewMode('chat')
        }}
      />
    )
  }

  // Render chat page if in chat mode
  if (viewMode === 'chat') {
    return (
      <ChatPage 
        onBack={handleBack}
        onSwitchToVoice={switchToVoice}
        onSwitchToVideo={switchToVideo}
        messages={messages}
        onSendMessage={handleChatMessage}
        onPlayAudio={handlePlayMessageAudio}
      />
    )
  }

  return (
    <div className="md:flex md:justify-center md:items-center min-h-screen md:bg-gray-100 bg-[#FFFAF4]">
      {/* Reconnect popup - Clean Compact Design */}
      {showReconnectPopup && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl" style={{width: '280px', padding: '28px 20px 32px 20px'}}>
            <div className="text-center">
              <h3 className="text-gray-900 text-base font-semibold mb-3">
                Enable Voice Assistant
              </h3>
              
              <p className="text-gray-600 text-sm leading-relaxed px-2" style={{marginBottom: '24px'}}>
                Allow microphone access to start your voice conversation
              </p>
              
              <button
                onClick={handleReconnectClick}
                className="bg-gradient-to-r from-[#E9842F] to-[#F46200] text-white rounded-lg hover:shadow-md transform hover:scale-105 transition-all duration-200"
                style={{
                  padding: '10px 32px',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
              >
                Enable Audio
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative bg-[#FFFAF4] w-full min-h-screen md:w-[480px] lg:w-[520px] md:h-screen md:shadow-xl md:border md:border-gray-200" style={{paddingBottom: '80px'}}>

        {/* Orange Header */}
        <div className="absolute bg-[#E9842F] flex items-center justify-between w-full md:w-[480px] lg:w-[520px] z-20" style={{height: '56px', top: '0px', paddingTop: '12px', paddingRight: '20px', paddingBottom: '12px', paddingLeft: '20px'}}>
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className="text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5M12 19L5 12L12 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <h1 className="text-white text-base md:text-xl lg:text-2xl font-medium" style={{fontFamily: 'Inter, sans-serif'}}>Divya Darshak</h1>
          </div>
          <button onClick={switchToChat} className="flex items-center" style={{width: '93px', height: '32px', gap: '8px', borderRadius: '12px', paddingRight: '10px', paddingLeft: '10px'}}>
            <svg width="93" height="32" viewBox="0 0 93 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="93" height="32" rx="12" fill="#FFFAF4"/>
              <path d="M15.474 21.21C12.674 21.21 10.504 18.928 10.504 15.96C10.504 13.006 12.674 10.738 15.474 10.738C17.994 10.738 20.01 12.418 20.388 14.896H18.75C18.47 13.272 17.154 12.124 15.488 12.124C13.5 12.124 12.1 13.734 12.1 15.96C12.1 18.214 13.5 19.824 15.488 19.824C17.154 19.824 18.47 18.662 18.75 17.038H20.388C20.01 19.53 17.994 21.21 15.474 21.21ZM23.2905 16.814V21H21.8765V10.948H23.2905V14.77C23.7805 13.972 24.5365 13.44 25.5585 13.44C27.0845 13.44 28.0925 14.42 28.0925 16.198V21H26.6785V16.674C26.6785 15.4 26.1185 14.686 25.0685 14.686C24.1025 14.686 23.2905 15.498 23.2905 16.814ZM34.4642 21V19.852C34.0022 20.678 33.1762 21.14 32.0842 21.14C30.5442 21.14 29.5362 20.258 29.5362 18.9C29.5362 17.444 30.6982 16.688 32.9102 16.688C33.3442 16.688 33.6942 16.702 34.2962 16.772V16.226C34.2962 15.162 33.7222 14.56 32.7422 14.56C31.7062 14.56 31.0762 15.176 31.0342 16.212H29.7462C29.8162 14.546 31.0062 13.44 32.7422 13.44C34.5762 13.44 35.6402 14.476 35.6402 16.24V21H34.4642ZM30.8802 18.858C30.8802 19.628 31.4542 20.132 32.3642 20.132C33.5542 20.132 34.2962 19.39 34.2962 18.256V17.654C33.7502 17.584 33.3582 17.57 32.9942 17.57C31.5802 17.57 30.8802 17.99 30.8802 18.858ZM41.6484 19.628V20.874C41.2144 21.07 40.8364 21.14 40.3884 21.14C39.0164 21.14 38.0644 20.398 38.0644 18.76V14.784H36.4264V13.58H38.0644V11.382H39.4784V13.58H41.7184V14.784H39.4784V18.438C39.4784 19.46 39.9684 19.824 40.7244 19.824C41.0604 19.824 41.3544 19.768 41.6484 19.628Z" fill="#757575"/>
              <path d="M73.6668 20.1667H60.3335M60.3335 20.1667L63.6668 16.8333M60.3335 20.1667L63.6668 23.5M60.3335 11.8333H73.6668M73.6668 11.8333L70.3335 8.5M73.6668 11.8333L70.3335 15.1667" stroke="#757575" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Animated Voice Agent Circle - OPTIMIZED */}
        <div className="absolute w-full flex justify-center items-center" style={{
          height: uploadedImage ? '120px' : '200px', 
          top: uploadedImage ? '100px' : '140px',
          transition: 'all 0.3s ease-in-out'
        }}>
          <div className="relative" style={{
            transform: uploadedImage ? 'scale(0.7)' : 'scale(1)',
            transition: 'transform 0.3s ease-in-out'
          }}>
            {/* Outer orange ring image */}
            <div 
              className="absolute inset-0 flex justify-center items-center"
              style={{
                width: '180px',
                height: '180px',
                transform: 'translate(-50%, -50%)',
                left: '50%',
                top: '50%'
              }}
            >
              <img 
                src="/image copy 5.png" 
                alt="Outer Ring"
                className="w-full h-full object-contain"
                style={{
                  opacity: isBotSpeaking ? 1 : 0.7
                }}
              />
            </div>

            {/* OPTIMIZED ring effect - no blur for performance */}
            {isBotSpeaking && (
              <div 
                className="absolute inset-0 rounded-full animate-pulse"
                style={{
                  background: `radial-gradient(circle, transparent 40%, #FFB366 60%, #FFA652 80%)`,
                  width: '180px',
                  height: '180px',
                  transform: 'translate(-50%, -50%) translateZ(0)',
                  left: '50%',
                  top: '50%',
                  willChange: 'opacity'
                }}
              />
            )}
            
            {/* Main circle container - optimized */}
            <div 
              className="relative rounded-full overflow-hidden flex justify-center items-center"
              style={{
                width: '160px',
                height: '160px',
                boxShadow: isBotSpeaking 
                  ? '0 0 20px #FFB36660' 
                  : 'none',
                transform: 'translateZ(0)',
                backgroundColor: 'transparent'

              }}
            >
              {/* Show sphere image when bot is speaking, otherwise show animated GIF */}
              {isBotSpeaking ? (
                <img 
                  src="/image copy 6.png" 
                  alt="Assistant Speaking"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <img 
                  src="/6dfc3075899176c51d0ec16eb039d672f41eddc0.gif" 
                  alt="Assistant Listening"
                  className="w-full h-full object-cover rounded-full"
                />
              )}
            </div>
          </div>
        </div>

        {/* Uploaded Image Card */}
        {uploadedImage && (
          <div 
            className="absolute w-full flex justify-center items-center" 
            style={{top: '240px'}}
          >
            <div 
              className="relative rounded-2xl overflow-hidden bg-white"
              style={{
                width: '240px',
                height: '240px',
                boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)'
              }}
            >
              <img 
                src={uploadedImage}
                alt="Uploaded for analysis"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setUploadedImage(null)}
                className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5"
                style={{boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)'}}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Text Display Area - FIXED */}
        <div className="absolute flex flex-col justify-center items-center px-4 md:px-0" 
             style={{
               width: '100%', 
               maxWidth: '350px', 
               minHeight: '120px', 
               left: '50%', 
               transform: 'translateX(-50%)', 
               top: uploadedImage ? '480px' : '360px',
               transition: 'top 0.3s ease-in-out'
             }}>
          <div className="w-full space-y-3">
            {/* Priority 1: Show user transcript when actively speaking */}
            {isUserSpeaking && displayTranscript ? (
              <div className="text-center animate-fade-in">
                <p className="text-sm text-[#757575] mb-1" style={{fontFamily: 'General Sans, sans-serif', fontWeight: 500}}>
                  Aap bol rahe hain:
                </p>
                <p className="text-[#269697]" 
                   style={{fontFamily: 'General Sans, sans-serif', fontWeight: 500, fontSize: '18px', lineHeight: '150%'}}>
                  "{displayTranscript}"
                </p>
              </div>
            ) : currentResponse ? (
              /* Priority 2: Show current bot response */
              <div className="text-center animate-fade-in">
                <p className="text-sm text-[#757575] mb-1" style={{fontFamily: 'General Sans, sans-serif', fontWeight: 500}}>
                  Sarathi:
                </p>
                <p className="text-[#F46200]" 
                   style={{fontFamily: 'General Sans, sans-serif', fontWeight: 500, fontSize: '18px', lineHeight: '150%'}}>
                  {currentResponse}
                </p>
              </div>
            ) : messages.length === 0 ? (
              /* Priority 3: Show initial greeting if no messages */
              <div className="text-center">
                <p className="text-[#757575]" 
                   style={{fontFamily: 'Inter, sans-serif', fontStyle: 'italic', fontWeight: 500, fontSize: '16px', lineHeight: '150%'}}>
                  {initialText}
                </p>
              </div>
            ) : (
              /* Priority 4: Show last message when idle */
              <div className="text-center">
                {messages[messages.length - 1].isUser || messages[messages.length - 1].type === 'human' ? (
                  <>
                    <p className="text-sm text-[#757575] mb-1" style={{fontFamily: 'General Sans, sans-serif', fontWeight: 500}}>
                      Aapne kaha:
                    </p>
                    <p className="text-[#269697]" 
                       style={{fontFamily: 'General Sans, sans-serif', fontWeight: 500, fontSize: '18px', lineHeight: '150%'}}>
                      "{messages[messages.length - 1].text || messages[messages.length - 1].content || ''}"
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-[#757575] mb-1" style={{fontFamily: 'General Sans, sans-serif', fontWeight: 500}}>
                      Sarathi:
                    </p>
                    <p className="text-[#F46200]" 
                       style={{fontFamily: 'General Sans, sans-serif', fontWeight: 500, fontSize: '18px', lineHeight: '150%'}}>
                      {messages[messages.length - 1].text || messages[messages.length - 1].content || ''}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 md:absolute md:bottom-6 flex justify-between items-center w-full md:w-full z-30 bg-[#FFFAF4] md:bg-transparent" 
             style={{height: '70px', paddingLeft: '20px', paddingRight: '20px', gap: '5px'}}>
          {/* Left Group */}
          <div className="flex items-center" style={{width: '84.69px', height: '41.27px', gap: '5px'}}>
            {/* Close Button */}
            <button 
              onClick={handleBack} 
              className="flex items-center justify-center"
            >
              <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0.5" y="0.5" width="40.2727" height="40.2727" rx="20.1364" fill="white"/>
                <rect x="0.5" y="0.5" width="40.2727" height="40.2727" rx="20.1364" stroke="#E9E8E8"/>
                <path d="M25.6362 15.6367L15.6362 25.6367M15.6362 15.6367L25.6362 25.6367" stroke="#757575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Attachment Button */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    const reader = new FileReader()
                    reader.onload = async (event) => {
                      const imageUrl = event.target?.result as string
                      setUploadedImage(imageUrl)
                      
                      await apiService.sendImage(imageUrl.split(',')[1])
                      await apiService.sendText('Please analyze this image')
                      
                      e.target.value = ''
                    }
                    reader.readAsDataURL(file)
                  }
                }}
              />
              <svg width="39" height="39" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0.733302" y="0.89004" width="37.4924" height="37.4924" rx="18.7462" fill="white"/>
                <rect x="0.733302" y="0.89004" width="37.4924" height="37.4924" rx="18.7462" stroke="#E9E8E8" strokeWidth="0.920705"/>
                <path d="M28.0639 18.6029L19.608 27.0588C17.6851 28.9818 14.5673 28.9818 12.6444 27.0588C10.7214 25.1358 10.7214 22.0181 12.6444 20.0951L21.1003 11.6392C22.3822 10.3572 24.4607 10.3572 25.7427 11.6392C27.0247 12.9212 27.0247 14.9997 25.7427 16.2817L17.6184 24.406C16.9774 25.0469 15.9382 25.0469 15.2972 24.406C14.6562 23.765 14.6562 22.7257 15.2972 22.0847L22.4267 14.9553" stroke="#757575" strokeWidth="1.87583" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Right Group */}
          <div className="flex items-center" style={{width: '86.48px', height: '41.27px', gap: '5.43px'}}>
            {/* Microphone Button */}
            <button 
              onClick={handleMicToggle}
              className="flex items-center justify-center"
              title={isMicEnabled ? "Mute microphone" : "Unmute microphone"}
            >
              {!isAudioEnabled || !isConnected || !isMicEnabled ? (
                <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0.49707" y="0.498047" width="37.0027" height="37.0027" rx="18.5014" fill="#E5E5E5"/>
                  <rect x="0.49707" y="0.498047" width="37.0027" height="37.0027" rx="18.5014" stroke="#E9E8E8"/>
                  <path d="M21.5896 16.7531V12.9526C21.5896 11.5215 20.4294 10.3613 18.9983 10.3613C17.9812 10.3613 17.1009 10.9474 16.6768 11.8003M18.9983 25.0451V27.6363M18.9983 25.0451C15.6591 25.0451 12.9521 22.3381 12.9521 18.9988V17.2713M18.9983 25.0451C22.3376 25.0451 25.0446 22.3381 25.0446 18.9988V17.2713M15.5433 27.6363H22.4533M10.3608 10.3613L27.6358 27.6363M18.9983 21.5901C17.5672 21.5901 16.4071 20.4299 16.4071 18.9988V16.4076L20.8317 20.83C20.3627 21.2996 19.7145 21.5901 18.9983 21.5901Z" stroke="#757575" strokeWidth="1.7275" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1.06252" y="0.54494" width="40.184" height="40.184" rx="20.092" fill="white"/>
                  <rect x="1.06252" y="0.54494" width="40.184" height="40.184" rx="20.092" stroke="#E9E8E8" strokeWidth="1.08597"/>
                  <path d="M27.7205 18.7619V20.6379C27.7205 24.2643 24.7808 27.204 21.1545 27.204M14.5884 18.7619V20.6379C14.5884 24.2643 17.5281 27.204 21.1545 27.204M21.1545 27.204V30.018M17.4024 30.018H24.9065M21.1545 23.4519C19.6003 23.4519 18.3404 22.1921 18.3404 20.6379V14.0718C18.3404 12.5177 19.6003 11.2578 21.1545 11.2578C22.7086 11.2578 23.9685 12.5177 23.9685 14.0718V20.6379C23.9685 22.1921 22.7086 23.4519 21.1545 23.4519Z" stroke="#757575" strokeWidth="1.87602" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>

            {/* Video Button */}
            <button 
              onClick={switchToVideo}
              className="flex items-center justify-center"
            >
              <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0.460352" y="0.460352" width="37.0793" height="37.0793" rx="18.5396" fill="white"/>
                <rect x="0.460352" y="0.460352" width="37.0793" height="37.0793" rx="18.5396" stroke="#E9E8E8" strokeWidth="0.920705"/>
                <path d="M28.2071 16.1743C28.2071 15.6165 28.2071 15.3377 28.0968 15.2085C28.0011 15.0965 27.8575 15.037 27.7106 15.0486C27.5413 15.0619 27.3441 15.2591 26.9497 15.6535L23.6035 18.9996L26.9497 22.3458C27.3441 22.7402 27.5413 22.9374 27.7106 22.9507C27.8575 22.9623 28.0011 22.9028 28.0968 22.7907C28.2071 22.6616 28.2071 22.3827 28.2071 21.8249V16.1743Z" stroke="#757575" strokeWidth="1.84141" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9.79297 16.9741C9.79297 15.4271 9.79297 14.6537 10.094 14.0628C10.3588 13.5431 10.7814 13.1206 11.3011 12.8557C11.892 12.5547 12.6654 12.5547 14.2124 12.5547H19.1842C20.7311 12.5547 21.5046 12.5547 22.0954 12.8557C22.6151 13.1206 23.0377 13.5431 23.3025 14.0628C23.6035 14.6537 23.6035 15.4271 23.6035 16.9741V21.0252C23.6035 22.5721 23.6035 23.3456 23.3025 23.9364C23.0377 24.4561 22.6151 24.8787 22.0954 25.1435C21.5046 25.4446 20.7311 25.4446 19.1842 25.4446H14.2124C12.6654 25.4446 11.892 25.4446 11.3011 25.1435C10.7814 24.8787 10.3588 24.4561 10.094 23.9364C9.79297 23.3456 9.79297 22.5721 9.79297 21.0252V16.9741Z" stroke="#757575" strokeWidth="1.84141" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

      </div>

      {/* CSS for animations - GPU optimized */}
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(1) translateZ(0);
            opacity: 0.8;
            will-change: transform, opacity;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1) translateZ(0);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1) translateZ(0);
            opacity: 0.8;
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

export default SarathiPage