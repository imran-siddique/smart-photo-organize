import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RotateCcw } from '@phosphor-icons/react'

interface Props {
  children: ReactNode
  fallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props
      
      if (Fallback && this.state.error) {
        return <Fallback error={this.state.error} resetErrorBoundary={this.resetErrorBoundary} />
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
              <CardTitle>Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">
                An unexpected error occurred. Please try refreshing the page.
              </p>
              <div className="flex justify-center space-x-3">
                <Button onClick={this.resetErrorBoundary} variant="default">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={() => window.location.reload()} variant="outline">
                  Refresh Page
                </Button>
              </div>
              {import.meta.env?.DEV && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-muted-foreground">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                    {this.state.error.message}
                    {this.state.error.stack && `\n\n${this.state.error.stack}`}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
      errorInfo,
      component: 'ErrorBoundary',
      props: this.props
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || ErrorFallback
      return (
        <FallbackComponent 
          error={this.state.error} 
          resetErrorBoundary={this.handleReset}
        />
      )
    }

    return this.props.children
  }
}