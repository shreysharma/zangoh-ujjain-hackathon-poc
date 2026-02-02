'use client'

import { useEffect } from 'react'
import { SessionManager } from '../utils/sessionManager'

export default function SessionInitializer() {
  useEffect(() => {
    // Initialize SessionManager auto-cleanup on app start
    SessionManager.initializeAutoCleanup()
    
    // Cleanup on unmount (when app is closed)
    return () => {
      SessionManager.stopAutoCleanup()
    }
  }, [])

  return null // This component doesn't render anything
}