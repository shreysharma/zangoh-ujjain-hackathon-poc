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

export const useSpeechRecognition = (onResult?: (transcript: string) => void, autoStart = false): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const recognitionRef = useRef<any>(null)
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize speech recognition setup (without starting)
  const initializeSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (SpeechRecognition && !recognitionRef.current) {
      setIsSupported(true)
      recognitionRef.current = new SpeechRecognition()
      
      const recognition = recognitionRef.current
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'hi-IN' // Hindi language for Divya Darshak
      recognition.maxAlternatives = 1
      
      recognition.onstart = () => {
        console.log('Speech recognition onstart triggered')
        setIsListening(true)
        console.log('Speech recognition started, isListening set to true')
      }
      
      recognition.onresult = (event: any) => {
        let finalTranscript = ''
        let confidence = 0
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
            confidence = event.results[i][0].confidence
          }
        }
        
        if (finalTranscript && confidence > 0.5) {
          const cleanTranscript = finalTranscript.trim()
          
          // Filter out common noise patterns and short utterances
          if (cleanTranscript.length > 2 && 
              !cleanTranscript.toLowerCase().includes('namaste') && // Ignore bot's own speech
              !cleanTranscript.toLowerCase().includes('main sarathi')) {
            
            console.log('Final transcript captured:', cleanTranscript)
            setTranscript(cleanTranscript)
            onResult?.(cleanTranscript)
          }
        }
      }
      
      recognition.onerror = (event: any) => {
        if (event.error === 'network') {
          console.warn('Speech recognition network error - this is common and usually recovers automatically')
          // Don't stop listening for network errors, they often recover
          return
        }
        
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          console.error('Speech recognition error:', event.error)
        }
        
        if (event.error !== 'no-speech' && event.error !== 'network') {
          setIsListening(false)
        }
      }
      
      recognition.onend = () => {
        console.log('Speech recognition ended')
        setIsListening(false)
      }
    } else {
      setIsSupported(false)
      console.warn('Speech recognition not supported')
    }
  }

  // Initialize only when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      initializeSpeechRecognition()
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

  const startListening = async () => {
    console.log('startListening called, isListening:', isListening, 'isPaused:', isPaused)
    
    // First check microphone permission
    try {
      if (typeof window !== 'undefined' && navigator?.mediaDevices?.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true })
        console.log('✅ Microphone permission confirmed for speech recognition')
      } else {
        console.warn('❌ MediaDevices not supported')
        return
      }
    } catch (error) {
      console.error('❌ Microphone permission denied for speech recognition:', error)
      return
    }
    
    // Initialize speech recognition if not already done
    if (!recognitionRef.current) {
      initializeSpeechRecognition()
    }
    
    if (!recognitionRef.current) {
      console.warn('Speech recognition not available')
      return
    }

    if (isListening) {
      console.log('Speech recognition already listening, skipping start')
      return
    }

    try {
      setIsPaused(false)
      setTranscript('')
      
      if (recognitionRef.current.readyState === 'closed' || !isListening) {
        recognitionRef.current.start()
        console.log('Speech recognition start attempted')
      } else {
        console.log('Speech recognition not in closed state, skipping start')
      }
    } catch (error: any) {
      if (error?.name === 'InvalidStateError') {
        console.warn('Speech recognition already started, attempting to reset')
        setIsListening(false)
        setIsPaused(true)
        
        try {
          recognitionRef.current.abort()
          setTimeout(() => {
            if (!isListening && !isPaused && recognitionRef.current) {
              setIsPaused(false)
              recognitionRef.current.start()
              console.log('Speech recognition restarted after reset')
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
    console.log('stopListening called')
    setIsPaused(true)
    setIsListening(false)
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
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