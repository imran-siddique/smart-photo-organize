import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { CloudArrowDown, Folder } from '@phosphor-icons/react'

interface LoadingStateProps {
  message?: string
  provider?: 'local' | 'onedrive'
}

export function LoadingState({ 
  message = 'Loading...', 
  provider = 'local' 
}: LoadingStateProps) {
  const Icon = provider === 'onedrive' ? CloudArrowDown : Folder
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <Icon className="w-12 h-12 text-primary mx-auto animate-pulse" />
            <h3 className="text-lg font-medium">{message}</h3>
            <div className="flex items-center justify-center space-x-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}