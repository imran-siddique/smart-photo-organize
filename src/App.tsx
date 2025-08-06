import React from 'react'
import { Folder, Image, Trash2, Upload, Eye, Download, DotsSixVertical, Check, X, FolderOpen, Plus, FolderPlus, PencilSimple, MagnifyingGlass, Warning, Lightning, ArrowsLeftRight, Crown, ListChecks, TestTube } from '@phosphor-icons/react'
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
import { apiService, PhotoDto, CategoryDto, API_BASE_URL } from '@/services/api'
import { toast, Toaster } from 'sonner'
import { DuplicateDetectionTester } from '@/components/DuplicateDetectionTester'

function PhotoSorter() {
  const [photos, setPhotos] = React.useState<PhotoDto[]>([])
  const [categories, setCategories] = React.useState<CategoryDto[]>([])
  const [duplicates, setDuplicates] = React.useState<PhotoDto[]>([])
  const [duplicateGroups, setDuplicateGroups] = React.useState<PhotoDto[][]>([])
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isDetectingDuplicates, setIsDetectingDuplicates] = React.useState(false)
  const [currentStep, setCurrentStep] = React.useState<'upload' | 'analyze' | 'sort' | 'review'>('sort')
  const [draggedCategory, setDraggedCategory] = React.useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null)
  const [selectedPhotos, setSelectedPhotos] = React.useState<number[]>([])
  const [bulkActionCategory, setBulkActionCategory] = React.useState<string>('')
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = React.useState(false)
  const [newCategoryName, setNewCategoryName] = React.useState('')
  const [newCategoryPattern, setNewCategoryPattern] = React.useState('')
  const [editingCategory, setEditingCategory] = React.useState<{ id: number; name: string; pattern: string } | null>(null)
  const [isEditCategoryOpen, setIsEditCategoryOpen] = React.useState(false)

  // Duplicate detection settings
  const [duplicateDetectionOpen, setDuplicateDetectionOpen] = React.useState(false)
  const [detectionSettings, setDetectionSettings] = React.useState({
    similarityThreshold: 85,
    checkFileSize: true,
    checkFilename: true,
    checkImageHash: true,
    checkVisualSimilarity: false
  })
  const [selectedDuplicateGroups, setSelectedDuplicateGroups] = React.useState<number[]>([])
  const [comparePhotos, setComparePhotos] = React.useState<PhotoDto[]>([])
  const [isCompareOpen, setIsCompareOpen] = React.useState(false)
  const [showTester, setShowTester] = React.useState(false)

  // Load data on component mount
  React.useEffect(() => {
    loadCategories()
    loadPhotos()
    loadDuplicates()
    loadDuplicateGroups()
  }, [])

  const loadCategories = async () => {
    try {
      const categoriesData = await apiService.getCategories()
      setCategories(categoriesData)
      if (categoriesData.length > 0 && currentStep === 'upload') {
        setCurrentStep('sort')
      }
    } catch (error) {
      console.error('Failed to load categories:', error)
      toast.error('Failed to load categories')
    }
  }

  const loadPhotos = async () => {
    try {
      setIsLoading(true)
      const photosData = await apiService.getPhotos()
      setPhotos(photosData)
    } catch (error) {
      console.error('Failed to load photos:', error)
      toast.error('Failed to load photos')
    } finally {
      setIsLoading(false)
    }
  }

  const loadDuplicates = async () => {
    try {
      const duplicatesData = await apiService.getDuplicates()
      setDuplicates(duplicatesData)
      if (duplicatesData.length > 0) {
        setCurrentStep('review')
      }
    } catch (error) {
      console.error('Failed to load duplicates:', error)
    }
  }

  const loadDuplicateGroups = async () => {
    try {
      const duplicateGroupsData = await apiService.getDuplicateGroups()
      setDuplicateGroups(duplicateGroupsData)
    } catch (error) {
      console.error('Failed to load duplicate groups:', error)
    }
  }

  // Handle file uploads
  const handleFileUpload = async (files: FileList) => {
    setUploadProgress(0)
    const fileArray = Array.from(files).filter(file => file.type.startsWith('image/'))
    
    if (fileArray.length === 0) {
      toast.error('No valid image files selected')
      return
    }

    try {
      if (fileArray.length === 1) {
        // Single file upload
        const file = fileArray[0]
        await apiService.uploadPhoto(file)
        setUploadProgress(100)
        toast.success('Photo uploaded successfully')
      } else {
        // Multiple file upload
        const result = await apiService.uploadMultiplePhotos(fileArray)
        setUploadProgress(100)
        
        if (result.errors.length > 0) {
          result.errors.forEach(error => toast.error(error))
        }
        
        if (result.photos.length > 0) {
          toast.success(`${result.photos.length} photos uploaded successfully`)
        }
      }
      
      // Reload data
      await loadPhotos()
      await loadDuplicates()
      await loadDuplicateGroups()
      await loadCategories() // Refresh photo counts
      
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('Upload failed: ' + (error as Error).message)
    } finally {
      setUploadProgress(0)
    }
  }

  const removeDuplicate = async (photoId: number) => {
    try {
      await apiService.removeDuplicate(photoId)
      setPhotos((current) => current.filter(p => p.id !== photoId))
      setDuplicates((current) => current.filter(p => p.id !== photoId))
      setSelectedPhotos((current) => current.filter(id => id !== photoId))
      setDuplicateGroups((current) => 
        current.map(group => group.filter(p => p.id !== photoId)).filter(group => group.length > 0)
      )
      toast.success('Duplicate removed')
    } catch (error) {
      console.error('Failed to remove duplicate:', error)
      toast.error('Failed to remove duplicate')
    }
  }

  // Enhanced duplicate detection
  const runDuplicateDetection = async () => {
    try {
      setIsDetectingDuplicates(true)
      const result = await apiService.runDuplicateDetection(detectionSettings)
      
      await loadDuplicates()
      await loadDuplicateGroups()
      
      toast.success(`Found ${result.totalFound} duplicates in ${result.groups} groups`)
      
      if (result.totalFound > 0) {
        setCurrentStep('review')
      }
    } catch (error) {
      console.error('Failed to detect duplicates:', error)
      toast.error('Failed to detect duplicates')
    } finally {
      setIsDetectingDuplicates(false)
      setDuplicateDetectionOpen(false)
    }
  }

  const comparePhotosInGroup = (group: PhotoDto[]) => {
    setComparePhotos(group)
    setIsCompareOpen(true)
  }

  const keepPhotoInGroup = async (group: PhotoDto[], keepPhoto: PhotoDto) => {
    try {
      const photoIds = group.map(p => p.id)
      await apiService.removeDuplicateGroup(photoIds, keepPhoto.id)
      
      await loadPhotos()
      await loadDuplicates()
      await loadDuplicateGroups()
      
      toast.success(`Kept "${keepPhoto.name}" and removed ${photoIds.length - 1} duplicates`)
    } catch (error) {
      console.error('Failed to process duplicate group:', error)
      toast.error('Failed to process duplicate group')
    }
  }

  const markAsNotDuplicate = async (photoId: number) => {
    try {
      await apiService.markAsNotDuplicate(photoId)
      await loadDuplicates()
      await loadDuplicateGroups()
      toast.success('Marked as not duplicate')
    } catch (error) {
      console.error('Failed to mark as not duplicate:', error)
      toast.error('Failed to mark as not duplicate')
    }
  }

  const toggleDuplicateGroupSelection = (groupIndex: number) => {
    setSelectedDuplicateGroups((current) => 
      current.includes(groupIndex) 
        ? current.filter(i => i !== groupIndex)
        : [...current, groupIndex]
    )
  }

  const processSelectedGroups = async (action: 'keep-first' | 'keep-largest' | 'keep-newest') => {
    try {
      for (const groupIndex of selectedDuplicateGroups) {
        const group = duplicateGroups[groupIndex]
        if (!group || group.length === 0) continue

        let keepPhoto: PhotoDto
        switch (action) {
          case 'keep-first':
            keepPhoto = group[0]
            break
          case 'keep-largest':
            keepPhoto = group.reduce((largest, current) => 
              current.size > largest.size ? current : largest
            )
            break
          case 'keep-newest':
            keepPhoto = group.reduce((newest, current) => 
              new Date(current.createdAt) > new Date(newest.createdAt) ? current : newest
            )
            break
          default:
            keepPhoto = group[0]
        }

        const photoIds = group.map(p => p.id)
        await apiService.removeDuplicateGroup(photoIds, keepPhoto.id)
      }

      await loadPhotos()
      await loadDuplicates()
      await loadDuplicateGroups()
      
      setSelectedDuplicateGroups([])
      toast.success(`Processed ${selectedDuplicateGroups.length} duplicate groups`)
    } catch (error) {
      console.error('Failed to process selected groups:', error)
      toast.error('Failed to process selected groups')
    }
  }

  // Handle drag and drop for categories
  const handleCategoryDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedCategory(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleCategoryDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleCategoryDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverIndex(null)
    }
  }

  const handleCategoryDrop = async (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedCategory === null || draggedCategory === dropIndex) {
      setDraggedCategory(null)
      setDragOverIndex(null)
      return
    }

    try {
      const newCategories = [...categories]
      const draggedItem = newCategories[draggedCategory]
      
      // Remove dragged item
      newCategories.splice(draggedCategory, 1)
      
      // Insert at new position
      const actualDropIndex = draggedCategory < dropIndex ? dropIndex - 1 : dropIndex
      newCategories.splice(actualDropIndex, 0, draggedItem)
      
      // Update sort orders
      const reorderData = newCategories.map((category, index) => ({
        id: category.id,
        sortOrder: index + 1
      }))
      
      await apiService.reorderCategories(reorderData)
      setCategories(newCategories)
      toast.success('Categories reordered')
      
    } catch (error) {
      console.error('Failed to reorder categories:', error)
      toast.error('Failed to reorder categories')
    } finally {
      setDraggedCategory(null)
      setDragOverIndex(null)
    }
  }

  const handleCategoryDragEnd = () => {
    setDraggedCategory(null)
    setDragOverIndex(null)
  }

  // Bulk selection handlers
  const togglePhotoSelection = (photoId: number) => {
    setSelectedPhotos((current) => 
      current.includes(photoId) 
        ? current.filter(id => id !== photoId)
        : [...current, photoId]
    )
  }

  const selectAllPhotos = () => {
    setSelectedPhotos(photos.map(photo => photo.id))
  }

  const deselectAllPhotos = () => {
    setSelectedPhotos([])
  }

  const deleteSelectedPhotos = async () => {
    try {
      await apiService.deleteMultiplePhotos(selectedPhotos)
      await loadPhotos()
      await loadCategories()
      setSelectedPhotos([])
      toast.success(`${selectedPhotos.length} photos deleted`)
    } catch (error) {
      console.error('Failed to delete photos:', error)
      toast.error('Failed to delete photos')
    }
  }

  const moveSelectedPhotos = async (categoryName: string) => {
    if (!categoryName) return
    
    const category = categories.find(c => c.name === categoryName)
    if (!category) return

    try {
      await apiService.updateMultiplePhotosCategory(selectedPhotos, category.id)
      await loadPhotos()
      await loadCategories()
      setSelectedPhotos([])
      setBulkActionCategory('')
      toast.success(`${selectedPhotos.length} photos moved to ${categoryName}`)
    } catch (error) {
      console.error('Failed to move photos:', error)
      toast.error('Failed to move photos')
    }
  }

  // Create new category
  const createNewCategory = async () => {
    if (!newCategoryName.trim()) return
    
    try {
      const maxSortOrder = Math.max(0, ...categories.map(c => c.sortOrder))
      
      const newCategory = await apiService.createCategory({
        name: newCategoryName.trim(),
        path: `${newCategoryName.trim()}/`,
        pattern: newCategoryPattern.trim() || `Custom category: ${newCategoryName.trim()}`,
        sortOrder: maxSortOrder + 1
      })
      
      setCategories((current) => [...current, newCategory])
      
      // Move selected photos to new category
      if (selectedPhotos.length > 0) {
        await apiService.updateMultiplePhotosCategory(selectedPhotos, newCategory.id)
        await loadPhotos()
        setSelectedPhotos([])
        toast.success(`Category created and ${selectedPhotos.length} photos moved`)
      } else {
        toast.success('Category created successfully')
      }
      
      // Reset form
      setNewCategoryName('')
      setNewCategoryPattern('')
      setIsCreateCategoryOpen(false)
      
    } catch (error) {
      console.error('Failed to create category:', error)
      toast.error('Failed to create category')
    }
  }

  const deleteCategory = async (categoryId: number) => {
    try {
      await apiService.deleteCategory(categoryId)
      await loadCategories()
      await loadPhotos()
      toast.success('Category deleted')
    } catch (error) {
      console.error('Failed to delete category:', error)
      toast.error('Failed to delete category')
    }
  }

  // Edit category functionality
  const openEditCategory = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId)
    if (!category) return
    
    setEditingCategory({
      id: category.id,
      name: category.name,
      pattern: category.pattern
    })
    setIsEditCategoryOpen(true)
  }

  const saveEditCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) return
    
    try {
      const category = categories.find(c => c.id === editingCategory.id)
      if (!category) return
      
      const updatedCategory = await apiService.updateCategory(editingCategory.id, {
        name: editingCategory.name.trim(),
        path: `${editingCategory.name.trim()}/`,
        pattern: editingCategory.pattern.trim() || `Custom category: ${editingCategory.name.trim()}`,
        sortOrder: category.sortOrder
      })
      
      setCategories((current) => 
        current.map(cat => 
          cat.id === editingCategory.id ? updatedCategory : cat
        )
      )
      
      // Reload photos to reflect category name changes
      await loadPhotos()
      
      setEditingCategory(null)
      setIsEditCategoryOpen(false)
      toast.success('Category updated successfully')
      
    } catch (error) {
      console.error('Failed to update category:', error)
      toast.error('Failed to update category')
    }
  }

  const cancelEditCategory = () => {
    setEditingCategory(null)
    setIsEditCategoryOpen(false)
  }

  const FileDropZone = ({ onDrop, children }: { onDrop: (files: FileList) => void, children: React.ReactNode }) => (
    <div
      className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
      onDragOver={(e) => { e.preventDefault() }}
      onDrop={(e) => {
        e.preventDefault()
        if (e.dataTransfer.files) onDrop(e.dataTransfer.files)
      }}
      onClick={() => {
        const input = document.createElement('input')
        input.type = 'file'
        input.multiple = true
        input.accept = 'image/*'
        input.onchange = (e) => {
          const target = e.target as HTMLInputElement
          if (target.files) onDrop(target.files)
        }
        input.click()
      }}
    >
      {children}
    </div>
  )

  return (
    <div className="min-h-screen bg-background p-6">
      <Toaster richColors position="top-right" />
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Photo Sorter</h1>
          <p className="text-muted-foreground">Organize your photos using existing folder patterns and remove duplicates</p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center space-x-4">
          {(['upload', 'analyze', 'sort', 'review'] as const).map((step, index) => (
            <div key={step} className={`flex items-center ${index > 0 ? 'ml-4' : ''}`}>
              {index > 0 && <div className="w-8 h-px bg-border mr-4" />}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === step ? 'bg-primary text-primary-foreground' : 
                ['upload', 'analyze', 'sort', 'review'].indexOf(currentStep) > index ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {index + 1}
              </div>
              <span className="ml-2 text-sm capitalize">{step}</span>
            </div>
          ))}
        </div>

        {/* Upload Structure Analysis */}
        {currentStep === 'upload' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="w-5 h-5" />
                Getting Started
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                <div>
                  <p className="text-lg font-medium mb-2">Welcome to Photo Sorter</p>
                  <p className="text-muted-foreground mb-4">
                    Your intelligent photo organization system is ready. Start by uploading some photos below.
                  </p>
                </div>
                <Button onClick={() => setCurrentStep('sort')}>Get Started</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Categories Display */}
        {categories.length > 0 && currentStep !== 'upload' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Categories ({categories.length})</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Drag to reorder
                  </Badge>
                  
                  {/* Create Category Dialog */}
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
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                createNewCategory()
                              }
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="category-pattern">Pattern Description (Optional)</Label>
                          <Input
                            id="category-pattern"
                            placeholder="e.g., contains: vacation, beach, summer"
                            value={newCategoryPattern}
                            onChange={(e) => setNewCategoryPattern(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                createNewCategory()
                              }
                            }}
                          />
                        </div>
                        {selectedPhotos.length > 0 && (
                          <Alert>
                            <AlertDescription>
                              {selectedPhotos.length} selected photos will be moved to this new category.
                            </AlertDescription>
                          </Alert>
                        )}
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setIsCreateCategoryOpen(false)
                              setNewCategoryName('')
                              setNewCategoryPattern('')
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
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault()
                                  saveEditCategory()
                                }
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-category-pattern">Pattern Description</Label>
                            <Input
                              id="edit-category-pattern"
                              placeholder="e.g., contains: vacation, beach, summer"
                              value={editingCategory.pattern}
                              onChange={(e) => setEditingCategory({
                                ...editingCategory,
                                pattern: e.target.value
                              })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault()
                                  saveEditCategory()
                                }
                              }}
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              onClick={cancelEditCategory}
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
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category, index) => (
                  <div
                    key={`${category.id}-${index}`}
                    className={`border rounded-lg p-4 space-y-2 cursor-move transition-all duration-200 group ${
                      draggedCategory === index 
                        ? 'opacity-50 scale-95' 
                        : dragOverIndex === index 
                          ? 'border-primary shadow-md scale-105' 
                          : 'hover:border-accent hover:shadow-sm'
                    }`}
                    draggable
                    onDragStart={(e) => handleCategoryDragStart(e, index)}
                    onDragOver={(e) => handleCategoryDragOver(e, index)}
                    onDragLeave={handleCategoryDragLeave}
                    onDrop={(e) => handleCategoryDrop(e, index)}
                    onDragEnd={handleCategoryDragEnd}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DotsSixVertical className="w-4 h-4 text-muted-foreground" />
                        <h3 className="font-medium">{category.name}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{category.photoCount} photos</Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditCategory(category.id)}
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
                    <p className="text-sm text-muted-foreground">{category.pattern}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Photo Upload */}
        {currentStep === 'sort' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                Upload New Photos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileDropZone onDrop={handleFileUpload}>
                <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">Upload photos to sort</p>
                <p className="text-muted-foreground mb-4">
                  We'll categorize them based on the patterns we learned
                </p>
                <Button>Select Photos</Button>
              </FileDropZone>
              
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Uploading photos...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Photos Grid */}
        {photos.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Photos ({photos.length})</CardTitle>
                
                {/* Bulk Actions Controls */}
                <div className="flex items-center gap-4">
                  {selectedPhotos.length > 0 && (
                    <>
                      <Badge variant="secondary">
                        {selectedPhotos.length} selected
                      </Badge>
                      
                      <div className="flex items-center gap-2">
                        <Select value={bulkActionCategory} onValueChange={setBulkActionCategory}>
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Move to..." />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.name}>
                                <div className="flex items-center gap-2">
                                  <FolderOpen className="w-4 h-4" />
                                  {category.name}
                                </div>
                              </SelectItem>
                            ))}
                            <SelectItem value="CREATE_NEW">
                              <div className="flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Create New Category...
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button 
                          size="sm" 
                          onClick={() => {
                            if (bulkActionCategory === 'CREATE_NEW') {
                              setIsCreateCategoryOpen(true)
                            } else {
                              moveSelectedPhotos(bulkActionCategory)
                            }
                          }}
                          disabled={!bulkActionCategory}
                        >
                          {bulkActionCategory === 'CREATE_NEW' ? 'Create & Move' : 'Move'}
                        </Button>
                        
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={deleteSelectedPhotos}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={deselectAllPhotos}
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
                      onClick={selectedPhotos.length === photos.length ? deselectAllPhotos : selectAllPhotos}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      {selectedPhotos.length === photos.length ? 'Deselect All' : 'Select All'}
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
                        checked={selectedPhotos.includes(photo.id)}
                        onCheckedChange={() => togglePhotoSelection(photo.id)}
                        className="bg-white/80 backdrop-blur-sm border-white"
                      />
                    </div>
                    
                    <div 
                      className={`aspect-square rounded-lg overflow-hidden bg-muted transition-all duration-200 ${
                        selectedPhotos.includes(photo.id) 
                          ? 'ring-2 ring-primary ring-offset-2' 
                          : ''
                      }`}
                      onClick={() => togglePhotoSelection(photo.id)}
                    >
                      <img
                        src={`${API_BASE_URL}/photos/${photo.id}/file`}
                        alt={photo.name}
                        className="w-full h-full object-cover cursor-pointer"
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
                            src={`${API_BASE_URL}/photos/${photo.id}/file`} 
                            alt={photo.name} 
                            className="w-full h-auto rounded-lg" 
                          />
                          <div className="space-y-2">
                            <p><strong>Size:</strong> {(photo.size / 1024 / 1024).toFixed(2)} MB</p>
                            <p><strong>Category:</strong> {photo.categoryName || 'Uncategorized'}</p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    {photo.categoryName && (
                      <Badge className="absolute top-2 left-2" variant="secondary">
                        {photo.categoryName}
                      </Badge>
                    )}
                    
                    <div className="mt-1">
                      <p className="text-xs truncate">{photo.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Duplicates Review */}
        {(duplicates.length > 0 || duplicateGroups.length > 0) && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Warning className="w-5 h-5 text-orange-500" />
                  Duplicate Detection Results
                </CardTitle>
                
                <div className="flex items-center gap-2">
                  {/* Testing Suite Button */}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowTester(true)}
                  >
                    <TestTube className="w-4 h-4 mr-1" />
                    Test Suite
                  </Button>

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
                                <Label htmlFor="check-hash" className="text-sm">Image Hash</Label>
                                <Switch
                                  id="check-hash"
                                  checked={detectionSettings.checkImageHash}
                                  onCheckedChange={(checked) => 
                                    setDetectionSettings(prev => ({ ...prev, checkImageHash: checked }))
                                  }
                                />
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <Label htmlFor="check-visual" className="text-sm">Visual Similarity (slower)</Label>
                                <Switch
                                  id="check-visual"
                                  checked={detectionSettings.checkVisualSimilarity}
                                  onCheckedChange={(checked) => 
                                    setDetectionSettings(prev => ({ ...prev, checkVisualSimilarity: checked }))
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
                            onClick={runDuplicateDetection}
                            disabled={isDetectingDuplicates}
                          >
                            {isDetectingDuplicates ? (
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
                      
                      <Select onValueChange={(value) => processSelectedGroups(value as any)}>
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
              <Tabs defaultValue="groups" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="groups">Duplicate Groups ({duplicateGroups.length})</TabsTrigger>
                  <TabsTrigger value="individual">Individual Duplicates ({duplicates.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="groups" className="space-y-4">
                  {duplicateGroups.length > 0 ? (
                    <>
                      <Alert>
                        <AlertDescription>
                          Found {duplicateGroups.length} groups with potential duplicates. Review each group and choose which photo to keep.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="space-y-4">
                        {duplicateGroups.map((group, groupIndex) => (
                          <Card key={groupIndex} className="border-orange-200">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={selectedDuplicateGroups.includes(groupIndex)}
                                    onCheckedChange={() => toggleDuplicateGroupSelection(groupIndex)}
                                  />
                                  <h4 className="font-medium">Group {groupIndex + 1}</h4>
                                  <Badge variant="outline">{group.length} photos</Badge>
                                  {group[0]?.similarity && (
                                    <Badge variant="secondary">
                                      {Math.round(group[0].similarity)}% similar
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => comparePhotosInGroup(group)}
                                  >
                                    <ArrowsLeftRight className="w-4 h-4 mr-1" />
                                    Compare
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {group.map((photo) => (
                                  <div key={photo.id} className="relative group">
                                    <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                                      <img
                                        src={`${API_BASE_URL}/photos/${photo.id}/file`}
                                        alt={photo.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-1">
                                      <Button 
                                        size="sm" 
                                        variant="secondary"
                                        onClick={() => keepPhotoInGroup(group, photo)}
                                      >
                                        <Crown className="w-4 h-4" />
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="destructive"
                                        onClick={() => removeDuplicate(photo.id)}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                    
                                    <div className="mt-2 space-y-1">
                                      <p className="text-xs truncate font-medium">{photo.name}</p>
                                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>{(photo.size / 1024 / 1024).toFixed(1)}MB</span>
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
                    </>
                  ) : (
                    <Alert>
                      <AlertDescription>
                        No duplicate groups found. Run duplicate detection to scan for similar photos.
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>
                
                <TabsContent value="individual" className="space-y-4">
                  {duplicates.length > 0 ? (
                    <>
                      <Alert>
                        <AlertDescription>
                          Found {duplicates.length} individual duplicate photos. These are exact matches or very similar files.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="space-y-4">
                        {duplicates.map((duplicate) => (
                          <div key={duplicate.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                            <img
                              src={`${API_BASE_URL}/photos/${duplicate.id}/file`}
                              alt={duplicate.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                            <div className="flex-1">
                              <p className="font-medium">{duplicate.name}</p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{(duplicate.size / 1024 / 1024).toFixed(2)} MB</span>
                                {duplicate.dimensions && (
                                  <span>{duplicate.dimensions.width}×{duplicate.dimensions.height}</span>
                                )}
                                {duplicate.similarity && (
                                  <Badge variant="outline">{Math.round(duplicate.similarity)}% match</Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => markAsNotDuplicate(duplicate.id)}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Not Duplicate
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => removeDuplicate(duplicate.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <Alert>
                      <AlertDescription>
                        No individual duplicates found.
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>
              </Tabs>
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
              {comparePhotos.slice(0, 2).map((photo, index) => (
                <div key={photo.id} className="space-y-4">
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img
                      src={`${API_BASE_URL}/photos/${photo.id}/file`}
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
                          onClick={() => keepPhotoInGroup(comparePhotos, photo)}
                        >
                          <Crown className="w-4 h-4 mr-1" />
                          Keep This
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeDuplicate(photo.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Size:</span>
                        <p>{(photo.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      {photo.dimensions && (
                        <div>
                          <span className="text-muted-foreground">Dimensions:</span>
                          <p>{photo.dimensions.width} × {photo.dimensions.height}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Created:</span>
                        <p>{new Date(photo.createdAt).toLocaleDateString()}</p>
                      </div>
                      {photo.categoryName && (
                        <div>
                          <span className="text-muted-foreground">Category:</span>
                          <p>{photo.categoryName}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Duplicate Detection Testing Suite */}
        {showTester && (
          <Card>
            <CardContent className="p-6">
              <DuplicateDetectionTester onClose={() => setShowTester(false)} />
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {photos.length > 0 && (
          <div className="flex justify-center space-x-4">
            <Button onClick={() => setCurrentStep('sort')} variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Upload More
            </Button>
            <Button 
              onClick={() => setDuplicateDetectionOpen(true)}
              variant="outline"
            >
              <MagnifyingGlass className="w-4 h-4 mr-2" />
              Scan for Duplicates
            </Button>
            <Button disabled>
              <Download className="w-4 h-4 mr-2" />
              Export Organized
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default PhotoSorter