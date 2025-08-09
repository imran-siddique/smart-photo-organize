// Infrastructure layer for monitoring and observability

import { PerformanceMetric, MemoryUsage, LogEntry } from '../../shared/types'
import { PERFORMANCE_THRESHOLDS, LOG_LEVELS } from '../../shared/constants'

/**
 * Performance monitoring service for tracking application metrics
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetric[] = []
  private observers: PerformanceObserver[] = []

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  private constructor() {
    this.initializeObservers()
  }

  private initializeObservers(): void {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Navigation timing
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          this.recordMetric('navigation', entry.duration, 'ms', {
            type: entry.entryType,
            name: entry.name
          })
        })
      })

      try {
        navObserver.observe({ entryTypes: ['navigation', 'measure', 'mark'] })
        this.observers.push(navObserver)
      } catch (error) {
        console.warn('Performance observer not supported for navigation:', error)
      }

      // Resource timing  
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (entry.name.includes('image') || entry.name.includes('photo')) {
            this.recordMetric('resource-load', entry.duration, 'ms', {
              type: entry.entryType,
              name: entry.name,
              size: (entry as any).transferSize
            })
          }
        })
      })

      try {
        resourceObserver.observe({ entryTypes: ['resource'] })
        this.observers.push(resourceObserver)
      } catch (error) {
        console.warn('Performance observer not supported for resources:', error)
      }
    }
  }

  recordMetric(name: string, value: number, unit: string, context?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      context
    }

    this.metrics.push(metric)

    // Keep only recent metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500)
    }

    // Check for performance issues
    this.checkPerformanceThresholds(metric)
  }

  mark(name: string): void {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(name)
    }
  }

  measure(name: string, startMark?: string, endMark?: string): void {
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        performance.measure(name, startMark, endMark)
        
        const entries = performance.getEntriesByName(name, 'measure')
        if (entries.length > 0) {
          const duration = entries[entries.length - 1].duration
          this.recordMetric(name, duration, 'ms')
        }
      } catch (error) {
        console.warn('Performance measure failed:', error)
      }
    }
  }

  private checkPerformanceThresholds(metric: PerformanceMetric): void {
    const thresholds = PERFORMANCE_THRESHOLDS

    switch (metric.name) {
      case 'initial-load':
        if (metric.value > thresholds.INITIAL_LOAD) {
          this.logPerformanceWarning('Slow initial load', metric)
        }
        break
      case 'photo-grid-render':
        if (metric.value > thresholds.PHOTO_GRID_RENDER) {
          this.logPerformanceWarning('Slow photo grid rendering', metric)
        }
        break
      case 'thumbnail-load':
        if (metric.value > thresholds.THUMBNAIL_LOAD) {
          this.logPerformanceWarning('Slow thumbnail loading', metric)
        }
        break
    }
  }

  private logPerformanceWarning(message: string, metric: PerformanceMetric): void {
    Logger.getInstance().warn(`Performance warning: ${message}`, {
      metric: metric.name,
      value: metric.value,
      unit: metric.unit,
      context: metric.context
    })
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name)
  }

  clearMetrics(): void {
    this.metrics = []
  }

  dispose(): void {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
    this.clearMetrics()
  }
}

/**
 * Memory monitoring service
 */
export class MemoryMonitor {
  private static instance: MemoryMonitor
  private usageHistory: MemoryUsage[] = []

  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor()
    }
    return MemoryMonitor.instance
  }

  private constructor() {
    this.startMonitoring()
  }

  private startMonitoring(): void {
    // Monitor memory usage every 30 seconds
    setInterval(() => {
      this.recordMemoryUsage()
    }, 30000)
  }

  recordMemoryUsage(context?: string): void {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory
      const usage: MemoryUsage = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
        timestamp: new Date()
      }

      this.usageHistory.push(usage)

      // Keep only recent history
      if (this.usageHistory.length > 100) {
        this.usageHistory = this.usageHistory.slice(-50)
      }

      // Check for memory issues
      if (usage.percentage > 80) {
        Logger.getInstance().warn('High memory usage detected', {
          percentage: usage.percentage.toFixed(1),
          usedMB: (usage.used / (1024 * 1024)).toFixed(1),
          context
        })
      }

      PerformanceMonitor.getInstance().recordMetric(
        'memory-usage',
        usage.percentage,
        '%',
        { context }
      )
    }
  }

  getCurrentUsage(): MemoryUsage | null {
    if (this.usageHistory.length === 0) {
      this.recordMemoryUsage('current-check')
    }
    return this.usageHistory[this.usageHistory.length - 1] || null
  }

  getUsageHistory(): MemoryUsage[] {
    return [...this.usageHistory]
  }

  formatMemorySize(bytes: number): string {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  logMemoryUsage(context: string): void {
    this.recordMemoryUsage(context)
    const usage = this.getCurrentUsage()
    if (usage) {
      Logger.getInstance().debug(`Memory usage - ${context}`, {
        used: this.formatMemorySize(usage.used),
        percentage: `${usage.percentage.toFixed(1)}%`
      })
    }
  }
}

