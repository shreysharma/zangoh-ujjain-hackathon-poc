'use client'

import React, { forwardRef, useState } from 'react'
import { MicrophoneProvider } from '../providers/MicrophoneProvider'
import BotHomeInternal from './BotHomeInternal'

interface BotHomeRef {
  handleConnect: () => void
  startMicrophone: () => void
}

const BotHome = forwardRef<BotHomeRef>((props, ref) => {
  const [showChatView, setShowChatView] = useState(false)
  const [responseModality, setResponseModality] = useState<'AUDIO' | 'TEXT'>('AUDIO')
  
  // Notification function for microphone provider
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  }

  return (
    <MicrophoneProvider
      isConnected={true}
      responseModality={responseModality}
      enabled={!showChatView} // Enable microphone only when NOT in chat view
      autoStart={true}
      showNotification={showNotification}
    >
      <BotHomeInternal 
        ref={ref} 
        onViewChange={setShowChatView}
        onModalityChange={setResponseModality}
      />
    </MicrophoneProvider>
  )
})

BotHome.displayName = 'BotHome'

export default BotHome