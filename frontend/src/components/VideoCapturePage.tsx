'use client'

import React, { useState, useEffect, useRef, useCallback, startTransition, memo } from 'react'
import { videoService } from '../services/videoService'
import { apiService, type StreamResponse } from '../services/apiService'
import { audioService } from '../services/audioService'
import { useApp } from '../contexts/AppContext'

interface VideoCapturePageProps {
  onBack: () => void
  onSwitchToChat?: () => void
  messages?: any[]
  onAddMessage?: (message: any) => void
  onRegisterStreamHandler?: (handler: (data: StreamResponse) => void) => void
}

interface VideoMessage {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

const VideoCapturePage = ({ onBack, onSwitchToChat, messages: parentMessages = [], onAddMessage, onRegisterStreamHandler }: VideoCapturePageProps) => {
  const { setVideoPermission } = useApp()
  const [isRecording, setIsRecording] = useState(true)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [currentResponse, setCurrentResponse] = useState('')
  const [isBotSpeaking, setIsBotSpeaking] = useState(false)
  const [userTranscript, setUserTranscript] = useState('')
  const [isUserSpeaking, setIsUserSpeaking] = useState(false)
  const [messages, setMessages] = useState<VideoMessage[]>([])
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isVideoPaused, setIsVideoPaused] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [responseBuffer, setResponseBuffer] = useState('')
  const [lastResponseTime, setLastResponseTime] = useState(0)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const transcriptTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const timerIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const isMutedRef = useRef(isMuted)
  const currentResponseRef = useRef('')
  const responseBufferRef = useRef('')
  const responseTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const lastMessageIdRef = useRef<string>('')
  const responseAccumulatorRef = useRef('')
  const audioChunksRef = useRef<string[]>([]) // Store audio chunks for playback
  const frameCountRef = useRef(0) // Track frame count for periodic prompts

  // Update ref when isMuted changes
  useEffect(() => {
    isMutedRef.current = isMuted
  }, [isMuted])
  
