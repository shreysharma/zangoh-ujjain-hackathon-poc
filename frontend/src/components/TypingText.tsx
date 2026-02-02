import React, { useState, useEffect } from 'react'

interface TypingTextProps {
  text: string
  className?: string
}

const TypingText = ({ text, className = '' }: TypingTextProps) => {
  const words = text.split(' ')
  const [displayedWords, setDisplayedWords] = useState<string[]>([])
  const [currentWordIndex, setCurrentWordIndex] = useState(0)

  // Reset animation when text changes
  useEffect(() => {
    setDisplayedWords([])
    setCurrentWordIndex(0)
  }, [text])

  // Auto-play speech when text changes - DISABLED
  useEffect(() => {
    // Speech synthesis disabled for testing
    // Uncomment below to re-enable auto-speech
    
    /*
    if ('speechSynthesis' in window) {
      const autoSpeak = () => {
        try {
          // Cancel any existing speech first
          window.speechSynthesis.cancel()
          
          const utterance = new SpeechSynthesisUtterance(text)
          utterance.rate = 0.8
          utterance.volume = 1.0
          
          window.speechSynthesis.speak(utterance)
          console.log('Auto-speaking:', text)
        } catch (error) {
          console.error('Auto-speech error:', error)
        }
      }

      // Auto-trigger speech after a short delay
      const timer = setTimeout(autoSpeak, 1000)
      
      return () => {
        clearTimeout(timer)
        // Cancel speech when component unmounts or text changes
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel()
        }
      }
    }
    */
  }, [text])

  // Display words one by one (typing effect)
  useEffect(() => {
    if (currentWordIndex < words.length) {
      const timer = setTimeout(() => {
        const currentWord = words[currentWordIndex]
        setDisplayedWords(prev => [...prev, currentWord])
        setCurrentWordIndex(prev => prev + 1)
      }, 500) // 500ms delay between words for typing effect

      return () => clearTimeout(timer)
    }
  }, [currentWordIndex, words])

  return (
    <div>
      <h1 className={className}>
        {displayedWords.map((word, index) => (
          <span 
            key={index} 
            className={`inline-block mr-2 ${index === displayedWords.length - 1 ? 'animate-pulse' : ''}`}
          >
            {word}
          </span>
        ))}
        {currentWordIndex < words.length && (
          <span className="inline-block w-3 h-3 bg-black rounded-full animate-pulse ml-1"></span>
        )}
      </h1>
    </div>
  )
}

export default TypingText