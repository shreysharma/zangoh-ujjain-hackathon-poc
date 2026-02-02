import { useState, useEffect, useRef } from 'react'

interface SpeechRecognitionHook {
  isListening: boolean
  transcript: string
  interimTranscript: string
  startListening: () => void
  stopListening: () => void
  pauseListening: () => void
  resumeListening: () => void
  isSupported: boolean
}

export const useSpeechRecognition = (onResult?: (transcript: string) => void, autoStart = false): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const recognitionRef = useRef<any>(null)
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (SpeechRecognition) {
      setIsSupported(true)
      recognitionRef.current = new SpeechRecognition()
      
      const recognition = recognitionRef.current
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'
      recognition.maxAlternatives = 1
      
      recognition.onstart = () => {
        setIsListening(true)
      }
      
      recognition.onresult = (event: any) => {
        let finalTranscript = ''
        let interimResults = ''
        let confidence = 0
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
            confidence = event.results[i][0].confidence
          } else {
            interimResults += event.results[i][0].transcript
          }
        }
        
        // Update interim results for real-time display
        if (interimResults) {
          setInterimTranscript(interimResults.trim())
        }
        
        if (finalTranscript && confidence > 0.5) { // Lowered confidence threshold
          const cleanTranscript = finalTranscript.trim()
          
          // Filter out common noise patterns and short utterances
          if (cleanTranscript.length > 2 && 
              !cleanTranscript.toLowerCase().includes('zoomies') && // Ignore bot's own speech
              !cleanTranscript.toLowerCase().includes('i am here') &&
              !cleanTranscript.toLowerCase().includes('i heard you')) {
            
            setTranscript(cleanTranscript)
            setInterimTranscript('') // Clear interim when final result is ready
            onResult?.(cleanTranscript)
            
            // Continue listening without stopping
          }
        }
      }
      
      recognition.onerror = (event: any) => {
        // Only log errors that aren't normal/expected
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          console.error('Speech recognition error:', event.error)
        }
        // Don't stop listening for "no-speech" - it's normal silence
        if (event.error !== 'no-speech') {
          setIsListening(false)
        }
      }
      
      recognition.onend = () => {
        setIsListening(false)
        
        // Don't auto-restart - let components control starting/stopping explicitly
      }
    } else {
      setIsSupported(false)
      console.warn('Speech recognition not supported')
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [onResult, autoStart])

  // Auto-start listening if enabled
  useEffect(() => {
    if (autoStart && isSupported && !isListening && !isPaused) {
      setTimeout(() => {
        startListening()
      }, 1000) // Start after 1 second
    }
  }, [autoStart, isSupported, isListening, isPaused])

  const startListening = () => {
    
    if (!recognitionRef.current) {
      console.warn('Speech recognition not available')
      return
    }

    // Check if already listening - prevent duplicate starts
    if (isListening) {
      return
    }

    try {
      setIsPaused(false) // Reset paused state before starting
      setTranscript('')
      setInterimTranscript('')
      
      // Additional check to prevent InvalidStateError
      if (recognitionRef.current.readyState === 'closed' || !isListening) {
        recognitionRef.current.start()
      } else {
      }
    } catch (error: any) {
      if (error?.name === 'InvalidStateError') {
        console.warn('Speech recognition already started, attempting to reset')
        // Reset the recognition instance state
        setIsListening(false)
        setIsPaused(true)
        
        // Try to abort and restart after a delay
        try {
          recognitionRef.current.abort()
          setTimeout(() => {
            if (!isListening && !isPaused && recognitionRef.current) {
              setIsPaused(false)
              recognitionRef.current.start()
            }
          }, 500)
        } catch (retryError) {
          console.error('Failed to restart speech recognition:', retryError)
          setIsListening(false)
        }
      } else {
        console.error('Error starting speech recognition:', error)
        setIsListening(false)
      }
    }
  }

  const stopListening = () => {
    setIsPaused(true) // Prevent auto-restart
    setIsListening(false)
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort() // Use abort for immediate stop
      } catch (error) {
        console.warn('Error stopping speech recognition:', error)
      }
    }
  }

  const pauseListening = () => {
    setIsPaused(true)
    stopListening()
  }

  const resumeListening = () => {
    setIsPaused(false)
    if (autoStart) {
      setTimeout(startListening, 500)
    }
  }

  return {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    pauseListening,
    resumeListening,
    isSupported
  }
}