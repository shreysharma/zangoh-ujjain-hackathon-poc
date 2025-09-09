'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiService } from '../services/apiService'

interface ApiHealthState {
  isHealthy: boolean
  isChecking: boolean
  lastChecked: Date | null
  error: string | null
}

export const useApiHealth = () => {
  const [state, setState] = useState<ApiHealthState>({
    isHealthy: true,
    isChecking: false,
    lastChecked: null,
    error: null
  })

  const checkHealth = useCallback(async () => {
    setState(prev => ({ ...prev, isChecking: true, error: null }))
    
    try {
      const isHealthy = await apiService.checkHealth()
      setState({
        isHealthy,
        isChecking: false,
        lastChecked: new Date(),
        error: isHealthy ? null : 'Backend service is not responding'
      })
      return isHealthy
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState({
        isHealthy: false,
        isChecking: false,
        lastChecked: new Date(),
        error: errorMessage
      })
      return false
    }
  }, [])

  // Check health on mount and periodically
  useEffect(() => {
    checkHealth()
    
    // Check every 30 seconds
    const interval = setInterval(checkHealth, 30000)
    
    return () => clearInterval(interval)
  }, [checkHealth])

  return {
    ...state,
    checkHealth,
    retryConnection: checkHealth
  }
}