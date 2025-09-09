import React, { useRef, useEffect } from 'react'

interface SubtitlesProps {
  userText?: string
  botText?: string
  isUserSpeaking?: boolean
  isBotSpeaking?: boolean
  className?: string
  isVideoMode?: boolean
}

const Subtitles: React.FC<SubtitlesProps> = ({
  userText,
  botText,
  isUserSpeaking,
  isBotSpeaking,
  className = "",
  isVideoMode = false
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollContainerRef.current) {
      const element = scrollContainerRef.current
      const isOverflowing = element.scrollHeight > element.clientHeight
      
      if (isOverflowing) {
        element.scrollTop = element.scrollHeight - element.clientHeight
      }
    }
  }, [userText, botText])
  // Don't show if no text
  if (!userText && !botText) return null

  return (
    <div className={`${className}`}>
      <div 
        ref={scrollContainerRef}
        className={`rounded-lg px-4 py-2 max-w-md mx-auto max-h-24 overflow-y-auto scroll-smooth scrollbar-hide ${
          isVideoMode 
            ? 'bg-white bg-opacity-70' 
            : 'bg-opacity-80'
        }`}
        style={isVideoMode ? { backgroundColor: '#FFFFFFB2' } : {}}
      >
        {/* Show user text only when user is speaking and bot is not speaking */}
        {userText && isUserSpeaking && !isBotSpeaking && (
          <div className="text-[#FFB366] text-md mb-1 text-center">
            {userText}
          </div>
        )}

        {/* Show bot text when bot is speaking */}
        {botText && isBotSpeaking && (
          <div className="text-orange-600 text-md text-center">
            {botText}
          </div>
        )}
      </div>
    </div>
  )
}

export default Subtitles