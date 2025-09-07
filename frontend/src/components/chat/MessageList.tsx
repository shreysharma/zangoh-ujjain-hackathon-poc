'use client'

import React from 'react'
import { Message } from '../../types/chat'

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
}

const MessageList = ({ messages, isLoading }: MessageListProps) => {
  return (
    <div className="space-y-4">
      {messages.length === 0 && (
        <div className="text-center py-8 px-4">
          <div className="w-32 h-32 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center shadow-inner">
              <div className="w-8 h-8 bg-white rounded-full"></div>
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-3">नमस्कार! 🙏</h3>
          <h4 className="text-lg font-semibold text-orange-600 mb-4">Welcome to Divya Darshak</h4>
          <p className="text-gray-600 text-sm leading-relaxed mb-6">
            Your AI-powered spiritual companion for pilgrimage guidance, religious practices, and spiritual wisdom.
          </p>
          <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
            <p className="text-xs text-gray-500 mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="bg-white px-3 py-1 rounded-full text-xs text-gray-700 shadow-sm">"Tell me about Varanasi"</span>
              <span className="bg-white px-3 py-1 rounded-full text-xs text-gray-700 shadow-sm">"Best time for Char Dham"</span>
            </div>
          </div>
        </div>
      )}
      
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl px-4 py-3 rounded-2xl ${
              message.sender === 'user'
                ? 'bg-orange-500 text-white rounded-tr-sm'
                : 'bg-white shadow-sm border border-gray-200 text-gray-800 rounded-tl-sm'
            }`}
          >
            {/* Visual message indicator */}
            {message.type === 'visual' && (
              <div className="flex items-center mb-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2 opacity-70">
                  <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
                </svg>
                <span className="text-xs opacity-70">Visual analysis</span>
              </div>
            )}
            
            <p className="text-sm leading-relaxed">{message.content}</p>
            <div className="mt-2 text-xs opacity-70 flex items-center">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {message.type === 'voice' && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-2">
                  <path d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z" fill="currentColor"/>
                </svg>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {isLoading && (
        <div className="flex justify-start">
          <div className="max-w-xs px-4 py-3 rounded-2xl bg-white shadow-sm border border-gray-200 rounded-tl-sm">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-xs text-gray-500">Thinking...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MessageList