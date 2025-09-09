'use client'

import { useEffect } from 'react'
import { useMicrophone } from '../providers/MicrophoneProvider'

interface UseMicrophoneControlOptions {
  enableOnMount?: boolean
  disableOnUnmount?: boolean
  autoStart?: boolean
}

export const useMicrophoneControl = (options: UseMicrophoneControlOptions = {}) => {
  const {
    enableOnMount = false,
    disableOnUnmount = false,
    autoStart = true
  } = options

  const {
    isListening,
    isSupported,
    isEnabled,
    startMicrophone,
    stopMicrophone,
    enableMicrophone,
    disableMicrophone
  } = useMicrophone()

  useEffect(() => {
    if (enableOnMount) {
      enableMicrophone()
      if (autoStart) {
        startMicrophone()
      }
    }

    return () => {
      if (disableOnUnmount) {
        disableMicrophone()
      }
    }
  }, [enableOnMount, disableOnUnmount, autoStart, enableMicrophone, disableMicrophone, startMicrophone])

  return {
    isListening,
    isSupported,
    isEnabled,
    startMicrophone,
    stopMicrophone,
    enableMicrophone,
    disableMicrophone
  }
}