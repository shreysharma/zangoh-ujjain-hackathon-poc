'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Message } from '../../hooks/useConversation'
import { SessionManager, ConversationSession } from '../../utils/sessionManager'
import { apiCounterService, type ApiCounters } from '../../services/apiCounterService'

const CONVERSATION_STORAGE_KEY = 'indiamart-conversation'

export default function LogsPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<ConversationSession[]>([])
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [liveUpdates, setLiveUpdates] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<'sessions' | 'legacy' | 'counters'>('sessions')
  const [apiCounters, setApiCounters] = useState<ApiCounters>(apiCounterService.getCounters())

  // Load sessions from localStorage
  const loadSessions = () => {
    try {
      console.log('🔍 Logger: Loading conversation sessions')
      const allSessions = SessionManager.getAllSessions()
      setSessions(allSessions.reverse()) // Show newest first
      setLastUpdate(new Date())
      console.log('🔍 Logger: Successfully loaded sessions:', allSessions.length)
    } catch (error) {
      console.error('❌ Logger: Failed to load sessions:', error)
    }
  }

  // Legacy load messages function for backward compatibility
  const loadLegacyMessages = () => {
    try {
      console.log('🔍 Logger: Checking localStorage for key:', CONVERSATION_STORAGE_KEY)
      const savedMessages = localStorage.getItem(CONVERSATION_STORAGE_KEY)
      console.log('🔍 Logger: Raw localStorage data:', savedMessages)
      
      if (savedMessages) {
        const parsedMessages: Message[] = JSON.parse(savedMessages)
        console.log('🔍 Logger: Parsed messages:', parsedMessages.length, 'messages')
        // Convert to a temporary session for display
        const legacySession: ConversationSession = {
          sessionId: 'legacy-session',
          startTime: new Date(),
          status: 'ended',
          messages: parsedMessages.map(msg => ({
            ...msg,
            timestamp: typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : msg.timestamp
          }))
        }
        setSessions([legacySession])
        setLastUpdate(new Date())
        console.log('🔍 Logger: Successfully loaded legacy messages:', parsedMessages.length)
      } else {
        console.log('🔍 Logger: No messages found in localStorage')
        setSessions([])
      }
    } catch (error) {
      console.error('❌ Logger: Failed to load legacy messages:', error)
    }
  }

  // Auto-refresh sessions when live updates enabled
  useEffect(() => {
    if (viewMode === 'sessions') {
      loadSessions()
      if (liveUpdates) {
        const interval = setInterval(loadSessions, 1000) // Refresh every second
        return () => clearInterval(interval)
      }
    } else if (viewMode === 'legacy') {
      loadLegacyMessages()
      if (liveUpdates) {
        const interval = setInterval(loadLegacyMessages, 1000)
        return () => clearInterval(interval)
      }
    }
    
    // Always update counters if live updates are enabled
    if (liveUpdates) {
      const updateCounters = () => setApiCounters(apiCounterService.getCounters())
      updateCounters() // Initial update
      const counterInterval = setInterval(updateCounters, 1000)
      return () => clearInterval(counterInterval)
    }
  }, [liveUpdates, viewMode])

  // Subscribe to real-time counter updates
  useEffect(() => {
    const unsubscribe = apiCounterService.subscribe((counters) => {
      setApiCounters(counters)
    })
    
    return unsubscribe
  }, [])

  // Clear all logs
  const clearLogs = () => {
    if (viewMode === 'sessions') {
      SessionManager.clearAllSessions()
      setSessions([])
    } else if (viewMode === 'legacy') {
      localStorage.removeItem(CONVERSATION_STORAGE_KEY)
      setSessions([])
    } else if (viewMode === 'counters') {
      apiCounterService.resetCounters()
      setApiCounters(apiCounterService.getCounters())
    }
    setLastUpdate(new Date())
  }

  // Export API counters
  const exportCounters = () => {
    const jsonString = apiCounterService.exportCounters()
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `api-counters-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Format timestamp - handles both Date objects and string timestamps
  const formatTime = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date
      if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
        return 'Invalid Date'
      }
      return dateObj.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3
      })
    } catch (error) {
      console.error('Error formatting time:', error, date)
      return 'Error'
    }
  }

  // Get message type color
  const getMessageColor = (type: string) => {
    switch (type) {
      case 'bot': return 'text-blue-600'
      case 'human': return 'text-green-600'
      case 'status': return 'text-yellow-600'
      case 'tool': return 'text-purple-600'
      case 'product_links': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-100"
                title="Go back"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.8333 10H4.16666M4.16666 10L10 15.8333M4.16666 10L10 4.16666" stroke="#374151" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <h1 className="text-3xl font-bold text-gray-800">Session-Based Chat Logger</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">View Mode:</span>
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value as 'sessions' | 'legacy' | 'counters')}
                  className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border-none outline-none"
                >
                  <option value="sessions">Sessions</option>
                  <option value="legacy">Legacy</option>
                  <option value="counters">API Counters</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Live Updates:</span>
                <button
                  onClick={() => setLiveUpdates(!liveUpdates)}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    liveUpdates 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {liveUpdates ? 'ON' : 'OFF'}
                </button>
              </div>
              {viewMode === 'counters' ? (
                <button
                  onClick={exportCounters}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Export Counters
                </button>
              ) : (
                <button
                  onClick={() => SessionManager.exportAllSessionsAsJSON()}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Export All JSON
                </button>
              )}
              <button
                onClick={clearLogs}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Clear All {viewMode === 'counters' ? 'Counters' : viewMode === 'sessions' ? 'Sessions' : 'Messages'}
              </button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{sessions.length}</div>
              <div className="text-sm text-blue-600">Total Sessions</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {sessions.filter(s => s.status === 'active').length}
              </div>
              <div className="text-sm text-green-600">Active Sessions</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {sessions.reduce((total, session) => total + session.messages.length, 0)}
              </div>
              <div className="text-sm text-purple-600">Total Messages</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {formatTime(lastUpdate)}
              </div>
              <div className="text-sm text-gray-600">Last Update</div>
            </div>
          </div>
        </div>

        {/* Live Debugger */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Live Debugger</h2>
          <div className="bg-gray-900 rounded-lg p-4 text-green-400 font-mono text-sm max-h-64 overflow-y-auto">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${liveUpdates ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span>Debug Console {liveUpdates ? '(Live)' : '(Paused)'}</span>
            </div>
            <div>📊 Total Sessions: {sessions.length}</div>
            <div>📝 Total Messages: {sessions.reduce((total, s) => total + s.messages.length, 0)}</div>
            <div>🟢 Active Sessions: {sessions.filter(s => s.status === 'active').length}</div>
            <div>🔄 Auto-refresh: {liveUpdates ? 'Enabled' : 'Disabled'}</div>
            <div>💾 View Mode: {viewMode}</div>
            <div>⏰ Last Update: {lastUpdate.toISOString()}</div>
            {sessions.length > 0 && (
              <div>🕐 Latest Session: {formatTime(sessions[0].startTime)}</div>
            )}
          </div>
        </div>

        {/* API Counters View */}
        {viewMode === 'counters' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">API Usage Counters</h2>
              <div className="flex gap-2">
                <button
                  onClick={exportCounters}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium"
                >
                  📊 Export Counters
                </button>
                <button
                  onClick={() => apiCounterService.resetCounters()}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-medium"
                >
                  🗑️ Reset Counters
                </button>
              </div>
            </div>
            
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{apiCounters.streamConnections}</div>
                <div className="text-sm text-blue-600">Stream Connected</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">{apiCounters.streamDisconnections}</div>
                <div className="text-sm text-red-600">Stream Disconnected</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{apiCounters.sendAudioCalls}</div>
                <div className="text-sm text-green-600">Send Audio Calls</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">{apiCounters.sendTextCalls}</div>
                <div className="text-sm text-purple-600">Send Text Calls</div>
              </div>
            </div>

            {/* Detailed Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Connection Statistics */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3">🔌 Connection Stats</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Connections:</span>
                    <span className="font-mono">{apiCounters.streamConnections}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Disconnections:</span>
                    <span className="font-mono">{apiCounters.streamDisconnections}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reconnections:</span>
                    <span className="font-mono">{apiCounters.streamReconnections}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Connection Errors:</span>
                    <span className="font-mono text-red-600">{apiCounters.connectionErrors}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stream Errors:</span>
                    <span className="font-mono text-red-600">{apiCounters.streamErrors}</span>
                  </div>
                </div>
              </div>

              {/* API Calls */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3">📡 API Calls</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Connect API:</span>
                    <span className="font-mono">{apiCounters.connectApiCalls}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Disconnect API:</span>
                    <span className="font-mono">{apiCounters.disconnectApiCalls}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Send Audio:</span>
                    <span className="font-mono">{apiCounters.sendAudioCalls}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Send Text:</span>
                    <span className="font-mono">{apiCounters.sendTextCalls}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Send Image:</span>
                    <span className="font-mono">{apiCounters.sendImageCalls}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>JSON Uploads:</span>
                    <span className="font-mono">{apiCounters.uploadJsonCalls}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Health Checks:</span>
                    <span className="font-mono">{apiCounters.healthCheckCalls}</span>
                  </div>
                </div>
              </div>

              {/* Data Transfer */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3">📊 Data Transfer</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Audio Data:</span>
                    <span className="font-mono">{(apiCounters.audioDataSent / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Text Messages:</span>
                    <span className="font-mono">{apiCounters.textMessagesSent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Images Sent:</span>
                    <span className="font-mono">{apiCounters.imagesSent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>JSON Exports:</span>
                    <span className="font-mono">{apiCounters.jsonUploads}</span>
                  </div>
                </div>
              </div>

              {/* Session Stats */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3">📝 Sessions</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span className="font-mono">{apiCounters.sessionsCreated}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ended:</span>
                    <span className="font-mono">{apiCounters.sessionsEnded}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Messages:</span>
                    <span className="font-mono">{apiCounters.totalMessages}</span>
                  </div>
                </div>
              </div>

              {/* Timing Stats */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3">⏱️ Timing</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Connection Time:</span>
                    <span className="font-mono">{Math.round(apiCounters.totalConnectionTime / 1000)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Duration:</span>
                    <span className="font-mono">{Math.round(apiCounters.averageConnectionDuration / 1000)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Longest Connection:</span>
                    <span className="font-mono">{Math.round(apiCounters.longestConnection / 1000)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shortest Connection:</span>
                    <span className="font-mono">{apiCounters.shortestConnection > 0 ? Math.round(apiCounters.shortestConnection / 1000) : 0}s</span>
                  </div>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3">📅 Activity</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">First Activity:</span>
                    <div className="font-mono text-xs">
                      {apiCounters.firstActivity ? apiCounters.firstActivity.toLocaleString() : 'Never'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Activity:</span>
                    <div className="font-mono text-xs">
                      {apiCounters.lastActivity ? apiCounters.lastActivity.toLocaleString() : 'Never'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Reset:</span>
                    <div className="font-mono text-xs">
                      {apiCounters.lastReset ? apiCounters.lastReset.toLocaleString() : 'Never'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Summary */}
            {(apiCounters.connectionErrors > 0 || apiCounters.apiErrors > 0 || apiCounters.audioErrors > 0 || apiCounters.streamErrors > 0) && (
              <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
                <h3 className="font-semibold text-red-800 mb-3">❌ Error Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">{apiCounters.connectionErrors}</div>
                    <div className="text-red-600">Connection Errors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">{apiCounters.apiErrors}</div>
                    <div className="text-red-600">API Errors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">{apiCounters.audioErrors}</div>
                    <div className="text-red-600">Audio Errors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">{apiCounters.streamErrors}</div>
                    <div className="text-red-600">Stream Errors</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sessions List */}
        {viewMode !== 'counters' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Conversation Sessions 
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({sessions.length} sessions)
              </span>
            </h2>
          
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No conversation sessions found.</p>
              <p className="text-sm mt-2">Connect to backend to start a new session.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session, index) => (
                <div 
                  key={session.sessionId}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Session Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`w-3 h-3 rounded-full ${
                        session.status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                      }`}></span>
                      <div>
                        <h3 className="font-medium text-gray-800">
                          Session #{sessions.length - index}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {session.sessionId}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => SessionManager.exportSessionAsJSON(session.sessionId)}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-medium"
                        title="Export this session as JSON"
                      >
                        📁 Export JSON
                      </button>
                      <button
                        onClick={() => SessionManager.uploadSessionToBackend(session.sessionId)}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-xs font-medium"
                        title="Upload this session to backend"
                      >
                        📤 Upload
                      </button>
                      <div className="text-right text-xs text-gray-500">
                        <div>Started: {formatTime(session.startTime)}</div>
                        {session.endTime && (
                          <div>Ended: {formatTime(session.endTime)}</div>
                        )}
                        <div>Duration: {SessionManager.getSessionDuration(session)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Session Stats */}
                  <div className="flex items-center gap-4 mb-3 text-xs">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {session.messages.length} messages
                    </span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                      {session.messages.filter(m => m.type === 'human').length} user
                    </span>
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      {session.messages.filter(m => m.type === 'bot').length} bot
                    </span>
                    {session.connectionInfo?.responseModality && (
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                        {session.connectionInfo.responseModality}
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded ${
                      session.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {session.status}
                    </span>
                  </div>

                  {/* Toggle Messages */}
                  <button
                    onClick={() => setSelectedSession(
                      selectedSession === session.sessionId ? null : session.sessionId
                    )}
                    className="text-sm text-blue-600 hover:text-blue-800 mb-3"
                  >
                    {selectedSession === session.sessionId ? 'Hide Messages' : 'Show Messages'} 
                    ({session.messages.length})
                  </button>

                  {/* Messages */}
                  {selectedSession === session.sessionId && (
                    <div className="border-t pt-3 space-y-2 max-h-64 overflow-y-auto">
                      {session.messages.map((message, msgIndex) => (
                        <div 
                          key={message.id || msgIndex}
                          className="border-l-4 border-gray-200 pl-3 py-1 text-sm"
                        >
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-xs text-gray-500 font-mono">
                              {formatTime(message.timestamp)}
                            </span>
                            <span className={`text-xs font-bold uppercase ${getMessageColor(message.type)}`}>
                              {message.type}
                            </span>
                            {message.isAudio && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                                AUDIO
                              </span>
                            )}
                          </div>
                          <div className="text-gray-800 break-words">
                            {message.content || '(empty content)'}
                            {message.originalText && (
                              <div className="text-xs text-blue-600 mt-1 p-2 bg-blue-50 rounded">
                                <strong>Original ({message.language}):</strong> {message.originalText}
                                <br />
                                <strong>Translated:</strong> {message.content}
                              </div>
                            )}
                          </div>
                          {message.file && (
                            <div className="text-xs text-gray-600 mt-1">
                              📎 {message.file.name}
                            </div>
                          )}
                          {message.productLinks && message.productLinks.length > 0 && (
                            <div className="text-xs text-gray-600 mt-1">
                              🔗 {message.productLinks.length} product links
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  )
}