  // Debug logging to see state changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (isUserSpeaking || userTranscript || currentResponse) {
        console.log('🔍 VIDEO STATE CHECK:', {
          isUserSpeaking,
          userTranscript: userTranscript ? `"${userTranscript.slice(0, 30)}..."` : null,
          currentResponse: currentResponse ? `"${currentResponse.slice(0, 30)}..."` : null,
          timestamp: new Date().toISOString().slice(11, 23)
        })
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [isUserSpeaking, userTranscript, currentResponse])

  // Remove browser speech recognition - backend handles all STT via audio stream

  // Handle stream responses from API - OPTIMIZED FOR VIDEO MODE
  const handleStreamResponse = useCallback((data: StreamResponse) => {
    console.log('🎯 Video page received stream event:', data.type, 'Has text:', !!data.text)
    
    switch (data.type) {
      case 'connected':
        console.log('✅ Video page received connected event')
        setIsConnected(true)
        // Emit video-specific connection status event
        window.dispatchEvent(new CustomEvent('videoConnectionStatusChanged', { 
          detail: { connected: true } 
        }))
        break
        
      case 'input_transcription':
        // Handle user's speech transcription and add to messages
        if (data.text && data.text.trim()) {
          console.log('🎤 User said (from backend):', data.text)
          
          // Add user message to history
          if (onAddMessage) {
            onAddMessage({
              text: data.text,
              isUser: true
            })
          }
          
          // Clear bot response and reset accumulator
          responseAccumulatorRef.current = ''
          currentResponseRef.current = ''
          audioChunksRef.current = [] // Clear audio chunks for new response
          
          setCurrentResponse('')
          setIsBotSpeaking(false)
          setIsUserSpeaking(true)
          setUserTranscript(data.text)
          
          console.log('🎤 VIDEO input_transcription: CLEARED currentResponse, set user speaking:', {
            userTranscript: data.text,
            isUserSpeaking: true,
            clearedResponse: 'YES - currentResponse set to empty'
          })
          
          // Clear after a longer delay
          if (transcriptTimeoutRef.current) {
            clearTimeout(transcriptTimeoutRef.current)
          }
          transcriptTimeoutRef.current = setTimeout(() => {
            console.log('🎤 VIDEO: Clearing user speaking states after timeout')
            setIsUserSpeaking(false)
            setUserTranscript('')
          }, 8000) // Increased to 8 seconds to ensure visibility
        }
        break
        
      case 'output_transcription':
        // Handle bot response - starts fresh for each new response
        if (data.text) {
          // Clear user speaking after a short delay to ensure it was visible
          setTimeout(() => {
            setUserTranscript('')
            setIsUserSpeaking(false)
          }, 1000)
          
          // For completely new response, reset everything
          if (!currentResponseRef.current || data.text.length < currentResponseRef.current.length) {
            currentResponseRef.current = data.text
          } else if (data.text.startsWith(currentResponseRef.current)) {
            // Backend sent accumulated text
            currentResponseRef.current = data.text
          } else if (!currentResponseRef.current.includes(data.text)) {
            // New incremental text to append
            currentResponseRef.current = currentResponseRef.current + data.text
          }
          
          // Set bot response and ensure it stays visible
          setCurrentResponse(currentResponseRef.current)
          setIsBotSpeaking(true)
          
          console.log('📝 VIDEO output_transcription: SET currentResponse:', {
            newResponse: currentResponseRef.current,
            length: currentResponseRef.current.length,
            isBotSpeaking: true
          })
        }
        break
        
      case 'text_message_complete':
        // Just log - let turn_complete handle the clearing
        console.log('✅ VIDEO: Text message complete')
        break
        
      case 'turn_complete':
        // Keep response visible - only clear when user speaks or new response comes
        console.log('📝 VIDEO: Turn complete - keeping response visible until user speaks')
        // DON'T clear automatically - let it stay until user interaction
        break
        
      case 'audio_chunk':
        // Store audio chunk but DON'T play it - SarathiPage handles audio playback
        if (data.audio_data && data.chunk_number !== undefined) {
          console.log('🔊 Video page received audio chunk:', data.chunk_number, '- NOT playing (handled by parent)')
          // Store audio chunks for message playback
          audioChunksRef.current.push(data.audio_data)
          // DON'T play audio here - it's already being played by SarathiPage handler
          // audioService.playAudioResponse(data.audio_data, data.chunk_number)
        }
        break
        
      case 'audio_playback_started':
        setIsBotSpeaking(true)
        break
        
      case 'audio_playback_completed':
        // DON'T set isBotSpeaking false here - let currentResponse stay visible
        console.log('🔊 VIDEO: Audio playback completed - keeping response visible')
        break
    }
  }, [onAddMessage])

  // Register our stream handler with the parent
  useEffect(() => {
    if (onRegisterStreamHandler) {
      console.log('📡 Video page registering stream handler with parent at:', new Date().toISOString())
      console.log('🔍 REGISTRATION DEBUG - Current states:', { currentResponse, isUserSpeaking, isBotSpeaking })
      onRegisterStreamHandler(handleStreamResponse)
      
      // Check if already connected and trigger connected event
      if (apiService.connected) {
        console.log('📡 Video page - already connected, triggering event')
        handleStreamResponse({ type: 'connected' })
      }
      
      // Force a test to see if handler works
      setTimeout(() => {
        console.log('🧪 Testing if video handler is working after 1 second...')
      }, 1000)
    } else {
      console.log('⚠️ Video page - no parent stream handler registration available')
    }
    
    return () => {
      console.log('🔌 Video page cleanup')
      // Clear any pending timeouts
      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current)
      }
      if (transcriptTimeoutRef.current) {
        clearTimeout(transcriptTimeoutRef.current)
      }
      // Clear refs
      currentResponseRef.current = ''
      responseAccumulatorRef.current = ''
      responseBufferRef.current = ''
      audioChunksRef.current = [] // Clear audio chunks
      // Unregister when unmounting
      if (onRegisterStreamHandler) {
        onRegisterStreamHandler(null as any)
      }
    }
  }, [onRegisterStreamHandler, handleStreamResponse])

  // Update local messages when parent messages change
  useEffect(() => {
    if (parentMessages && parentMessages.length > 0) {
      // Sync local messages with parent messages
      setMessages(parentMessages)
      
      // If the last message is from bot, show it as current response
      const lastMessage = parentMessages[parentMessages.length - 1]
      if (lastMessage && !lastMessage.isUser) {
        setCurrentResponse(lastMessage.text)
        setIsBotSpeaking(false) // Set to false since it's already complete
        
        // DON'T clear the response - keep it visible until user speaks
        console.log('📝 VIDEO: Keeping bot response visible from parent messages')
      }
    }
  }, [parentMessages])

  // Initialize camera and start recording
  useEffect(() => {
    const initCamera = async () => {
      try {
        // Clean up any existing audio first to prevent echo
        console.log('🔄 VideoCapturePage initializing - CLEANING UP AUDIO to prevent echo')
        audioService.stopCurrentAudio()
        audioService.clearAudioQueue()
        audioService.stopAudioProcessing()
        
        setCameraError(null)
        const stream = await videoService.startCamera(facingMode)
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoService.setVideoElement(videoRef.current)
        }
        
        // Track video permission granted
        setVideoPermission(true)
        console.log('📷 Video permission granted')
        setIsRecording(true)
        
        // Capture and send first frame immediately for instant response
        setTimeout(async () => {
          if (apiService.connected && videoRef.current) {
            try {
              console.log('📸 Capturing first frame immediately')
              const canvas = document.createElement('canvas')
              canvas.width = videoRef.current.videoWidth
              canvas.height = videoRef.current.videoHeight
              const ctx = canvas.getContext('2d')
              if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0)
                const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]
                
                // Send first frame immediately - no prompt needed
                frameCountRef.current = 1
                await apiService.sendImage(base64Image)
                console.log('✅ Sent first frame immediately - no prompt')
              }
            } catch (error) {
              console.error('❌ Failed to capture first frame:', error)
            }
          }
        }, 100) // Small delay to ensure video is ready
        
        // Then continue capturing frames every 5 seconds
        videoService.startFrameCapture(5000, async (base64Image) => {
          console.log('📸 Frame captured, connected:', apiService.connected)
          if (apiService.connected) {
            try {
              // Increment frame counter (starting from 2 since first was sent immediately)
              frameCountRef.current++
              
              // Send image to backend for context
              await apiService.sendImage(base64Image).catch(error => {
                console.error('❌ Image send error:', error)
              })
              console.log('✅ Sent video frame for context, frame:', frameCountRef.current)
              
              // For all frames after the first, just send images, no text needed
              // The AI already knows it's receiving video from the first "What do you see?" prompt
            } catch (error) {
              console.error('❌ Frame capture error:', error)
            }
          }
        })
        
        // Setup audio processing to send audio to backend
        console.log('🎤 Setting up audio processing for video mode')
        await audioService.setupAudioProcessing()
        
        // Set callback to control when audio should be sent
        audioService.setShouldSendAudioCallback(() => !isMutedRef.current) // Don't send audio when muted
        audioService.setAudioEnabled(true)
        
      } catch (error: any) {
        console.error('Camera initialization error:', error)
        setCameraError(error.message || 'Camera access failed')
        setIsRecording(false)
      }
    }

    initCamera()

    return () => {
      videoService.stopVideoStream()
      audioService.setAudioEnabled(false) // Disable audio first
      audioService.stopAudioProcessing() // Stop audio processing when leaving video mode
      audioService.setShouldSendAudioCallback(() => false) // Ensure no audio is sent
      if (transcriptTimeoutRef.current) {
        clearTimeout(transcriptTimeoutRef.current)
      }
    }
  }, [facingMode])

  // Handle timer based on recording state
  useEffect(() => {
    if (isRecording && !isVideoPaused) {
      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } else {
      // Stop timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [isRecording, isVideoPaused])

  // Switch camera
  const handleSwitchCamera = async () => {
    try {
      setCameraError(null)
      const newFacingMode = facingMode === 'user' ? 'environment' : 'user'
      setFacingMode(newFacingMode)
    } catch (error: any) {
      console.error('Camera switch error:', error)
      setCameraError('Failed to switch camera')
    }
  }

  // Stop recording and go back
  const handleStop = () => {
    videoService.stopVideoStream()
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
    }
    onBack()
  }
  
  // Toggle microphone mute/unmute
  const handleMicToggle = () => {
    console.log('🎤 Video mic toggle clicked!')
    
    if (!isMuted) {
      // Currently unmuted, so mute it
      setIsMuted(true)
      audioService.setAudioEnabled(false)
      console.log('🔇 Video microphone muted')
    } else {
      // Currently muted, so unmute it
      setIsMuted(false)
      audioService.setAudioEnabled(true)
      console.log('🎤 Video microphone unmuted')
    }
  }

  // Toggle video on/off
  const handleVideoToggle = () => {
    if (isVideoPaused) {
      // Resume video
      if (videoRef.current) {
        videoRef.current.play()
      }
      setIsVideoPaused(false)
      setIsRecording(true)
      // Resume frame capture
      videoService.startFrameCapture(5000, async (base64Image) => {
        console.log('📸 Frame captured (resume), connected:', apiService.connected)
        if (apiService.connected) {
          try {
            // Increment frame counter
            frameCountRef.current++
            
            // Send image to backend for context
            await apiService.sendImage(base64Image).catch(error => {
              console.error('❌ Image send error (resume):', error)
            })
            console.log('✅ Sent video frame for context (resume)')
            
            // No need to send prompts on resume - user will ask if needed
          } catch (error) {
            console.error('❌ Frame capture error (resume):', error)
          }
        }
      })
    } else {
      // Pause video
      if (videoRef.current) {
        videoRef.current.pause()
      }
      setIsVideoPaused(true)
      setIsRecording(false)
      // Stop frame capture
      videoService.stopFrameCapture()
    }
  }
  
  // Format timer display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 bg-black md:bg-gray-100 md:flex md:justify-center md:items-center">
      <div className="relative w-full h-full md:w-[480px] lg:w-[520px] md:h-screen bg-black md:shadow-xl md:overflow-hidden">
        
        {/* Full screen video */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

      {/* Header with Timer and Chat button aligned horizontally */}
      <div className="absolute bg-transparent flex items-center justify-between w-full z-20" style={{height: '56px', top: '0px', paddingTop: '12px', paddingRight: '20px', paddingBottom: '12px', paddingLeft: '20px'}}>
        <div className="flex-1"></div>
        
        {/* Timer centered in the middle */}
        <div className="flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
          <span className="text-white text-sm font-semibold" style={{fontFamily: 'SF Pro Display, Inter, sans-serif', letterSpacing: '1px'}}>
            {formatTime(recordingTime)}
          </span>
        </div>
        
        {/* Chat button - same as SarathiPage */}
        <button onClick={onSwitchToChat} className="flex items-center" style={{width: '93px', height: '32px', gap: '8px', borderRadius: '12px', paddingRight: '10px', paddingLeft: '10px'}}>
          <svg width="93" height="32" viewBox="0 0 93 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="93" height="32" rx="12" fill="#FFFAF4"/>
            <path d="M15.474 21.21C12.674 21.21 10.504 18.928 10.504 15.96C10.504 13.006 12.674 10.738 15.474 10.738C17.994 10.738 20.01 12.418 20.388 14.896H18.75C18.47 13.272 17.154 12.124 15.488 12.124C13.5 12.124 12.1 13.734 12.1 15.96C12.1 18.214 13.5 19.824 15.488 19.824C17.154 19.824 18.47 18.662 18.75 17.038H20.388C20.01 19.53 17.994 21.21 15.474 21.21ZM23.2905 16.814V21H21.8765V10.948H23.2905V14.77C23.7805 13.972 24.5365 13.44 25.5585 13.44C27.0845 13.44 28.0925 14.42 28.0925 16.198V21H26.6785V16.674C26.6785 15.4 26.1185 14.686 25.0685 14.686C24.1025 14.686 23.2905 15.498 23.2905 16.814ZM34.4642 21V19.852C34.0022 20.678 33.1762 21.14 32.0842 21.14C30.5442 21.14 29.5362 20.258 29.5362 18.9C29.5362 17.444 30.6982 16.688 32.9102 16.688C33.3442 16.688 33.6942 16.702 34.2962 16.772V16.226C34.2962 15.162 33.7222 14.56 32.7422 14.56C31.7062 14.56 31.0762 15.176 31.0342 16.212H29.7462C29.8162 14.546 31.0062 13.44 32.7422 13.44C34.5762 13.44 35.6402 14.476 35.6402 16.24V21H34.4642ZM30.8802 18.858C30.8802 19.628 31.4542 20.132 32.3642 20.132C33.5542 20.132 34.2962 19.39 34.2962 18.256V17.654C33.7502 17.584 33.3582 17.57 32.9942 17.57C31.5802 17.57 30.8802 17.99 30.8802 18.858ZM41.6484 19.628V20.874C41.2144 21.07 40.8364 21.14 40.3884 21.14C39.0164 21.14 38.0644 20.398 38.0644 18.76V14.784H36.4264V13.58H38.0644V11.382H39.4784V13.58H41.7184V14.784H39.4784V18.438C39.4784 19.46 39.9684 19.824 40.7244 19.824C41.0604 19.824 41.3544 19.768 41.6484 19.628Z" fill="#757575"/>
            <path d="M73.6668 20.1667H60.3335M60.3335 20.1667L63.6668 16.8333M60.3335 20.1667L63.6668 23.5M60.3335 11.8333H73.6668M73.6668 11.8333L70.3335 8.5M73.6668 11.8333L70.3335 15.1667" stroke="#757575" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Translucent message display area - MATCHES SARATHI PAGE APPROACH */}
      <div className="absolute top-24 left-4 right-4 max-h-48 overflow-y-auto z-10">
        {/* Only show the box when there's content to display */}
        {(isUserSpeaking && userTranscript) || currentResponse ? (
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 min-h-[60px] transition-opacity duration-200" style={{
            willChange: 'opacity',
            transform: 'translateZ(0)',
            contain: 'layout style paint'
          }}>
            {isUserSpeaking && userTranscript ? (
              /* Priority 1: Only show when user is actively speaking */
              <div className="text-center animate-fade-in">
                <p className="text-xs text-white/90 font-semibold mb-1" style={{fontFamily: 'General Sans, sans-serif', fontWeight: 500, textShadow: '1px 1px 2px rgba(0,0,0,0.7)'}}>
                  Aap bol rahe hain:
                </p>
                <p className="text-white text-sm font-medium leading-relaxed" 
                   style={{fontFamily: 'General Sans, sans-serif', fontWeight: 500, fontSize: '16px', lineHeight: '150%', textShadow: '1px 1px 2px rgba(0,0,0,0.7)'}}>
                  "{userTranscript}"
                </p>
              </div>
            ) : currentResponse ? (
              /* Priority 2: Show bot response - KEEP VISIBLE until user speaks again */
              <div className="text-center animate-fade-in">
                <p className="text-xs text-white/90 font-semibold mb-1" style={{fontFamily: 'General Sans, sans-serif', fontWeight: 500, textShadow: '1px 1px 2px rgba(0,0,0,0.7)'}}>
                  Sarathi:
                </p>
                <p className="text-white text-sm font-medium leading-relaxed" 
                   style={{fontFamily: 'General Sans, sans-serif', fontWeight: 500, fontSize: '16px', lineHeight: '150%', textShadow: '1px 1px 2px rgba(0,0,0,0.7)'}}>
                  {currentResponse}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Bottom navigation bar with white background - moved up and rounded top */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm rounded-t-3xl" style={{paddingBottom: '20px', height: '120px'}}>
        <div className="flex items-center justify-between" style={{paddingTop: '35px', paddingLeft: '20px', paddingRight: '20px'}}>
          {/* Left side - Close and Switch Camera */}
          <div className="flex items-center gap-1">
            {/* Close button */}
            <button onClick={handleStop} className="p-0">
              <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0.5" y="0.863281" width="40.2727" height="40.2727" rx="20.1364" fill="white"/>
                <rect x="0.5" y="0.863281" width="40.2727" height="40.2727" rx="20.1364" stroke="#E9E8E8"/>
                <path d="M25.6362 16L15.6362 26M15.6362 16L25.6362 26" stroke="#757575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Switch camera button */}
            <button onClick={handleSwitchCamera} className="p-0">
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0.815937" y="1.16408" width="41.6718" height="41.6718" rx="20.8359" fill="white"/>
                <rect x="0.815937" y="1.16408" width="41.6718" height="41.6718" rx="20.8359" stroke="#E9E8E8" strokeWidth="1.08597"/>
                <path d="M11.6519 18.3772C11.6519 18.0269 11.6519 17.8517 11.6665 17.7042C11.8075 16.2813 12.9331 15.1556 14.3561 15.0146C14.5036 15 14.6882 15 15.0574 15C15.1997 15 15.2708 15 15.3312 14.9963C16.1025 14.9496 16.7778 14.4629 17.066 13.746C17.0886 13.6899 17.1097 13.6266 17.1519 13.5C17.194 13.3734 17.2151 13.3101 17.2377 13.254C17.5259 12.5371 18.2012 12.0504 18.9725 12.0037C19.0329 12 19.0996 12 19.233 12H24.0707C24.2041 12 24.2708 12 24.3312 12.0037C25.1025 12.0504 25.7778 12.5371 26.066 13.254C26.0886 13.3101 26.1097 13.3734 26.1519 13.5C26.194 13.6266 26.2151 13.6899 26.2377 13.746C26.5259 14.4629 27.2012 14.9496 27.9725 14.9963C28.0329 15 28.104 15 28.2463 15C28.6155 15 28.8001 15 28.9476 15.0146C30.3706 15.1556 31.4963 16.2813 31.6372 17.7042C31.6519 17.8517 31.6519 18.0269 31.6519 18.3772V26.2C31.6519 27.8802 31.6519 28.7202 31.3249 29.362C31.0373 29.9265 30.5783 30.3854 30.0138 30.673C29.3721 31 28.532 31 26.8519 31H16.4519C14.7717 31 13.9316 31 13.2899 30.673C12.7254 30.3854 12.2665 29.9265 11.9788 29.362C11.6519 28.7202 11.6519 27.8802 11.6519 26.2V18.3772Z" stroke="#757575" strokeWidth="1.73" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M26.1235 22.4717C25.9766 23.8523 25.1943 25.1461 23.8999 25.8934C21.7492 27.1351 18.9992 26.3983 17.7576 24.2476L17.6253 24.0186M17.1799 21.5269C17.3268 20.1462 18.1091 18.8525 19.4036 18.1051C21.5542 16.8635 24.3042 17.6003 25.5459 19.7509L25.6781 19.98M17.1519 25.2082L17.5391 23.7629L18.9844 24.1502M24.3194 19.8484L25.7646 20.2356L26.1519 18.7904" stroke="#757575" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Center - Animated Agent Circle (smaller) */}
          <div className="relative" style={{marginTop: '-10px'}}>
            {/* Outer orange ring */}
            <div 
              className="absolute inset-0 flex justify-center items-center"
              style={{
                width: '100px',
                height: '100px',
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

            {/* Glowing effect when speaking */}
            {isBotSpeaking && (
              <div 
                className="absolute inset-0 rounded-full animate-pulse"
                style={{
                  background: `radial-gradient(circle, transparent 30%, #FFB36640 50%, #FFA65240 70%)`,
                  filter: 'blur(8px)',
                  width: '100px',
                  height: '100px',
                  transform: 'translate(-50%, -50%)',
                  left: '50%',
                  top: '50%'
                }}
              />
            )}
            
            {/* Main circle */}
            <div 
              className="relative rounded-full overflow-hidden flex justify-center items-center"
              style={{
                width: '80px',
                height: '80px',
                boxShadow: isBotSpeaking 
                  ? '0 0 20px #FFB36660, inset 0 0 15px #FFA65240' 
                  : 'none',
                backgroundColor: 'transparent'
              }}
            >
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

          {/* Right side - Mic and Video */}
          <div className="flex items-center gap-1">
            {/* Microphone button */}
            <button 
              onClick={handleMicToggle}
              className={`p-0 ${!isMuted ? 'animate-pulse' : ''}`}
            >
              {isMuted ? (
                <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0.49707" y="0.498047" width="37.0027" height="37.0027" rx="18.5014" fill="white" fillOpacity="0.8"/>
                  <rect x="0.49707" y="0.498047" width="37.0027" height="37.0027" rx="18.5014" stroke="#E9E8E8"/>
                  <path d="M21.5896 16.7531V12.9526C21.5896 11.5215 20.4294 10.3613 18.9983 10.3613C17.9812 10.3613 17.1009 10.9474 16.6768 11.8003M18.9983 25.0451V27.6363M18.9983 25.0451C15.6591 25.0451 12.9521 22.3381 12.9521 18.9988V17.2713M18.9983 25.0451C22.3376 25.0451 25.0446 22.3381 25.0446 18.9988V17.2713M15.5433 27.6363H22.4533M10.3608 10.3613L27.6358 27.6363M18.9983 21.5901C17.5672 21.5901 16.4071 20.4299 16.4071 18.9988V16.4076L20.8317 20.83C20.3627 21.2996 19.7145 21.5901 18.9983 21.5901Z" stroke="#757575" strokeWidth="1.7275" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0.49707" y="0.498047" width="37.0027" height="37.0027" rx="18.5014" fill="white"/>
                  <rect x="0.49707" y="0.498047" width="37.0027" height="37.0027" rx="18.5014" stroke="#E9E8E8"/>
                  <path d="M25.0446 17.2713V18.9988C25.0446 22.3381 22.3377 25.0451 18.9984 25.0451M12.9521 17.2713V18.9988C12.9521 22.3381 15.6591 25.0451 18.9984 25.0451M18.9984 25.0451V27.6363M15.5434 27.6363H22.4534M18.9984 21.5901C17.5673 21.5901 16.4071 20.4299 16.4071 18.9988V12.9526C16.4071 11.5215 17.5673 10.3613 18.9984 10.3613C20.4295 10.3613 21.5896 11.5215 21.5896 12.9526V18.9988C21.5896 20.4299 20.4295 21.5901 18.9984 21.5901Z" stroke="#757575" strokeWidth="1.7275" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>

            {/* Video toggle button - pauses/resumes video */}
            <button onClick={handleVideoToggle} className="p-0">
              {isVideoPaused ? (
                // Normal video icon (video is off, click to turn on)
                <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0.460352" y="0.460352" width="37.0793" height="37.0793" rx="18.5396" fill="white"/>
                  <rect x="0.460352" y="0.460352" width="37.0793" height="37.0793" rx="18.5396" stroke="#E9E8E8" strokeWidth="0.920705"/>
                  <path d="M28.2071 16.1743C28.2071 15.6165 28.2071 15.3377 28.0968 15.2085C28.0011 15.0965 27.8575 15.037 27.7106 15.0486C27.5413 15.0619 27.3441 15.2591 26.9497 15.6535L23.6035 18.9996L26.9497 22.3458C27.3441 22.7402 27.5413 22.9374 27.7106 22.9507C27.8575 22.9623 28.0011 22.9028 28.0968 22.7907C28.2071 22.6616 28.2071 22.3827 28.2071 21.8249V16.1743Z" stroke="#757575" strokeWidth="1.84141" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9.79297 16.9741C9.79297 15.4271 9.79297 14.6537 10.094 14.0628C10.3588 13.5431 10.7814 13.1206 11.3011 12.8557C11.892 12.5547 12.6654 12.5547 14.2124 12.5547H19.1842C20.7311 12.5547 21.5046 12.5547 22.0954 12.8557C22.6151 13.1206 23.0377 13.5431 23.3025 14.0628C23.6035 14.6537 23.6035 15.4271 23.6035 16.9741V21.0252C23.6035 22.5721 23.6035 23.3456 23.3025 23.9364C23.0377 24.4561 22.6151 24.8787 22.0954 25.1435C21.5046 25.4446 20.7311 25.4446 19.1842 25.4446H14.2124C12.6654 25.4446 11.892 25.4446 11.3011 25.1435C10.7814 24.8787 10.3588 24.4561 10.094 23.9364C9.79297 23.3456 9.79297 22.5721 9.79297 21.0252V16.9741Z" stroke="#757575" strokeWidth="1.84141" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                // Slashed video icon (video is on, click to turn off)
                <svg width="40" height="41" viewBox="0 0 40 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0.719169" y="1.24602" width="38.7805" height="38.7805" rx="19.3902" fill="white"/>
                  <rect x="0.719169" y="1.24602" width="38.7805" height="38.7805" rx="19.3902" stroke="#E9E8E8" strokeWidth="0.999862"/>
                  <path d="M13.5442 14.0696C11.9902 14.0696 10.7305 15.3294 10.7305 16.8834V24.3867C10.7305 25.9407 11.9902 27.2004 13.5442 27.2004H21.9855C23.2541 27.2004 24.3267 26.3608 24.6778 25.2069M24.7992 20.635L28.2079 17.2263C28.6097 16.8246 28.8106 16.6237 28.983 16.6101C29.1327 16.5983 29.2789 16.6589 29.3764 16.773C29.4888 16.9046 29.4888 17.1887 29.4888 17.7569V23.5131C29.4888 24.0813 29.4888 24.3655 29.3764 24.497C29.2789 24.6112 29.1327 24.6717 28.983 24.66C28.8106 24.6464 28.6097 24.4455 28.2079 24.0437L24.7992 20.635ZM24.7992 20.635V18.5716C24.7992 16.9958 24.7992 16.2078 24.4925 15.6059C24.2228 15.0765 23.7923 14.6461 23.2629 14.3763C22.661 14.0696 21.8731 14.0696 20.2972 14.0696H17.7648M10.7305 11.2559L29.4888 30.0142" stroke="#757575" strokeWidth="1.87583" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Camera error display */}
      {cameraError && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 rounded-lg p-4 max-w-xs">
          <p className="text-red-600 text-sm">{cameraError}</p>
        </div>
      )}

        {/* CSS for animations */}
        <style jsx>{`
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
    </div>
  )
}

export default memo(VideoCapturePage)