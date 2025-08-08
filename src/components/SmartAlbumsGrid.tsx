import React from 'react'
import { SmartAlbum } from '@/services/smartAlbums'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Sparkles, 
  Calendar, 
  Users, 
  MapPin, 
  Camera, 
  Image, 
  Star, 
  Clock,
  Eye,
  ArrowRight,
  Palette
} from '@phosphor-icons/react'

const iconMap = {
  'User': Users,
  'Tree': MapPin,
  'PartyPopper': Users,
  'Buildings': Image,
  'Clock': Clock,
  'Star': Star,
  'Image': Image,
  'Monitor': Camera,
  'Calendar': Calendar,
  'Folder': Image
}

interface SmartAlbumsGridProps {
  albums: SmartAlbum[]
  isGenerating: boolean
  statistics: {
    totalAlbums: number
    totalPhotosInAlbums: number
    averageConfidence: number
    organizationPercentage: number
    customRulesCount: number
    suggestedRulesCount: number
  }
  onViewAlbum: (album: SmartAlbum) => void
  onGenerateAlbums: () => void
  onManageRules: () => void
}

export function SmartAlbumsGrid({
  albums,
  isGenerating,
  statistics,
  onViewAlbum,
  onGenerateAlbums,
  onManageRules
}: SmartAlbumsGridProps) {
  const [selectedAlbum, setSelectedAlbum] = React.useState<SmartAlbum | null>(null)
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')

  const handleViewAlbum = (album: SmartAlbum) => {
    setSelectedAlbum(album)
    onViewAlbum(album)
  }

  const getIconComponent = (iconName: string) => {
    return iconMap[iconName as keyof typeof iconMap] || Image
  }

  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Smart Albums
          </h2>
          <p className="text-muted-foreground">
            AI-powered photo organization and intelligent categorization
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onManageRules}
          >
            <Palette className="h-4 w-4 mr-2" />
            Manage Rules
          </Button>
          
          <Button
            onClick={onGenerateAlbums}
            disabled={isGenerating}
            className="min-w-[120px]"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 rounded-full border-2 border-transparent border-t-current" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Albums
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Albums Created</p>
                <p className="text-2xl font-bold">{statistics.totalAlbums}</p>
              </div>
              <Image className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Photos Organized</p>
                <p className="text-2xl font-bold">{statistics.totalPhotosInAlbums}</p>
              </div>
              <Star className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Confidence</p>
                <p className="text-2xl font-bold">{formatConfidence(statistics.averageConfidence)}</p>
              </div>
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Organization</p>
                <p className="text-2xl font-bold">{Math.round(statistics.organizationPercentage)}%</p>
              </div>
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </div>
            <Progress value={statistics.organizationPercentage} className="mt-2 h-1" />
          </CardContent>
        </Card>
      </div>

      {/* Albums Grid */}
      {albums.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {albums.length} smart albums
            </p>
            
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'grid' | 'list')}>
              <TabsList>
                <TabsTrigger value="grid">Grid</TabsTrigger>
                <TabsTrigger value="list">List</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {albums.map((album) => {
              const IconComponent = getIconComponent(album.rule.icon)
              
              return (
                <Card key={album.id} className="group hover:shadow-md transition-all duration-200 cursor-pointer" onClick={() => handleViewAlbum(album)}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Album Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="p-2 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: album.rule.color + '20', color: album.rule.color }}
                          >
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-medium truncate">{album.name}</h3>
                            <p className="text-xs text-muted-foreground truncate">
                              {album.photoCount} photos
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>

                      {/* Preview Photos */}
                      <div className="grid grid-cols-3 gap-1 aspect-[3/2] bg-muted rounded overflow-hidden">
                        {album.photos.slice(0, 3).map((photo, index) => (
                          <div key={photo.id} className="relative overflow-hidden bg-background">
                            <img
                              src={photo.thumbnailUrl || photo.url}
                              alt={photo.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        ))}
                        {album.photoCount > 3 && (
                          <div className="bg-background/80 flex items-center justify-center text-xs font-medium text-muted-foreground">
                            +{album.photoCount - 3}
                          </div>
                        )}
                      </div>

                      {/* Album Info */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">
                            {formatConfidence(album.confidence)} match
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {album.lastUpdated.toLocaleDateString()}
                          </span>
                        </div>
                        
                        {album.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {album.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                                {tag}
                              </Badge>
                            ))}
                            {album.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                +{album.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ) : (
        /* Empty State */
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">No Smart Albums Yet</h3>
              <p className="text-muted-foreground">
                Generate AI-powered smart albums to automatically organize your photos by content, location, people, and more.
              </p>
            </div>
            <Button onClick={onGenerateAlbums} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 rounded-full border-2 border-transparent border-t-current" />
                  Analyzing Photos...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Smart Albums
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Album Detail Dialog */}
      <Dialog open={!!selectedAlbum} onOpenChange={(open) => !open && setSelectedAlbum(null)}>
        {selectedAlbum && (
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: selectedAlbum.rule.color + '20', color: selectedAlbum.rule.color }}
                >
                  {React.createElement(getIconComponent(selectedAlbum.rule.icon), { className: 'h-5 w-5' })}
                </div>
                <div>
                  <DialogTitle>{selectedAlbum.name}</DialogTitle>
                  <DialogDescription>{selectedAlbum.description}</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <Tabs defaultValue="photos" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="photos">Photos ({selectedAlbum.photoCount})</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>
              
              <TabsContent value="photos" className="space-y-4">
                <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {selectedAlbum.photos.map((photo) => (
                      <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-lg bg-muted">
                        <img
                          src={photo.thumbnailUrl || photo.url}
                          alt={photo.name}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-white text-xs font-medium truncate bg-black/50 px-2 py-1 rounded">
                            {photo.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="details" className="space-y-4">
                <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Album Statistics</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Photos</p>
                          <p className="font-medium">{selectedAlbum.photoCount}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Match Confidence</p>
                          <p className="font-medium">{formatConfidence(selectedAlbum.confidence)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Last Updated</p>
                          <p className="font-medium">{selectedAlbum.lastUpdated.toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Rule Type</p>
                          <p className="font-medium capitalize">{selectedAlbum.rule.type.replace('-', ' ')}</p>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {selectedAlbum.tags.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedAlbum.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-medium mb-2">Album Rule</h4>
                      <div className="space-y-2">
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm">{selectedAlbum.rule.description}</p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <p>Auto-update: {selectedAlbum.rule.autoUpdate ? 'Enabled' : 'Disabled'}</p>
                          <p>Rule enabled: {selectedAlbum.rule.enabled ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}