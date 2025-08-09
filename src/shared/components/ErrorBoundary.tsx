// Error boundary component with enhanced error handling

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Warning, ArrowCounterClockwise, Bug } from '@phosphor-icons/react'

import { logger } from '@/infrastructure/monitoring'
import { globalErrorHandler, ErrorReporter, AppError, ErrorFactory } from '@/infrastructure/security/error-handling'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  errorId: string | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorBoundaryFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  showDetails?: boolean
}

interface ErrorBoundaryFallbackProps {
  error: Error
  errorInfo: React.ErrorInfo | null
  resetError: () => void
  errorId: string
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      hasError: true,
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const appError = error instanceof AppError 
      ? error 
      : ErrorFactory.fromError(error, 'COMPONENT_ERROR', {
          componentStack: errorInfo.componentStack,
          errorBoundary: 'ErrorBoundary'
        })

    logger.error('React Error Boundary caught an error', {
      errorId: this.state.errorId,
      componentStack: errorInfo.componentStack
    }, error)

    // Handle through global error handler
    const result = globalErrorHandler.handleError(appError)
    
    // Report to external service in production
    if (!import.meta.env?.DEV) {
      ErrorReporter.reportToExternalService(appError)
    }

    this.setState({
      errorInfo
    })

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // Auto-retry for recoverable errors after a delay
    if (result.recoverable && result.action === 'retry') {
      this.scheduleAutoRetry()
    }
  }

  private scheduleAutoRetry = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }

    this.resetTimeoutId = window.setTimeout(() => {
      logger.info('Auto-retrying after error boundary catch')
      this.resetError()
    }, 5000) // Retry after 5 seconds
  }

  resetError = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
      this.resetTimeoutId = null
    }

    logger.info('Resetting error boundary state')
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    })
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props
      
      if (Fallback && this.state.error && this.state.errorId) {
        return (
          <Fallback
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            resetError={this.resetError}
            errorId={this.state.errorId}
          />
        )
      }

      return (
        <DefaultErrorFallback
          error={this.state.error as Error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
          errorId={this.state.errorId as string}
          showDetails={this.props.showDetails}
        />
      )
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ 
  error, 
  resetError, 
  errorId,
  showDetails = false 
}: ErrorBoundaryFallbackProps & { showDetails?: boolean }) {
  const [showDetailsState, setShowDetailsState] = React.useState(showDetails)
  
  const userFriendlyMessage = React.useMemo(() => {
    if (error instanceof AppError) {
      return ErrorReporter.createUserFriendlyMessage(error)
    }
    return 'An unexpected error occurred. Please try refreshing the page.'
  }, [error])

  const handleReportError = () => {
    const errorData = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    // Copy to clipboard for easy reporting
    navigator.clipboard?.writeText(JSON.stringify(errorData, null, 2)).then(() => {
      console.log('Error details copied to clipboard')
    })
  }

  const handleRefreshPage = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Warning className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Something went wrong</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-2">
              {userFriendlyMessage}
            </p>
            <p className="text-sm text-muted-foreground">
              Error ID: <code className="bg-muted px-1 py-0.5 rounded text-xs">{errorId}</code>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={resetError} variant="default">
              <ArrowCounterClockwise className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            
            <Button onClick={handleRefreshPage} variant="outline">
              Refresh Page
            </Button>
            
            {import.meta.env?.DEV && (
              <Button 
                onClick={() => setShowDetailsState(!showDetailsState)} 
                variant="outline"
                size="sm"
              >
                <Bug className="h-4 w-4 mr-2" />
                {showDetailsState ? 'Hide' : 'Show'} Details
              </Button>
            )}
          </div>

          {showDetailsState && (
            <div className="mt-6 space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Error Details</h3>
                <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-40 text-muted-foreground">
                  {error.message}
                </pre>
              </div>
              
              {error.stack && (
                <div>
                  <h3 className="font-semibold mb-2">Stack Trace</h3>
                  <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-60 text-muted-foreground">
                    {error.stack}
                  </pre>
                </div>
              )}

              {errorInfo?.componentStack && (
                <div>
                  <h3 className="font-semibold mb-2">Component Stack</h3>
                  <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-60 text-muted-foreground">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}

              <Button 
                onClick={handleReportError} 
                variant="outline" 
                size="sm"
                className="w-full"
              >
                Copy Error Details
              </Button>
            </div>
          )}

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              If this problem persists, please report it with the error ID above.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Hook for functional components to handle errors
export function useErrorBoundary() {
  return React.useCallback((error: Error) => {
    // This will trigger the error boundary
    throw error
  }, [])
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}