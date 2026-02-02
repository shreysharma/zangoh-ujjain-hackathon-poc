import React, { useState } from 'react'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import { Message } from '../hooks/useConversation'

interface ChatViewProps {
  showChatView: boolean
  messages: Message[]
  onSendMessage: (message: string) => void
  onFileUpload?: (file: File) => void
  onVideoToggle?: () => void
}

const ChatView = ({ showChatView, messages, onSendMessage, onFileUpload, onVideoToggle }: ChatViewProps) => {
  const [inputMessage, setInputMessage] = useState('')

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      onSendMessage(inputMessage.trim())
      setInputMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  const handleFileSelect = (file: File) => {
    if (onFileUpload) {
      onFileUpload(file)
    }
  }

  return (
    <div className="flex flex-col h-full transition-transform duration-500 ease-in-out">
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages} isVisible={showChatView} />
      </div>
      
      <MessageInput 
        value={inputMessage}
        onChange={setInputMessage}
        onSend={handleSendMessage}
        onKeyDown={handleKeyDown}
        onFileSelect={handleFileSelect}
        onVideoToggle={onVideoToggle}
      />
    </div>
  )
}

export default ChatView