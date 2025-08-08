import React from 'react'
import { Warning, ArrowClockwise } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development'

  const handleRefresh = () => {
    // Try resetting the error boundary first
    resetErrorBoundary()
    
    // If that doesn't work, refresh the page as fallback
    setTimeout(() => {
      window.location.reload()
    }, 100)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Warning className="w-16 h-16 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Oops! Something went wrong</CardTitle>
          <p className="text-muted-foreground">
            The application encountered an unexpected error. Don't worry - your data is safe.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <Warning className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Error Details:</p>
                <p className="text-sm">{error.message}</p>
                {isDevelopment && error.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium">
                      Technical Details (Development)
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h3 className="font-medium">What you can do:</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Try refreshing the page</li>
              <li>Check if you're using a supported browser</li>
              <li>Clear your browser cache and cookies</li>
              <li>If the problem persists, try using a different browser</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button onClick={handleRefresh} className="flex-1">
              <ArrowClockwise className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'}
              className="flex-1"
            >
              Return Home
            </Button>
          </div>

          {isDevelopment && (
            <Alert>
              <AlertDescription className="text-xs">
                <strong>Development Mode:</strong> This error boundary is showing detailed 
                information because you're in development mode. In production, users will 
                see a simplified error message.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}