// Session management for conversations
import { Message } from '../hooks/useConversation'
import { apiService } from '../services/apiService'

export interface ConversationSession {
  sessionId: string
  startTime: Date
  endTime?: Date
  messages: Message[]
  status: 'active' | 'ended'
  connectionInfo?: {
    backendConnected: boolean
    responseModality?: 'AUDIO' | 'TEXT'
  }
}

export const SESSION_STORAGE_KEY = 'indiamart-conversation-sessions'

export class SessionManager {
  private static currentSessionId: string | null = null
  private static cleanupInterval: NodeJS.Timeout | null = null

  // Generate unique session ID
  static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Create new conversation session
  static createNewSession(): string {
    const sessionId = this.generateSessionId()
    const newSession: ConversationSession = {
      sessionId,
      startTime: new Date(),
      messages: [],
      status: 'active',
      connectionInfo: {
        backendConnected: false
      }
    }

    this.saveSession(newSession)
    this.currentSessionId = sessionId
    
    console.log('📝 New conversation session created:', sessionId)
    return sessionId
  }

  // Get current active session ID
  static getCurrentSessionId(): string | null {
    return this.currentSessionId
  }

  // Set current session ID
  static setCurrentSessionId(sessionId: string): void {
    this.currentSessionId = sessionId
  }

  // End current session
  static async endCurrentSession(): Promise<void> {
    if (this.currentSessionId) {
      const session = this.getSession(this.currentSessionId)
      if (session) {
        session.endTime = new Date()
        session.status = 'ended'
        this.saveSession(session)
        console.log('🔚 Session ended:', this.currentSessionId)
        
        // Auto-export session as JSON and upload to backend
        await this.autoExportSession(this.currentSessionId)
      }
      this.currentSessionId = null
    }
  }

  // Add message to current session
  static addMessageToCurrentSession(message: Message): void {
    if (!this.currentSessionId) {
      this.currentSessionId = this.createNewSession()
    }

    const session = this.getSession(this.currentSessionId)
    if (session) {
      session.messages.push(message)
      this.saveSession(session)
    }
  }

  // Update existing message in current session (for streaming updates)
  static updateMessageInCurrentSession(message: Message): void {
    if (!this.currentSessionId) {
      return
    }

    const session = this.getSession(this.currentSessionId)
    if (session) {
      // Find and update existing message by ID
      const messageIndex = session.messages.findIndex(m => m.id === message.id)
      if (messageIndex >= 0) {
        session.messages[messageIndex] = message
        this.saveSession(session)
      } else {
        // If message doesn't exist, add it
        session.messages.push(message)
        this.saveSession(session)
      }
    }
  }

  // Update session connection info
  static updateSessionConnection(connected: boolean, modality?: 'AUDIO' | 'TEXT'): void {
    if (!this.currentSessionId) {
      this.currentSessionId = this.createNewSession()
    }

    const session = this.getSession(this.currentSessionId)
    if (session) {
      session.connectionInfo = {
        backendConnected: connected,
        responseModality: modality
      }
      this.saveSession(session)
    }
  }

  // Get single session
  static getSession(sessionId: string): ConversationSession | null {
    try {
      const sessions = this.getAllSessions()
      return sessions.find(s => s.sessionId === sessionId) || null
    } catch (error) {
      console.error('Error getting session:', error)
      return null
    }
  }

  // Get all sessions
  static getAllSessions(): ConversationSession[] {
    try {
      const sessionsData = localStorage.getItem(SESSION_STORAGE_KEY)
      if (!sessionsData) return []

      const sessions = JSON.parse(sessionsData)
      return sessions.map((session: any) => ({
        ...session,
        startTime: new Date(session.startTime),
        endTime: session.endTime ? new Date(session.endTime) : undefined
      }))
    } catch (error) {
      console.error('Error loading sessions:', error)
      return []
    }
  }

