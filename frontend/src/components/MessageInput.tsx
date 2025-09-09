import React, { useState, useRef } from 'react'
import { apiService } from '../services/apiService'

interface MessageInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
  onFileSelect?: (file: File) => void
  onVideoToggle?: () => void
}

const MessageInput = ({ value, onChange, onSend, onKeyDown, onFileSelect, onVideoToggle }: MessageInputProps) => {
  const [isSending, setIsSending] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSendMessage = () => {
    if (value.trim() && !isSending) {
      setIsSending(true)
      onSend()
      setTimeout(() => setIsSending(false), 1000)
    }
  }
  return (
    <div className="fixed bottom-0 left-0 right-0 md:absolute md:bottom-0 flex items-center w-full z-30 bg-[#FFFAF4]" 
         style={{height: '70px', paddingLeft: '16px', paddingRight: '16px', paddingTop: '10px', paddingBottom: '10px', gap: '8px'}}>
      
      {/* Input field with send button inside */}
      <div className="flex-1 flex items-center bg-white rounded-full" 
           style={{height: '44px', paddingLeft: '16px', paddingRight: '6px', border: '1px solid #E9E8E8'}}>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask me anything..."
          className="flex-1 bg-transparent outline-none text-[#333333] placeholder-[#AAAAAA]"
          style={{fontFamily: 'Inter, sans-serif', fontSize: '14px'}}
          disabled={isSending}
        />
        <button
          onClick={handleSendMessage}
          disabled={!value.trim() || isSending}
          className="p-2 disabled:opacity-50"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.55648 9.99889H3.90023M3.82088 10.2722L1.63189 16.811C1.45993 17.3246 1.37394 17.5815 1.43564 17.7396C1.48922 17.877 1.60433 17.9811 1.74634 18.0207C1.90986 18.0664 2.15686 17.9552 2.65086 17.733L18.318 10.683C18.8 10.466 19.0411 10.3574 19.1156 10.2066C19.1804 10.0757 19.1804 9.92208 19.1156 9.79114C19.0411 9.64042 18.8 9.53193 18.318 9.31495L2.6454 2.26238C2.15289 2.04075 1.90664 1.92994 1.74326 1.9754C1.60139 2.01487 1.48631 2.11874 1.43254 2.25583C1.37063 2.4137 1.45569 2.67 1.6258 3.18258L3.82149 9.79783C3.85071 9.88586 3.86531 9.92988 3.87109 9.9749C3.8762 10.0149 3.87615 10.0553 3.87093 10.0952C3.86505 10.1402 3.85033 10.1842 3.82088 10.2722Z" stroke="#757575" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
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
            if (file && onFileSelect) {
              onFileSelect(file)
              e.target.value = ''
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
        onClick={onVideoToggle}
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
  )
}

export default MessageInput