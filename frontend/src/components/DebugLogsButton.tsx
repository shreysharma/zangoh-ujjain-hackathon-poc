'use client'

import React from 'react'

const DebugLogsButton = () => {
  return (
    <button 
      className="fixed top-4 right-4 bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-medium z-50 flex items-center gap-2"
      onClick={() => window.open('/logs', '_blank')}
    >
      <span>🔍</span>
      <span>Debug Logs</span>
    </button>
  )
}

export default DebugLogsButton