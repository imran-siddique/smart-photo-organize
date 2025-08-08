import React from 'react'
import { Image, Folder, CloudArrowDown, Upload } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface EmptyStateProps {
  currentProvider: 'local' | 'onedrive'
  isFileSystemAccessSupported: boolean
  onLoadPhotos: () => Promise<void>
  onFileSelect: (files: FileList) => void
}

export function EmptyState({
  currentProvider,
  isFileSystemAccessSupported,
  onLoadPhotos,
  onFileSelect
}: EmptyStateProps) {
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      onFileSelect(files)
    }
  }

  return (
    <Card>
      <CardContent className="py-12">
        <div className="text-center space-y-4">
          <Image className="w-16 h-16 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-medium">No photos loaded</h3>
            <p className="text-muted-foreground">
              {currentProvider === 'local' 
                ? 'Choose a folder or select photos to start organizing.'
                : 'Click "Load Photos" to start organizing your OneDrive photos.'
              }
            </p>
          </div>
          {currentProvider === 'local' ? (
            <div className="flex justify-center gap-2">
              {isFileSystemAccessSupported && (
                <Button onClick={onLoadPhotos}>
                  <Folder className="w-4 h-4 mr-2" />
                  Choose Folder
                </Button>
              )}
              <Button asChild variant="outline">
                <label>
                  <Upload className="w-4 h-4 mr-2" />
                  Select Photos
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </label>
              </Button>
            </div>
          ) : (
            <Button onClick={onLoadPhotos}>
              <CloudArrowDown className="w-4 h-4 mr-2" />
              Load Photos from OneDrive
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}