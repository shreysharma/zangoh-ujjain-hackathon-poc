'use client'

import { useEffect, useState } from 'react'

interface VideoConnectionStatusProps {
  isConnected?: boolean
}

export default function VideoConnectionStatus({ isConnected: propIsConnected }: VideoConnectionStatusProps) {
  const [isConnected, setIsConnected] = useState(propIsConnected || false)
  
  useEffect(() => {
    // Update from prop if provided
    if (propIsConnected !== undefined) {
      setIsConnected(propIsConnected)
    }
    
    // Listen for connection status changes from video page
    const handleConnectionChange = (e: CustomEvent) => {
      setIsConnected(e.detail.connected)
    }
    
    window.addEventListener('videoConnectionStatusChanged' as any, handleConnectionChange)
    
    return () => {
      window.removeEventListener('videoConnectionStatusChanged' as any, handleConnectionChange)
    }
  }, [propIsConnected])
  
  return (
    <div className="fixed top-2 right-2 z-[9999] bg-black/80 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-2 shadow-lg">
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} ${isConnected ? 'animate-pulse' : 'animate-none'}`} />
      <span className="text-white text-xs font-medium">
        Video: {isConnected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  )
}