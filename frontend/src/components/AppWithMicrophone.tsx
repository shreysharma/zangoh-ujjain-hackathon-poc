/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import React, { useState } from 'react'
import { MicrophoneProvider } from '../providers/MicrophoneProvider'
import BotHomeWithMicrophone from './BotHomeWithMicrophone'
import WelcomePage from './WelcomePage'

const AppWithMicrophone: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'welcome' | 'bot-home'>('welcome')
  const [isConnected, setIsConnected] = useState(false)
  
  // Notification state
  const [notification, setNotification] = useState<{
    message: string
    type: 'success' | 'error' | 'info'
  } | null>(null)

  // Show notification function
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type })
  }

  return (
    <MicrophoneProvider
      isConnected={isConnected}
      enabled={true}
      autoStart={true}
      showNotification={showNotification}
    >
      {currentPage === 'welcome' && (
        <WelcomePage 
          onStartConversation={() => setCurrentPage('bot-home')}
        />
      )}
      
      {currentPage === 'bot-home' && (
        <BotHomeWithMicrophone />
      )}
    </MicrophoneProvider>
  )
}

export default AppWithMicrophone