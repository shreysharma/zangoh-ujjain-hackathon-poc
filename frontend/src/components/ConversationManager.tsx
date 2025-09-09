import React, { useState } from 'react'

export interface Message {
  id: string
  type: 'bot' | 'human'
  content: string
  timestamp: Date
}

interface ConversationManagerProps {
  className?: string
}

const ConversationManager = ({ className = '' }: ConversationManagerProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: 'Hi, I am Zoomies. I am here to help you. Tell me what do you need assistance with?',
      timestamp: new Date()
    }
  ])

  const addMessage = (content: string, type: 'bot' | 'human') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
  }

  const addBotMessage = (content: string) => {
    addMessage(content, 'bot')
  }

  const addHumanMessage = (content: string) => {
    addMessage(content, 'human')
  }

  const clearConversation = () => {
    setMessages([])
  }

  return {
    messages,
    addBotMessage,
    addHumanMessage,
    clearConversation
  }
}

export default ConversationManager