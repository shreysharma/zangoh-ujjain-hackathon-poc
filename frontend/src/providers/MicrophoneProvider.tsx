/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { audioService } from '../services/audioService'

interface MicrophoneContextType {
  isListening: boolean
  isSupported: boolean
  isEnabled: boolean
  startMicrophone: () => Promise<void>
  stopMicrophone: () => void
  enableMicrophone: () => void
  disableMicrophone: () => void
  showNotification?: (message: string, type?: 'success' | 'error' | 'info') => void
}

interface MicrophoneProviderProps {
  children: ReactNode
  isConnected: boolean
  responseModality?: 'AUDIO' | 'TEXT' // Response modality to determine if audio should be sent
  enabled?: boolean // Direct control over microphone enabled state
  autoStart?: boolean // Whether to auto-start microphone when enabled
  showNotification?: (message: string, type?: 'success' | 'error' | 'info') => void
}

const MicrophoneContext = createContext<MicrophoneContextType | undefined>(undefined)

export const useMicrophone = () => {
  const context = useContext(MicrophoneContext)
  if (context === undefined) {
    throw new Error('useMicrophone must be used within a MicrophoneProvider')
  }
  return context
}

export const MicrophoneProvider: React.FC<MicrophoneProviderProps> = ({
  children,
  isConnected,
  responseModality = 'AUDIO',
  enabled = true,
  autoStart = true,
  showNotification
}) => {
  const [isEnabled, setIsEnabled] = useState(enabled)

  const handleSpeechResult = useCallback(async (transcript: string) => {
    if (transcript.trim() && isConnected && isEnabled) {
      // Handle speech result - you can emit events or call callbacks here
      console.log('Speech recognized:', transcript)
    }
  }, [isConnected, isEnabled])

  const { isListening, isSupported, startListening, stopListening } = useSpeechRecognition(handleSpeechResult, false)

  // Update enabled state when prop changes
  useEffect(() => {
    setIsEnabled(enabled)
  }, [enabled])

  // Define stopMicrophone function first
  const stopMicrophone = useCallback(() => {
    if (isListening) {
      console.log('MicrophoneProvider: Stopping microphone')
      stopListening()
      audioService.stopAudioProcessing()
      audioService.clearAudioQueue()
      // Stop any currently playing bot audio when mic is stopped
      audioService.stopCurrentAudio()
      showNotification?.('Microphone stopped', 'info')
    }
  }, [isListening, stopListening, showNotification])

  // Auto-start/stop microphone based on enabled state
  useEffect(() => {
    if (isEnabled && autoStart && !isListening && isSupported) {
      console.log('🎤 Auto-starting microphone (enabled=true)')
      // Call startMicrophone but avoid circular dependency
      if (!isListening) {
        startListening()
        showNotification?.('Microphone auto-started', 'success')
      }
    } else if (!isEnabled && isListening) {
      console.log('🎤 Auto-stopping microphone (enabled=false)')
      stopMicrophone()
    }
  }, [isEnabled, autoStart, isListening, isSupported, stopMicrophone, startListening, showNotification])

  const startMicrophone = useCallback(async () => {
    if (!isEnabled) {
      showNotification?.('Microphone is disabled on this page', 'info')
      return
    }

    if (!isSupported) {
      showNotification?.('Speech recognition not supported in this browser', 'error')
      return
    }

    try {
      console.log('MicrophoneProvider: Starting microphone')
      
      // Set callback to check if audio should be sent based on response modality
      audioService.setShouldSendAudioCallback(() => responseModality === 'AUDIO')
      
      // Setup audio processing for real-time streaming  
      await audioService.setupAudioProcessing()
      
      // Start Web Speech API for speech recognition
      if (!isListening) {
        startListening()
        if (isConnected && responseModality === 'AUDIO') {
          showNotification?.('Microphone activated - listening', 'success')
        } else if (isConnected && responseModality === 'TEXT') {
          showNotification?.('Microphone activated - audio will not be sent in TEXT mode', 'info')
        } else {
          showNotification?.('Microphone activated - connect to AI to use voice', 'info')
        }
      } else {
        showNotification?.('Microphone already listening', 'info')
      }
      
    } catch (error) {
      console.error('Microphone setup failed:', error)
      showNotification?.('Microphone access failed - please allow permission', 'error')
    }
  }, [isEnabled, isConnected, isSupported, isListening, startListening, showNotification, responseModality])

  const enableMicrophone = useCallback(() => {
    setIsEnabled(true)
  }, [])

  const disableMicrophone = useCallback(() => {
    setIsEnabled(false)
    if (isListening) {
      stopMicrophone()
    }
  }, [isListening, stopMicrophone])

  const contextValue: MicrophoneContextType = {
    isListening,
    isSupported,
    isEnabled,
    startMicrophone,
    stopMicrophone,
    enableMicrophone,
    disableMicrophone,
    showNotification
  }

  return (
    <MicrophoneContext.Provider value={contextValue}>
      {children}
    </MicrophoneContext.Provider>
  )
}

export default MicrophoneProvider