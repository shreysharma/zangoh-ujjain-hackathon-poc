import React, { useState, useEffect, useCallback } from 'react'
import { Message, ProductLink } from '../hooks/useConversation'
import MessageList from './MessageList'
import Subtitles from './Subtitles'

interface MainBotViewProps {
  showChatView: boolean
  latestMessage?: Message | undefined
  liveTranscription?: string
  isVideoOpen: boolean
  isVideoLoaded: boolean
  videoRef: React.RefObject<HTMLVideoElement | null>
  isSupported: boolean
  isConnected?: boolean
  isConnecting?: boolean
  onConnect?: () => void
  onDisconnect?: () => void
  responseModality?: 'AUDIO' | 'TEXT'
  onModalityChange?: (modality: 'AUDIO' | 'TEXT') => void
  animationData?: unknown
  loading?: boolean
  isListening?: boolean
  isBotSpeaking?: boolean
  currentFacingMode?: 'user' | 'environment'
  products?: ProductLink[]
  messages?: Message[]
  onMicToggle?: () => void
  // Image preview prop
  currentImagePreview?: {url: string, name: string} | null
  // Subtitle props
  userTranscript?: string
  botTranscript?: string
}

const MainBotView = ({
  showChatView,
  latestMessage,
  liveTranscription,
  isVideoOpen,
  isVideoLoaded,
  videoRef,
  isSupported,
  currentFacingMode = 'user',
  products = [],
  messages = [],
  isBotSpeaking = false,
  isListening = false,
  onMicToggle,
  currentImagePreview,
  userTranscript,
  botTranscript,
}: MainBotViewProps) => {
  // Drag state for video component
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [videoPosition, setVideoPosition] = useState({ x: 0, y: 0 })

  // Local state for messages from localStorage
  const [localMessages, setLocalMessages] = useState<Message[]>([])

  // Load messages from localStorage
  const loadLocalMessages = useCallback(() => {
    try {
      const CONVERSATION_STORAGE_KEY = 'indiamart-conversation'
      const savedMessages = localStorage.getItem(CONVERSATION_STORAGE_KEY)

      if (savedMessages) {
        const parsedMessages: Message[] = JSON.parse(savedMessages)
        const messagesWithDates = parsedMessages.map(msg => ({
          ...msg,
          timestamp: typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : msg.timestamp
        }))
        setLocalMessages(messagesWithDates)
      } else {
        setLocalMessages([])
      }
    } catch (error) {
      console.error('Error loading messages from localStorage:', error)
      setLocalMessages([])
    }
  }, [])

  // Load messages on component mount and set up interval for live updates
  useEffect(() => {
    loadLocalMessages()

    // Refresh messages every 2 seconds to show live updates
    const interval = setInterval(loadLocalMessages, 2000)

    return () => clearInterval(interval)
  }, [loadLocalMessages])

  // Use local messages if available, fallback to prop messages
  const displayMessages = localMessages.length > 0 ? localMessages : messages


  // Drag handlers with useCallback for performance - supporting both mouse and touch
  const handleStart = useCallback((clientX: number, clientY: number, currentTarget: EventTarget | null) => {
    setIsDragging(true)
    const rect = (currentTarget as HTMLElement).getBoundingClientRect()
    setDragOffset({
      x: clientX - rect.left,
      y: clientY - rect.top
    })
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    handleStart(e.clientX, e.clientY, e.currentTarget)
  }, [handleStart])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    handleStart(touch.clientX, touch.clientY, e.currentTarget)
  }, [handleStart])

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return

    const containerRect = document.querySelector('.drag-container')?.getBoundingClientRect()
    if (!containerRect) return

    const newX = clientX - containerRect.left - dragOffset.x
    const newY = clientY - containerRect.top - dragOffset.y

    // Keep video within bounds
    const videoWidth = 250
    const videoHeight = 400
    const maxX = containerRect.width - videoWidth
    const maxY = containerRect.height - videoHeight

    setVideoPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    })
  }, [isDragging, dragOffset.x, dragOffset.y])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    handleMove(e.clientX, e.clientY)
  }, [handleMove])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    handleMove(touch.clientX, touch.clientY)
  }, [handleMove])

  const handleEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Add global mouse and touch event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false })
      document.addEventListener('mouseup', handleEnd)
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleEnd)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleEnd)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleEnd)
      }
    }
  }, [isDragging, handleMouseMove, handleTouchMove, handleEnd])

  // Reset position when video closes
  useEffect(() => {
    if (!isVideoOpen) {
      setVideoPosition({ x: 0, y: 0 })
    }
  }, [isVideoOpen])



  return (
    <>
      {!isVideoOpen &&
        <div className={`drag-container absolute inset-0 flex flex-col justify-center gap-4 items-center p-6 text-[20px] font-[500] transition-transform duration-500 ease-in-out ${showChatView ? '-translate-x-full' : 'translate-x-0'
          }`}>



          {/*Glowing Circle */}
          <div className="flex flex-col items-center gap-8 absolute">

            {/* Glowing Circle with GIF/Image */}
            <div className="relative">
              {/* Glowing ring effect - only when bot is speaking */}
              {isBotSpeaking && (
                <div
                  className="absolute inset-0 rounded-full animate-pulse"
                  style={{
                    background: `radial-gradient(circle, transparent 40%, #FFB366 60%, #FFB378 80%)`,
                    filter: 'blur(8px)',
                    boxShadow: '0 0 40px #298FC9',
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
                  border: '8px solid #FFB366',
                  boxShadow: isBotSpeaking
                    ? '0 0 30px #FFB366, inset 0 0 20px #FFB378'
                    : 'none',
                  animation: isBotSpeaking ? 'glow 2s ease-in-out infinite' : 'none'
                }}
              >
                {/* Show sphere when bot is speaking, otherwise show GIF */}
                {isBotSpeaking ? (
                  <img
                    src="./image copy 6.png"
                    alt="Assistant Speaking"
                    className="w-[80%] h-[80%] object-cover"
                  />
                ) : (
                  <img
                    src="./sphere.gif"
                    alt="Assistant"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>

            {/* Image Preview - Show uploaded image temporarily */}
            {currentImagePreview && (
              <div className="mt-4 flex flex-col items-center animate-fade-in">
                <div className="relative rounded-lg overflow-hidden shadow-lg max-w-[200px]">
                  <img 
                    src={currentImagePreview.url} 
                    alt={currentImagePreview.name}
                    className="w-full h-auto max-h-[150px] object-contain"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs px-2 py-1 truncate">
                    {currentImagePreview.name}
                  </div>
                </div>
              </div>
            )}

            {/* Subtitles - Reserve space to prevent layout shift */}
            {!isVideoOpen && (
              <div className="mt-6 h-16 flex items-start justify-center">
                {!showChatView && (userTranscript || botTranscript) && (
                  <Subtitles
                    userText={userTranscript}
                    botText={botTranscript}
                    isUserSpeaking={!!userTranscript && !isBotSpeaking}
                    isBotSpeaking={isBotSpeaking}
                  />
                )}
              </div>
            )}
          </div>

          {/* Messages Display - Load from localStorage */}
          {/* Commented out as per your code */}

          {/* Video Camera Feed - Draggable */}
          <div
            className={`absolute flex justify-center ${isVideoOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-0'} ${!isDragging ? 'transition-all duration-500 ease-in-out' : ''}`}
            style={{
              left: isVideoOpen ? `${videoPosition.x}px` : 'auto',
              top: isVideoOpen ? `${videoPosition.y}px` : 'auto',
              right: isVideoOpen ? 'auto' : '8px',
              bottom: isVideoOpen ? 'auto' : '24px',
              cursor: isDragging ? 'grabbing' : 'grab',
              transform: isDragging ? 'none' : undefined,
              transition: isDragging ? 'none' : 'all 0.5s ease-in-out'
            }}
          >
            {isVideoOpen && (
              <div
                className='w-[250px] h-[400px] bg-gray-800 rounded-3xl overflow-hidden shadow-lg border-2 border-white relative select-none'
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
              >
                {/* Drag handle */}
                <div className='absolute top-2 left-2 right-2 h-6 bg-black bg-opacity-20 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity'>
                  <div className='w-8 h-1 bg-white rounded-full'></div>
                </div>
              </div>
            )}
          </div>

          {/* Add CSS for animations */}
          <style jsx>{`
        @keyframes glow {
         0% {
            border-color: #FFB378;
            box-shadow: 0 0 30px #C678C980, inset 0 0 20px #C678C940;
          }
          50% {
            border-color: #FFB378;
            box-shadow: 0 0 50px #C678C980, inset 0 0 30px #C678C960;
          }
          100% {
            border-color: #FFB378;
            box-shadow: 0 0 30px #C678C980, inset 0 0 20px #C678C940;
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
      }
      <div
        className={`absolute top-0 right-0 h-full w-full flex justify-center ${isVideoOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}
      >
        {isVideoOpen && (
          <div
            className='w-full h-full bg-black overflow-hidden shadow-lg border-2 border-white relative select-none'
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            <video
              ref={videoRef}
              className={`w-full h-full object-cover pointer-events-none ${currentFacingMode === 'user' ? 'transform scale-x-[-1]' : ''}`}
              muted
              playsInline
              autoPlay
            />
            {!isVideoLoaded && (
              <div className='absolute flex items-center rounded-3xl justify-center text-white text-xs bg-gray-800 bg-opacity-75 z-10 pointer-events-none'>
                <span>Loading camera...</span>
              </div>
            )}
          </div>
        )}


      </div>

    </>

  )
}

export default MainBotView