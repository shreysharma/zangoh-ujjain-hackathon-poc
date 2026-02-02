// API Usage Counter Service
// Tracks all API calls, connections, and usage statistics

interface ApiCounters {
  // Connection tracking
  streamConnections: number
  streamDisconnections: number
  streamReconnections: number
  
  // API endpoint calls
  connectApiCalls: number
  disconnectApiCalls: number
  sendAudioCalls: number
  sendTextCalls: number
  sendImageCalls: number
  uploadJsonCalls: number
  healthCheckCalls: number
  
  // Error tracking
  connectionErrors: number
  apiErrors: number
  audioErrors: number
  streamErrors: number
  
  // Data transfer
  audioDataSent: number // in bytes
  textMessagesSent: number
  imagesSent: number
  jsonUploads: number
  
  // Timing metrics
  totalConnectionTime: number // in milliseconds
  averageConnectionDuration: number
  longestConnection: number
  shortestConnection: number
  
  // Session metrics
  sessionsCreated: number
  sessionsEnded: number
  totalMessages: number
  
  // Timestamps
  firstActivity: Date | null
  lastActivity: Date | null
  lastReset: Date | null
}

interface ConnectionSession {
  startTime: Date
  endTime?: Date
  duration?: number
  errors: number
}

class ApiCounterService {
  private static instance: ApiCounterService | null = null
  private counters: ApiCounters
  private currentConnection: ConnectionSession | null = null
  private subscribers: ((counters: ApiCounters) => void)[] = []
  
  private readonly STORAGE_KEY = 'api-usage-counters'

  private constructor() {
    this.counters = this.loadCounters()
  }

  static getInstance(): ApiCounterService {
    if (!ApiCounterService.instance) {
      ApiCounterService.instance = new ApiCounterService()
    }
    return ApiCounterService.instance
  }

