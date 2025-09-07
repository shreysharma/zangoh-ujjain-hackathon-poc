"use client";

import React, { useState, useEffect } from 'react';
import { debugLogger } from '../services/debugLogger';

export const DebugPanel: React.FC = () => {
  const [logs, setLogs] = useState<Array<{ timestamp: string; type: string; message: string }>>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Subscribe to log updates
    const unsubscribe = debugLogger.subscribe((newLogs) => {
      setLogs([...newLogs]);
    });

    // Get initial logs
    setLogs(debugLogger.getLogs());

    return unsubscribe;
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white px-3 py-1 rounded-lg text-xs hover:bg-gray-700 transition-colors"
      >
        Show Debug
      </button>
    );
  }

  return (
    <div
      className={`fixed ${
        isMinimized ? 'bottom-4 right-4 w-64' : 'bottom-4 right-4 w-96'
      } z-50 transition-all duration-300`}
    >
      <div className="bg-gray-900 rounded-lg shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-gray-800 rounded-t-lg">
          <span className="text-xs font-mono text-green-400">Debug Logger</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => debugLogger.clearLogs()}
              className="text-gray-400 hover:text-white text-xs px-2 py-1 hover:bg-gray-700 rounded"
            >
              Clear
            </button>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-gray-400 hover:text-white text-xs px-2 py-1 hover:bg-gray-700 rounded"
            >
              {isMinimized ? '▲' : '▼'}
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-white text-xs px-2 py-1 hover:bg-gray-700 rounded"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Logs */}
        {!isMinimized && (
          <div className="max-h-64 overflow-y-auto p-2 space-y-1 font-mono text-xs">
            {logs.length === 0 ? (
              <div className="text-gray-500 text-center py-4">No debug logs yet...</div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`flex gap-2 p-1 rounded ${
                    log.type === 'error'
                      ? 'bg-red-900/20 text-red-300'
                      : log.type === 'warn'
                      ? 'bg-yellow-900/20 text-yellow-300'
                      : log.type === 'success'
                      ? 'bg-green-900/20 text-green-300'
                      : 'bg-gray-800/50 text-gray-300'
                  }`}
                >
                  <span className="text-gray-500 flex-shrink-0">{log.timestamp}</span>
                  <span className="break-all whitespace-pre-wrap">{log.message}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Status bar */}
        {!isMinimized && (
          <div className="px-3 py-1 bg-gray-800 rounded-b-lg border-t border-gray-700">
            <span className="text-xs text-gray-400">
              {logs.length} logs • Last: {logs[0]?.timestamp || 'N/A'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};