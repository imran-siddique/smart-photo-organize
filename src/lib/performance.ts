// Service Worker registration for production performance
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator && import.meta.env?.DEV === false) {
    navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered successfully:', registration.scope)
      })
      .catch(error => {
        console.log('Service Worker registration failed:', error)
      })
  }
}

// Performance monitoring utilities
export const performanceMonitor = {
  // Mark performance timing points
  mark: (name: string) => {
    if (performance && performance.mark) {
      performance.mark(name)
    }
  },

  // Measure time between marks
  measure: (name: string, startMark?: string, endMark?: string) => {
    if (performance && performance.measure) {
      try {
        performance.measure(name, startMark, endMark)
        const entries = performance.getEntriesByName(name, 'measure')
        if (entries.length > 0) {
          const duration = entries[entries.length - 1].duration
          console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`)
          return duration
        }
      } catch (error) {
        console.warn('Performance measurement failed:', error)
      }
    }
    return 0
  },

  // Clear performance entries
  clearMarks: (name?: string) => {
    if (performance && performance.clearMarks) {
      performance.clearMarks(name)
    }
  }
}

// Memory usage monitoring
export const memoryMonitor = {
  getMemoryInfo: () => {
    if ('memory' in performance) {
      return {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      }
    }
    return null
  },

  logMemoryUsage: (context: string) => {
    const memInfo = memoryMonitor.getMemoryInfo()
    if (memInfo) {
      const usedMB = (memInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)
      const totalMB = (memInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)
      console.log(`Memory [${context}]: ${usedMB}MB / ${totalMB}MB used`)
    }
  }
}

// Production readiness checks
export const productionChecks = {
  checkEnvironment: () => {
    const checks = {
      isProduction: import.meta.env?.DEV === false,
      hasServiceWorker: 'serviceWorker' in navigator,
      hasWebGL: !!window.WebGLRenderingContext,
      hasFileSystemAccess: 'showDirectoryPicker' in window,
      hasWebWorkers: !!window.Worker,
      isSecureContext: window.isSecureContext,
      hasLocalStorage: !!window.localStorage,
      hasIndexedDB: !!window.indexedDB
    }

    console.log('Production Readiness Checks:', checks)
    return checks
  },

  checkPerformance: () => {
    const checks = {
      memoryInfo: memoryMonitor.getMemoryInfo(),
      connectionType: (navigator as any).connection?.effectiveType || 'unknown',
      deviceMemory: (navigator as any).deviceMemory || 'unknown',
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown'
    }

    console.log('Performance Checks:', checks)
    return checks
  }
}

// Error boundary production reporting
export const errorReporting = {
  reportError: (error: Error, context: any) => {
    if (import.meta.env?.DEV === false) {
      // In production, you would send to an error monitoring service
      console.error('Production Error Report:', {
        message: error.message,
        stack: error.stack,
        context,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        url: window.location.href
      })
      
      // Example: Send to monitoring service
      // fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ error, context })
      // })
    }
  }
}