  // Load counters from localStorage
  private loadCounters(): ApiCounters {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          ...this.getDefaultCounters(),
          ...parsed,
          firstActivity: parsed.firstActivity ? new Date(parsed.firstActivity) : null,
          lastActivity: parsed.lastActivity ? new Date(parsed.lastActivity) : null,
          lastReset: parsed.lastReset ? new Date(parsed.lastReset) : null
        }
      }
    } catch (error) {
      console.error('❌ Failed to load API counters:', error)
    }
    return this.getDefaultCounters()
  }

  // Save counters to localStorage
  private saveCounters(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.counters))
    } catch (error) {
      console.error('❌ Failed to save API counters:', error)
    }
  }

  // Get default counter values
  private getDefaultCounters(): ApiCounters {
    return {
      streamConnections: 0,
      streamDisconnections: 0,
      streamReconnections: 0,
      connectApiCalls: 0,
      disconnectApiCalls: 0,
      sendAudioCalls: 0,
      sendTextCalls: 0,
      sendImageCalls: 0,
      uploadJsonCalls: 0,
      healthCheckCalls: 0,
      connectionErrors: 0,
      apiErrors: 0,
      audioErrors: 0,
      streamErrors: 0,
      audioDataSent: 0,
      textMessagesSent: 0,
      imagesSent: 0,
      jsonUploads: 0,
      totalConnectionTime: 0,
      averageConnectionDuration: 0,
      longestConnection: 0,
      shortestConnection: 0,
      sessionsCreated: 0,
      sessionsEnded: 0,
      totalMessages: 0,
      firstActivity: null,
      lastActivity: null,
      lastReset: null
    }
  }

  // Update last activity timestamp
  private updateActivity(): void {
    const now = new Date()
    if (!this.counters.firstActivity) {
      this.counters.firstActivity = now
    }
    this.counters.lastActivity = now
    this.saveCounters()
    this.notifySubscribers()
  }

  // Notify all subscribers of counter updates
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback(this.counters)
      } catch (error) {
        console.error('❌ Error in counter subscriber:', error)
      }
    })
  }

  // Subscribe to counter updates
  subscribe(callback: (counters: ApiCounters) => void): () => void {
    this.subscribers.push(callback)
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback)
      if (index > -1) {
        this.subscribers.splice(index, 1)
      }
    }
  }

  // Stream connection tracking
  trackStreamConnection(): void {
    this.counters.streamConnections++
    this.currentConnection = {
      startTime: new Date(),
      errors: 0
    }
    this.updateActivity()
  }

  trackStreamDisconnection(): void {
    this.counters.streamDisconnections++
    
    // Calculate connection duration
    if (this.currentConnection) {
      this.currentConnection.endTime = new Date()
      this.currentConnection.duration = this.currentConnection.endTime.getTime() - this.currentConnection.startTime.getTime()
      
      // Update timing statistics
      this.counters.totalConnectionTime += this.currentConnection.duration
      this.counters.averageConnectionDuration = this.counters.totalConnectionTime / this.counters.streamConnections
      
      if (this.counters.longestConnection === 0 || this.currentConnection.duration > this.counters.longestConnection) {
        this.counters.longestConnection = this.currentConnection.duration
      }
      
      if (this.counters.shortestConnection === 0 || this.currentConnection.duration < this.counters.shortestConnection) {
        this.counters.shortestConnection = this.currentConnection.duration
      }
      
      this.currentConnection = null
    }
    
    this.updateActivity()
  }

  trackStreamReconnection(): void {
    this.counters.streamReconnections++
    this.updateActivity()
  }

  trackStreamError(): void {
    this.counters.streamErrors++
    if (this.currentConnection) {
      this.currentConnection.errors++
    }
    this.updateActivity()
  }

  // API endpoint tracking
  trackConnectApi(): void {
    this.counters.connectApiCalls++
    this.updateActivity()
  }

  trackDisconnectApi(): void {
    this.counters.disconnectApiCalls++
    this.updateActivity()
  }

  trackSendAudio(dataSize?: number): void {
    this.counters.sendAudioCalls++
    if (dataSize) {
      this.counters.audioDataSent += dataSize
    }
    this.updateActivity()
  }

  trackSendText(): void {
    this.counters.sendTextCalls++
    this.counters.textMessagesSent++
    this.updateActivity()
  }

  trackSendImage(): void {
    this.counters.sendImageCalls++
    this.counters.imagesSent++
    this.updateActivity()
  }


  trackUploadJson(): void {
    this.counters.uploadJsonCalls++
    this.counters.jsonUploads++
    this.updateActivity()
  }

  trackHealthCheck(): void {
    this.counters.healthCheckCalls++
    this.updateActivity()
  }

  // Error tracking
  trackConnectionError(): void {
    this.counters.connectionErrors++
    this.updateActivity()
  }

  trackApiError(): void {
    this.counters.apiErrors++
    this.updateActivity()
  }

  trackAudioError(): void {
    this.counters.audioErrors++
    this.updateActivity()
  }

  // Session tracking
  trackSessionCreated(): void {
    this.counters.sessionsCreated++
    this.updateActivity()
  }

  trackSessionEnded(): void {
    this.counters.sessionsEnded++
    this.updateActivity()
  }

  trackMessage(): void {
    this.counters.totalMessages++
    this.updateActivity()
  }

  // Get current counters
  getCounters(): ApiCounters {
    return { ...this.counters }
  }

  // Get current connection info
  getCurrentConnectionInfo(): { isConnected: boolean; duration?: number; errors?: number } {
    if (!this.currentConnection) {
      return { isConnected: false }
    }

    const duration = new Date().getTime() - this.currentConnection.startTime.getTime()
    return {
      isConnected: true,
      duration,
      errors: this.currentConnection.errors
    }
  }

  // Reset all counters
  resetCounters(): void {
    this.counters = {
      ...this.getDefaultCounters(),
      lastReset: new Date()
    }
    this.saveCounters()
    this.notifySubscribers()
  }

  // Export counters as JSON
  exportCounters(): string {
    return JSON.stringify(this.counters, null, 2)
  }

  // Utility functions
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Get formatted statistics
  getFormattedStats(): Record<string, string | number> {
    const connection = this.getCurrentConnectionInfo()
    return {
      // Connection stats
      'Stream Connections': this.counters.streamConnections,
      'Stream Disconnections': this.counters.streamDisconnections,
      'Stream Reconnections': this.counters.streamReconnections,
      'Currently Connected': connection.isConnected ? 'Yes' : 'No',
      'Current Connection Duration': connection.duration ? this.formatDuration(connection.duration) : 'N/A',
      
      // API calls
      'Connect API Calls': this.counters.connectApiCalls,
      'Disconnect API Calls': this.counters.disconnectApiCalls,
      'Send Audio Calls': this.counters.sendAudioCalls,
      'Send Text Calls': this.counters.sendTextCalls,
      'Send Image Calls': this.counters.sendImageCalls,
      'JSON Uploads': this.counters.uploadJsonCalls,
      'Health Checks': this.counters.healthCheckCalls,
      
      // Errors
      'Connection Errors': this.counters.connectionErrors,
      'API Errors': this.counters.apiErrors,
      'Audio Errors': this.counters.audioErrors,
      'Stream Errors': this.counters.streamErrors,
      
      // Data transfer
      'Audio Data Sent': this.formatBytes(this.counters.audioDataSent),
      'Text Messages Sent': this.counters.textMessagesSent,
      'Images Sent': this.counters.imagesSent,
      
      // Timing
      'Total Connection Time': this.formatDuration(this.counters.totalConnectionTime),
      'Average Connection Duration': this.formatDuration(this.counters.averageConnectionDuration),
      'Longest Connection': this.formatDuration(this.counters.longestConnection),
      'Shortest Connection': this.formatDuration(this.counters.shortestConnection),
      
      // Sessions
      'Sessions Created': this.counters.sessionsCreated,
      'Sessions Ended': this.counters.sessionsEnded,
      'Total Messages': this.counters.totalMessages,
      
      // Activity
      'First Activity': this.counters.firstActivity?.toLocaleString() || 'Never',
      'Last Activity': this.counters.lastActivity?.toLocaleString() || 'Never',
      'Last Reset': this.counters.lastReset?.toLocaleString() || 'Never'
    }
  }
}

// Export singleton instance
export const apiCounterService = ApiCounterService.getInstance()
export type { ApiCounters }