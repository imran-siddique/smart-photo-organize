import React from 'react'
import { ArrowsLeftRight, Crown, Trash } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { UnifiedPhoto } from '@/hooks/usePhotoStorage'

interface PhotoComparisonProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  compareItems: UnifiedPhoto[]
  onKeepPhoto: (groupPhotos: UnifiedPhoto[], keepPhoto: UnifiedPhoto) => Promise<void>
  onDeletePhoto: (photoIds: string[]) => Promise<void>
  formatFileSize: (size: number) => string
}

export function PhotoComparison({
  isOpen,
  onOpenChange,
  compareItems,
  onKeepPhoto,
  onDeletePhoto,
  formatFileSize
}: PhotoComparisonProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowsLeftRight className="w-5 h-5" />
            Compare Photos
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {compareItems.slice(0, 2).map((photo, index) => (
            <div key={photo.id} className="space-y-4">
              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                <img
                  src={photo.url}
                  alt={photo.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium truncate">{photo.name}</h4>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => onKeepPhoto(compareItems, photo)}
                    >
                      <Crown className="w-4 h-4 mr-1" />
                      Keep This
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDeletePhoto([photo.id])}
                    >
                      <Trash className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Size:</span>
                    <p>{formatFileSize(photo.size)}</p>
                  </div>
                  {photo.dimensions && (
                    <div>
                      <span className="text-muted-foreground">Dimensions:</span>
                      <p>{photo.dimensions.width} × {photo.dimensions.height}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Modified:</span>
                    <p>{typeof photo.lastModified === 'string' 
                      ? new Date(photo.lastModified).toLocaleDateString()
                      : new Date(photo.lastModified).toLocaleDateString()
                    }</p>
                  </div>
                  {photo.folder && (
                    <div>
                      <span className="text-muted-foreground">Folder:</span>
                      <p>{photo.folder}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}