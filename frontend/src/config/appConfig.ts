// Application configuration for IndiaMART AI integration

export interface AppConfig {
  // Backend API configuration
  api: {
    baseUrl: string
    timeout: number
    retryAttempts: number
  }
  
  // Audio processing configuration
  audio: {
    sampleRate: number
    chunkSize: number
    enableAudioPlayback: boolean
    enableMicrophoneInput: boolean
  }
  
  // Video processing configuration
  video: {
    captureFrameRate: number // FPS for AI analysis
    maxResolution: {
      width: number
      height: number
    }
    enableFrameCapture: boolean
  }
  
  // UI configuration
  ui: {
    defaultResponseModality: 'AUDIO' | 'TEXT'
    autoConnectOnMount: boolean
    showConnectionStatus: boolean
    showDebugLogs: boolean
  }
  
  // IndiaMART integration
  indiamart: {
    domain: string
    enableProductSearch: boolean
    enableSupplierSearch: boolean
    maxSearchResults: number
  }
  
  // External services configuration
  externalServices: {
    corsProxies: string[]
    fontUrl: string
  }
}

// Default configuration - all values should be overridden from env
export const defaultConfig: AppConfig = {
  api: {
    baseUrl: '',
    timeout: 30000,
    retryAttempts: 3
  },
  
  audio: {
    sampleRate: 16000,
    chunkSize: 4096,
    enableAudioPlayback: true,
    enableMicrophoneInput: true
  },
  
  video: {
    captureFrameRate: 1,
    maxResolution: {
      width: 640,
      height: 480
    },
    enableFrameCapture: true
  },
  
  ui: {
    defaultResponseModality: 'AUDIO',
    autoConnectOnMount: true,
    showConnectionStatus: true,
    showDebugLogs: false
  },
  
  indiamart: {
    domain: '',
    enableProductSearch: true,
    enableSupplierSearch: true,
    maxSearchResults: 10
  },
  
  externalServices: {
    corsProxies: [],
    fontUrl: ''
  }
}

// Environment-specific overrides
export const getConfig = (): AppConfig => {
  const config = { ...defaultConfig }
  
  // API Configuration
  config.api.baseUrl = process.env.NEXT_PUBLIC_API_BASE || ''
  config.api.timeout = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000')
  config.api.retryAttempts = parseInt(process.env.NEXT_PUBLIC_API_RETRY_ATTEMPTS || '3')
  
  // Audio Configuration
  config.audio.sampleRate = parseInt(process.env.NEXT_PUBLIC_AUDIO_SAMPLE_RATE || '16000')
  config.audio.chunkSize = parseInt(process.env.NEXT_PUBLIC_AUDIO_CHUNK_SIZE || '4096')
  config.audio.enableAudioPlayback = process.env.NEXT_PUBLIC_ENABLE_AUDIO_PLAYBACK !== 'false'
  config.audio.enableMicrophoneInput = process.env.NEXT_PUBLIC_ENABLE_MICROPHONE_INPUT !== 'false'
  
  // Video Configuration
  config.video.captureFrameRate = parseInt(process.env.NEXT_PUBLIC_VIDEO_CAPTURE_FRAME_RATE || '1')
  config.video.maxResolution.width = parseInt(process.env.NEXT_PUBLIC_VIDEO_MAX_WIDTH || '640')
  config.video.maxResolution.height = parseInt(process.env.NEXT_PUBLIC_VIDEO_MAX_HEIGHT || '480')
  config.video.enableFrameCapture = process.env.NEXT_PUBLIC_ENABLE_FRAME_CAPTURE !== 'false'
  
  // UI Configuration
  config.ui.defaultResponseModality = (process.env.NEXT_PUBLIC_DEFAULT_RESPONSE_MODALITY || 'AUDIO') as 'AUDIO' | 'TEXT'
  config.ui.autoConnectOnMount = process.env.NEXT_PUBLIC_AUTO_CONNECT_ON_MOUNT !== 'false'
  config.ui.showConnectionStatus = process.env.NEXT_PUBLIC_SHOW_CONNECTION_STATUS !== 'false'
  config.ui.showDebugLogs = process.env.NEXT_PUBLIC_SHOW_DEBUG_LOGS === 'true' || process.env.NODE_ENV === 'development'
  
  // IndiaMART Configuration
  config.indiamart.domain = process.env.NEXT_PUBLIC_INDIAMART_DOMAIN || ''
  config.indiamart.enableProductSearch = process.env.NEXT_PUBLIC_INDIAMART_ENABLE_PRODUCT_SEARCH !== 'false'
  config.indiamart.enableSupplierSearch = process.env.NEXT_PUBLIC_INDIAMART_ENABLE_SUPPLIER_SEARCH !== 'false'
  config.indiamart.maxSearchResults = parseInt(process.env.NEXT_PUBLIC_INDIAMART_MAX_SEARCH_RESULTS || '10')
  
  // External Services Configuration
  const corsProxies: string[] = []
  if (process.env.NEXT_PUBLIC_CORS_PROXY_1) corsProxies.push(process.env.NEXT_PUBLIC_CORS_PROXY_1)
  if (process.env.NEXT_PUBLIC_CORS_PROXY_2) corsProxies.push(process.env.NEXT_PUBLIC_CORS_PROXY_2)
  if (process.env.NEXT_PUBLIC_CORS_PROXY_3) corsProxies.push(process.env.NEXT_PUBLIC_CORS_PROXY_3)
  config.externalServices.corsProxies = corsProxies
  config.externalServices.fontUrl = process.env.NEXT_PUBLIC_FONT_URL || ''
  
  return config
}

export const config = getConfig()