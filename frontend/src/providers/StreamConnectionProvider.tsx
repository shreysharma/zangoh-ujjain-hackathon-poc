'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface StreamConnectionContextType {
  isStreamConnected: boolean
  setStreamConnected: (connected: boolean) => void
  canMakeApiCalls: boolean
  streamDisconnectionReason?: string
  setStreamDisconnectionReason: (reason?: string) => void
}

const StreamConnectionContext = createContext<StreamConnectionContextType | undefined>(undefined)

interface StreamConnectionProviderProps {
  children: ReactNode
}

export const StreamConnectionProvider = ({ children }: StreamConnectionProviderProps) => {
  const [isStreamConnected, setIsStreamConnected] = useState(true)
  const [streamDisconnectionReason, setStreamDisconnectionReason] = useState<string | undefined>()

  const setStreamConnected = useCallback((connected: boolean) => {
    setIsStreamConnected(connected)
    if (connected) {
      // Clear disconnection reason when reconnecting
      setStreamDisconnectionReason(undefined)
    }
  }, [])

  const canMakeApiCalls = isStreamConnected

  return (
    <StreamConnectionContext.Provider value={{
      isStreamConnected,
      setStreamConnected,
      canMakeApiCalls,
      streamDisconnectionReason,
      setStreamDisconnectionReason
    }}>
      {children}
    </StreamConnectionContext.Provider>
  )
}

export const useStreamConnection = () => {
  const context = useContext(StreamConnectionContext)
  if (context === undefined) {
    throw new Error('useStreamConnection must be used within a StreamConnectionProvider')
  }
  return context
}