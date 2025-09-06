import { useState, useEffect, useRef } from 'react'

interface SpeechRecognitionHook {
  isListening: boolean
  transcript: string
  startListening: () => void
  stopListening: () => void
  pauseListening: () => void
  resumeListening: () => void
  isSupported: boolean
}

export const useSpeechRecognition = (
  onResult?: (transcript: string, isFinal: boolean) => void, 
  autoStart = false
): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const recognitionRef = useRef<any>(null)
  const lastTranscriptRef = useRef<string>('')

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (SpeechRecognition) {
      setIsSupported(true)
      recognitionRef.current = new SpeechRecognition()
      
      const recognition = recognitionRef.current
      recognition.continuous = true // Keep listening continuously
      recognition.interimResults = true // Get real-time interim results
      recognition.lang = 'hi-IN' // Hindi for pilgrimage context
      recognition.maxAlternatives = 1
      
      recognition.onstart = () => {
        console.log('🎤 Speech recognition started - continuous mode')
        setIsListening(true)
      }
      
      recognition.onresult = (event: any) => {
        let interimTranscript = ''
        let finalTranscript = ''
        
        // Process all results from the current speech segment
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }
        
        // Update transcript for display (interim or final)
        const currentTranscript = finalTranscript || interimTranscript
        
        if (currentTranscript) {
          const cleanTranscript = currentTranscript.trim()
          
          // Always update display transcript
          setTranscript(cleanTranscript)
          
          // Call onResult for both interim and final results
          if (finalTranscript) {
            // Final result - send to AI
            if (cleanTranscript.length > 2 && cleanTranscript !== lastTranscriptRef.current) {
              console.log('🎯 Final transcript:', cleanTranscript)
              lastTranscriptRef.current = cleanTranscript
              onResult?.(cleanTranscript, true)
            }
          } else if (interimTranscript) {
            // Interim result - just for display
            console.log('📝 Interim transcript:', cleanTranscript)
            onResult?.(cleanTranscript, false)
          }
        }
      }
      
      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          console.log('🔇 No speech detected, continuing to listen...')
          // Don't stop listening on no-speech error for continuous mode
          return
        }
        
        if (event.error === 'aborted') {
          console.log('🛑 Speech recognition aborted')
        } else {
          console.error('❌ Speech recognition error:', event.error)
        }
        
        // Only stop listening for critical errors
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setIsListening(false)
        }
      }
      
      recognition.onend = () => {
        console.log('🔚 Speech recognition ended')
        
        // Auto-restart for continuous listening if not paused
        if (!isPaused && isListening) {
          console.log('🔄 Auto-restarting speech recognition for continuous mode')
          setTimeout(() => {
            try {
              recognition.start()
            } catch (error) {
              console.warn('Could not auto-restart:', error)
            }
          }, 100)
        } else {
          setIsListening(false)
        }
      }
    } else {
      setIsSupported(false)
      console.warn('❌ Speech recognition not supported in this browser')
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch (error) {
          console.warn('Error cleaning up speech recognition:', error)
        }
      }
    }
  }, [onResult, isPaused, isListening])

  const startListening = () => {
    if (!recognitionRef.current) {
      console.warn('Speech recognition not initialized')
      return
    }

    if (isListening) {
      console.log('Already listening')
      return
    }

    try {
      setIsPaused(false)
      setTranscript('')
      lastTranscriptRef.current = ''
      recognitionRef.current.start()
      console.log('🎤 Starting continuous speech recognition')
    } catch (error: any) {
      if (error?.name === 'InvalidStateError') {
        console.warn('Speech recognition already started, restarting...')
        try {
          recognitionRef.current.abort()
          setTimeout(() => {
            if (recognitionRef.current) {
              recognitionRef.current.start()
            }
          }, 200)
        } catch (abortError) {
          console.error('Error restarting:', abortError)
        }
      } else {
        console.error('Error starting speech recognition:', error)
        setIsListening(false)
      }
    }
  }

  const stopListening = () => {
    setIsPaused(true)
    setIsListening(false)
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
        console.log('🛑 Stopped speech recognition')
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
    startListening,
    stopListening,
    pauseListening,
    resumeListening,
    isSupported
  }
}