'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { apiService, type StreamResponse } from '../services/apiService'
import { audioService } from '../services/audioService'
import { MessageStorage, type Message } from '../utils/messageStorage'
import { useApp } from '../contexts/AppContext'
import ChatPage from './ChatPage'
import VideoCapturePage from './VideoCapturePage'

interface RakshakPageProps {
  onBack: () => void
}

// Message interface now imported from messageStorage

const RakshakPage = ({ onBack }: RakshakPageProps) => {
  const { setCurrentPage, setMicPermission } = useApp()
  const [viewMode, setViewMode] = useState<'voice' | 'chat' | 'video'>('voice')
  const [displayedText, setDisplayedText] = useState('')
  const [messages, setMessages] = useState<Message[]>(() => {
    const storedMessages = MessageStorage.getMessages('rakshak')
    console.log('🔍 Loaded messages from storage:', storedMessages)
    return storedMessages
  })
  
  // Helper function to update messages and persist to localStorage
  const updateMessages = useCallback((updater: (prev: Message[]) => Message[]) => {
    setMessages(prev => {
      console.log('🔍 Before update - messages count:', prev.length)
      const updated = updater(prev)
      console.log('🔍 After update - messages count:', updated.length)
      console.log('🔍 Updated messages:', updated)
      MessageStorage.saveMessages('rakshak', updated)
      return updated
    })
  }, [])
  
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [currentResponse, setCurrentResponse] = useState('')
  const [fullResponse, setFullResponse] = useState('')  // Store full response for messages
  const fullResponseRef = useRef('')  // Ref to avoid dependency issues
  const audioChunksRef = useRef<string[]>([])  // Accumulate audio chunks for current message
  const responseCompleteRef = useRef(true)  // Track if last response is complete - start true for first response
  const [isResponseActive, setIsResponseActive] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isBotSpeaking, setIsBotSpeaking] = useState(false)
  const [userTranscript, setUserTranscript] = useState('')
  const [isUserSpeaking, setIsUserSpeaking] = useState(false)
  const [displayTranscript, setDisplayTranscript] = useState('')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const transcriptTimeoutRef = useRef<NodeJS.Timeout>()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isMutedRef = useRef(isMuted)
  const viewModeRef = useRef(viewMode)
  const videoStreamHandlerRef = useRef<((data: StreamResponse) => void) | null>(null)
  
  // Update ref when isMuted changes
  useEffect(() => {
    isMutedRef.current = isMuted
  }, [isMuted])
  
  // Helper function to truncate text to max 3 lines worth (approx 150 chars)
  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text
    // Keep the last maxLength characters, showing most recent text
    return '...' + text.slice(-maxLength)
  }

  const initialText = ''

  // Track current page and disable body scroll
  useEffect(() => {
    setCurrentPage('rakshak')
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [])

  // Handle voice recognition results with real-time transcript display
  const handleVoiceResult = useCallback((transcript: string, isFinal: boolean) => {
    if (transcript.trim()) {
      console.log('🎤 User said:', transcript, 'Final:', isFinal)
      
      // Update real-time user transcript display with truncation
      const truncatedTranscript = truncateText(transcript)
      setUserTranscript(truncatedTranscript)
      setIsUserSpeaking(true)
      setDisplayTranscript(truncatedTranscript)
      
      // Clear previous timeout
      if (transcriptTimeoutRef.current) {
        clearTimeout(transcriptTimeoutRef.current)
      }
      
      // Keep transcript visible for a bit after speech ends
      transcriptTimeoutRef.current = setTimeout(() => {
        setIsUserSpeaking(false)
        setUserTranscript('')
      }, 2000)
      
      // Only send final transcript to AI
      if (isFinal) {
        // Don't add user message here - it will be added by input_transcription event
        // Just send to AI
        apiService.sendText(transcript)
      }
    }
  }, [])

  const { isListening, startListening, stopListening, pauseListening, resumeListening, isSupported, transcript: liveTranscript } = useSpeechRecognition(handleVoiceResult)

  // Update display transcript when live transcript changes
  useEffect(() => {
    if (liveTranscript && liveTranscript.trim()) {
      setDisplayTranscript(liveTranscript)
      setIsUserSpeaking(true)
      
      // Clear previous timeout
      if (transcriptTimeoutRef.current) {
        clearTimeout(transcriptTimeoutRef.current)
      }
      
      // Set timeout to clear transcript
      transcriptTimeoutRef.current = setTimeout(() => {
        setIsUserSpeaking(false)
        setDisplayTranscript('')
      }, 2000)
    }
  }, [liveTranscript])

  // Pause/resume speech recognition based on bot speaking state
  useEffect(() => {
    if (isBotSpeaking && isListening) {
      console.log('🔇 Pausing speech recognition - bot is speaking')
      pauseListening()
      // Clear any lingering user transcript immediately when bot starts speaking
      setDisplayTranscript('')
      setIsUserSpeaking(false)
    } else if (!isBotSpeaking && !isListening && viewMode === 'voice') {
      console.log('🎤 Resuming speech recognition - bot finished speaking')
      // Longer delay to avoid picking up echo or residual audio
      setTimeout(() => {
        // Double-check bot isn't speaking again before resuming
        if (!isBotSpeaking) {
          resumeListening()
        }
      }, 1500) // Increased delay from 500ms to 1500ms
    }
  }, [isBotSpeaking, isListening, viewMode, pauseListening, resumeListening])

  // Handle stream responses from API
  const handleStreamResponse = useCallback((data: StreamResponse) => {
    // Pass stream events to video page if handler is registered
    if (videoStreamHandlerRef.current) {
      console.log('🔄 Passing event to video page:', data.type)
      videoStreamHandlerRef.current(data)
    }
    
    switch (data.type) {
      case 'connected':
        setIsConnected(true)
        setIsConnecting(false)
        // Reset all accumulated state on fresh connection
        fullResponseRef.current = ''
        audioChunksRef.current = []
        responseCompleteRef.current = true
        console.log('✅ Connected to backend - state reset')
        // Emit connection status event
        window.dispatchEvent(new CustomEvent('connectionStatusChanged', { 
          detail: { connected: true } 
        }))
        break
        
      case 'input_transcription':
        // Handle user's speech transcription from backend - just save to messages
        // DO NOT show in "Aap bol rahe hain" - that's only for live microphone input
        if (data.text && data.text.trim()) {
          // Add user message to chat history
          const userMessage: Message = {
            id: Date.now().toString(),
            text: data.text,
            isUser: true,
            timestamp: new Date()
          }
          updateMessages(prev => [...prev, userMessage])
          
          // Clear bot response displays when user speaks
          setCurrentResponse('')
          setFullResponse('')
          audioChunksRef.current = []
          // Clear fullResponseRef for next bot response
          fullResponseRef.current = ''
        }
        break
        
      case 'output_transcription':
        if (data.text) {  // Don't trim - preserve spaces for proper accumulation
          console.log('📝 Output transcription received:', JSON.stringify(data.text))
          
          setIsResponseActive(true)
          setIsBotSpeaking(true)
          
          // For first load issues, let's be more aggressive about fresh starts
          // If we don't have any current response active, treat this as completely fresh
          if (responseCompleteRef.current || !fullResponseRef.current) {
            console.log('📝 Starting completely fresh response')
            // Clear any previous response completely before starting new one
            fullResponseRef.current = data.text
            audioChunksRef.current = []
            responseCompleteRef.current = false
          } else {
            // Only accumulate if we're in the middle of an ongoing response
            // and the new text looks like it's building on the previous
            if (data.text.startsWith(fullResponseRef.current)) {
              console.log('📝 Accumulating cumulative text')
              fullResponseRef.current = data.text
            } else if (!fullResponseRef.current.includes(data.text)) {
              console.log('📝 Appending incremental text')  
              fullResponseRef.current = fullResponseRef.current + data.text
            } else {
              console.log('📝 Duplicate text, keeping existing')
              // Don't change accumulated text for duplicates
            }
          }
          
          const accumulatedText = fullResponseRef.current
          
          console.log('📝 Final accumulated text:', JSON.stringify(accumulatedText))
          
          // Store the accumulated text
          fullResponseRef.current = accumulatedText
          setFullResponse(accumulatedText)
          setCurrentResponse(truncateText(accumulatedText))
          
          // Update or add the bot message with accumulated text
          updateMessages(prev => {
            // Always check if the last message is a bot message we can update
            const lastMsg = prev[prev.length - 1]
            const isLastMessageBot = lastMsg && !lastMsg.isUser
            
            if (isLastMessageBot) {
              // Update the existing bot message
              console.log('📝 Updating bot message:', accumulatedText)
              return [...prev.slice(0, -1), {
                ...lastMsg,
                text: accumulatedText,
                audioChunks: [...audioChunksRef.current]
              }]
            } else {
              // Add new bot message
              console.log('📝 Adding new bot message:', accumulatedText)
              audioChunksRef.current = []
              return [...prev, {
                id: 'bot-msg-' + Date.now(),
                text: accumulatedText,
                isUser: false,
                timestamp: new Date(),
                audioChunks: []
              }]
            }
          })
          
          // Don't touch user speaking states here - only microphone input should control that
        }
        break
        
      case 'turn_complete':
        // Don't update messages here - keep accumulating
        // Just clean up display state
        console.log('📝 Turn complete (partial), accumulated so far:', fullResponseRef.current)
        setCurrentResponse('')
        setFullResponse('')
        setIsResponseActive(false)
        // Don't set isBotSpeaking to false here - let audio_playback_completed handle it
        // Audio might still be playing after turn_complete
        // Mark response as complete so next response starts fresh
        responseCompleteRef.current = true
        break
        
      case 'audio_playback_started':
        setIsBotSpeaking(true)
        setIsUserSpeaking(false)
        setDisplayTranscript('') // Clear any user transcript when bot starts speaking
        break
        
      case 'audio_playback_completed':
        setIsBotSpeaking(false)
        break
        
      case 'audio_chunk':
        // Play audio chunk when received
        if (data.audio_data && data.chunk_number !== undefined) {
          console.log('🔊 Received audio chunk:', data.chunk_number, 'size:', data.chunk_size)
          
          // Add to audio chunks for this message
          audioChunksRef.current.push(data.audio_data)
          
          // In voice or video mode, play immediately
          if (viewMode === 'voice' || viewMode === 'video') {
            audioService.playAudioResponse(data.audio_data, data.chunk_number)
          }
        }
        break
    }
  }, [currentResponse, viewMode])  // Add back dependencies since we use ref wrapper

  // Keep handleStreamResponse stable with a ref
  const streamHandlerRef = useRef(handleStreamResponse)
  useEffect(() => {
    streamHandlerRef.current = handleStreamResponse
  }, [handleStreamResponse])

  // Setup backend connection once on mount
  useEffect(() => {
    let mounted = true

    const setupConnection = async () => {
      if (!mounted) return
      
      try {
        setIsConnecting(true)
        // Initialize backend connection and SSE stream only if not already connected
        if (!apiService.connected) {
          await apiService.connect()
        }
        
        if (!mounted) return
        
        // Start event stream only if not already started
        apiService.startEventStream((data) => streamHandlerRef.current(data))
        setIsConnected(true)
      } catch (error) {
        if (mounted) {
          console.error('Connection setup error:', error)
          setIsConnected(false)
        }
      } finally {
        if (mounted) {
          setIsConnecting(false)
        }
      }
    }

    setupConnection()
    
    return () => {
      mounted = false
    }

    // return () => {
    //   if (typeof window !== 'undefined') {
    //     stopListening()
    //     apiService.disconnect()
    //     apiService.closeEventStream()
    //     audioService.stopAudioProcessing()
    //   }
    // }
  }, [])  // Empty deps - only run once on mount

  // Monitor connection status and attempt reconnection if needed
  useEffect(() => {
    const checkConnection = setInterval(() => {
      if (!apiService.connected && !isConnecting) {
        console.log('🔄 Connection lost, attempting to reconnect...')
        setIsConnected(false)
        setIsConnecting(true)
        
        apiService.connect().then(connected => {
          if (connected) {
            console.log('✅ Reconnected successfully')
            // Stream is already started by connect(), no need to start again
            setIsConnected(true)
          } else {
            console.error('❌ Reconnection failed')
          }
          setIsConnecting(false)
        }).catch(error => {
          console.error('❌ Reconnection error:', error)
          setIsConnecting(false)
        })
      }
    }, 5000) // Check every 5 seconds

    return () => clearInterval(checkConnection)
  }, [isConnecting])

  // Setup voice/audio when in voice mode
  useEffect(() => {
    const setupVoice = async () => {
      if (viewMode !== 'voice') {
        // Stop audio if switching away from voice
        audioService.stopAudioProcessing()
        stopListening()
        return
      }

      try {
        // Check browser support
        if (!navigator?.mediaDevices?.getUserMedia) {
          console.warn('❌ MediaDevices API not supported')
          setPermissionDenied(true)
          return
        }

        // Request microphone permission
        console.log('🎤 Requesting microphone permission...')
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach(track => track.stop())
        console.log('✅ Microphone permission granted')
        
        setPermissionDenied(false)
        
        // Setup audio processing with continuous mode
        // Only send audio when not muted AND not in chat mode
        audioService.setShouldSendAudioCallback(() => !isMutedRef.current && viewModeRef.current !== 'chat')
        audioService.setUserSpeakingCallback((isSpeaking: boolean) => {
          if (isSpeaking) {
            console.log('🗣️ User started speaking')
            setIsBotSpeaking(false)
          } else {
            console.log('🤫 User stopped speaking')
          }
        })
        
        // Set up audio playback callbacks for better state management
        audioService.setAudioPlaybackStartedCallback(() => {
          console.log('🔊 Audio playback started callback')
          setIsBotSpeaking(true)
          setIsUserSpeaking(false)
          setDisplayTranscript('')
        })
        
        audioService.setAudioPlaybackCompletedCallback(() => {
          console.log('🔇 Audio playback completed callback')
          setIsBotSpeaking(false)
        })
        
        await audioService.setupAudioProcessing()
        await audioService.activateAudioContext()
        audioService.setAudioEnabled(true)
        
        // Start continuous listening
        setTimeout(() => {
          startListening()
          console.log('🎤 Started continuous listening')
        }, 1500)
      } catch (error) {
        console.error('Voice setup error:', error)
        if (error instanceof DOMException && error.name === 'NotAllowedError') {
          console.log('❌ Microphone permission denied')
          setPermissionDenied(true)
        }
      }
    }

    if (typeof window !== 'undefined' && isConnected) {
      setupVoice()
    }

    return () => {
      if (transcriptTimeoutRef.current) {
        clearTimeout(transcriptTimeoutRef.current)
      }
    }
  }, [viewMode, isConnected])  // Only depend on viewMode and connection status

  // Handle microphone access toggle
  const handleMicToggle = async () => {
    console.log('🎤 Mic access toggle clicked!')
    
    // Toggle microphone access on/off
    if (!isMuted) {
      // Currently unmuted, so mute it
      setIsMuted(true)
      stopListening()
      audioService.setAudioEnabled(false)
      
      console.log('🔇 Microphone muted')
    } else {
      // Currently muted, so unmute it
      setIsMuted(false)
      audioService.setAudioEnabled(true)
      
      // Start listening again
      startListening()
      console.log('🔊 Microphone unmuted')
    }
  }

  // Handle microphone permission request
  const handleMicPermissionRequest = async () => {
    try {
      console.log('🎤 Requesting microphone permission...')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
      console.log('✅ Microphone permission granted')
      
      setPermissionDenied(false)
      setIsMuted(false)
      await audioService.setupAudioProcessing()
      audioService.setAudioEnabled(true)
      startListening()
      
    } catch (error: any) {
      console.error('Microphone permission error:', error)
      setPermissionDenied(true)
      // Don't show alert - browser will show its own permission UI
    }
  }

  // Set initial text directly without animation
  useEffect(() => {
    setDisplayedText(initialText)
  }, [])
  
  // Keep viewModeRef in sync with viewMode state
  useEffect(() => {
    viewModeRef.current = viewMode
  }, [viewMode])

  // Switch to chat mode
  const switchToChat = async () => {
    console.log('🔄 Switching to chat mode - stopping voice and audio')
    stopListening()
    audioService.stopCurrentAudio()  // Stop any currently playing audio
    audioService.stopAudioProcessing()
    audioService.clearAudioQueue()
    
    // Re-initialize audio service for playback-only mode (for chat message audio)
    try {
      await audioService.setupAudioProcessing()
      await audioService.activateAudioContext()
      audioService.setAudioEnabled(true)
      console.log('✅ Audio service re-initialized for chat mode')
    } catch (error) {
      console.error('❌ Failed to initialize audio for chat mode:', error)
    }
    
    setViewMode('chat')
    console.log('✅ Chat mode active - voice stopped, playback enabled')
  }

  // Switch to voice mode
  const switchToVoice = () => {
    setViewMode('voice')
  }

  // Switch to video mode
  const switchToVideo = async () => {
    console.log('🔄 Switching to video mode from:', viewMode)
    
    // If coming from chat mode, ensure audio is ready but don't restart if already connected
    if (viewMode === 'chat') {
      console.log('📹 Switching from chat to video - ensuring audio is ready')
      try {
        // Only setup audio if not already processing
        if (!audioService.isProcessing) {
          await audioService.setupAudioProcessing()
          await audioService.activateAudioContext()
        }
        audioService.setAudioEnabled(true)
        
        // Start listening if not already listening
        if (!isListening && isSupported) {
          startListening()
        }
      } catch (error) {
        console.error('❌ Failed to initialize audio for video mode:', error)
      }
    } else {
      stopListening()
      audioService.stopAudioProcessing()
    }
    
    setViewMode('video')
  }

  // Handle playing audio for a message
  const handlePlayMessageAudio = useCallback(async (message: Message) => {
    if (message.audioChunks && message.audioChunks.length > 0) {
      console.log('🔊 Playing audio for message, chunks:', message.audioChunks.length)
      // Clear any existing audio queue
      audioService.clearAudioQueue()
      audioService.clearProcessedChunks()
      // Play all chunks sequentially
      for (let i = 0; i < message.audioChunks.length; i++) {
        await audioService.playAudioResponse(message.audioChunks[i], i + 1)
      }
    } else {
      console.log('⚠️ No audio chunks available for this message')
    }
  }, [])

  // Handle sending message from chat
  const handleChatMessage = useCallback(async (text: string, image?: string) => {
    // Clear any previous response and audio
    fullResponseRef.current = ''
    setFullResponse('')
    audioChunksRef.current = []
    
    // Add user message immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      text: text || '',
      image: image,  // Include image if provided
      isUser: true,
      timestamp: new Date()
    }
    updateMessages(prev => [...prev, userMessage])
    
    // Send to API if text is provided
    if (text) {
      try {
        await apiService.sendText(text)
      } catch (error) {
        console.error('Failed to send message:', error)
        // Handle API not connected error
        if (error instanceof Error && error.message === "API_NOT_CONNECTED") {
          // Add bot message saying API not connected
          const errorMessage: Message = {
            id: Date.now().toString(),
            text: 'API not connected. Reconnecting...',
            isUser: false,
            timestamp: new Date()
          }
          updateMessages(prev => [...prev, errorMessage])
        }
      }
    }
    // Image is already sent directly in ChatPage
  }, [])

  // Render chat page if in chat mode
  if (viewMode === 'chat') {
    return (
      <ChatPage 
        onBack={onBack}
        onSwitchToVoice={switchToVoice}
        onSwitchToVideo={switchToVideo}
        messages={messages}
        onSendMessage={handleChatMessage}
        onPlayAudio={handlePlayMessageAudio}
        assistantName="Rakshak"
      />
    )
  }

  // Render video page if in video mode
  if (viewMode === 'video') {
    return (
      <VideoCapturePage 
        onBack={() => setViewMode('voice')}
        onRegisterStreamHandler={(handler) => {
          videoStreamHandlerRef.current = handler
        }}
        onSwitchToChat={async () => {
          // Stop video audio before switching to chat
          stopListening()
          audioService.stopAudioProcessing()
          audioService.clearAudioQueue()
          
          // Re-initialize audio service for playback-only mode (for chat message audio)
          try {
            await audioService.setupAudioProcessing()
            await audioService.activateAudioContext()
            audioService.setAudioEnabled(true)
            console.log('✅ Audio service re-initialized for video-to-chat transition')
          } catch (error) {
            console.error('❌ Failed to initialize audio for video-to-chat transition:', error)
          }
          
          setViewMode('chat')
        }}
        messages={messages}
        onAddMessage={(message: Message) => {
          updateMessages(prev => [...prev, message])
        }}
      />
    )
  }

  return (
    <div className="md:flex md:justify-center md:items-center min-h-screen md:bg-gray-100 bg-[#FFFAF4]">
      <div className="relative bg-[#FFFAF4] w-full min-h-screen md:w-[480px] lg:w-[520px] md:h-screen md:shadow-xl md:border md:border-gray-200" style={{paddingBottom: '80px'}}>

        {/* Orange Header */}
        <div className="absolute bg-[#E9842F] flex items-center justify-between w-full md:w-[480px] lg:w-[520px] z-20" style={{height: '56px', top: '0px', paddingTop: '12px', paddingRight: '20px', paddingBottom: '12px', paddingLeft: '20px'}}>
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-white">
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

        {/* Animated Voice Agent Circle */}
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

            {/* Glowing ring effect - only when bot is speaking with light orange */}
            {isBotSpeaking && (
              <div 
                className="absolute inset-0 rounded-full animate-pulse"
                style={{
                  background: `radial-gradient(circle, transparent 40%, #FFB366 60%, #FFA652 80%)`,
                  filter: 'blur(10px)',
                  boxShadow: '0 0 50px #FFB366',
                  width: '180px',
                  height: '180px',
                  transform: 'translate(-50%, -50%)',
                  left: '50%',
                  top: '50%'
                }}
              />
            )}
            
            {/* Main circle container */}
            <div 
              className="relative rounded-full overflow-hidden flex justify-center items-center"
              style={{
                width: '160px',
                height: '160px',
                boxShadow: isBotSpeaking 
                  ? '0 0 40px #FFB366, inset 0 0 25px #FFA652' 
                  : 'none',
                animation: isBotSpeaking ? 'glow 2s ease-in-out infinite' : 'none',
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

        {/* Uploaded Image Card - Shows below voice circle */}
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
              {/* Close button */}
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

        {/* Text Display Area - Shows user speech and bot responses */}
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
            {/* Show permission denied message */}
            {permissionDenied ? (
              <div className="text-center">
                <p className="font-medium text-[#F46200]" style={{fontFamily: 'Inter, sans-serif', fontSize: '16px', lineHeight: '150%'}}>
                  Microphone permission chahiye. Browser settings mein microphone allow kariye.
                </p>
              </div>
            ) : (
              <>
                {/* Show user transcript when speaking */}
                {isUserSpeaking && displayTranscript && (
                  <div className="text-center animate-fade-in">
                    <p className="text-sm text-[#757575] mb-1" style={{fontFamily: 'General Sans, sans-serif', fontWeight: 500}}>
                      Aap bol rahe hain:
                    </p>
                    <p className="text-[#269697]" 
                       style={{fontFamily: 'General Sans, sans-serif', fontWeight: 500, fontSize: '18px', lineHeight: '150%'}}>
                      "{displayTranscript}"
                    </p>
                  </div>
                )}
                
                {/* Show bot response */}
                {currentResponse && !isUserSpeaking && (
                  <div className="text-center animate-fade-in">
                    <p className="text-sm text-[#757575] mb-1" style={{fontFamily: 'General Sans, sans-serif', fontWeight: 500}}>
                      Rakshak:
                    </p>
                    <p className="text-[#F46200]" 
                       style={{fontFamily: 'General Sans, sans-serif', fontWeight: 500, fontSize: '18px', lineHeight: '150%'}}>
                      {currentResponse}
                    </p>
                  </div>
                )}
                
                {/* Show initial greeting if no activity */}
                {!isUserSpeaking && !currentResponse && messages.length === 0 && (
                  <div className="text-center">
                    <p className="text-[#757575]" 
                       style={{fontFamily: 'Inter, sans-serif', fontStyle: 'italic', fontWeight: 500, fontSize: '16px', lineHeight: '150%'}}>
                      {initialText}
                    </p>
                  </div>
                )}
                
                {/* Show last message if no current activity */}
                {!isUserSpeaking && !currentResponse && messages.length > 0 && (
                  <div className="text-center animate-fade-in">
                    {messages[messages.length - 1].isUser ? (
                      <>
                        <p className="text-sm text-[#757575] mb-1" style={{fontFamily: 'General Sans, sans-serif', fontWeight: 500}}>
                          Aapne kaha:
                        </p>
                        <p className="text-[#269697]" 
                           style={{fontFamily: 'General Sans, sans-serif', fontWeight: 500, fontSize: '18px', lineHeight: '150%'}}>
                          "{messages[messages.length - 1].text}"
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-[#757575] mb-1" style={{fontFamily: 'General Sans, sans-serif', fontWeight: 500}}>
                          Rakshak:
                        </p>
                        <p className="text-[#F46200]" 
                           style={{fontFamily: 'General Sans, sans-serif', fontWeight: 500, fontSize: '18px', lineHeight: '150%'}}>
                          {messages[messages.length - 1].text}
                        </p>
                      </>
                    )}
                  </div>
                )}
              </>
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
              onClick={onBack} 
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
                      
                      // Send image to API (remove data URL prefix)
                      await apiService.sendImage(imageUrl.split(',')[1])
                      
                      // Send a text message to trigger response about the image
                      await apiService.sendText('Please analyze this image')
                      
                      // Clear the file input for future uploads
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
            >
              {isMuted ? (
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

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes glow {
          0% {
            box-shadow: 0 0 30px #FFB36680, inset 0 0 20px #FFA65240;
          }
          50% {
            box-shadow: 0 0 60px #FFB366A0, inset 0 0 35px #FFA65260;
          }
          100% {
            box-shadow: 0 0 30px #FFB36680, inset 0 0 20px #FFA65240;
          }
        }
        
        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.8;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
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

export default RakshakPage