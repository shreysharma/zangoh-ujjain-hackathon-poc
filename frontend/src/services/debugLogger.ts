// Global debug logger service
class DebugLogger {
  private logs: Array<{ timestamp: string; type: string; message: string }> = [];
  private listeners: Array<(logs: typeof this.logs) => void> = [];
  private maxLogs = 500;

  constructor() {
    // Override console methods to capture logs
    this.interceptConsoleLogs();
  }

  private interceptConsoleLogs() {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      originalLog(...args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      // Only capture relevant logs
      if (this.isRelevantLog(message)) {
        this.addLog('info', message);
      }
    };

    console.error = (...args) => {
      originalError(...args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      this.addLog('error', message);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      if (this.isRelevantLog(message)) {
        this.addLog('warn', message);
      }
    };
  }

  private isRelevantLog(message: string): boolean {
    // Simple event headers only
    const criticalPatterns = [
      '📨 Text sent',
      '📡 Text event:',
      '🔊 Audio event:',
      '✅ Turn complete',
      '🛑 Interrupted',
      '🔌 Connected',
      '🔌 SSE connection',
      '❌ Failed',
      '⚠️ No response after',
      '🔄 Restarting',
      '🔍 SSE Monitor'
    ];
    
    return criticalPatterns.some(pattern => message.includes(pattern));
  }

  addLog(type: 'info' | 'error' | 'warn' | 'success', message: string) {
    const timestamp = new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3 
    });

    this.logs.unshift({ timestamp, type, message });
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Notify listeners
    this.notifyListeners();
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
    this.notifyListeners();
  }

  subscribe(listener: (logs: typeof this.logs) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.logs));
  }

  // Manual logging methods for explicit debug messages
  logConnection(message: string) {
    this.addLog('info', `🔌 ${message}`);
  }

  logSSE(message: string) {
    this.addLog('info', `📡 ${message}`);
  }

  logError(message: string) {
    this.addLog('error', `❌ ${message}`);
  }

  logSuccess(message: string) {
    this.addLog('success', `✅ ${message}`);
  }

  logWarning(message: string) {
    this.addLog('warn', `⚠️ ${message}`);
  }
}

// Export singleton instance
export const debugLogger = new DebugLogger();