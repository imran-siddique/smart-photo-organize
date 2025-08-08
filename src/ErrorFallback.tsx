import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Warning, ArrowClockwise } from '@phosphor-icons/react'

interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Warning className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <CardTitle className="text-xl">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription className="text-sm">
              {error.message || 'An unexpected error occurred'}
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              We apologize for the inconvenience. Please try refreshing the page.
            </p>
            
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground">
                Technical details
              </summary>
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                {error.stack || error.message}
              </pre>
            </details>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={resetErrorBoundary} className="flex-1">
              <ArrowClockwise className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="flex-1"
            >
              Reload Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}