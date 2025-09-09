'use client'

import React, { useEffect, useState } from 'react'

interface NotificationProps {
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
  onClose: () => void
}

const Notification = ({ message, type = 'info', duration = 3000, onClose }: NotificationProps) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Allow fade out animation
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-[#FFB366]' // Orange theme for success
      case 'error':
        return 'bg-red-500'   // Keep red for errors
      default:
        return 'bg-[#FFB366]' // Orange theme for info
    }
  }

  const getTextColor = () => {
    switch (type) {
      case 'error':
        return 'text-white' // White text on red background
      default:
        return 'text-white' // White text on orange background
    }
  }

  return (
    <div 
      className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-lg ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      } ${getBackgroundColor()} ${getTextColor()}`}
    >
      {message}
    </div>
  )
}

export default Notification