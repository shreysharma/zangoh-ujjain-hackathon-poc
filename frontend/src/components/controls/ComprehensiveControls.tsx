import React from 'react'

interface ComprehensiveControlsProps {
  isListening: boolean
  currentTurnActive: boolean
  onVideoClick: () => void
  onCameraSwitch: () => void
  onMicToggle: () => void
}

const ComprehensiveControls: React.FC<ComprehensiveControlsProps> = ({
  isListening,
  currentTurnActive,
  onVideoClick,
  onCameraSwitch,
  onMicToggle
}) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm rounded-t-3xl" style={{ paddingBottom: '20px', height: '120px' }}>
      <div className="flex items-center justify-between" style={{ paddingTop: '35px', paddingLeft: '20px', paddingRight: '20px' }}>
        {/* Left side - Close and Switch Camera */}
        <div className="flex items-center gap-1">
          {/* Close button - closes video */}
          <button onClick={onVideoClick} className="p-0 cursor-pointer" title="Close video">
            <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0.5" y="0.863281" width="40.2727" height="40.2727" rx="20.1364" fill="white" />
              <rect x="0.5" y="0.863281" width="40.2727" height="40.2727" rx="20.1364" stroke="#E9E8E8" />
              <path d="M25.6362 16L15.6362 26M15.6362 16L25.6362 26" stroke="#757575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Switch camera button */}
          <button onClick={onCameraSwitch} className="p-0 cursor-pointer" title="Switch camera">
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0.815937" y="1.16408" width="41.6718" height="41.6718" rx="20.8359" fill="white" />
              <rect x="0.815937" y="1.16408" width="41.6718" height="41.6718" rx="20.8359" stroke="#E9E8E8" strokeWidth="1.08597" />
              <path d="M11.6519 18.3772C11.6519 18.0269 11.6519 17.8517 11.6665 17.7042C11.8075 16.2813 12.9331 15.1556 14.3561 15.0146C14.5036 15 14.6882 15 15.0574 15C15.1997 15 15.2708 15 15.3312 14.9963C16.1025 14.9496 16.7778 14.4629 17.066 13.746C17.0886 13.6899 17.1097 13.6266 17.1519 13.5C17.194 13.3734 17.2151 13.3101 17.2377 13.254C17.5259 12.5371 18.2012 12.0504 18.9725 12.0037C19.0329 12 19.0996 12 19.233 12H24.0707C24.2041 12 24.2708 12 24.3312 12.0037C25.1025 12.0504 25.7778 12.5371 26.066 13.254C26.0886 13.3101 26.1097 13.3734 26.1519 13.5C26.194 13.6266 26.2151 13.6899 26.2377 13.746C26.5259 14.4629 27.2012 14.9496 27.9725 14.9963C28.0329 15 28.104 15 28.2463 15C28.6155 15 28.8001 15 28.9476 15.0146C30.3706 15.1556 31.4963 16.2813 31.6372 17.7042C31.6519 17.8517 31.6519 18.0269 31.6519 18.3772V26.2C31.6519 27.8802 31.6519 28.7202 31.3249 29.362C31.0373 29.9265 30.5783 30.3854 30.0138 30.673C29.3721 31 28.532 31 26.8519 31H16.4519C14.7717 31 13.9316 31 13.2899 30.673C12.7254 30.3854 12.2665 29.9265 11.9788 29.362C11.6519 28.7202 11.6519 27.8802 11.6519 26.2V18.3772Z" stroke="#757575" strokeWidth="1.73" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M26.1235 22.4717C25.9766 23.8523 25.1943 25.1461 23.8999 25.8934C21.7492 27.1351 18.9992 26.3983 17.7576 24.2476L17.6253 24.0186M17.1799 21.5269C17.3268 20.1462 18.1091 18.8525 19.4036 18.1051C21.5542 16.8635 24.3042 17.6003 25.5459 19.7509L25.6781 19.98M17.1519 25.2082L17.5391 23.7629L18.9844 24.1502M24.3194 19.8484L25.7646 20.2356L26.1519 18.7904" stroke="#757575" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Center - Animated Agent Circle (smaller) */}
        <div className="relative" style={{ marginTop: '-10px' }}>
          {/* Outer orange ring */}
          <div
            className="absolute inset-0 flex justify-center items-center"
            style={{
              width: '100px',
              height: '100px',
              transform: 'translate(-50%, -50%)',
              left: '50%',
              top: '50%'
            }}
          >
            <img
              src="/image copy 5.png"
              alt="Outer Ring"
              className="w-full h-full object-contain"
              style={{
                opacity: currentTurnActive ? 1 : 0.7
              }}
            />
          </div>

          {/* Glowing effect when speaking */}
          {currentTurnActive && (
            <div
              className="absolute inset-0 rounded-full animate-pulse"
              style={{
                background: `radial-gradient(circle, transparent 30%, #FFB36640 50%, #FFA65240 70%)`,
                filter: 'blur(8px)',
                width: '100px',
                height: '100px',
                transform: 'translate(-50%, -50%)',
                left: '50%',
                top: '50%'
              }}
            />
          )}

          {/* Main circle */}
          <div
            className="relative rounded-full overflow-hidden flex justify-center items-center"
            style={{
              width: '80px',
              height: '80px',
              boxShadow: currentTurnActive
                ? '0 0 20px #FFB36660, inset 0 0 15px #FFA65240'
                : 'none',
              backgroundColor: 'transparent'
            }}
          >
            {currentTurnActive ? (
              <img
                src="/image copy 6.png"
                alt="Assistant Speaking"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <img
                src="/sphere.gif"
                alt="Assistant Listening"
                className="w-full h-full object-cover rounded-full"
              />
            )}
          </div>
        </div>

        {/* Right side - Mic and Video */}
        <div className="flex items-center gap-1">
          {/* Microphone button */}
          <button
            onClick={onMicToggle}
            className={`p-0 cursor-pointer ${isListening ? 'animate-pulse' : ''}`}
          >
            {!isListening ? (
              <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0.49707" y="0.498047" width="37.0027" height="37.0027" rx="18.5014" fill="white" fillOpacity="0.8" />
                <rect x="0.49707" y="0.498047" width="37.0027" height="37.0027" rx="18.5014" stroke="#E9E8E8" />
                <path d="M21.5896 16.7531V12.9526C21.5896 11.5215 20.4294 10.3613 18.9983 10.3613C17.9812 10.3613 17.1009 10.9474 16.6768 11.8003M18.9983 25.0451V27.6363M18.9983 25.0451C15.6591 25.0451 12.9521 22.3381 12.9521 18.9988V17.2713M18.9983 25.0451C22.3376 25.0451 25.0446 22.3381 25.0446 18.9988V17.2713M15.5433 27.6363H22.4533M10.3608 10.3613L27.6358 27.6363M18.9983 21.5901C17.5672 21.5901 16.4071 20.4299 16.4071 18.9988V16.4076L20.8317 20.83C20.3627 21.2996 19.7145 21.5901 18.9983 21.5901Z" stroke="#757575" strokeWidth="1.7275" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0.49707" y="0.498047" width="37.0027" height="37.0027" rx="18.5014" fill="white" />
                <rect x="0.49707" y="0.498047" width="37.0027" height="37.0027" rx="18.5014" stroke="#E9E8E8" />
                <path d="M25.0446 17.2713V18.9988C25.0446 22.3381 22.3377 25.0451 18.9984 25.0451M12.9521 17.2713V18.9988C12.9521 22.3381 15.6591 25.0451 18.9984 25.0451M18.9984 25.0451V27.6363M15.5434 27.6363H22.4534M18.9984 21.5901C17.5673 21.5901 16.4071 20.4299 16.4071 18.9988V12.9526C16.4071 11.5215 17.5673 10.3613 18.9984 10.3613C20.4295 10.3613 21.5896 11.5215 21.5896 12.9526V18.9988C21.5896 20.4299 20.4295 21.5901 18.9984 21.5901Z" stroke="#757575" strokeWidth="1.7275" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>

          {/* Video button - closes video */}
          <button onClick={onVideoClick} className="p-0 cursor-pointer" title="Close video">
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

export default ComprehensiveControls