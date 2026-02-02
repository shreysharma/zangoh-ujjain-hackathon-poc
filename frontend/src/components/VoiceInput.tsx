import React from 'react'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'

interface VoiceInputProps {
  onSpeechResult: (transcript: string) => void
  className?: string
}

const VoiceInput = ({ onSpeechResult, className = '' }: VoiceInputProps) => {
  const { isListening, startListening, stopListening, isSupported } = useSpeechRecognition(onSpeechResult)

  const handleMicClick = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  if (!isSupported) {
    return (
      <div className={`text-center ${className}`}>
        <p className="text-red-500 text-sm">Speech recognition not supported in this browser</p>
      </div>
    )
  }

  return (
    <div className={`absolute bottom-16 right-4 ${className}`}>
      <button
        onClick={handleMicClick}
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
          isListening 
            ? 'bg-red-500 animate-pulse shadow-lg' 
            : 'bg-[#269697] hover:bg-[#1e7677] shadow-md'
        }`}
      >
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="text-white"
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
      </button>
      {isListening && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
          <span className="bg-black text-white px-2 py-1 rounded text-xs whitespace-nowrap">
            Listening...
          </span>
        </div>
      )}
    </div>
  )
}

export default VoiceInput