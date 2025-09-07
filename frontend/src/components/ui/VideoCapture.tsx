'use client'

import React, { useRef, useEffect, useState } from 'react'
import { videoService } from '../../services/videoService'

interface VideoCaptureProps {
  onImageCapture?: (base64Image: string) => void
  isActive: boolean
  onToggle: () => void
  className?: string
}

const VideoCapture = ({ onImageCapture, isActive, onToggle, className = '' }: VideoCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => {
    if (isActive) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => stopCamera()
  }, [isActive])

  const startCamera = async () => {
    if (!videoRef.current) return

    setIsLoading(true)
    setError(null)

    try {
      const stream = await videoService.startCamera(facingMode)
      videoService.setVideoElement(videoRef.current)
      
      // Start frame capture for pilgrimage analysis
      videoService.startFrameCapture(3000, (base64Image) => {
        setIsAnalyzing(true)
        onImageCapture?.(base64Image)
        setTimeout(() => setIsAnalyzing(false), 1000)
      })
      
    } catch (err) {
      setError((err as Error).message)
      console.error('Camera error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const stopCamera = () => {
    videoService.stopVideoStream()
  }

  const handleCameraSwitch = async () => {
    if (!isActive) return

    setIsLoading(true)
    try {
      const newFacingMode = facingMode === 'user' ? 'environment' : 'user'
      await videoService.switchCamera(facingMode)
      setFacingMode(newFacingMode)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCapturePhoto = async () => {
    const base64Image = await videoService.captureFrameAsBase64()
    if (base64Image) {
      onImageCapture?.(base64Image)
      setIsAnalyzing(true)
      setTimeout(() => setIsAnalyzing(false), 1000)
    }
  }

  return (
    <div className={`relative ${className}`}>
      {isActive && (
        <div className="relative bg-black rounded-2xl overflow-hidden shadow-lg">
          {/* Video Element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-48 object-cover"
          />
          
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="bg-white/90 rounded-full p-3">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
          )}
          
          {/* Analysis Indicator */}
          {isAnalyzing && (
            <div className="absolute top-3 right-3">
              <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium animate-pulse">
                Analyzing...
              </div>
            </div>
          )}
          
          {/* Camera Controls */}
          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
            {/* Camera Switch Button */}
            <button
              onClick={handleCameraSwitch}
              disabled={isLoading}
              className="bg-white/90 text-gray-700 p-2 rounded-full hover:bg-white transition-colors disabled:opacity-50"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 5H16.83L15 3H9L7.17 5H4C2.9 5 2 5.9 2 7V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V7C22 5.9 21.1 5 20 5ZM20 19H4V7H8.05L9.88 5H14.12L15.95 7H20V19ZM12 8C9.24 8 7 10.24 7 13C7 15.76 9.24 18 12 18C14.76 18 17 15.76 17 13C17 10.24 14.76 8 12 8ZM12 16C10.35 16 9 14.65 9 13C9 11.35 10.35 10 12 10C13.65 10 15 11.35 15 13C15 14.65 13.65 16 12 16Z" fill="currentColor"/>
                <path d="M14 13C14 14.1 13.1 15 12 15C10.9 15 10 14.1 10 13C10 11.9 10.9 11 12 11C13.1 11 14 11.9 14 13Z" fill="currentColor"/>
              </svg>
            </button>
            
            {/* Capture Photo Button */}
            <button
              onClick={handleCapturePhoto}
              disabled={isLoading}
              className="bg-orange-500 text-white p-3 rounded-full hover:bg-orange-600 transition-colors disabled:opacity-50 shadow-lg"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15.2C13.77 15.2 15.2 13.77 15.2 12C15.2 10.23 13.77 8.8 12 8.8C10.23 8.8 8.8 10.23 8.8 12C8.8 13.77 10.23 15.2 12 15.2Z" fill="currentColor"/>
                <path d="M9 2L7.17 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4H16.83L15 2H9ZM12 17C8.69 17 6 14.31 6 11C6 7.69 8.69 5 12 5C15.31 5 18 7.69 18 11C18 14.31 15.31 17 12 17Z" fill="currentColor"/>
              </svg>
            </button>
            
            {/* Close Button */}
            <button
              onClick={onToggle}
              className="bg-white/90 text-gray-700 p-2 rounded-full hover:bg-white transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
          
          {/* Instructions Overlay */}
          <div className="absolute top-3 left-3">
            <div className="bg-black/60 text-white px-3 py-1 rounded-full text-xs">
              Point at temples, deities, or religious sites
            </div>
          </div>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      
      {/* Camera Toggle Button (when not active) */}
      {!isActive && (
        <button
          onClick={onToggle}
          className="w-full bg-orange-100 hover:bg-orange-200 border-2 border-dashed border-orange-300 rounded-2xl p-6 transition-colors"
        >
          <div className="flex flex-col items-center text-orange-600">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-2">
              <path d="M12 15.2C13.77 15.2 15.2 13.77 15.2 12C15.2 10.23 13.77 8.8 12 8.8C10.23 8.8 8.8 10.23 8.8 12C8.8 13.77 10.23 15.2 12 15.2Z" fill="currentColor"/>
              <path d="M9 2L7.17 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4H16.83L15 2H9ZM12 17C8.69 17 6 14.31 6 11C6 7.69 8.69 5 12 5C15.31 5 18 7.69 18 11C18 14.31 15.31 17 12 17Z" fill="currentColor"/>
            </svg>
            <h3 className="font-semibold text-sm mb-1">Visual Pilgrimage Assistant</h3>
            <p className="text-xs text-center">
              Show me temples, deities, or religious sites for instant information and guidance
            </p>
          </div>
        </button>
      )}
    </div>
  )
}

export default VideoCapture