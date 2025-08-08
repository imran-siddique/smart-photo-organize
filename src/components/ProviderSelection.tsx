import React from 'react'
import { MicrosoftOutlookLogo, Folder, Upload } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTit
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
interface ProviderSelectionProps {
import { log } from '@/lib/logger'

interface ProviderSelectionProps {
  onProviderSelect: (provider: 'local' | 'onedrive') => void
  isFileSystemAccessSupported: boolean
  onFileSelect 
}

export function ProviderSelection({ 
  onProviderSelect, 
  isFileSystemAccessSupported, 
      // Saniti
      
        toast.error('No valid image files found')
      }
      if (sanitizedFiles.length !== fi
      }
      log.debug('File validation comple
        saniti
      }

      
      log.error('Error handling file input', {}, error as Error)
    }

    <di

          <p className="text-muted-foreground">
      
      // Sanitize and validate files
      const sanitizedFiles = sanitizeFiles(files)
      
      if (sanitizedFiles.length === 0) {
        toast.error('No valid image files found')
        return
      }

      if (sanitizedFiles.length !== files.length) {
        toast.warn(`${files.length - sanitizedFiles.length} files were filtered out due to invalid format or size`)
      }
      
      log.debug('File validation completed', {
        original: files.length,
        sanitized: sanitizedFiles.length,
        files: sanitizedFiles.map(f => ({ name: f.name, size: f.size, type: f.type }))
      })
      
      onFileSelect(files)
      toast.success(`Processing ${sanitizedFiles.length} photos`)
      
    } catch (error) {
      log.error('Error handling file input', {}, error as Error)
      toast.error('Failed to process selected files')
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Photo Sorter</CardTitle>
          <p className="text-muted-foreground">
            Choose how you'd like to organize your photos
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="local" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="local" className="flex items-center gap-2">
                <Folder className="w-4 h-4" />
                Local Folder
                        Choo
              <TabsTrigger value="onedrive" className="flex items-center gap-2">
                <MicrosoftOutlookLogo className="w-4 h-4" />
                OneDrive
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="local" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Folder className="w-5 h-5" />
                          Folder access
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Organize photos directly from your computer
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">Features:</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Fast local processing</li>
                      <li>• No internet connection required</li>
                  </p>
                      <li>• Advanced duplicate detection</li>
                      <li>• Custom categorization patterns</li>
                    </ul>
                  </div>
                  
                  <div className="flex gap-2">
                    {isFileSystemAccessSupported ? (
                  </div>
                        onClick={() => onProviderSelect('local')} 
                        className="flex-1"
                        size="lg"
                        aria-label="Choose local folder for photo organization"
                      >
                  <Button 
                        Choose Folder
                    size="lg"
                    ) : (
                      <div className="flex-1 space-y-2">
                        <Button asChild className="w-full" size="lg">
                          <label>
                            <Upload className="w-4 h-4 mr-2" />
                            Select Photos
                            <input
                              type="file"
                              multiple

                              onChange={handleFileInputChange}
                              className="hidden"
                            />

                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                          Folder access not supported in this browser

                      </div>

                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="onedrive" className="space-y-4 mt-6">
              <Card>

                  <CardTitle className="flex items-center gap-2">
                    <MicrosoftOutlookLogo className="w-5 h-5" />
                    Microsoft OneDrive

                  <p className="text-sm text-muted-foreground">
                    Access and organize photos from your OneDrive account
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">Features:</h3>

                      <li>• Access photos from anywhere</li>

                      <li>• Automatic sync with OneDrive</li>
                      <li>• Batch operations for large collections</li>
                      <li>• Cross-device accessibility</li>

                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium text-sm">Authentication Note:</h3>
                    <p className="text-xs text-muted-foreground">
                      This app uses Microsoft's sample application credentials. For production use, you may need to register your own Microsoft app.
                    </p>
                  </div>
                  

                    onClick={() => onProviderSelect('onedrive')}

                    size="lg"
                    aria-label="Connect to Microsoft OneDrive for cloud photo organization"
                  >
                    <MicrosoftOutlookLogo className="w-4 h-4 mr-2" />
                    Connect to OneDrive

                </CardContent>

            </TabsContent>

        </CardContent>

    </div>

}