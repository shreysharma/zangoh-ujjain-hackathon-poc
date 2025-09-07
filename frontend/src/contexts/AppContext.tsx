'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { apiService } from '../services/apiService'
import { audioService } from '../services/audioService'
import { videoService } from '../services/videoService'
import { MessageStorage } from '../utils/messageStorage'

interface AppState {
  isInitialized: boolean
  micPermissionGranted: boolean
  videoPermissionGranted: boolean
  isMicEnabled: boolean
  currentPage: 'home' | 'sarathi' | 'rakshak' | 'gyankosh'
}

interface AppContextType {
  appState: AppState
  resetApp: () => Promise<void>
  setCurrentPage: (page: AppState['currentPage']) => void
  setMicPermission: (granted: boolean) => void
  setVideoPermission: (granted: boolean) => void
  setMicEnabled: (enabled: boolean) => void
  initializeApp: () => void
}

const defaultAppState: AppState = {
  isInitialized: false,
  micPermissionGranted: false,
  videoPermissionGranted: false,
  isMicEnabled: true,
  currentPage: 'home'
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [appState, setAppState] = useState<AppState>(defaultAppState)

  const resetApp = useCallback(async () => {
    console.log('🔄 Resetting app state...')
    
    try {
      // Disconnect API connections
      if (apiService.connected) {
        await apiService.disconnect()
        apiService.closeEventStream()
      }
      
      // Stop all audio services
      audioService.stopAudioProcessing()
      audioService.setAudioEnabled(false)
      
      // Stop video services
      videoService.stopVideoStream()
      
      // Clear all message storage
      MessageStorage.clearAllMessages()
      
      // Also clear conversation from localStorage
      localStorage.removeItem('divyadarshak-conversation')
      console.log('🗑️ Cleared conversation from localStorage')
      
      // Reset app state
      setAppState({
        isInitialized: false,
        micPermissionGranted: false,
        videoPermissionGranted: false,
        isMicEnabled: true,
        currentPage: 'home'
      })
      
      console.log('✅ App state reset complete')
    } catch (error) {
      console.error('❌ Error resetting app:', error)
    }
  }, [])

  const setCurrentPage = useCallback((page: AppState['currentPage']) => {
    setAppState(prev => ({ ...prev, currentPage: page }))
  }, [])

  const setMicPermission = useCallback((granted: boolean) => {
    setAppState(prev => ({ ...prev, micPermissionGranted: granted }))
  }, [])

  const setVideoPermission = useCallback((granted: boolean) => {
    setAppState(prev => ({ ...prev, videoPermissionGranted: granted }))
  }, [])

  const setMicEnabled = useCallback((enabled: boolean) => {
    setAppState(prev => ({ ...prev, isMicEnabled: enabled }))
  }, [])

  const initializeApp = useCallback(() => {
    setAppState(prev => ({ ...prev, isInitialized: true }))
  }, [])

  const contextValue: AppContextType = {
    appState,
    resetApp,
    setCurrentPage,
    setMicPermission,
    setVideoPermission,
    setMicEnabled,
    initializeApp
  }

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

export default AppContext