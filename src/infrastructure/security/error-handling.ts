// Error handling infrastructure

import { logger } from '../monitoring'
import { ERROR_CODES } from '../../shared/constants'

/**
 * Custom error class with additional context
 */
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public context?: Record<string, any>,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'AppError'
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError)
    }
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      stack: this.stack
    }
  }
}

/**
 * Error factory for creating consistent errors
 */
export class ErrorFactory {
  static fileNotFound(path: string, originalError?: Error): AppError {
    return new AppError(
      ERROR_CODES.FILE_NOT_FOUND,
      `File not found: ${path}`,
      { path },
      originalError
    )
  }

  static fileAccessDenied(path: string, originalError?: Error): AppError {
    return new AppError(
      ERROR_CODES.FILE_ACCESS_DENIED,
      `Access denied: ${path}`,
      { path },
      originalError
    )
  }

  static fileTooLarge(filename: string, size: number, maxSize: number): AppError {
    return new AppError(
      ERROR_CODES.FILE_TOO_LARGE,
      `File too large: ${filename} (${size} bytes, max: ${maxSize} bytes)`,
      { filename, size, maxSize }
    )
  }

  static invalidFileType(filename: string, type: string): AppError {
    return new AppError(
      ERROR_CODES.INVALID_FILE_TYPE,
      `Invalid file type: ${filename} (${type})`,
      { filename, type }
    )
  }

  static authenticationFailed(provider: string, originalError?: Error): AppError {
    return new AppError(
      ERROR_CODES.AUTH_FAILED,
      `Authentication failed for ${provider}`,
      { provider },
      originalError
    )
  }

  static authenticationExpired(provider: string): AppError {
    return new AppError(
      ERROR_CODES.AUTH_EXPIRED,
      `Authentication expired for ${provider}`,
      { provider }
    )
  }

  static processingFailed(operation: string, originalError?: Error): AppError {
    return new AppError(
      ERROR_CODES.PROCESSING_FAILED,
      `Processing failed: ${operation}`,
      { operation },
      originalError
    )
  }

  static networkError(url: string, originalError?: Error): AppError {
    return new AppError(
      ERROR_CODES.NETWORK_ERROR,
      `Network error: ${url}`,
      { url },
      originalError
    )
  }

  static validationFailed(field: string, value: any, rule: string): AppError {
    return new AppError(
      ERROR_CODES.VALIDATION_FAILED,
      `Validation failed for ${field}: ${rule}`,
      { field, value, rule }
    )
  }

  static fromError(error: Error, code?: string, context?: Record<string, any>): AppError {
    if (error instanceof AppError) {
      return error
    }

    return new AppError(
      code || ERROR_CODES.PROCESSING_FAILED,
      error.message,
      context,
      error
    )
  }
}

/**
 * Global error handler
 */
export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler
  private errorHandlers: Map<string, ErrorHandler> = new Map()

  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler()
    }
    return GlobalErrorHandler.instance
  }

  private constructor() {
    this.setupGlobalHandlers()
    this.registerDefaultHandlers()
  }

  private setupGlobalHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason
      logger.error('Unhandled promise rejection', { 
        reason: error?.message || error,
        stack: error?.stack 
      }, error)
      
      // Prevent the default behavior (logging to console)
      event.preventDefault()
      
      this.handleError(ErrorFactory.fromError(
        error instanceof Error ? error : new Error(String(error)),
        ERROR_CODES.PROCESSING_FAILED,
        { type: 'unhandled-promise-rejection' }
      ))
    })

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      const error = event.error || new Error(event.message)
      logger.error('Uncaught error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }, error)

      this.handleError(ErrorFactory.fromError(
        error,
        ERROR_CODES.PROCESSING_FAILED,
        { 
          type: 'uncaught-error',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      ))
    })
  }

  private registerDefaultHandlers(): void {
    // File system errors
    this.registerHandler(ERROR_CODES.FILE_NOT_FOUND, (error) => {
      logger.warn(`File not found: ${error.message}`, error.context)
      return {
        message: 'The requested file could not be found.',
        severity: 'warning',
        recoverable: true
      }
    })

    this.registerHandler(ERROR_CODES.FILE_ACCESS_DENIED, (error) => {
      logger.warn(`File access denied: ${error.message}`, error.context)
      return {
        message: 'Permission denied. Please check file permissions and try again.',
        severity: 'warning',
        recoverable: true
      }
    })

    // Authentication errors
    this.registerHandler(ERROR_CODES.AUTH_FAILED, (error) => {
      logger.error(`Authentication failed: ${error.message}`, error.context, error.originalError)
      return {
        message: 'Authentication failed. Please sign in again.',
        severity: 'error',
        recoverable: true,
        action: 'redirect-to-auth'
      }
    })

    this.registerHandler(ERROR_CODES.AUTH_EXPIRED, (error) => {
      logger.warn(`Authentication expired: ${error.message}`, error.context)
      return {
        message: 'Your session has expired. Please sign in again.',
        severity: 'warning',
        recoverable: true,
        action: 'redirect-to-auth'
      }
    })

    // Network errors
    this.registerHandler(ERROR_CODES.NETWORK_ERROR, (error) => {
      logger.warn(`Network error: ${error.message}`, error.context, error.originalError)
      return {
        message: 'Network connection issue. Please check your internet connection and try again.',
        severity: 'warning',
        recoverable: true,
        action: 'retry'
      }
    })

    // Rate limiting
    this.registerHandler(ERROR_CODES.RATE_LIMIT_EXCEEDED, (error) => {
      logger.warn(`Rate limit exceeded: ${error.message}`, error.context)
      return {
        message: 'Too many requests. Please wait a moment before trying again.',
        severity: 'warning',
        recoverable: true,
        action: 'wait-and-retry'
      }
    })

    // Default handler for unhandled error codes
    this.registerHandler('DEFAULT', (error) => {
      logger.error(`Unhandled error: ${error.message}`, error.context, error.originalError)
      return {
        message: 'An unexpected error occurred. Please try again.',
        severity: 'error',
        recoverable: true,
        action: 'retry'
      }
    })
  }

  registerHandler(errorCode: string, handler: ErrorHandler): void {
    this.errorHandlers.set(errorCode, handler)
  }

  handleError(error: AppError | Error): ErrorHandlerResult {
    const appError = error instanceof AppError ? error : ErrorFactory.fromError(error)
    
    // Log the error
    logger.error(`Error handled: ${appError.message}`, {
      code: appError.code,
      context: appError.context
    }, appError.originalError)

    // Find appropriate handler
    const handler = this.errorHandlers.get(appError.code) || this.errorHandlers.get('DEFAULT')!
    
    return handler(appError)
  }

  clearHandlers(): void {
    this.errorHandlers.clear()
    this.registerDefaultHandlers()
  }
}

