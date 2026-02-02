'use client'

import React, { ReactNode } from 'react'
import { MicrophoneProvider } from '../providers/MicrophoneProvider'

interface MicrophoneLayoutProps {
  children: ReactNode
  isConnected: boolean
  showNotification?: (message: string, type?: 'success' | 'error' | 'info') => void
}

export const MicrophoneLayout: React.FC<MicrophoneLayoutProps> = ({
  children,
  isConnected,
  showNotification
}) => {
  return (
    <MicrophoneProvider
      isConnected={isConnected}
      enabledPages={[
        '/bot-home',     // Enable microphone on bot home page
        '/audio-chat',   // Enable microphone on audio chat page
        '/voice-call'    // Enable microphone on voice call page
      ]}
      disabledPages={[
        '/chat',         // Disable microphone on text chat page
        '/settings',     // Disable microphone on settings page
        '/profile'       // Disable microphone on profile page
      ]}
      autoStart={true}
      showNotification={showNotification}
    >
      {children}
    </MicrophoneProvider>
  )
}

export default MicrophoneLayout