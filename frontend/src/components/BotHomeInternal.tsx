/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import Header from './Header'
import ChatView from './ChatView'
import MainBotView from './MainBotView'
import Notification from './Notification'
import { useConversation } from '../hooks/useConversation'
import { useMicrophone } from '../providers/MicrophoneProvider'
import { apiService, type StreamResponse } from '../services/apiService'
import { audioService } from '../services/audioService'
import { videoService } from '../services/videoService'

interface BotHomeRef {
  handleConnect: () => void
  startMicrophone: () => void
}

interface BotHomeInternalProps {
  onViewChange?: (showChatView: boolean) => void
  onModalityChange?: (modality: 'AUDIO' | 'TEXT') => void
}

const BotHomeInternal = forwardRef<BotHomeRef, BotHomeInternalProps>(({ onViewChange, onModalityChange }, ref) => {
  const { 
    messages, 
    addHumanMessage, 
    addBotMessage, 
    addToolMessage,
    addStatusMessage,
    addProductLinks,
    updateOrAddBotMessage,
    finalizeStreamingMessage
  } = useConversation()
  
  // Get microphone controls from provider
  const { isListening, isSupported, startMicrophone, stopMicrophone } = useMicrophone()
  
  // Get the latest message
  const latestMessage = messages[messages.length - 1]

  // Backend connection states
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [responseModality, setResponseModality] = useState<'AUDIO' | 'TEXT'>('AUDIO')
  
  // Stream processing states
  const [currentTurnActive, setCurrentTurnActive] = useState(false)
  const [currentTextBuffer, setCurrentTextBuffer] = useState('')
  const [currentTranscriptionBuffer, setCurrentTranscriptionBuffer] = useState('')

  // Video states
  const [isVideoOpen, setIsVideoOpen] = useState(false)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>('user')
  const videoRef = useRef<HTMLVideoElement>(null)

  // Mobile device detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  // Chat view state
  const [showChatView, setShowChatView] = useState(false)

  // Notify parent when view changes
  useEffect(() => {
    onViewChange?.(showChatView)
  }, [showChatView, onViewChange])

  // Notify parent when modality changes
  useEffect(() => {
    onModalityChange?.(responseModality)
  }, [responseModality, onModalityChange])

  // Notification state
  const [notification, setNotification] = useState<{
    message: string
    type: 'success' | 'error' | 'info'
  } | null>(null)

  // Animation state
  const [animationData, setAnimationData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Show notification function
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type })
  }

  // Expose handleConnect and startMicrophone functions to parent component
  useImperativeHandle(ref, () => ({
    handleConnect,
    startMicrophone
  }))

  // Handle streaming responses from backend
  const handleStreamResponse = (data: StreamResponse) => {
    // console.log('📡 BotHomeInternal handleStreamResponse called with:', data)
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
        setCurrentTurnActive(true)
        // DISABLED: Audio handling moved to useConnectionManager to prevent duplicate playback
        // if (data.audio_data) {
        //   audioService.playAudioResponse(data.audio_data, data.chunk_number)
        // }
        break

      case 'input_transcription':
        if (data.text && data.text.trim()) {
          addHumanMessage(data.text.trim())
          if (currentTurnActive) {
            setCurrentTurnActive(false)
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
          
          setCurrentTranscriptionBuffer(prev => {
            const newBuffer = prev + data.text
            updateOrAddBotMessage(newBuffer, true)
            return newBuffer
          })
        }
        break
        
      case 'turn_complete':
        setCurrentTurnActive(false)
        
        if (data.has_text && currentTextBuffer && currentTextBuffer.trim()) {
          finalizeStreamingMessage(currentTextBuffer, false)
        }
        
        if (currentTranscriptionBuffer && currentTranscriptionBuffer.trim()) {
          const cleanedBuffer = currentTranscriptionBuffer.replace(/^null/gi, '').trim()
          if (cleanedBuffer && cleanedBuffer !== 'null') {
            finalizeStreamingMessage(cleanedBuffer, true)
          }
        }
        
        setCurrentTextBuffer('')
        setCurrentTranscriptionBuffer('')
        break
        
      case 'tool_call_start':
        // addToolMessage('🔍 Processing your request...')
        break
        
      case 'tool_call_complete':
        break
        
      case 'product_links':
        console.log('🔍 Received product links data:', {
          function_name: data.function_name,
          links_count: data.links?.length || 0,
          raw_data: data
        })
        
        if (data.links && data.links.length > 0) {
          data.links.forEach((link, index) => {
            console.log(`📋 Link ${index + 1}:`, {
              title: link.title,
              company: link.company,
              city: link.city,
              rating: link.rating,
              source: link.source,
              url: link.url,
              raw_link: link
            })
          })
          
          addProductLinks(data.links, data.function_name)
        }
        break
        
      case 'heartbeat':
        break
        
      default:
        break
    }
  }

  // Manual connect function
  const handleConnect = async () => {
    if (isConnecting || isConnected) return
    
    setIsConnecting(true)
    // showNotification('Connecting to AI backend...')
    
    try {
      const certOk = await apiService.checkCertificateStatus()
      
      if (!certOk) {
        const userChoice = confirm(
          '🔒 SSL Certificate Setup Required\n\n' +
          'The backend server is using HTTPS with a self-signed certificate.\n' +
          'You need to accept this certificate in your browser first.\n\n' +
          '📋 Instructions:\n' +
          '1. Click OK to open the backend URL in a new tab\n' +
          '2. You\'ll see a security warning - click "Advanced"\n' +
          '3. Click "Proceed to localhost (unsafe)"\n' +
          '4. Return to this tab and click Connect again\n\n' +
          'Click OK to open backend URL, or Cancel to continue without backend.'
        )
        
        if (userChoice) {
          const { config } = await import('../config/appConfig')
          window.open(config.api.baseUrl + '/', '_blank')
          showNotification('Please accept the certificate in the new tab and click Connect again')
          setIsConnecting(false)
          return
        } else {
          setIsConnecting(false)
          showNotification('Connection cancelled')
          return
        }
      }
      
      await apiService.connect(responseModality)
      setIsConnected(true)
      // showNotification('Connected to AI backend successfully!', 'success')
      
      apiService.startEventStream(handleStreamResponse)
      
    } catch (error) {
      console.error('Connection error:', error)
      setIsConnected(false)
      showNotification(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
    } finally {
      setIsConnecting(false)
    }
  }

  // Manual disconnect function
  const handleDisconnect = async () => {
    try {
      await apiService.disconnect()
      setIsConnected(false)
      // showNotification('Disconnected from AI backend')
      
      audioService.stopBrowserMicrophone()
      audioService.clearAudioQueue()
      videoService.stopVideoStream()
    } catch (error) {
      console.error('Disconnect error:', error)
      showNotification('Disconnect error')
    }
  }

  // Handle connection toggle
  const handleConnectionToggle = async () => {
    if (isConnecting) return
    
    if (isConnected) {
      if (isListening) {
        stopMicrophone()
      }
      
      await handleDisconnect()
      
      const nextModality = responseModality === 'AUDIO' ? 'AUDIO' : 'AUDIO'
      setResponseModality(nextModality)
      
      setTimeout(async () => {
        await handleConnect()
        
        if (nextModality === 'AUDIO' && !showChatView) {
          setTimeout(() => {
            startMicrophone()
          }, 1000)
        }
      }, 500)
    } else {
      await handleConnect()
    }
  }

  // Load animation data
  useEffect(() => {
    console.log('Attempting to load newanime.json...')
    fetch('/newanime.json')
      .then(res => {
        console.log('Fetch response:', res.status, res.ok)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => {
        console.log('Animation data loaded successfully:', typeof data, Object.keys(data).slice(0, 5))
        setAnimationData(data)
      })
      .catch(err => {
        console.error('Animation file could not be loaded:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      apiService.disconnect()
      audioService.stopBrowserMicrophone()
      audioService.clearAudioQueue()
      videoService.stopVideoStream()
    }
  }, [])

  // Video handling functions
  const handleVideoClick = async () => {
    console.log('🎥 Video button clicked, isVideoOpen:', isVideoOpen)
    if (!isVideoOpen) {
      try {
        console.log('Starting video capture...')
        // showNotification('Starting camera...', 'info')
        
        console.log('📷 Requesting camera access with facing mode:', currentFacingMode)
        
        // First test basic camera access
        const testStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: currentFacingMode },
          audio: false 
        })
        console.log('✅ Basic camera access successful:', testStream)
        
        // Now use the video service
        const stream = await videoService.startCamera(currentFacingMode)
        console.log('✅ Video service camera started:', stream)
        
        console.log('🔍 Checking video element ref:', videoRef.current)
        if (videoRef.current) {
          console.log('📺 Setting video stream to video element')
          videoRef.current.srcObject = stream
          videoService.setVideoElement(videoRef.current)
          
          // Set video loaded immediately and try to play
          setIsVideoLoaded(true)
          
          try {
            await videoRef.current.play()
            console.log('✅ Video is now playing')
          } catch (playError) {
            console.log('⚠️ Video play failed, trying manual approach:', playError)
            
            // Fallback: wait for metadata and try again
            videoRef.current.onloadedmetadata = async () => {
              console.log('📺 Video metadata loaded, trying to play again')
              try {
                if (videoRef.current) {
                  await videoRef.current.play()
                  console.log('✅ Video playing after metadata load')
                }
              } catch (retryError) {
                console.error('❌ Video play failed even after metadata:', retryError)
                showNotification('Camera started but video display failed', 'error')
              }
            }
          }
        }
        
        setIsVideoOpen(true)
        
        // Wait for React to re-render and create the video element
        setTimeout(() => {
          console.log('🔍 Checking video element ref after state update:', videoRef.current)
          if (videoRef.current && !videoRef.current.srcObject) {
            console.log('📺 Setting video stream to video element (delayed)')
            videoRef.current.srcObject = stream
            videoService.setVideoElement(videoRef.current)
            setIsVideoLoaded(true)
            
            videoRef.current.play().catch((error) => {
              console.log('⚠️ Video play failed:', error)
            })
          }
        }, 100) // Small delay to allow React to render
        
        // showNotification('Camera started successfully!', 'success')
        
        // Start frame capture for AI analysis if connected
        if (isConnected) {
          videoService.startFrameCapture(2000) // Send frame every 2 seconds
        }
        
      } catch (error) {
        console.error('Video error:', error)
        showNotification(error instanceof Error ? error.message : 'Failed to start camera', 'error')
      }
    } else {
      console.log('Stopping video capture...')
      
      // Capture the last frame before stopping the video
      try {
        const capturedFrameUrl = await videoService.captureFrameAsBlob()
        if (capturedFrameUrl) {
          console.log('📸 Captured last frame:', capturedFrameUrl)
          
          // Add the captured frame to the conversation
          const fileInfo = {
            name: `camera-capture-${Date.now()}.png`,
            type: 'image/png',
            url: capturedFrameUrl
          }
          
          addHumanMessage('Product shown live on call', fileInfo)
          // showNotification('Last frame captured and added to conversation', 'success')
          
          // Send the image to AI if connected
          if (isConnected) {
            try {
              // Convert blob URL to base64 for API
              const response = await fetch(capturedFrameUrl)
              const blob = await response.blob()
              const reader = new FileReader()
              reader.onload = async () => {
                const base64 = (reader.result as string).split(',')[1]
                await apiService.sendImage(base64)
                console.log('📤 Captured frame sent to AI for analysis')
              }
              reader.readAsDataURL(blob)
            } catch (error) {
              console.error('Failed to send captured frame to AI:', error)
            }
          }
        } else {
          console.log('⚠️ Failed to capture last frame')
        }
      } catch (error) {
        console.error('Error capturing last frame:', error)
      }
      
      // Stop the video stream
      videoService.stopVideoStream()
      setIsVideoOpen(false)
      setIsVideoLoaded(false)
      // showNotification('Camera stopped', 'info')
    }
  }

  // Handle camera switch (mobile only)
  const handleCameraSwitch = async () => {
    if (!isVideoOpen || !isMobile) return
    
    try {
      // showNotification('Switching camera...', 'info')
      const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user'
      
      const stream = await videoService.switchCamera(currentFacingMode)
      setCurrentFacingMode(newFacingMode)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoService.setVideoElement(videoRef.current)
      }
      
      // showNotification('Camera switched successfully!', 'success')
      
      // Restart frame capture if connected
      if (isConnected) {
        videoService.startFrameCapture(2000)
      }
      
    } catch (error) {
      console.error('Camera switch error:', error)
      showNotification(error instanceof Error ? error.message : 'Failed to switch camera', 'error')
    }
  }

  // Chat and file handling remain the same...
  const handleChatMessage = async (message: string) => {
    if (!message.trim()) return
    
    addHumanMessage(message)
    
    if (!isConnected) {
      // showNotification('Not connected to AI backend - using local mode')
      setTimeout(() => {
        addBotMessage("I'm not connected to the AI backend right now. Please check the connection and try again.")
      }, 1000)
      return
    }
    
    if (currentTurnActive) {
      console.log('Waiting for current turn to complete before sending new message...')
      const startTime = Date.now()
      const maxWaitMs = 5000
      
      while (currentTurnActive && (Date.now() - startTime) < maxWaitMs) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      if (currentTurnActive) {
        console.warn('Turn detection timeout - forcing reset to prevent blocking')
        setCurrentTurnActive(false)
      }
      console.log('Current turn completed, proceeding with new message')
    }
    
    audioService.clearAudioQueue()
    if (audioService.isPlaying) {
      audioService.stopCurrentAudio()
    }
    
    setCurrentTextBuffer('')
    setCurrentTranscriptionBuffer('')
    setCurrentTurnActive(false)
    
    console.log('Cleared buffers for new message - ready to receive fresh response')
    
    try {
      await apiService.sendText(message)
      console.log('Text message sent, waiting for AI response...')
    } catch (error) {
      console.error('Failed to send message:', error)
      showNotification(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleFileUpload = async (file: File) => {
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
      showNotification('File uploaded (AI not connected)')
    }
  }

  return (
    <main className='w-screen h-screen flex justify-center items-center'>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className='w-[500px] h-full relative bg-white'>
        <Header 
          onSwitchToChat={() => {
            setShowChatView(!showChatView)
            // showNotification(showChatView ? 'Switched to Audio view' : 'Switched to Chat view')
          }} 
          showChatView={showChatView}
          onBackClick={() => {
            setShowChatView(!showChatView)
            // showNotification(showChatView ? 'Switched to Audio view' : 'Switched to Chat view')
          }}
          isConnected={isConnected}
          isConnecting={isConnecting}
          responseModality={responseModality}
          onConnectionToggle={handleConnectionToggle}
        />

        <div className='w-full h-[90%] relative overflow-hidden'>
          <ChatView 
            showChatView={showChatView}
            messages={messages}
            onSendMessage={handleChatMessage}
            onFileUpload={handleFileUpload}
          />
          
          <MainBotView 
            showChatView={showChatView}
            latestMessage={latestMessage}
            isVideoOpen={isVideoOpen}
            isVideoLoaded={isVideoLoaded}
            videoRef={videoRef}
            isSupported={isSupported}
            animationData={animationData}
            loading={loading}
            isListening={isListening}
            isBotSpeaking={currentTurnActive}
          />
        </div>

        {!showChatView && (
          <>
            <div className='absolute bottom-10 left-4'>
              <div 
                className={`px-3 py-3 rounded-xl flex items-center gap-2 cursor-pointer transition-colors ${
                  isVideoOpen ? 'bg-[#A8D5D5] hover:bg-[#98C5C5]' : 'bg-[#EEF6F5] hover:bg-[#E0F0EF]'
                }`}
                onClick={() => {
                  console.log('📹 Button physically clicked!')
                  handleVideoClick()
                }}
              >
                <div className='w-8 h-8 rounded-lg flex items-center justify-center'>
                  <img src={isVideoOpen ? './stopvdo.svg' : './video.svg'} alt={isVideoOpen ? "Stop video" : "Start video"} />
                </div>
              </div>
            </div>
            
            {/* Camera switch button for mobile devices */}
            {isMobile && isVideoOpen && (
              <div className='absolute bottom-10 left-20 sm:bottom-10'>
                <div 
                  className='px-3 py-3 rounded-xl flex items-center gap-2 cursor-pointer transition-colors bg-[#EEF6F5] hover:bg-[#E0F0EF]'
                  onClick={handleCameraSwitch}
                >
                  <div className='w-8 h-8 rounded-lg flex items-center justify-center'>
                    <img src='./revert.svg' alt="Switch camera" />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div className='absolute left-1/2 transform -translate-x-1/2 -bottom-3 w-[170px] h-[6px] bg-black m-4 rounded-full'></div>
      </div>
    </main>
  )
})

BotHomeInternal.displayName = 'BotHomeInternal'

export default BotHomeInternal