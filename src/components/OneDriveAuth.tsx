import React from 'react'
import { MicrosoftOutlookLogo, SignOut } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface OneDriveAuthProps {
  onAuthenticate: () => void
  onBack: () => void
  onLogout: () => void
  error?: string
  user?: {
    displayName?: string
  } | null
  isAuthenticated: boolean
}

export function OneDriveAuth({ 
  onAuthenticate, 
  onBack, 
  onLogout,
  error, 
  user, 
  isAuthenticated 
}: OneDriveAuthProps) {
  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          Welcome, {user.displayName}
        </div>
        <Button variant="outline" onClick={onLogout} size="sm">
          <SignOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <MicrosoftOutlookLogo className="w-16 h-16 mx-auto mb-4 text-blue-500" />
          <CardTitle className="text-2xl">Connect to OneDrive</CardTitle>
          <p className="text-muted-foreground">
            Sign in to access your OneDrive photos
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={onAuthenticate} className="w-full" size="lg" aria-label="Sign in with Microsoft account">
            <MicrosoftOutlookLogo className="w-4 h-4 mr-2" />
            Sign In with Microsoft
          </Button>
          <Button 
            variant="outline" 
            onClick={onBack}
            className="w-full"
          >
            Back to Provider Selection
          </Button>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}