export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

interface LogEntry {
  timestamp: Date
  level: LogLevel
  message: string
  context?: any
  error?: Error
}

class Logger {
  private level: LogLevel
  private entries: LogEntry[] = []
  private maxEntries = 1000

  constructor() {
    this.level = (import.meta.env?.DEV === false) ? LogLevel.WARN : LogLevel.DEBUG
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.level
  }

  private addEntry(level: LogLevel, message: string, context?: any, error?: Error) {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      error
    }

    this.entries.push(entry)
    
    // Keep only the most recent entries
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries)
    }

    // In production, you would send critical errors to a monitoring service
    if (level === LogLevel.ERROR && import.meta.env?.DEV === false) {
      this.reportError(entry)
    }
  }

  private reportError(entry: LogEntry) {
    // In a real production app, integrate with services like:
    // - Sentry: Sentry.captureException(entry.error, { extra: entry.context })
    // - LogRocket: LogRocket.captureException(entry.error)
    // - Custom analytics endpoint
    
    console.error('Production Error:', {
      message: entry.message,
      timestamp: entry.timestamp.toISOString(),
      context: entry.context,
      stack: entry.error?.stack
    })
  }

  error(message: string, context?: any, error?: Error) {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(`[ERROR] ${message}`, context, error)
      this.addEntry(LogLevel.ERROR, message, context, error)
    }
  }

  warn(message: string, context?: any) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(`[WARN] ${message}`, context)
      this.addEntry(LogLevel.WARN, message, context)
    }
  }

  info(message: string, context?: any) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(`[INFO] ${message}`, context)
      this.addEntry(LogLevel.INFO, message, context)
    }
  }

  debug(message: string, context?: any) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(`[DEBUG] ${message}`, context)
      this.addEntry(LogLevel.DEBUG, message, context)
    }
  }

  // Performance logging
  time(label: string) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.time(label)
    }
  }

  timeEnd(label: string) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.timeEnd(label)
    }
  }

  // Get recent log entries for debugging
  getRecentLogs(level?: LogLevel, limit = 50): LogEntry[] {
    let logs = this.entries
    
    if (level !== undefined) {
      logs = logs.filter(entry => entry.level === level)
    }
    
    return logs.slice(-limit)
  }

  // Clear logs
  clearLogs() {
    this.entries = []
  }

  // Download logs as JSON (for debugging)
  downloadLogs() {
    const blob = new Blob([JSON.stringify(this.entries, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `photo-sorter-logs-${new Date().toISOString()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

// Singleton logger instance
export const logger = new Logger()

// Export convenience functions
export const log = {
  error: (message: string, context?: any, error?: Error) => logger.error(message, context, error),
  warn: (message: string, context?: any) => logger.warn(message, context),
  info: (message: string, context?: any) => logger.info(message, context),
  debug: (message: string, context?: any) => logger.debug(message, context),
  time: (label: string) => logger.time(label),
  timeEnd: (label: string) => logger.timeEnd(label)
}