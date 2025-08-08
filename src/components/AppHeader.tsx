import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, FlaskConical } from '@phosphor-icons/react'

interface AppHeaderProps {
  currentProvider: 'local' | 'onedrive'
  oneDriveUser?: {
    displayName?: string
  } | null
  showTestingPanel: boolean
  showSmartAlbums: boolean
  onSwitchProvider: () => void
  onToggleTestingPanel: () => void
  onToggleSmartAlbums: () => void
  onLogout?: () => void
}

export function AppHeader({
  currentProvider,
  oneDriveUser,
  showTestingPanel,
  showSmartAlbums,
  onSwitchProvider,
  onToggleTestingPanel,
  onToggleSmartAlbums,
  onLogout
}: AppHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          {currentProvider === 'local' ? 'Local Photo Sorter' : 'OneDrive Photo Sorter'}
          {showSmartAlbums && (
            <Badge variant="secondary" className="text-sm">
              <Sparkles className="h-3 w-3 mr-1" />
              Smart Albums
            </Badge>
          )}
        </h1>
        <p className="text-muted-foreground">
          {showSmartAlbums 
            ? 'AI-powered photo organization with intelligent categorization'
            : currentProvider === 'local' 
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
          variant={showSmartAlbums ? "default" : "outline"}
          onClick={onToggleSmartAlbums} 
          size="sm"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {showSmartAlbums ? 'Exit' : 'Smart Albums'}
        </Button>
        <Button 
          variant="outline" 
          onClick={onToggleTestingPanel} 
          size="sm"
        >
          <FlaskConical className="h-4 w-4 mr-2" />
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