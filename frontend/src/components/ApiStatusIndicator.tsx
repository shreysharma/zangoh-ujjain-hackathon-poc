'use client'

import React from 'react'
import { useApiHealth } from '../hooks/useApiHealth'

interface ApiStatusIndicatorProps {
  showNotification?: (message: string, type?: 'success' | 'error' | 'info') => void
}

const ApiStatusIndicator = ({ showNotification }: ApiStatusIndicatorProps) => {
  const { isHealthy, isChecking, error, retryConnection } = useApiHealth()

  const handleRetry = async () => {
    const success = await retryConnection()
    if (showNotification) {
      showNotification(
        success ? 'Connection restored!' : 'Still unable to connect to backend',
        success ? 'success' : 'error'
      )
    }
  }

  if (isHealthy) {
    return (
      <></>
    )
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-50 border-b border-red-200 p-3 z-50">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-700 font-medium">Backend Disconnected</span>
          </div>
          
          {error && (
            <span className="text-red-600 text-sm">
              {error}
            </span>
          )}
        </div>

        <button
          onClick={handleRetry}
          disabled={isChecking}
          className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-medium px-3 py-1 rounded transition-colors flex items-center space-x-1"
        >
          {isChecking ? (
            <>
              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Checking...</span>
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Retry</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default ApiStatusIndicator