import React from 'react'
import { Warning, MagnifyingGlass, Lightning, ArrowsLeftRight, Crown, Trash } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UnifiedPhoto, UnifiedDuplicateGroup } from '@/hooks/usePhotoStorage'

interface DuplicatesReviewProps {
  duplicateGroups: UnifiedDuplicateGroup[]
  selectedDuplicateGroups: string[]
  isDuplicateDetectionRunning: boolean
  detectionSettings: {
    similarityThreshold: number
    checkFileSize: boolean
    checkFilename: boolean
    checkHash: boolean
  }
  onDetectionSettingsChange: (settings: any) => void
  onToggleGroupSelection: (groupId: string) => void
  onComparePhotos: (photos: UnifiedPhoto[]) => void
  onKeepPhoto: (groupPhotos: UnifiedPhoto[], keepPhoto: UnifiedPhoto) => Promise<void>
  onDeletePhoto: (photoIds: string[]) => Promise<void>
  onRunDetection: () => Promise<void>
  onProcessSelectedGroups: (action: 'keep-first' | 'keep-largest' | 'keep-newest') => Promise<void>
  formatFileSize: (size: number) => string
}

export function DuplicatesReview({
  duplicateGroups,
  selectedDuplicateGroups,
  isDuplicateDetectionRunning,
  detectionSettings,
  onDetectionSettingsChange,
  onToggleGroupSelection,
  onComparePhotos,
  onKeepPhoto,
  onDeletePhoto,
  onRunDetection,
  onProcessSelectedGroups,
  formatFileSize
}: DuplicatesReviewProps) {
  const [duplicateDetectionOpen, setDuplicateDetectionOpen] = React.useState(false)

  if (duplicateGroups.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Warning className="w-5 h-5 text-orange-500" />
            Duplicate Detection Results
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Duplicate Detection Settings Dialog */}
            <Dialog open={duplicateDetectionOpen} onOpenChange={setDuplicateDetectionOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <MagnifyingGlass className="w-4 h-4 mr-1" />
                  Detect Duplicates
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Lightning className="w-5 h-5" />
                    Duplicate Detection Settings
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 pt-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Similarity Threshold: {detectionSettings.similarityThreshold}%</Label>
                      <Slider
                        value={[detectionSettings.similarityThreshold]}
                        onValueChange={([value]) => 
                          onDetectionSettingsChange({ ...detectionSettings, similarityThreshold: value })
                        }
                        max={100}
                        min={50}
                        step={5}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Higher values = more strict matching
                      </p>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Detection Methods</Label>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="check-size" className="text-sm">File Size</Label>
                          <Switch
                            id="check-size"
                            checked={detectionSettings.checkFileSize}
                            onCheckedChange={(checked) => 
                              onDetectionSettingsChange({ ...detectionSettings, checkFileSize: checked })
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="check-filename" className="text-sm">Filename Similarity</Label>
                          <Switch
                            id="check-filename"
                            checked={detectionSettings.checkFilename}
                            onCheckedChange={(checked) => 
                              onDetectionSettingsChange({ ...detectionSettings, checkFilename: checked })
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="check-hash" className="text-sm">Content Hash</Label>
                          <Switch
                            id="check-hash"
                            checked={detectionSettings.checkHash}
                            onCheckedChange={(checked) => 
                              onDetectionSettingsChange({ ...detectionSettings, checkHash: checked })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setDuplicateDetectionOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => {
                        onRunDetection()
                        setDuplicateDetectionOpen(false)
                      }}
                      disabled={isDuplicateDetectionRunning}
                    >
                      {isDuplicateDetectionRunning ? (
                        <>
                          <Lightning className="w-4 h-4 mr-1 animate-pulse" />
                          Detecting...
                        </>
                      ) : (
                        <>
                          <MagnifyingGlass className="w-4 h-4 mr-1" />
                          Run Detection
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Batch Actions for Selected Groups */}
            {selectedDuplicateGroups.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {selectedDuplicateGroups.length} groups selected
                </Badge>
                
                <Select onValueChange={(value) => onProcessSelectedGroups(value as any)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Batch action..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep-first">Keep First</SelectItem>
                    <SelectItem value="keep-largest">Keep Largest</SelectItem>
                    <SelectItem value="keep-newest">Keep Newest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <AlertDescription>
            Found {duplicateGroups.length} groups with potential duplicates. Review each group and choose which photo to keep.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-4">
          {duplicateGroups.map((group) => (
            <Card key={group.id} className="border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedDuplicateGroups.includes(group.id)}
                      onCheckedChange={() => onToggleGroupSelection(group.id)}
                    />
                    <h4 className="font-medium">Group</h4>
                    <Badge variant="outline">{group.photos.length} photos</Badge>
                    <Badge variant="secondary">
                      {Math.round(group.similarity)}% similar
                    </Badge>
                    {group.reason.length > 0 && (
                      <Badge variant="outline">
                        {group.reason.join(', ')}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onComparePhotos(group.photos)}
                    >
                      <ArrowsLeftRight className="w-4 h-4 mr-1" />
                      Compare
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {group.photos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                        <img
                          src={photo.thumbnailUrl || photo.url}
                          alt={photo.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-1">
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => onKeepPhoto(group.photos, photo)}
                        >
                          <Crown className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => onDeletePhoto([photo.id])}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="mt-2 space-y-1">
                        <p className="text-xs truncate font-medium">{photo.name}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{formatFileSize(photo.size)}</span>
                          {photo.dimensions && (
                            <span>{photo.dimensions.width}×{photo.dimensions.height}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}