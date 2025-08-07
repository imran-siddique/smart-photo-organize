import React from 'react'
import { MicrosoftOutlookLogo, Image, Trash2, Eye, Plus, FolderPlus, PencilSimple, MagnifyingGlass, Warning, Lightning, ArrowsLeftRight, Crown, SignOut, CloudArrowDown, Funnel, SortAscending, Check, X, Folder, Upload } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePhotoStorage, UnifiedPhoto, UnifiedCategory } from '@/hooks/usePhotoStorage'
import { toast, Toaster } from 'sonner'

function PhotoSorter() {
  const {
    currentProvider,
    switchProvider,
    isFileSystemAccessSupported,
    isOneDriveAuthenticated,
    oneDriveUser,
    authenticateOneDrive,
    handleOneDriveCallback,
    logoutOneDrive,
    photos,
    filteredPhotos,
    categories,
    duplicateGroups,
    isLoading,
    isLoadingPhotos,
    isDuplicateDetectionRunning,
    error,
    progress,
    loadPhotos,
    createCategory,
    updateCategory,
    deleteCategory,
    deletePhotos,
    runDuplicateDetection,
    filterPhotos,
    formatFileSize
  } = usePhotoStorage()

  const [selectedItems, setSelectedItems] = React.useState<string[]>([])
  const [bulkActionCategory, setBulkActionCategory] = React.useState<string>('')
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = React.useState(false)
  const [newCategoryName, setNewCategoryName] = React.useState('')
  const [newCategoryPatterns, setNewCategoryPatterns] = React.useState('')
  const [newCategoryColor, setNewCategoryColor] = React.useState('#3b82f6')
  const [editingCategory, setEditingCategory] = React.useState<UnifiedCategory | null>(null)
  const [isEditCategoryOpen, setIsEditCategoryOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = React.useState<string>('')
  const [sortBy, setSortBy] = React.useState<'name' | 'date' | 'size'>('name')
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc')
  const [showProviderSelection, setShowProviderSelection] = React.useState(!currentProvider || currentProvider === 'local')

  // Duplicate detection settings
  const [duplicateDetectionOpen, setDuplicateDetectionOpen] = React.useState(false)
  const [detectionSettings, setDetectionSettings] = React.useState({
    similarityThreshold: 85,
    checkFileSize: true,
    checkFilename: true,
    checkHash: true
  })
  const [selectedDuplicateGroups, setSelectedDuplicateGroups] = React.useState<string[]>([])
  const [compareItems, setCompareItems] = React.useState<UnifiedPhoto[]>([])
  const [isCompareOpen, setIsCompareOpen] = React.useState(false)

  // Handle auth callback for OneDrive
  React.useEffect(() => {
    if (currentProvider !== 'onedrive') return
    
    const hash = window.location.hash
    
    if (hash && hash.includes('access_token')) {
      handleOneDriveCallback(hash).then(success => {
        if (success) {
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname)
        }
      })
    } else if (hash && hash.includes('error')) {
      // Handle OAuth errors
      const params = new URLSearchParams(hash.replace('#', ''))
      const error = params.get('error')
      const errorDescription = params.get('error_description')
      console.error('OAuth error:', error, errorDescription)
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [handleOneDriveCallback, currentProvider])

  // Filter and sort photos
  React.useEffect(() => {
    filterPhotos(searchQuery, selectedCategoryFilter)
  }, [searchQuery, selectedCategoryFilter, photos])

  const sortedPhotos = React.useMemo(() => {
    const sorted = [...filteredPhotos]
    
    sorted.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'date':
          const aTime = typeof a.lastModified === 'string' 
            ? new Date(a.lastModified).getTime()
            : a.lastModified
          const bTime = typeof b.lastModified === 'string'
            ? new Date(b.lastModified).getTime()
            : b.lastModified
          comparison = aTime - bTime
          break
        case 'size':
          comparison = a.size - b.size
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return sorted
  }, [filteredPhotos, sortBy, sortOrder])

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(current => 
      current.includes(itemId)
        ? current.filter(id => id !== itemId)
        : [...current, itemId]
    )
  }

  const selectAllItems = () => {
    setSelectedItems(sortedPhotos.map(photo => photo.id))
  }

  const deselectAllItems = () => {
    setSelectedItems([])
  }

  const createNewCategory = async () => {
    if (!newCategoryName.trim()) return
    
    const patterns = newCategoryPatterns
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0)
    
    await createCategory({
      name: newCategoryName.trim(),
      patterns: patterns.length > 0 ? patterns : [newCategoryName.trim().toLowerCase()],
      folder: newCategoryName.trim(),
      color: newCategoryColor,
      autoSort: true,
      sortOrder: categories.length + 1
    })
    
    // Reset form
    setNewCategoryName('')
    setNewCategoryPatterns('')
    setNewCategoryColor('#3b82f6')
    setIsCreateCategoryOpen(false)
  }

  const deleteSelectedItems = async () => {
    if (selectedItems.length === 0) return
    await deletePhotos(selectedItems)
    setSelectedItems([])
  }

  const openEditCategory = (category: UnifiedCategory) => {
    setEditingCategory({ ...category })
    setIsEditCategoryOpen(true)
  }

  const saveEditCategory = async () => {
    if (!editingCategory) return
    
    await updateCategory(editingCategory.id, editingCategory)
    setEditingCategory(null)
    setIsEditCategoryOpen(false)
  }

  const runDuplicateDetectionWithSettings = async () => {
    await runDuplicateDetection({
      checkFileSize: detectionSettings.checkFileSize,
      checkFilename: detectionSettings.checkFilename,
      checkHash: detectionSettings.checkHash,
      similarityThreshold: detectionSettings.similarityThreshold
    })
    setDuplicateDetectionOpen(false)
  }

  const toggleDuplicateGroupSelection = (groupId: string) => {
    setSelectedDuplicateGroups(current => 
      current.includes(groupId)
        ? current.filter(id => id !== groupId)
        : [...current, groupId]
    )
  }

  const comparePhotosInGroup = (photos: UnifiedPhoto[]) => {
    setCompareItems(photos)
    setIsCompareOpen(true)
  }

  const keepPhotoInGroup = async (groupPhotos: UnifiedPhoto[], keepPhoto: UnifiedPhoto) => {
    const photosToDelete = groupPhotos.filter(photo => photo.id !== keepPhoto.id).map(photo => photo.id)
    if (photosToDelete.length > 0) {
      await deletePhotos(photosToDelete)
      setIsCompareOpen(false)
    }
  }

  // File input handler for local photos
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      loadPhotos(false, files)
    }
  }

  // Provider selection screen
  if (showProviderSelection) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Toaster richColors position="top-right" />
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
                </TabsTrigger>
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
                      Local Folder Access
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
                        <li>• Privacy-focused (files stay on your device)</li>
                        <li>• Advanced duplicate detection</li>
                        <li>• Custom categorization patterns</li>
                      </ul>
                    </div>
                    
                    <div className="flex gap-2">
                      {isFileSystemAccessSupported ? (
                        <Button 
                          onClick={() => {
                            switchProvider('local')
                            setShowProviderSelection(false)
                          }} 
                          className="flex-1"
                          size="lg"
                        >
                          <Folder className="w-4 h-4 mr-2" />
                          Choose Folder
                        </Button>
                      ) : (
                        <div className="flex-1 space-y-2">
                          <Button asChild className="w-full" size="lg">
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
                          <p className="text-xs text-muted-foreground text-center">
                            Folder access not supported in this browser
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="onedrive" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MicrosoftOutlookLogo className="w-5 h-5" />
                      Microsoft OneDrive
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Access and organize photos from your OneDrive account
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-medium">Features:</h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Access photos from anywhere</li>
                        <li>• Parallel cloud processing</li>
                        <li>• Automatic sync with OneDrive</li>
                        <li>• Batch operations for large collections</li>
                        <li>• Cross-device accessibility</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-medium text-sm">Authentication Note:</h3>
                      <p className="text-xs text-muted-foreground">
                        This app uses Microsoft's sample application credentials. For production use, you may need to register your own Microsoft app.
                      </p>
                    </div>
                    
                    <Button 
                      onClick={() => {
                        switchProvider('onedrive')
                        setShowProviderSelection(false)
                      }}
                      className="w-full"
                      size="lg"
                    >
                      <MicrosoftOutlookLogo className="w-4 h-4 mr-2" />
                      Connect to OneDrive
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    )
  }

  // OneDrive authentication screen
  if (currentProvider === 'onedrive' && !isOneDriveAuthenticated && !isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Toaster richColors position="top-right" />
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <MicrosoftOutlookLogo className="w-16 h-16 mx-auto mb-4 text-blue-500" />
            <CardTitle className="text-2xl">Connect to OneDrive</CardTitle>
            <p className="text-muted-foreground">
              Sign in to access your OneDrive photos
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={authenticateOneDrive} className="w-full" size="lg">
              <MicrosoftOutlookLogo className="w-4 h-4 mr-2" />
              Sign In with Microsoft
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowProviderSelection(true)}
              className="w-full"
            >
              Back to Provider Selection
            </Button>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <CloudArrowDown className="w-12 h-12 text-primary mx-auto animate-bounce" />
              <h3 className="text-lg font-medium">Connecting to OneDrive...</h3>
              <p className="text-muted-foreground">Please wait while we authenticate your account.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <Toaster richColors position="top-right" />
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
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
            <Button variant="outline" onClick={() => setShowProviderSelection(true)} size="sm">
              Switch Provider
            </Button>
            {currentProvider === 'onedrive' && (
              <Button variant="outline" onClick={logoutOneDrive} size="sm">
                <SignOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {progress && (
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
        )}

        {/* Search and Filter Controls */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search photos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
                <SelectTrigger className="w-48">
                  <Funnel className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SortAscending className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="size">Size</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </CardContent>
        </Card>


        {categories.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Categories ({categories.length})</CardTitle>
                
                <Dialog open={isCreateCategoryOpen} onOpenChange={setIsCreateCategoryOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-1" />
                      New Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <FolderPlus className="w-5 h-5" />
                        Create New Category
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="category-name">Category Name</Label>
                        <Input
                          id="category-name"
                          placeholder="Enter category name..."
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category-patterns">Matching Patterns (comma-separated)</Label>
                        <Input
                          id="category-patterns"
                          placeholder="e.g., vacation, beach, summer"
                          value={newCategoryPatterns}
                          onChange={(e) => setNewCategoryPatterns(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category-color">Category Color</Label>
                        <Input
                          id="category-color"
                          type="color"
                          value={newCategoryColor}
                          onChange={(e) => setNewCategoryColor(e.target.value)}
                        />
                      </div>
                      {selectedItems.length > 0 && (
                        <Alert>
                          <AlertDescription>
                            {selectedItems.length} selected photos will be moved to this new category.
                          </AlertDescription>
                        </Alert>
                      )}
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsCreateCategoryOpen(false)
                            setNewCategoryName('')
                            setNewCategoryPatterns('')
                            setNewCategoryColor('#3b82f6')
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={createNewCategory}
                          disabled={!newCategoryName.trim()}
                        >
                          Create Category
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="border rounded-lg p-4 space-y-2 transition-all duration-200 group hover:border-accent hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <h3 className="font-medium">{category.name}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {items.filter(item => 
                            category.patterns.some(pattern =>
                              item.name.toLowerCase().includes(pattern.toLowerCase())
                            )
                          ).length} photos
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditCategory(category)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <PencilSimple className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteCategory(category.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Patterns: {category.patterns.join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Category Dialog */}
        <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PencilSimple className="w-5 h-5" />
                Edit Category
              </DialogTitle>
            </DialogHeader>
            {editingCategory && (
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-category-name">Category Name</Label>
                  <Input
                    id="edit-category-name"
                    placeholder="Enter category name..."
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({
                      ...editingCategory,
                      name: e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category-patterns">Matching Patterns</Label>
                  <Input
                    id="edit-category-patterns"
                    placeholder="e.g., vacation, beach, summer"
                    value={editingCategory.patterns.join(', ')}
                    onChange={(e) => setEditingCategory({
                      ...editingCategory,
                      patterns: e.target.value.split(',').map(p => p.trim()).filter(p => p)
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category-color">Category Color</Label>
                  <Input
                    id="edit-category-color"
                    type="color"
                    value={editingCategory.color}
                    onChange={(e) => setEditingCategory({
                      ...editingCategory,
                      color: e.target.value
                    })}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setEditingCategory(null)
                      setIsEditCategoryOpen(false)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={saveEditCategory}
                    disabled={!editingCategory.name.trim()}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Load Photos Button */}
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
                        onClick={() => loadPhotos(true)} 
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
                    onClick={() => loadPhotos(true)} 
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

        {/* Photos Grid */}
        {sortedPhotos.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Photos ({sortedPhotos.length})</CardTitle>
                
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
                          onClick={deleteSelectedItems}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={deselectAllItems}
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
                      onClick={selectedItems.length === sortedPhotos.length ? deselectAllItems : selectAllItems}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      {selectedItems.length === sortedPhotos.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {sortedPhotos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    {/* Selection Checkbox */}
                    <div className="absolute top-2 right-2 z-10">
                      <Checkbox
                        checked={selectedItems.includes(photo.id)}
                        onCheckedChange={() => toggleItemSelection(photo.id)}
                        className="bg-white/80 backdrop-blur-sm border-white"
                      />
                    </div>
                    
                    <div 
                      className={`aspect-square rounded-lg overflow-hidden bg-muted transition-all duration-200 ${
                        selectedItems.includes(photo.id) 
                          ? 'ring-2 ring-primary ring-offset-2' 
                          : ''
                      }`}
                      onClick={() => toggleItemSelection(photo.id)}
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
        )}

        {/* Duplicates Review */}
        {duplicateGroups.length > 0 && (
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
                                setDetectionSettings(prev => ({ ...prev, similarityThreshold: value }))
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
                                    setDetectionSettings(prev => ({ ...prev, checkFileSize: checked }))
                                  }
                                />
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <Label htmlFor="check-filename" className="text-sm">Filename Similarity</Label>
                                <Switch
                                  id="check-filename"
                                  checked={detectionSettings.checkFilename}
                                  onCheckedChange={(checked) => 
                                    setDetectionSettings(prev => ({ ...prev, checkFilename: checked }))
                                  }
                                />
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <Label htmlFor="check-hash" className="text-sm">Content Hash</Label>
                                <Switch
                                  id="check-hash"
                                  checked={detectionSettings.checkHash}
                                  onCheckedChange={(checked) => 
                                    setDetectionSettings(prev => ({ ...prev, checkHash: checked }))
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
                            onClick={runDuplicateDetectionWithSettings}
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
                      
                      <Select onValueChange={(value) => processSelectedDuplicateGroups(value as any)}>
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
                            onCheckedChange={() => toggleDuplicateGroupSelection(group.id)}
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
                            onClick={() => comparePhotosInGroup(group.photos)}
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
                                onClick={() => keepPhotoInGroup(group.photos, photo)}
                              >
                                <Crown className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => deletePhotos([photo.id])}
                              >
                                <Trash2 className="w-4 h-4" />
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
        )}

        {/* Photo Comparison Dialog */}
        <Dialog open={isCompareOpen} onOpenChange={setIsCompareOpen}>
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
                          onClick={() => keepPhotoInGroup(compareItems, photo)}
                        >
                          <Crown className="w-4 h-4 mr-1" />
                          Keep This
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deletePhotos([photo.id])}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
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

        {/* Actions */}
        {photos.length > 0 && (
          <div className="flex justify-center space-x-4">
            <Button onClick={() => loadPhotos(true)} variant="outline">
              {currentProvider === 'local' ? <Folder className="w-4 h-4 mr-2" /> : <CloudArrowDown className="w-4 h-4 mr-2" />}
              {currentProvider === 'local' ? 'Load More Photos' : 'Refresh Photos'}
            </Button>
            <Button 
              onClick={() => setDuplicateDetectionOpen(true)}
              variant="outline"
              disabled={isDuplicateDetectionRunning}
            >
              <MagnifyingGlass className="w-4 h-4 mr-2" />
              {isDuplicateDetectionRunning ? 'Scanning...' : 'Scan for Duplicates'}
            </Button>
          </div>
        )}

        {/* Empty State */}
        {photos.length === 0 && !isLoadingPhotos && (
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
                      <Button onClick={() => loadPhotos()}>
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
                  <Button onClick={() => loadPhotos()}>
                    <CloudArrowDown className="w-4 h-4 mr-2" />
                    Load Photos from OneDrive
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default PhotoSorter