'use client'

import React, { useEffect, useState } from 'react'

interface VoiceAnimationProps {
  isActive: boolean
  onToggle: () => void
  size?: number
}

const VoiceAnimation = ({ isActive, onToggle, size = 144 }: VoiceAnimationProps) => {
  const [tongueLength, setTongueLength] = useState(0)
  const [flameIntensity, setFlameIntensity] = useState(0)

  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        // Animate tongue length
        setTongueLength(Math.random() * 40 + 20)
        // Animate flame intensity
        setFlameIntensity(Math.random() * 0.8 + 0.2)
      }, 150)
      return () => clearInterval(interval)
    } else {
      setTongueLength(0)
      setFlameIntensity(0)
    }
  }, [isActive])

  return (
    <div className="relative">
      {/* Main Circle Container */}
      <button
        onClick={onToggle}
        className={`relative rounded-full transition-all duration-300 ${
          isActive 
            ? 'bg-gradient-to-br from-orange-400 via-red-500 to-red-600 shadow-2xl shadow-orange-500/50 scale-110' 
            : 'bg-gradient-to-br from-orange-400 to-orange-600 shadow-xl shadow-orange-300/50 hover:scale-105'
        }`}
        style={{ width: size, height: size }}
      >
        {/* Flame Background Effect */}
        {isActive && (
          <div 
            className="absolute inset-0 rounded-full bg-gradient-to-t from-red-600 via-orange-500 to-yellow-400 opacity-70 animate-pulse"
            style={{ 
              filter: `blur(${flameIntensity * 8}px)`,
              transform: `scale(${1 + flameIntensity * 0.2})`
            }}
          />
        )}

        {/* Inner Circle */}
        <div className={`absolute inset-4 rounded-full ${
          isActive 
            ? 'bg-gradient-to-br from-red-500 to-red-700 shadow-inner' 
            : 'bg-gradient-to-br from-orange-500 to-orange-700 shadow-inner'
        }`}>
          
          {/* Central Face */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Eyes */}
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 flex space-x-4">
              <div className="w-3 h-3 bg-white rounded-full shadow-sm"></div>
              <div className="w-3 h-3 bg-white rounded-full shadow-sm"></div>
            </div>

            {/* Mouth with Roaring Tongue */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
              {/* Mouth */}
              <div className={`w-8 h-6 bg-black rounded-full transition-all duration-200 ${
                isActive ? 'scale-150' : 'scale-100'
              }`}>
                {/* Animated Tongue */}
                {isActive && (
                  <div 
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-red-400 to-red-600 rounded-full animate-pulse"
                    style={{
                      width: `${tongueLength}px`,
                      height: '4px',
                      transformOrigin: 'left center',
                      animation: `tongueFlicker ${150}ms infinite alternate`
                    }}
                  />
                )}
              </div>

              {/* Sound Waves */}
              {isActive && (
                <>
                  <div className="absolute -left-8 top-1/2 w-4 h-0.5 bg-white/60 rounded animate-ping" style={{ animationDelay: '0ms' }} />
                  <div className="absolute -left-12 top-1/2 w-6 h-0.5 bg-white/40 rounded animate-ping" style={{ animationDelay: '200ms' }} />
                  <div className="absolute -left-16 top-1/2 w-8 h-0.5 bg-white/20 rounded animate-ping" style={{ animationDelay: '400ms' }} />
                  
                  <div className="absolute -right-8 top-1/2 w-4 h-0.5 bg-white/60 rounded animate-ping" style={{ animationDelay: '100ms' }} />
                  <div className="absolute -right-12 top-1/2 w-6 h-0.5 bg-white/40 rounded animate-ping" style={{ animationDelay: '300ms' }} />
                  <div className="absolute -right-16 top-1/2 w-8 h-0.5 bg-white/20 rounded animate-ping" style={{ animationDelay: '500ms' }} />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Microphone Icon Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg 
            width={size * 0.25} 
            height={size * 0.25} 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={`text-white transition-opacity duration-300 ${
              isActive ? 'opacity-30' : 'opacity-80'
            }`}
          >
            <path 
              d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z" 
              fill="currentColor"
            />
            <path 
              d="M19 10V12C19 16.42 15.42 20 11 20H10V22H14C14.55 22 15 22.45 15 23C15 23.55 14.55 24 14 24H10C9.45 24 9 23.55 9 23C9 22.45 9.45 22 10 22H10V20C5.58 20 2 16.42 2 12V10C2 9.45 2.45 9 3 9C3.55 9 4 9.45 4 10V12C4 15.31 6.69 18 10 18H14C17.31 18 20 15.31 20 12V10C20 9.45 19.55 9 19 9C18.45 9 18 9.45 18 10Z" 
              fill="currentColor"
            />
          </svg>
        </div>
      </button>

      {/* Status Text */}
      {isActive && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
          <span className="bg-black/80 text-white px-4 py-1 rounded-full text-sm font-medium animate-pulse">
            सुन रहा हूँ...
          </span>
        </div>
      )}

      {/* Custom CSS for tongue animation */}
      <style jsx>{`
        @keyframes tongueFlicker {
          0% { transform: translateX(-50%) translateY(-50%) scaleX(0.8) }
          50% { transform: translateX(-50%) translateY(-50%) scaleX(1.2) }
          100% { transform: translateX(-50%) translateY(-50%) scaleX(0.9) }
        }
      `}</style>
    </div>
  )
}

export default VoiceAnimation