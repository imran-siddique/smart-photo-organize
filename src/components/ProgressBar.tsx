import React from 'react'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'

interface ProgressBarProps {
  progress: {
    operation: string
    current: number
    total: number
  } | null
}

export function ProgressBar({ progress }: ProgressBarProps) {
  if (!progress) {
    return null
  }

  return (
    <Card>
      <CardContent className="py-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{progress.operation}</span>
            <span className="text-sm text-muted-foreground">
              {progress.current} / {progress.total}
            </span>
          </div>
          <Progress 
            value={(progress.current / progress.total) * 100} 
            className="w-full" 
          />
        </div>
      </CardContent>
    </Card>
  )
}