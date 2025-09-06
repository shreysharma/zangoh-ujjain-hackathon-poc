'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { apiService } from '../services/apiService'
import { audioService } from '../services/audioService'
import VideoCapturePage from './VideoCapturePage'

interface ChatPageProps {
  onBack: () => void
  onSwitchToVoice: () => Promise<void>
  onSwitchToVideo?: () => void
  messages: any[]
  onSendMessage?: (text: string, image?: string) => void
  onPlayAudio?: (message: any) => void
  isConnected?: boolean
  assistantName?: string
}

const ChatPage = ({ onBack, onSwitchToVoice, onSwitchToVideo, messages, onSendMessage, onPlayAudio, assistantName = 'Sarathi' }: ChatPageProps) => {
  const [showVideo, setShowVideo] = useState(false)
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  
  // Use messages from parent, no local state duplication
  const displayMessages = messages
  
  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initialize audio service for playback only when chat page loads
  useEffect(() => {
    const initializeAudioForPlayback = async () => {
      try {
        console.log('🔊 Initializing audio service for chat playback...')
        // Clear any existing audio state
        audioService.clearAudioQueue()
        audioService.stopCurrentAudio()
        
        // Initialize audio context for playback
        await audioService.activateAudioContext()
        
        // Initialize basic audio processing (needed for playback methods to work)
        await audioService.setupAudioProcessing()
        
        // Enable audio for playback but prevent sending to API
        audioService.setAudioEnabled(true)
        audioService.setShouldSendAudioCallback(() => false) // Never send audio in chat mode
        
        console.log('✅ Audio service ready for chat message playback')
      } catch (error) {
        console.error('❌ Failed to initialize audio for chat playback:', error)
      }
    }

    initializeAudioForPlayback()
  }, [])

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || isSending) return
    
    const message = inputText.trim()
    setInputText('')
    setIsSending(true)
    
    try {
      if (onSendMessage) {
        // Use parent's handler if provided
        onSendMessage(message)
      } else {
        // Fallback to direct API call
        await apiService.sendText(message)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSending(false)
    }
  }, [inputText, isSending, onSendMessage])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date | undefined) => {
    if (!date) {
      return ''
    }
    // Handle if date is a string
    const dateObj = date instanceof Date ? date : new Date(date)
    if (isNaN(dateObj.getTime())) {
      return ''
    }
    return dateObj.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  // Show video page if requested
  if (showVideo) {
    return <VideoCapturePage 
      onBack={() => setShowVideo(false)} 
      onSwitchToChat={() => setShowVideo(false)}
    />
  }

  return (
    <div className="fixed inset-0 md:flex md:justify-center md:items-center md:bg-gray-100 bg-[#FFFAF4]">
      <div className="relative bg-[#FFFAF4] overflow-hidden w-full h-full md:w-[480px] lg:w-[520px] md:h-screen md:shadow-xl md:border md:border-gray-200 md:overflow-hidden flex flex-col">

        {/* Orange Header */}
        <div className="bg-[#E9842F] flex items-center justify-between" style={{height: '56px', paddingTop: '12px', paddingRight: '20px', paddingBottom: '12px', paddingLeft: '20px'}}>
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5M12 19L5 12L12 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <h1 className="text-white text-base md:text-xl lg:text-2xl font-medium" style={{fontFamily: 'Inter, sans-serif'}}>Divya Darshak</h1>
          </div>
          
          <button onClick={async () => await onSwitchToVoice()} className="flex items-center" style={{width: '93px', height: '32px', gap: '8px', borderRadius: '12px', paddingRight: '10px', paddingLeft: '10px'}}>
            <svg width="93" height="32" viewBox="0 0 93 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="93" height="32" rx="12" fill="#FFFAF4"/>
              <path d="M19.296 10.948L15.6 21H13.906L10.21 10.948H11.862L14.788 19.208L17.756 10.948H19.296ZM22.5509 21.14C20.4509 21.14 18.9109 19.488 18.9109 17.29C18.9109 15.092 20.4509 13.44 22.5509 13.44C24.6509 13.44 26.1909 15.092 26.1909 17.29C26.1909 19.488 24.6509 21.14 22.5509 21.14ZM22.5509 19.894C23.7689 19.894 24.7349 18.914 24.7349 17.29C24.7349 15.666 23.7689 14.7 22.5509 14.7C21.3329 14.7 20.3809 15.666 20.3809 17.29C20.3809 18.914 21.3329 19.894 22.5509 19.894ZM29.3543 11.858C29.3543 12.39 28.9343 12.796 28.3323 12.796C27.7303 12.796 27.2963 12.39 27.2963 11.858C27.2963 11.312 27.7303 10.92 28.3323 10.92C28.9343 10.92 29.3543 11.312 29.3543 11.858ZM29.0463 21H27.6323V13.58H29.0463V21ZM33.9353 21.154C31.9053 21.154 30.4773 19.558 30.4773 17.29C30.4773 15.05 31.9333 13.44 33.9353 13.44C35.7693 13.44 37.0993 14.658 37.3653 16.59H35.8813C35.7273 15.4 34.9853 14.686 33.9493 14.686C32.7313 14.686 31.9333 15.722 31.9333 17.29C31.9333 18.872 32.7313 19.894 33.9493 19.894C34.9993 19.894 35.7273 19.194 35.8953 17.99H37.3653C37.1133 19.95 35.7973 21.154 33.9353 21.154ZM41.7722 21.14C39.6302 21.14 38.1882 19.586 38.1882 17.248C38.1882 15.05 39.6862 13.44 41.7302 13.44C43.9422 13.44 45.4122 15.232 45.1602 17.64H39.6302C39.7422 19.152 40.4982 20.034 41.7442 20.034C42.7942 20.034 43.5222 19.46 43.7602 18.494H45.1602C44.7962 20.146 43.5222 21.14 41.7722 21.14ZM41.7022 14.504C40.5682 14.504 39.7982 15.316 39.6442 16.702H43.6622C43.5922 15.33 42.8502 14.504 41.7022 14.504Z" fill="#757575"/>
              <path d="M73.6668 20.1667H60.3335M60.3335 20.1667L63.6668 16.8333M60.3335 20.1667L63.6668 23.5M60.3335 11.8333H73.6668M73.6668 11.8333L70.3335 8.5M73.6668 11.8333L70.3335 15.1667" stroke="#757575" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto" style={{paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '80px'}}>
          <div className="flex flex-col justify-end min-h-full">
            {displayMessages.map((message, index) => (
              <div key={index} style={{marginBottom: '16px'}}>
                {message.isUser ? (
                  // User message - right aligned with peach bubble or image
                  <div className="flex flex-col items-end">
                    {(message.image || message.file?.url) ? (
                      // Image message - check both image and file.url
                      <div 
                        className="rounded-xl overflow-hidden"
                        style={{
                          maxWidth: '200px',
                          boxShadow: '4px 4px 5.2px rgba(0, 0, 0, 0.04)'
                        }}
                      >
                        <img 
                          src={message.image || message.file?.url} 
                          alt="Uploaded" 
                          className="w-full h-auto block"
                        />
                      </div>
                    ) : (
                      // Text message
                      <div 
                        className="bg-[#FFE1BE] rounded-xl"
                        style={{
                          padding: '16px',
                          boxShadow: '4px 4px 5.2px rgba(0, 0, 0, 0.04)',
                          maxWidth: '70%',
                          wordBreak: 'break-word'
                        }}
                      >
                        <p className="text-[#393939]" style={{
                          fontFamily: 'General Sans, Inter, sans-serif',
                          fontSize: '14px',
                          lineHeight: '150%',
                          letterSpacing: '-0.011em',
                          fontWeight: 400,
                          whiteSpace: 'pre-wrap',
                          overflowWrap: 'break-word'
                        }}>
                          {message.text}
                        </p>
                      </div>
                    )}
                    <p className="text-[#757575]" style={{fontFamily: 'Inter, sans-serif', fontSize: '11px', marginTop: '8px', marginRight: '8px'}}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                ) : (
                  // Bot message - left aligned with white bubble and audio button
                  <div className="flex flex-col items-start">
                    <div 
                      className="inline-flex flex-row items-start bg-white rounded-xl"
                      style={{
                        padding: '16px',
                        gap: '10px',
                        boxShadow: '4px 4px 5.2px rgba(0, 0, 0, 0.04)',
                        maxWidth: '70%'
                      }}
                    >
                      <p className="text-[#393939]" style={{
                        fontFamily: 'General Sans, Inter, sans-serif',
                        fontSize: '14px',
                        lineHeight: '150%',
                        letterSpacing: '-0.011em',
                        fontWeight: 400,
                        whiteSpace: 'pre-wrap',
                        overflowWrap: 'break-word',
                        wordBreak: 'break-word'
                      }}>
                        {message.text}
                      </p>
                      <button 
                        className="flex-shrink-0 ml-2"
                        onClick={() => onPlayAudio && onPlayAudio(message)}
                      >
                        <svg width="19" height="18" viewBox="0 0 19 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11.5 1.51846V16.4747C11.5019 16.5866 11.4748 16.6971 11.4212 16.7955C11.3677 16.8938 11.2896 16.9765 11.1945 17.0357C11.0865 17.0999 10.9616 17.1301 10.8362 17.1223C10.7108 17.1145 10.5906 17.069 10.4914 16.9919L5.36875 13.0075C5.33161 12.9782 5.30162 12.9408 5.28105 12.8981C5.26048 12.8555 5.24986 12.8088 5.25 12.7614V5.23643C5.25014 5.1889 5.26112 5.14203 5.2821 5.09939C5.30309 5.05675 5.33352 5.01945 5.37109 4.99034L10.4937 1.00596C10.606 0.91897 10.7446 0.872808 10.8866 0.87508C11.0286 0.877352 11.1656 0.927923 11.275 1.01846C11.3469 1.08021 11.4043 1.157 11.4432 1.24341C11.4821 1.32982 11.5015 1.42372 11.5 1.51846ZM3.6875 5.24893H1.5C1.16848 5.24893 0.850537 5.38063 0.616116 5.61505C0.381696 5.84947 0.25 6.16741 0.25 6.49893V11.4989C0.25 11.8305 0.381696 12.1484 0.616116 12.3828C0.850537 12.6172 1.16848 12.7489 1.5 12.7489H3.6875C3.77038 12.7489 3.84987 12.716 3.90847 12.6574C3.96708 12.5988 4 12.5193 4 12.4364V5.56143C4 5.47855 3.96708 5.39907 3.90847 5.34046C3.84987 5.28186 3.77038 5.24893 3.6875 5.24893ZM13.5914 6.87706C13.5297 6.93129 13.4793 6.99716 13.443 7.0709C13.4068 7.14464 13.3855 7.2248 13.3802 7.3068C13.375 7.38879 13.386 7.47102 13.4126 7.54876C13.4392 7.6265 13.4808 7.69824 13.5352 7.75987C13.8366 8.10224 14.0029 8.54276 14.0029 8.99893C14.0029 9.4551 13.8366 9.89562 13.5352 10.238C13.4794 10.2993 13.4363 10.3711 13.4085 10.4492C13.3807 10.5273 13.3688 10.6102 13.3733 10.693C13.3779 10.7758 13.3989 10.8568 13.435 10.9314C13.4712 11.006 13.5219 11.0726 13.5841 11.1275C13.6462 11.1823 13.7187 11.2242 13.7973 11.2508C13.8758 11.2773 13.9588 11.288 14.0415 11.2821C14.1242 11.2762 14.2049 11.254 14.279 11.2167C14.353 11.1793 14.4188 11.1276 14.4727 11.0646C14.9754 10.4939 15.2527 9.75945 15.2527 8.99893C15.2527 8.23841 14.9754 7.50399 14.4727 6.93331C14.4184 6.87147 14.3525 6.82096 14.2787 6.78465C14.2049 6.74835 14.1246 6.72697 14.0425 6.72174C13.9604 6.71652 13.8781 6.72755 13.8003 6.7542C13.7225 6.78085 13.6507 6.8226 13.5891 6.87706H13.5914ZM16.7859 4.83253C16.7322 4.76825 16.666 4.71544 16.5914 4.67725C16.5168 4.63905 16.4353 4.61626 16.3517 4.61021C16.2681 4.60416 16.1841 4.61499 16.1048 4.64204C16.0255 4.6691 15.9524 4.71183 15.8899 4.7677C15.8275 4.82357 15.7769 4.89143 15.7412 4.96725C15.7055 5.04307 15.6854 5.1253 15.6821 5.20904C15.6788 5.29279 15.6924 5.37634 15.722 5.45473C15.7517 5.53312 15.7968 5.60474 15.8547 5.66534C16.6748 6.58207 17.1281 7.76892 17.1281 8.99893C17.1281 10.2289 16.6748 11.4158 15.8547 12.3325C15.7968 12.3931 15.7517 12.4647 15.722 12.5431C15.6924 12.6215 15.6788 12.7051 15.6821 12.7888C15.6854 12.8726 15.7055 12.9548 15.7412 13.0306C15.7769 13.1064 15.8275 13.1743 15.8899 13.2302C15.9524 13.286 16.0255 13.3288 16.1048 13.3558C16.1841 13.3829 16.2681 13.3937 16.3517 13.3877C16.4353 13.3816 16.5168 13.3588 16.5914 13.3206C16.666 13.2824 16.7322 13.2296 16.7859 13.1653C17.8107 12.0195 18.3772 10.5362 18.3772 8.99893C18.3772 7.46169 17.8107 5.97837 16.7859 4.83253Z" fill="#757575"/>
                        </svg>
                      </button>
                    </div>
                    <p className="text-[#757575]" style={{fontFamily: 'Inter, sans-serif', fontSize: '11px', marginTop: '8px', marginLeft: '8px'}}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                )}
              </div>
            ))}
            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Bottom Input - Fixed at bottom with solid background */}
        <div className="fixed bottom-0 left-0 right-0 md:absolute md:bottom-0 flex items-center w-full md:w-full z-30 bg-[#FFFAF4]" 
             style={{height: '70px', paddingLeft: '16px', paddingRight: '16px', paddingTop: '10px', paddingBottom: '10px', gap: '8px'}}>
          
          {/* Input field with send button inside */}
          <div className="flex-1 flex items-center bg-white rounded-full" 
               style={{height: '44px', paddingLeft: '16px', paddingRight: '6px', border: '1px solid #E9E8E8'}}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`${assistantName} se puchein`}
              className="flex-1 bg-transparent outline-none text-[#333333] placeholder-[#AAAAAA]"
              style={{fontFamily: 'Inter, sans-serif', fontSize: '14px'}}
              disabled={isSending}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isSending}
              className="p-2 disabled:opacity-50"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.55648 9.99889H3.90023M3.82088 10.2722L1.63189 16.811C1.45993 17.3246 1.37394 17.5815 1.43564 17.7396C1.48922 17.877 1.60433 17.9811 1.74634 18.0207C1.90986 18.0664 2.15686 17.9552 2.65086 17.733L18.318 10.683C18.8 10.466 19.0411 10.3574 19.1156 10.2066C19.1804 10.0757 19.1804 9.92208 19.1156 9.79114C19.0411 9.64042 18.8 9.53193 18.318 9.31495L2.6454 2.26238C2.15289 2.04075 1.90664 1.92994 1.74326 1.9754C1.60139 2.01487 1.48631 2.11874 1.43254 2.25583C1.37063 2.4137 1.45569 2.67 1.6258 3.18258L3.82149 9.79783C3.85071 9.88586 3.86531 9.92988 3.87109 9.9749C3.8762 10.0149 3.87615 10.0553C3.87093 10.0952C3.86505 10.1402C3.85033 10.1842 3.82088 10.2722Z" stroke="#757575" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Attachment Button */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onload = async (event) => {
                    const imageUrl = event.target?.result as string
                    
                    // Add image message to chat with the actual image
                    if (onSendMessage) {
                      onSendMessage('', imageUrl)  // Send empty text with image
                    }
                    
                    // Send image to API (remove data URL prefix)
                    await apiService.sendImage(imageUrl.split(',')[1])
                    
                    // Send a prompt to analyze the image
                    await apiService.sendText('Kripya is image ko analyze karke iske baare mein bataiye. Yeh kya hai aur isme kya dikh raha hai?')
                  }
                  reader.readAsDataURL(file)
                }
              }}
            />
            <svg width="35" height="34" viewBox="0 0 35 34" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0.777582" y="0.407465" width="33.1851" height="33.1851" rx="16.5925" fill="white"/>
              <rect x="0.777582" y="0.407465" width="33.1851" height="33.1851" rx="16.5925" stroke="#E9E8E8" strokeWidth="0.81493"/>
              <path d="M24.9686 16.085L17.4841 23.5694C15.7821 25.2715 13.0225 25.2715 11.3205 23.5694C9.61843 21.8674 9.61843 19.1078 11.3205 17.4058L18.8049 9.92134C19.9396 8.78664 21.7793 8.78664 22.914 9.92134C24.0487 11.056 24.0487 12.8957 22.914 14.0304L15.7231 21.2214C15.1557 21.7887 14.2359 21.7887 13.6685 21.2214C13.1012 20.654 13.1012 19.7342 13.6685 19.1668L19.9789 12.8564" stroke="#757575" strokeWidth="1.66033" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Video Button */}
          <button 
            onClick={() => {
              // Use parent's switchToVideo if available, otherwise use local showVideo
              if (onSwitchToVideo) {
                onSwitchToVideo()
              } else {
                setShowVideo(!showVideo)
              }
            }}
            className="flex items-center justify-center"
          >
            <svg width="35" height="34" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0.460352" y="0.460352" width="37.0793" height="37.0793" rx="18.5396" fill="white"/>
              <rect x="0.460352" y="0.460352" width="37.0793" height="37.0793" rx="18.5396" stroke="#E9E8E8" strokeWidth="0.920705"/>
              <path d="M28.2071 16.1743C28.2071 15.6165 28.2071 15.3377 28.0968 15.2085C28.0011 15.0965 27.8575 15.037 27.7106 15.0486C27.5413 15.0619 27.3441 15.2591 26.9497 15.6535L23.6035 18.9996L26.9497 22.3458C27.3441 22.7402 27.5413 22.9374 27.7106 22.9507C27.8575 22.9623 28.0011 22.9028 28.0968 22.7907C28.2071 22.6616 28.2071 22.3827 28.2071 21.8249V16.1743Z" stroke="#757575" strokeWidth="1.84141" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9.79297 16.9741C9.79297 15.4271 9.79297 14.6537 10.094 14.0628C10.3588 13.5431 10.7814 13.1206 11.3011 12.8557C11.892 12.5547 12.6654 12.5547 14.2124 12.5547H19.1842C20.7311 12.5547 21.5046 12.5547 22.0954 12.8557C22.6151 13.1206 23.0377 13.5431 23.3025 14.0628C23.6035 14.6537 23.6035 15.4271 23.6035 16.9741V21.0252C23.6035 22.5721 23.6035 23.3456 23.3025 23.9364C23.0377 24.4561 22.6151 24.8787 22.0954 25.1435C21.5046 25.4446 20.7311 25.4446 19.1842 25.4446H14.2124C12.6654 25.4446 11.892 25.4446 11.3011 25.1435C10.7814 24.8787 10.3588 24.4561 10.094 23.9364C9.79297 23.3456 9.79297 22.5721 9.79297 21.0252V16.9741Z" stroke="#757575" strokeWidth="1.84141" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

      </div>
    </div>
  )
}

export default ChatPage