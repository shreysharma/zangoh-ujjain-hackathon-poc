'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '../Header'
import ChatView from '../ChatView'
import Notification from '../Notification'
import { useGlobalConversation } from '../../providers/ConversationProvider'
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition'

const ChatViewPage = () => {
  const router = useRouter()
  const {
    messages,
    isConnected,
    isConnecting,
    responseModality,
    handleChatMessage,
    handleFileUpload,
    handleConnectionToggle,
    showNotification: globalShowNotification
  } = useGlobalConversation()

  // Direct microphone control - to stop it if running
  const { isListening, stopListening } = useSpeechRecognition()

  const [notification, setNotification] = useState<{
    message: string
    type: 'success' | 'error' | 'info'
  } | null>(null)

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type })
    globalShowNotification(message, type)
  }

  const handleBackToAudio = () => {
    router.push('/audio')
  }

  const handleBackToAudio2 = () => {
    router.push('/audio')
  }

  // Auto-stop microphone when component mounts (entering chat page)
  useEffect(() => {
    let hasRun = false

    console.log('🎤 Chat page loaded - checking microphone state')

    if (isListening && !hasRun) {
      hasRun = true
      console.log('🎤 Auto-stopping microphone on chat page')
      showNotification('Microphone disabled in chat mode', 'info')
      stopListening()
    }
  }, [isListening, stopListening, showNotification])

  return (
    <main className='w-screen h-screen flex justify-center items-center'>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className='w-[500px] h-full relative bg-white'>
        <Header
          onSwitchToChat={handleBackToAudio}
          showChatView={true}
          onBackClick={handleBackToAudio2}
          isConnected={isConnected}
          isConnecting={isConnecting}
          responseModality={responseModality}
          onConnectionToggle={handleConnectionToggle}
        />

        <div className='w-full h-full relative overflow-hidden'>
          <ChatView
            showChatView={true}
            messages={messages}
            onSendMessage={handleChatMessage}
            onFileUpload={handleFileUpload}
          />
        </div>

        <div className='absolute left-1/2 transform -translate-x-1/2 -bottom-3 w-[170px] h-[6px] bg-black m-4 rounded-full'></div>
      </div>
    </main>
  )
}

export default ChatViewPage