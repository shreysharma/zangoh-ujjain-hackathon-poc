import React, { useRef } from 'react'
import { apiService } from '../../services/apiService'

interface SimpleControlsProps {
  isVideoOpen: boolean
  isListening: boolean
  onVideoClick: () => void
  onMicToggle: () => void
  onImageSelect?: (imageUrl: string, fileName: string) => void
}

const SimpleControls: React.FC<SimpleControlsProps> = ({
  isVideoOpen,
  isListening,
  onVideoClick,
  onMicToggle,
  onImageSelect
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm rounded-t-3xl" style={{ paddingBottom: '20px', height: '120px' }}>
      <div className="flex items-center justify-between" style={{ paddingTop: '35px', paddingLeft: '20px', paddingRight: '20px' }}>
        {/* Left side - Image upload button */}
        <div className="flex items-center gap-1">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center p-0 cursor-pointer"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onload = async (event) => {
                    const imageUrl = event.target?.result as string
                    
                    // Add image to conversation first
                    if (onImageSelect) {
                      onImageSelect(imageUrl, file.name)
                    }
                    
                    // Send to backend (direct call like video frames)
                    const base64 = imageUrl.split(',')[1]
                    console.log('Sending selected image to AI, size:', base64.length)
                    apiService.sendImage(base64)
                    
                    e.target.value = ''
                  }
                  reader.readAsDataURL(file)
                }
              }}
            />
            <svg width="39" height="39" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0.733302" y="0.89004" width="37.4924" height="37.4924" rx="18.7462" fill="white"/>
              <rect x="0.733302" y="0.89004" width="37.4924" height="37.4924" rx="18.7462" stroke="#E9E8E8" strokeWidth="0.920705"/>
              <path d="M28.0639 18.6029L19.608 27.0588C17.6851 28.9818 14.5673 28.9818 12.6444 27.0588C10.7214 25.1358 10.7214 22.0181 12.6444 20.0951L21.1003 11.6392C22.3822 10.3572 24.4607 10.3572 25.7427 11.6392C27.0247 12.9212 27.0247 14.9997 25.7427 16.2817L17.6184 24.406C16.9774 25.0469 15.9382 25.0469 15.2972 24.406C14.6562 23.765 14.6562 22.7257 15.2972 22.0847L22.4267 14.9553" stroke="#757575" strokeWidth="1.87583" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Center - Empty space (no GIF/image) */}
        <div className="flex-1"></div>

        {/* Right side - Mic and Video buttons */}
        <div className="flex items-center gap-1">
          {/* Microphone button */}
          <button
            onClick={onMicToggle}
            className={`p-0 cursor-pointer flex items-center justify-center`}
            style={{ width: '38px', height: '38px' }}
          >
            {!isListening ? (
              <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0.5" y="0.5" width="37" height="37" rx="18.5" fill="white" fillOpacity="0.8" />
                <rect x="0.5" y="0.5" width="37" height="37" rx="18.5" stroke="#E9E8E8" />
                <path d="M21.5896 16.7531V12.9526C21.5896 11.5215 20.4294 10.3613 18.9983 10.3613C17.9812 10.3613 17.1009 10.9474 16.6768 11.8003M18.9983 25.0451V27.6363M18.9983 25.0451C15.6591 25.0451 12.9521 22.3381 12.9521 18.9988V17.2713M18.9983 25.0451C22.3376 25.0451 25.0446 22.3381 25.0446 18.9988V17.2713M15.5433 27.6363H22.4533M10.3608 10.3613L27.6358 27.6363M18.9983 21.5901C17.5672 21.5901 16.4071 20.4299 16.4071 18.9988V16.4076L20.8317 20.83C20.3627 21.2996 19.7145 21.5901 18.9983 21.5901Z" stroke="#757575" strokeWidth="1.7275" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0.5" y="0.5" width="37" height="37" rx="18.5" fill="white" />
                <rect x="0.5" y="0.5" width="37" height="37" rx="18.5" stroke="#E9E8E8" />
                <path d="M25.0446 17.2713V18.9988C25.0446 22.3381 22.3377 25.0451 18.9984 25.0451M12.9521 17.2713V18.9988C12.9521 22.3381 15.6591 25.0451 18.9984 25.0451M18.9984 25.0451V27.6363M15.5434 27.6363H22.4534M18.9984 21.5901C17.5673 21.5901 16.4071 20.4299 16.4071 18.9988V12.9526C16.4071 11.5215 17.5673 10.3613 18.9984 10.3613C20.4295 10.3613 21.5896 11.5215 21.5896 12.9526V18.9988C21.5896 20.4299 20.4295 21.5901 18.9984 21.5901Z" stroke="#757575" strokeWidth="1.7275" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>

          {/* Video button */}
          <button onClick={onVideoClick} className="p-0 cursor-pointer" title={isVideoOpen ? "Close video" : "Start video"}>
            <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0.460352" y="0.460352" width="37.0793" height="37.0793" rx="18.5396" fill="white" />
              <rect x="0.460352" y="0.460352" width="37.0793" height="37.0793" rx="18.5396" stroke="#E9E8E8" strokeWidth="0.920705" />
              <path d="M28.2071 16.1743C28.2071 15.6165 28.2071 15.3377 28.0968 15.2085C28.0011 15.0965 27.8575 15.037 27.7106 15.0486C27.5413 15.0619 27.3441 15.2591 26.9497 15.6535L23.6035 18.9996L26.9497 22.3458C27.3441 22.7402 27.5413 22.9374 27.7106 22.9507C27.8575 22.9623 28.0011 22.9028 28.0968 22.7907C28.2071 22.6616 28.2071 22.3827 28.2071 21.8249V16.1743Z" stroke="#757575" strokeWidth="1.84141" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9.79297 16.9741C9.79297 15.4271 9.79297 14.6537 10.094 14.0628C10.3588 13.5431 10.7814 13.1206 11.3011 12.8557C11.892 12.5547 12.6654 12.5547 14.2124 12.5547H19.1842C20.7311 12.5547 21.5046 12.5547 22.0954 12.8557C22.6151 13.1206 23.0377 13.5431 23.3025 14.0628C23.6035 14.6537 23.6035 15.4271 23.6035 16.9741V21.0252C23.6035 22.5721 23.6035 23.3456 23.3025 23.9364C23.0377 24.4561 22.6151 24.8787 22.0954 25.1435C21.5046 25.4446 20.7311 25.4446 19.1842 25.4446H14.2124C12.6654 25.4446 11.892 25.4446 11.3011 25.1435C10.7814 24.8787 10.3588 24.4561 10.094 23.9364C9.79297 23.3456 9.79297 22.5721 9.79297 21.0252V16.9741Z" stroke="#757575" strokeWidth="1.84141" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default SimpleControls