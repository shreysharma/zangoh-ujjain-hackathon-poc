'use client'

import React, { useState, KeyboardEvent } from 'react'

interface MessageInputProps {
  onSend: (message: string) => void
  disabled?: boolean
}

const MessageInput = ({ onSend, disabled = false }: MessageInputProps) => {
  const [message, setMessage] = useState('')

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim())
      setMessage('')
    }
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex items-end space-x-2">
      <div className="flex-1 min-w-0">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about pilgrimage sites, spiritual guidance..."
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          rows={1}
          disabled={disabled}
        />
      </div>
      <button
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        className={`p-3 rounded-full transition-colors duration-200 ${
          disabled || !message.trim()
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700'
        }`}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-white"
        >
          <path
            d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  )
}

export default MessageInput