/**
 * Centralized logging service
 */
export class Logger {
  private static instance: Logger
  private logs: LogEntry[] = []
  private logLevel: number = LOG_LEVELS.INFO

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  private constructor() {
    // Set log level based on environment
    const isDevelopment = import.meta.env?.DEV || window.location.hostname === 'localhost'
    this.logLevel = isDevelopment ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO
  }

  setLogLevel(level: keyof typeof LOG_LEVELS): void {
    this.logLevel = LOG_LEVELS[level]
  }

  private log(level: LogEntry['level'], message: string, context?: Record<string, any>, error?: Error): void {
    const levelValue = LOG_LEVELS[level.toUpperCase() as keyof typeof LOG_LEVELS]
    
    if (levelValue > this.logLevel) {
      return
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      error,
      source: this.getCallerInfo()
    }

    this.logs.push(entry)

    // Keep only recent logs
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-500)
    }

    // Console output
    this.outputToConsole(entry)

    // Send critical errors to external service (in production)
    if (level === 'error' && !import.meta.env?.DEV) {
      this.sendErrorToExternalService(entry)
    }
  }

  private getCallerInfo(): string {
    const stack = new Error().stack
    if (stack) {
      const lines = stack.split('\n')
      // Find the first line that's not from this logger
      for (let i = 3; i < lines.length; i++) {
        const line = lines[i]
        if (!line.includes('Logger.') && !line.includes('log.')) {
          const match = line.match(/at\s+(.+?)\s+\((.+):(\d+):(\d+)\)/)
          if (match) {
            return `${match[1]} (${match[2].split('/').pop()}:${match[3]})`
          }
        }
      }
    }
    return 'unknown'
  }

  private outputToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString()
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.source}]`
    
    const args = [
      `${prefix} ${entry.message}`,
      ...(entry.context ? [entry.context] : []),
      ...(entry.error ? [entry.error] : [])
    ]

    switch (entry.level) {
      case 'error':
        console.error(...args)
        break
      case 'warn':
        console.warn(...args)
        break
      case 'info':
        console.info(...args)
        break
      case 'debug':
        console.debug(...args)
        break
    }
  }

  private async sendErrorToExternalService(entry: LogEntry): Promise<void> {
    // In a real application, you would send this to your error tracking service
    // (e.g., Sentry, LogRocket, Bugsnag, etc.)
    try {
      // Placeholder for external error reporting
      console.log('Would send error to external service:', entry)
    } catch (error) {
      console.error('Failed to send error to external service:', error)
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context)
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context)
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context)
  }

  error(message: string, context?: Record<string, any>, error?: Error): void {
    this.log('error', message, context, error)
  }

  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  getLogsByLevel(level: LogEntry['level']): LogEntry[] {
    return this.logs.filter(log => log.level === level)
  }

  clearLogs(): void {
    this.logs = []
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }
}

/**
 * Production readiness checks
 */
export class ProductionChecks {
  static checkEnvironment(): void {
    const logger = Logger.getInstance()
    const performanceMonitor = PerformanceMonitor.getInstance()

    // Check if we're running in production
    const isProduction = import.meta.env.PROD
    const hasHTTPS = window.location.protocol === 'https:'
    
    if (isProduction && !hasHTTPS) {
      logger.warn('Running in production without HTTPS')
    }

    // Check for required environment variables
    const requiredEnvVars = ['VITE_ONEDRIVE_CLIENT_ID']
    for (const envVar of requiredEnvVars) {
      if (!import.meta.env[envVar]) {
        logger.warn(`Missing environment variable: ${envVar}`)
      }
    }

    // Check browser compatibility
    const requiredFeatures = [
      'FileReader',
      'localStorage',
      'fetch',
      'Promise',
      'URL'
    ]

    for (const feature of requiredFeatures) {
      if (!(feature in window)) {
        logger.error(`Missing required browser feature: ${feature}`)
      }
    }

    logger.info('Environment check completed', {
      isProduction,
      hasHTTPS,
      userAgent: navigator.userAgent
    })

    performanceMonitor.mark('environment-check-complete')
  }

  static checkPerformance(): void {
    const logger = Logger.getInstance()
    const memoryMonitor = MemoryMonitor.getInstance()
    
    // Check initial memory usage
    memoryMonitor.recordMemoryUsage('initial-check')
    
    // Check connection quality
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        logger.warn('Slow connection detected', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink
        })
      }
    }

    // Check for service workers
    if ('serviceWorker' in navigator) {
      logger.info('Service Worker support available')
    } else {
      logger.warn('Service Worker not supported')
    }

    logger.info('Performance check completed')
  }
}

// Create singleton instances
export const performanceMonitor = PerformanceMonitor.getInstance()
export const memoryMonitor = MemoryMonitor.getInstance()
export const logger = Logger.getInstance()
export const productionChecks = ProductionChecks