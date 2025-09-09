// Video service for camera/screen capture and image streaming
// Handles video stream management and frame capture for AI analysis

import { apiService } from './apiService'

interface VideoConstraints {
  video: {
    facingMode?: 'user' | 'environment'
    width?: { ideal: number; min?: number; max?: number }
    height?: { ideal: number; min?: number; max?: number }
  }
  audio: boolean
}

class VideoService {
  private currentStream: MediaStream | null = null
  private isCapturing = false
  private captureInterval: NodeJS.Timeout | null = null
  private videoElement: HTMLVideoElement | null = null
  private canvasElement: HTMLCanvasElement | null = null

  // Start camera with specified constraints
  async startCamera(facingMode: 'user' | 'environment' = 'user'): Promise<MediaStream> {
    try {
      
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported by this browser')
      }
      
      // Check HTTPS requirement (required for mobile)
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        throw new Error('Camera requires HTTPS connection on mobile devices')
      }

      // Detect if on mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      
      const constraints: VideoConstraints = {
        video: isMobile ? {
          // Mobile-friendly constraints
          facingMode: facingMode,
          width: { ideal: 320, min: 240, max: 480 },
          height: { ideal: 240, min: 180, max: 360 }
        } : {
          // Desktop constraints
          width: { ideal: 320, max: 640 },
          height: { ideal: 240, max: 480 },
          facingMode: facingMode
        },
        audio: false
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      this.currentStream = stream
      
      
      return stream
    } catch (error) {
      console.error('Camera error:', error)
      throw this.formatCameraError(error)
    }
  }

  // Start screen sharing
  async startScreenShare(): Promise<MediaStream> {
    try {
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Screen sharing not supported by this browser')
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: true,
        audio: false 
      })
      
      this.currentStream = stream
      
      return stream
    } catch (error) {
      console.error('Screen share error:', error)
      throw error
    }
  }

  // Stop current video stream
  stopVideoStream(): void {
    
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => {
        track.stop()
      })
      this.currentStream = null
    }
    
    this.stopFrameCapture()
    
    if (this.videoElement) {
      this.videoElement.srcObject = null
    }
  }

  // Set video element for streaming
  setVideoElement(videoElement: HTMLVideoElement): void {
    this.videoElement = videoElement
    
    if (this.currentStream) {
      videoElement.srcObject = this.currentStream
    }
  }

  // Start frame capture for AI analysis
  startFrameCapture(intervalMs: number = 1000): void {
    if (this.isCapturing) {
      this.stopFrameCapture()
    }
    
    this.isCapturing = true
    
    this.captureInterval = setInterval(() => {
      this.captureAndSendFrame()
    }, intervalMs)
  }

  // Stop frame capture
  stopFrameCapture(): void {
    if (this.captureInterval) {
      clearInterval(this.captureInterval)
      this.captureInterval = null
    }
    this.isCapturing = false
  }

  // Capture current video frame and send to API
  private captureAndSendFrame(): void {
    if (!this.videoElement || !this.videoElement.videoWidth) {
      return
    }

    try {
      // Create canvas if not exists
      if (!this.canvasElement) {
        this.canvasElement = document.createElement('canvas')
      }

      const canvas = this.canvasElement
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        console.error('Cannot get canvas context')
        return
      }

      // Set canvas dimensions to match video
      canvas.width = this.videoElement.videoWidth
      canvas.height = this.videoElement.videoHeight
      
      // Draw current video frame
      ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height)
      
      // Convert to base64 JPEG and send to API (like original)
      canvas.toBlob((blob) => {
        if (blob) {
          const reader = new FileReader()
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1]
            // Send to API (like original - no await/async complexity)
            apiService.sendImage(base64)
          }
          reader.readAsDataURL(blob)
        }
      }, 'image/jpeg', 0.8)
      
    } catch (error) {
      console.error('Error capturing video frame:', error)
    }
  }

  // Capture single frame and return as blob URL
  async captureFrameAsBlob(): Promise<string | null> {
    if (!this.videoElement || !this.videoElement.videoWidth) {
      return null
    }

    try {
      // Create canvas if not exists
      if (!this.canvasElement) {
        this.canvasElement = document.createElement('canvas')
      }

      const canvas = this.canvasElement
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        console.error('Cannot get canvas context')
        return null
      }

      // Set canvas dimensions to match video
      canvas.width = this.videoElement.videoWidth
      canvas.height = this.videoElement.videoHeight
      
      // Draw current video frame
      ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height)
      
      // Convert canvas to blob and create object URL
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const captureUrl = URL.createObjectURL(blob)
            resolve(captureUrl)
          } else {
            resolve(null)
          }
        }, 'image/png', 0.8)
      })
      
    } catch (error) {
      console.error('Error capturing video frame as blob:', error)
      return null
    }
  }

  // Switch camera (mobile only)
  async switchCamera(currentFacingMode: 'user' | 'environment'): Promise<MediaStream> {
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user'
    
    // Stop current stream
    this.stopVideoStream()
    
    // Start new camera
    const stream = await this.startCamera(newFacingMode)
    
    // If video element is set, update it
    if (this.videoElement) {
      this.videoElement.srcObject = stream
    }
    
    return stream
  }

  // Format camera error messages
  private formatCameraError(error: any): Error {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    let errorMessage = 'Camera access failed: '
    
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        errorMessage += isMobile 
          ? 'Camera permission denied. Please check your browser settings and allow camera access for this site.'
          : 'Permission denied. Please allow camera access.'
      } else if (error.name === 'NotFoundError') {
        errorMessage += isMobile
          ? 'No camera found. Please ensure your device has a working camera.'
          : 'No camera found on this device.'
      } else if (error.name === 'NotSupportedError') {
        errorMessage += isMobile
          ? 'Camera not supported by this mobile browser. Try Chrome or Safari.'
          : 'Camera not supported by this browser.'
      } else if (error.name === 'NotReadableError') {
        errorMessage += isMobile
          ? 'Camera is being used by another app. Please close other camera apps and try again.'
          : 'Camera is being used by another application.'
      } else if (error.message?.includes('HTTPS')) {
        errorMessage += 'HTTPS required for camera access on mobile devices. Please use a secure connection.'
      } else {
        errorMessage += error.message || 'Unknown error occurred.'
      }
    } else {
      errorMessage += 'Unknown error occurred.'
    }
    
    return new Error(errorMessage)
  }

  // Check if currently capturing
  get capturing(): boolean {
    return this.isCapturing
  }

  // Check if stream is active
  get hasActiveStream(): boolean {
    return this.currentStream !== null && this.currentStream.active
  }

  // Get current stream
  get stream(): MediaStream | null {
    return this.currentStream
  }
}

// Export singleton instance
export const videoService = new VideoService()