/**
 * Error boundary for React components
 */
export interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: any
}

export interface ErrorBoundaryContext {
  reportError: (error: Error, errorInfo?: any) => void
  clearError: () => void
}

/**
 * Async error boundary for handling promise rejections in components
 */
export class AsyncErrorBoundary {
  private static instance: AsyncErrorBoundary
  private handlers: Set<(error: Error) => void> = new Set()

  static getInstance(): AsyncErrorBoundary {
    if (!AsyncErrorBoundary.instance) {
      AsyncErrorBoundary.instance = new AsyncErrorBoundary()
    }
    return AsyncErrorBoundary.instance
  }

  addHandler(handler: (error: Error) => void): void {
    this.handlers.add(handler)
  }

  removeHandler(handler: (error: Error) => void): void {
    this.handlers.delete(handler)
  }

  captureAsyncError(error: Error): void {
    // Notify all registered handlers
    this.handlers.forEach(handler => {
      try {
        handler(error)
      } catch (handlerError) {
        console.error('Error in async error handler:', handlerError)
      }
    })

    // Also handle through global error handler
    GlobalErrorHandler.getInstance().handleError(error)
  }

  wrapAsync<T extends (...args: any[]) => Promise<any>>(fn: T): T {
    return (async (...args: Parameters<T>) => {
      try {
        return await fn(...args)
      } catch (error) {
        this.captureAsyncError(error instanceof Error ? error : new Error(String(error)))
        throw error
      }
    }) as T
  }
}

/**
 * Error reporting utilities
 */
export class ErrorReporter {
  static reportToConsole(error: AppError): void {
    console.group(`🚨 ${error.code}: ${error.message}`)
    if (error.context) {
      console.log('Context:', error.context)
    }
    if (error.originalError) {
      console.log('Original Error:', error.originalError)
    }
    console.log('Stack:', error.stack)
    console.groupEnd()
  }

  static async reportToExternalService(error: AppError): Promise<void> {
    // In a real application, you would send this to your error tracking service
    try {
      const errorData = {
        code: error.code,
        message: error.message,
        context: error.context,
        stack: error.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }

      // Placeholder for external reporting
      console.log('Would report error to external service:', errorData)
      
      // Example implementation for Sentry, LogRocket, etc.
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorData)
      // })
    } catch (reportingError) {
      console.error('Failed to report error to external service:', reportingError)
    }
  }

  static createUserFriendlyMessage(error: AppError): string {
    const result = GlobalErrorHandler.getInstance().handleError(error)
    return result.message
  }
}

// Type definitions
export type ErrorHandler = (error: AppError) => ErrorHandlerResult

export interface ErrorHandlerResult {
  message: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  recoverable: boolean
  action?: 'retry' | 'redirect' | 'redirect-to-auth' | 'wait-and-retry' | 'refresh-page'
  retryDelay?: number
}

// Export singleton instances
export const globalErrorHandler = GlobalErrorHandler.getInstance()
export const asyncErrorBoundary = AsyncErrorBoundary.getInstance()