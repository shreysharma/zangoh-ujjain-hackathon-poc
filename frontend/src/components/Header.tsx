'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { authUtils } from '../utils/auth'

interface HeaderProps {
  onSwitchToChat?: () => void
  showChatView?: boolean
  onBackClick?: () => void
  isConnected?: boolean
  isConnecting?: boolean
  responseModality?: 'AUDIO' | 'TEXT'
  onConnectionToggle?: () => void
  onAudioEnable?: () => void
  isAudioEnabled?: boolean
  onToggleChatView?: () => void
}

const Header = ({ onSwitchToChat, showChatView, onBackClick, isConnected, isConnecting, responseModality, onConnectionToggle, onAudioEnable, isAudioEnabled, onToggleChatView }: HeaderProps) => {
  const router = useRouter()

  const handleLogout = () => {
    authUtils.logout()
    router.push('/')
  }

  return (
    <nav
      className="px-5 absolute top-0 right-0 z-50 w-full"
      style={{
        background: "linear-gradient(to right, #E9842F, #E9842F, #E9842F)",
        paddingTop: "env(safe-area-inset-top)",
        height: "60.812px",
      }}
    >
      <div className='flex justify-between items-center h-full'>


        {/* Left Side - Title */}
        <div
          onClick={handleLogout}
          className='flex gap-2 items-center'
          style={{
            fontFamily: 'General Sans, var(--font-general-sans), Inter, sans-serif',
            fontWeight: 600,
            fontSize: '18.24px',
            lineHeight: '100%',
            letterSpacing: '0%',
            color: 'white'
          }}
        >

        {showChatView ? (
          <div className='w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer' onClick={onBackClick}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.8333 10H4.16666M4.16666 10L10 15.8333M4.16666 10L10 4.16666" stroke="white" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ):(
           <div className='w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer'>
           
          </div>
        )}
          Divya Darshak
        </div>


        {/* Right Side - Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Chat View Toggle Button */}
          <button onClick={onToggleChatView} className="flex items-center cursor-pointer justify-around gap-1 text-[#757575] text-[13px] bg-[#FFFAF4] min-w-[80px] h-[30px] rounded-lg"
          style={{ fontFamily: 'Inter, sans-serif'}} >
            {showChatView ? (
              <p>Voice</p>
            ) : (
             <p>Chat</p>
            )}
            <img src="./switch.svg" alt="Switch" />
          </button>
          {/* Logs Button */}
          {/* <div
            className="w-10 h-10 flex items-center justify-center rounded-full cursor-pointer transition-colors hover:bg-white/20"
            onClick={() => router.push('/logs')}
            title="View Session Logs"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3.33333 5H16.6667M3.33333 10H16.6667M3.33333 15H10" stroke="white" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div> */}

          {/* Connect Button */}
          <div
            className={`w-10 h-10 flex items-center justify-center rounded-full cursor-pointer transition-colors ${
              isConnected ? 'bg-green-500/20' : isConnecting ? 'bg-yellow-500/20' : 'bg-white/20'
            } hover:bg-white/30`}
            onClick={onConnectionToggle}
            title={isConnected ? "Disconnect" : isConnecting ? "Connecting..." : "Connect"}
          >
            {isConnecting ? (
              <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeDasharray="60" strokeDashoffset="20"/>
              </svg>
            ) : isConnected ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="white"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" fill="white"/>
              </svg>
            )}
          </div>
        </div>


      </div>
    </nav>
  )
}

export default Header