  // Save session to localStorage
  private static saveSession(session: ConversationSession): void {
    try {
      const sessions = this.getAllSessions()
      const existingIndex = sessions.findIndex(s => s.sessionId === session.sessionId)
      
      if (existingIndex >= 0) {
        sessions[existingIndex] = session
      } else {
        sessions.push(session)
      }

      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions))
    } catch (error) {
      console.error('Error saving session:', error)
    }
  }

  // Clear all sessions
  static clearAllSessions(): void {
    localStorage.removeItem(SESSION_STORAGE_KEY)
    this.currentSessionId = null
    console.log('🗑️ All sessions cleared')
  }

  // Initialize automatic cleanup (call this when app starts)
  static initializeAutoCleanup(): void {
    // Clear any existing interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }

    // Run cleanup immediately
    this.cleanupOldSessions()

    // Set up automatic cleanup every 10 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldSessions()
    }, 10 * 60 * 1000) // 10 minutes

    console.log('🧹 Auto-cleanup initialized - will run every 10 minutes')
  }

  // Stop automatic cleanup
  static stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
      console.log('🧹 Auto-cleanup stopped')
    }
  }

  // Clean up sessions older than 1 hour
  static cleanupOldSessions(): void {
    try {
      const sessions = this.getAllSessions()
      const oneHourAgo = new Date(Date.now() - (60 * 60 * 1000)) // 1 hour ago
      const initialCount = sessions.length

      // Filter out sessions older than 1 hour (check both start and end times)
      const validSessions = sessions.filter(session => {
        const sessionTime = session.endTime || session.startTime
        const isOld = sessionTime < oneHourAgo
        
        if (isOld) {
          console.log(`🗑️ Removing old session: ${session.sessionId} (${sessionTime.toISOString()})`)
        }
        
        return !isOld
      })

      // Save the filtered sessions back to localStorage
      if (validSessions.length !== initialCount) {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(validSessions))
        const removedCount = initialCount - validSessions.length
        console.log(`🧹 Cleanup completed: Removed ${removedCount} old session(s), ${validSessions.length} remaining`)
      } else {
        console.log('🧹 Cleanup completed: No old sessions found')
      }
    } catch (error) {
      console.error('❌ Error during session cleanup:', error)
    }
  }

  // Get session statistics
  static getSessionStats() {
    const sessions = this.getAllSessions()
    return {
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.status === 'active').length,
      totalMessages: sessions.reduce((total, session) => total + session.messages.length, 0),
      latestSession: sessions.length > 0 ? sessions[sessions.length - 1] : null
    }
  }

  // Format session duration
  static getSessionDuration(session: ConversationSession): string {
    const start = session.startTime
    const end = session.endTime || new Date()
    const durationMs = end.getTime() - start.getTime()
    
    const minutes = Math.floor(durationMs / 60000)
    const seconds = Math.floor((durationMs % 60000) / 1000)
    
    return `${minutes}m ${seconds}s`
  }

  // Generate filename based on session timestamp
  static generateFilename(session: ConversationSession): string {
    const timestamp = session.startTime.toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .split('.')[0] // Remove milliseconds
    
    return `conversation_${timestamp}.json`
  }

  // Export session as JSON (browser download)
  static exportSessionAsJSON(sessionId: string): void {
    try {
      const session = this.getSession(sessionId)
      if (!session) {
        console.error('Session not found for export:', sessionId)
        return
      }

      // Prepare export data with metadata
      const exportData = {
        exportInfo: {
          exportedAt: new Date().toISOString(),
          exporter: 'IndiaMart Chat Logger',
          version: '1.0'
        },
        session: {
          ...session,
          duration: this.getSessionDuration(session),
          messageCount: session.messages.length,
          messageTypes: {
            human: session.messages.filter(m => m.type === 'human').length,
            bot: session.messages.filter(m => m.type === 'bot').length,
            status: session.messages.filter(m => m.type === 'status').length,
            tool: session.messages.filter(m => m.type === 'tool').length,
            product_links: session.messages.filter(m => m.type === 'product_links').length
          }
        }
      }

      // Create and download file
      const jsonString = JSON.stringify(exportData, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = this.generateFilename(session)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      console.log('📁 Session exported:', this.generateFilename(session))
    } catch (error) {
      console.error('Error exporting session:', error)
    }
  }

  // Export all sessions as a single JSON file
  static exportAllSessionsAsJSON(): void {
    try {
      const sessions = this.getAllSessions()
      if (sessions.length === 0) {
        console.log('No sessions to export')
        return
      }

      const exportData = {
        exportInfo: {
          exportedAt: new Date().toISOString(),
          exporter: 'IndiaMart Chat Logger',
          version: '1.0',
          totalSessions: sessions.length
        },
        sessions: sessions.map(session => ({
          ...session,
          duration: this.getSessionDuration(session),
          messageCount: session.messages.length,
          messageTypes: {
            human: session.messages.filter(m => m.type === 'human').length,
            bot: session.messages.filter(m => m.type === 'bot').length,
            status: session.messages.filter(m => m.type === 'status').length,
            tool: session.messages.filter(m => m.type === 'tool').length,
            product_links: session.messages.filter(m => m.type === 'product_links').length
          }
        }))
      }

      const timestamp = new Date().toISOString()
        .replace(/[:.]/g, '-')
        .replace('T', '_')
        .split('.')[0]
      
      const filename = `all_conversations_${timestamp}.json`
      
      const jsonString = JSON.stringify(exportData, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      console.log('📁 All sessions exported:', filename)
    } catch (error) {
      console.error('Error exporting all sessions:', error)
    }
  }

  // Auto-export session when it ends
  static async autoExportSession(sessionId: string): Promise<void> {
    try {
      const session = this.getSession(sessionId)
      if (!session) return

      // Only auto-export if session has messages
      if (session.messages.length > 0) {
        console.log('🔄 Auto-uploading session:', sessionId)
        
        // Upload to backend only (no file download)
        await this.uploadSessionToBackend(sessionId)
      }
    } catch (error) {
      console.error('Error auto-exporting session:', error)
    }
  }

  // Upload session to backend API
  static async uploadSessionToBackend(sessionId: string): Promise<void> {
    try {
      const session = this.getSession(sessionId)
      if (!session) {
        console.error('Session not found for backend upload:', sessionId)
        return
      }

      // Prepare export data with metadata (same as JSON export)
      const exportData = {
        exportInfo: {
          exportedAt: new Date().toISOString(),
          exporter: 'IndiaMart Chat Logger',
          version: '1.0'
        },
        session: {
          ...session,
          duration: this.getSessionDuration(session),
          messageCount: session.messages.length,
          messageTypes: {
            human: session.messages.filter(m => m.type === 'human').length,
            bot: session.messages.filter(m => m.type === 'bot').length,
            status: session.messages.filter(m => m.type === 'status').length,
            tool: session.messages.filter(m => m.type === 'tool').length,
            product_links: session.messages.filter(m => m.type === 'product_links').length
          }
        }
      }

      const filename = this.generateFilename(session)
      
      console.log('📤 Uploading session to backend:', filename)
      await apiService.uploadJson(filename, exportData)
      console.log('✅ Session uploaded to backend successfully:', filename)
      
    } catch (error) {
      console.error('❌ Error uploading session to backend:', error)
      // Don't throw error - we don't want to break the session ending process
      // Just log the error and continue
    }
  }
}