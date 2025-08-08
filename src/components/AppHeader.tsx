import React from 'react'
import { Button } from '@/components/ui/button'

interface AppHeaderProps {
  currentProvider: 'local' | 'onedrive'
  oneDriveUser?: {
    displayName?: string
  } | null
  showTestingPanel: boolean
  onSwitchProvider: () => void
  onToggleTestingPanel: () => void
  onLogout?: () => void
}

export function AppHeader({
  currentProvider,
  oneDriveUser,
  showTestingPanel,
  onSwitchProvider,
  onToggleTestingPanel,
  onLogout
}: AppHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {currentProvider === 'local' ? 'Local Photo Sorter' : 'OneDrive Photo Sorter'}
        </h1>
        <p className="text-muted-foreground">
          {currentProvider === 'local' 
            ? 'Organize photos from your local computer'
            : 'Organize your OneDrive photos with parallel processing and batch operations'
          }
        </p>
      </div>
      <div className="flex items-center gap-4">
        {currentProvider === 'onedrive' && oneDriveUser && (
          <div className="text-sm text-muted-foreground">
            Welcome, {oneDriveUser.displayName}
          </div>
        )}
        <Button variant="outline" onClick={onSwitchProvider} size="sm">
          Switch Provider
        </Button>
        <Button 
          variant="outline" 
          onClick={onToggleTestingPanel} 
          size="sm"
        >
          {showTestingPanel ? 'Hide' : 'Show'} Testing
        </Button>
        {currentProvider === 'onedrive' && onLogout && (
          <Button variant="outline" onClick={onLogout} size="sm">
            Logout
          </Button>
        )}
      </div>
    </div>
  )
}