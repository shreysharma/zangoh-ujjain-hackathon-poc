'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Message } from '../../types/chat'
import VoiceInput from '../ui/VoiceInput'
import VideoCapture from '../ui/VideoCapture'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import { apiService } from '../../services/apiService'

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isVideoActive, setIsVideoActive] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const responses = [
        `मैं आपकी आध्यात्मिक यात्रा में सहायता करने के लिए यहाँ हूँ। आप कौन से तीर्थस्थान के बारे में जानना चाहते हैं?`,
        `नमस्ते! मैं दिव्य दर्शक हूँ। मैं आपको तीर्थयात्रा, मंदिरों, और आध्यात्मिक अभ्यासों के बारे में मार्गदर्शन दे सकता हूँ।`,
        `आपका स्वागत है! मैं यहाँ हूँ आपकी धार्मिक यात्रा में सहायता के लिए। आप किस प्रकार की जानकारी चाहते हैं?`,
        `जय हो! मैं आपके आध्यात्मिक प्रश्नों का उत्तर देने और तीर्थयात्रा की योजना में मदद करने के लिए तैयार हूँ।`
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: randomResponse,
        sender: 'assistant',
        timestamp: new Date(),
        type: 'text'
      }
      
      setMessages(prev => [...prev, aiResponse])
      setIsLoading(false)
    }, 1500)
  }

  const handleVoiceInput = (transcript: string) => {
    handleSendMessage(transcript)
  }

  const handleVideoCapture = async (base64Image: string) => {
    // Create message with visual analysis request
    const visualMessage: Message = {
      id: Date.now().toString(),
      content: '📸 Analyzing image for spiritual guidance...',
      sender: 'user',
      timestamp: new Date(),
      type: 'visual',
      imageData: base64Image
    }

    setMessages(prev => [...prev, visualMessage])
    setIsLoading(true)

    try {
      // Send image to AI for real analysis (like IndiaMART POC)
      const analysis = await apiService.analyzeImage(base64Image)
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: analysis,
        sender: 'assistant',
        timestamp: new Date(),
        type: 'text'
      }
      
      setMessages(prev => [...prev, aiResponse])
      
    } catch (error) {
      console.error('Visual analysis failed:', error)
      
      // Fallback response
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: 'क्षमा करें, मैं अभी इस तस्वीर का विश्लेषण नहीं कर पा रहा। कृपया मुझे बताएं कि आप क्या देख रहे हैं और मैं आपकी सहायता करूंगा।',
        sender: 'assistant',
        timestamp: new Date(),
        type: 'text'
      }
      
      setMessages(prev => [...prev, errorResponse])
    } finally {
      setIsLoading(false)
    }
  }

  const toggleVideo = () => {
    setIsVideoActive(!isVideoActive)
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-orange-50 to-white max-w-md mx-auto relative">
      {/* Mobile Status Bar Simulation */}
      <div className="bg-orange-500 h-2 w-full"></div>
      
      {/* Header */}
      <div className="bg-orange-500 px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3">
              <div className="w-5 h-5 bg-white rounded-full"></div>
            </div>
            <div>
              <h1 className="text-lg font-semibold">Divya Darshak</h1>
              <p className="text-xs opacity-90">Smart Pilgrimage Guide</p>
            </div>
          </div>
          <div className="text-xs opacity-90">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
        <MessageList messages={messages} isLoading={isLoading} />
        
        {/* Video Capture Component */}
        <div className="mb-4">
          <VideoCapture 
            onImageCapture={handleVideoCapture}
            isActive={isVideoActive}
            onToggle={toggleVideo}
          />
        </div>
        
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Control Area */}
      <div className="bg-white border-t border-orange-100 px-4 py-4 relative">
        {/* Control Buttons Row */}
        <div className="flex justify-center items-center space-x-4 mb-4">
          {/* Camera Toggle Button */}
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full transition-all duration-200 shadow-lg border-2 ${
              isVideoActive 
                ? 'bg-green-500 border-green-400 text-white' 
                : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 10.5V7C17 6.45 16.55 6 16 6H4C3.45 6 3 6.45 3 7V17C3 17.55 3.45 18 4 18H16C16.55 18 17 17.55 17 17V13.5L21 17.5V6.5L17 10.5Z" fill="currentColor"/>
            </svg>
          </button>
          
          {/* Central Voice Button */}
          <VoiceInput onSpeechResult={handleVoiceInput} />
        </div>
        
        {/* Text Input */}
        <div className="flex items-center space-x-3">
          <MessageInput onSend={handleSendMessage} disabled={isLoading} />
        </div>
      </div>
    </div>
  )
}

export default ChatInterface