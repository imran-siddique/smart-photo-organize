import React from 'react'
import { Eye, Check, X, Trash } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { UnifiedPhoto } from '@/hooks/usePhotoStorage'

interface PhotosGridProps {
  photos: UnifiedPhoto[]
  selectedItems: string[]
  onToggleSelection: (photoId: string) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  onDeleteSelected: () => Promise<void>
  formatFileSize: (size: number) => string
}

export function PhotosGrid({
  photos,
  selectedItems,
  onToggleSelection,
  onSelectAll,
  onDeselectAll,
  onDeleteSelected,
  formatFileSize
}: PhotosGridProps) {
  if (photos.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Photos ({photos.length})</CardTitle>
          
          {/* Bulk Actions Controls */}
          <div className="flex items-center gap-4">
            {selectedItems.length > 0 && (
              <>
                <Badge variant="secondary">
                  {selectedItems.length} selected
                </Badge>
                
                <div className="flex items-center gap-2">                        
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={onDeleteSelected}
                  >
                    <Trash className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={onDeselectAll}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                </div>
              </>
            )}
            
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={selectedItems.length === photos.length ? onDeselectAll : onSelectAll}
              >
                <Check className="w-4 h-4 mr-1" />
                {selectedItems.length === photos.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              {/* Selection Checkbox */}
              <div className="absolute top-2 right-2 z-10">
                <Checkbox
                  checked={selectedItems.includes(photo.id)}
                  onCheckedChange={() => onToggleSelection(photo.id)}
                  className="bg-white/80 backdrop-blur-sm border-white"
                />
              </div>
              
              <div 
                className={`aspect-square rounded-lg overflow-hidden bg-muted transition-all duration-200 ${
                  selectedItems.includes(photo.id) 
                    ? 'ring-2 ring-primary ring-offset-2' 
                    : ''
                }`}
                onClick={() => onToggleSelection(photo.id)}
              >
                <img
                  src={photo.thumbnailUrl || photo.url}
                  alt={photo.name}
                  className="w-full h-full object-cover cursor-pointer"
                  onError={(e) => {
                    // Fallback to a placeholder if thumbnail fails
                    e.currentTarget.src = `data:image/svg+xml;base64,${btoa(`
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
                        <rect width="200" height="200" fill="#f3f4f6"/>
                        <path d="M50 150 L150 50 L175 75 L75 175 Z" fill="#d1d5db"/>
                        <circle cx="75" cy="75" r="15" fill="#d1d5db"/>
                      </svg>
                    `)}`
                  }}
                />
              </div>
              
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>{photo.name}</DialogTitle>
                    </DialogHeader>
                    <img 
                      src={photo.url}
                      alt={photo.name} 
                      className="w-full h-auto rounded-lg" 
                    />
                    <div className="space-y-2">
                      <p><strong>Size:</strong> {formatFileSize(photo.size)}</p>
                      <p><strong>Modified:</strong> {
                        typeof photo.lastModified === 'string' 
                          ? new Date(photo.lastModified).toLocaleDateString()
                          : new Date(photo.lastModified).toLocaleDateString()
                      }</p>
                      {photo.dimensions && (
                        <p><strong>Dimensions:</strong> {photo.dimensions.width} × {photo.dimensions.height}</p>
                      )}
                      {photo.folder && (
                        <p><strong>Folder:</strong> {photo.folder}</p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="mt-1">
                <p className="text-xs truncate">{photo.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(photo.size)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}