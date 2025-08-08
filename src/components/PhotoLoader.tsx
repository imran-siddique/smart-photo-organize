import React from 'react'
import { Folder, CloudArrowDown, Upload } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UnifiedPhoto } from '@/hooks/usePhotoStorage'

interface PhotoLoaderProps {
  currentProvider: 'local' | 'onedrive'
  photos: UnifiedPhoto[]
  filteredPhotos: UnifiedPhoto[]
  isLoadingPhotos: boolean
  isFileSystemAccessSupported: boolean
  onLoadPhotos: (refresh?: boolean, files?: FileList) => Promise<void>
  onFileSelect: (files: FileList) => void
}

export function PhotoLoader({
  currentProvider,
  photos,
  filteredPhotos,
  isLoadingPhotos,
  isFileSystemAccessSupported,
  onLoadPhotos,
  onFileSelect
}: PhotoLoaderProps) {
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      onFileSelect(files)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {currentProvider === 'local' ? <Folder className="w-5 h-5" /> : <CloudArrowDown className="w-5 h-5" />}
          {currentProvider === 'local' ? 'Local Photos' : 'OneDrive Photos'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">
              {photos.length > 0 
                ? `${photos.length} photos loaded ${currentProvider === 'local' ? 'from your computer' : 'from your OneDrive'}`
                : `Load photos ${currentProvider === 'local' ? 'from your computer' : 'from your OneDrive account'}`
              }
            </p>
            {filteredPhotos.length !== photos.length && (
              <p className="text-sm text-muted-foreground">
                Showing {filteredPhotos.length} of {photos.length} photos
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {currentProvider === 'local' && (
              <>
                {isFileSystemAccessSupported && (
                  <Button 
                    onClick={() => onLoadPhotos(true)} 
                    disabled={isLoadingPhotos}
                    variant="outline"
                  >
                    {isLoadingPhotos ? (
                      <>
                        <Folder className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Folder className="w-4 h-4 mr-2" />
                        {photos.length > 0 ? 'Load More' : 'Choose Folder'}
                      </>
                    )}
                  </Button>
                )}
                <Button asChild variant="outline">
                  <label>
                    <Upload className="w-4 h-4 mr-2" />
                    Add Photos
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </label>
                </Button>
              </>
            )}
            {currentProvider === 'onedrive' && (
              <Button 
                onClick={() => onLoadPhotos(true)} 
                disabled={isLoadingPhotos}
                variant="outline"
              >
                {isLoadingPhotos ? (
                  <>
                    <CloudArrowDown className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <CloudArrowDown className="w-4 h-4 mr-2" />
                    {photos.length > 0 ? 'Refresh' : 'Load Photos'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}