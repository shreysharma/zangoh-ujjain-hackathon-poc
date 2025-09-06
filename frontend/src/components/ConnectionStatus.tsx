'use client'

import { useEffect, useState } from 'react'
import { apiService } from '../services/apiService'

export default function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false)
  
  useEffect(() => {
    // Check connection status periodically
    const checkConnection = async () => {
      try {
        const connected = apiService.connected
        setIsConnected(connected)
      } catch {
        setIsConnected(false)
      }
    }
    
    // Initial check
    checkConnection()
    
    // Set up interval to check every 2 seconds
    const interval = setInterval(checkConnection, 2000)
    
    // Also listen for storage events to sync across components
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'streamConnected') {
        setIsConnected(e.newValue === 'true')
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Listen for custom events from pages
    const handleConnectionChange = (e: CustomEvent) => {
      setIsConnected(e.detail.connected)
      // Store in localStorage for persistence
      localStorage.setItem('streamConnected', e.detail.connected.toString())
    }
    
    window.addEventListener('connectionStatusChanged' as any, handleConnectionChange)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('connectionStatusChanged' as any, handleConnectionChange)
    }
  }, [])
  
  return (
    <div className="fixed top-2 left-1/2 transform -translate-x-1/2 z-[9999] bg-black/80 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-2 shadow-lg">
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} ${isConnected ? 'animate-pulse' : 'animate-none'}`} />
      <span className="text-white text-xs font-medium">
        {isConnected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  )
}