import React from 'react'
import { Folder, Image, Trash2, Upload, Eye, Download, DotsSixVertical, Check, X, FolderOpen, Plus, FolderPlus, PencilSimple } from '@phosphor-icons/react'
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
import { useKV } from '@github/spark/hooks'

interface PhotoFile {
  id: string
  name: string
  size: number
  type: string
  lastModified: number
  dataUrl: string
  suggestedCategory?: string
  isDuplicate?: boolean
  duplicateOf?: string
}

interface Category {
  name: string
  path: string
  count: number
  pattern: string
}

interface AnalysisResult {
  categories: Category[]
  totalPhotos: number
  duplicates: string[]
}

function PhotoSorter() {
  const [photos, setPhotos] = useKV<PhotoFile[]>("photos", [])
  const [categories, setCategories] = useKV<Category[]>("categories", [])
  const [analysis, setAnalysis] = useKV<AnalysisResult | null>("analysis", null)
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)
  const [duplicates, setDuplicates] = useKV<PhotoFile[]>("duplicates", [])
  const [currentStep, setCurrentStep] = React.useState<'upload' | 'analyze' | 'sort' | 'review'>('upload')
  const [draggedCategory, setDraggedCategory] = React.useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null)
  const [selectedPhotos, setSelectedPhotos] = React.useState<string[]>([])
  const [bulkActionCategory, setBulkActionCategory] = React.useState<string>('')
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = React.useState(false)
  const [newCategoryName, setNewCategoryName] = React.useState('')
  const [newCategoryPattern, setNewCategoryPattern] = React.useState('')
  const [editingCategory, setEditingCategory] = React.useState<{ index: number; name: string; pattern: string } | null>(null)
  const [isEditCategoryOpen, setIsEditCategoryOpen] = React.useState(false)

  // Mock analysis of existing folder structure
  const analyzeExistingStructure = async (files: FileList) => {
    setIsAnalyzing(true)
    
    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Mock pattern recognition from file names/paths
    const mockCategories: Category[] = [
      { name: "Events", path: "Events/", count: 45, pattern: "contains: party, wedding, birthday, event" },
      { name: "Nature", path: "Nature/", count: 32, pattern: "contains: landscape, tree, flower, outdoor" },
      { name: "Family", path: "Family/", count: 78, pattern: "contains: family, kids, parents, relatives" },
      { name: "Travel", path: "Travel/", count: 56, pattern: "contains: vacation, trip, city, landmark" },
      { name: "Portraits", path: "Portraits/", count: 23, pattern: "contains: headshot, portrait, person, face" }
    ]
    
    const mockAnalysis: AnalysisResult = {
      categories: mockCategories,
      totalPhotos: 234,
      duplicates: []
    }
    
    setCategories(mockCategories)
    setAnalysis(mockAnalysis)
    setIsAnalyzing(false)
    setCurrentStep('sort')
  }

  // Handle file uploads
  const handleFileUpload = async (files: FileList) => {
    setUploadProgress(0)
    const newPhotos: PhotoFile[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type.startsWith('image/')) continue
      
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(file)
      })
      
      const photo: PhotoFile = {
        id: `photo_${Date.now()}_${i}`,
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        dataUrl,
        suggestedCategory: suggestCategory(file.name)
      }
      
      newPhotos.push(photo)
      setUploadProgress((i + 1) / files.length * 100)
    }
    
    // Detect duplicates
    const allPhotos = [...photos, ...newPhotos]
    const duplicatePhotos = detectDuplicates(allPhotos)
    
    setPhotos((current) => [...current, ...newPhotos])
    setDuplicates(duplicatePhotos)
    setSelectedPhotos([]) // Clear selections when new photos are added
    
    if (duplicatePhotos.length > 0) {
      setCurrentStep('review')
    }
  }

  // Simple category suggestion based on filename
  const suggestCategory = (filename: string): string => {
    const name = filename.toLowerCase()
    
    if (name.includes('wedding') || name.includes('party') || name.includes('birthday')) return 'Events'
    if (name.includes('landscape') || name.includes('nature') || name.includes('flower')) return 'Nature'
    if (name.includes('family') || name.includes('kid') || name.includes('mom') || name.includes('dad')) return 'Family'
    if (name.includes('travel') || name.includes('vacation') || name.includes('trip')) return 'Travel'
    if (name.includes('portrait') || name.includes('headshot')) return 'Portraits'
    
    return 'Unsorted'
  }

  // Simple duplicate detection based on name and size
  const detectDuplicates = (photoList: PhotoFile[]): PhotoFile[] => {
    const duplicates: PhotoFile[] = []
    const seen = new Map<string, PhotoFile>()
    
    photoList.forEach(photo => {
      const key = `${photo.name}_${photo.size}`
      if (seen.has(key)) {
        duplicates.push({
          ...photo,
          isDuplicate: true,
          duplicateOf: seen.get(key)?.id
        })
      } else {
        seen.set(key, photo)
      }
    })
    
    return duplicates
  }

  const removeDuplicate = (photoId: string) => {
    setPhotos((current) => current.filter(p => p.id !== photoId))
    setDuplicates((current) => current.filter(p => p.id !== photoId))
    setSelectedPhotos((current) => current.filter(id => id !== photoId)) // Remove from selection if selected
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
    // Only clear if we're leaving the entire drop zone, not just moving between children
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverIndex(null)
    }
  }

  const handleCategoryDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedCategory === null || draggedCategory === dropIndex) {
      setDraggedCategory(null)
      setDragOverIndex(null)
      return
    }

    setCategories((current) => {
      const newCategories = [...current]
      const draggedItem = newCategories[draggedCategory]
      
      // Remove dragged item
      newCategories.splice(draggedCategory, 1)
      
      // Insert at new position
      const actualDropIndex = draggedCategory < dropIndex ? dropIndex - 1 : dropIndex
      newCategories.splice(actualDropIndex, 0, draggedItem)
      
      return newCategories
    })

    setDraggedCategory(null)
    setDragOverIndex(null)
  }

  const handleCategoryDragEnd = () => {
    setDraggedCategory(null)
    setDragOverIndex(null)
  }

  // Bulk selection handlers
  const togglePhotoSelection = (photoId: string) => {
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

  const deleteSelectedPhotos = () => {
    setPhotos((current) => current.filter(photo => !selectedPhotos.includes(photo.id)))
    setDuplicates((current) => current.filter(duplicate => !selectedPhotos.includes(duplicate.id)))
    setSelectedPhotos([])
  }

  const moveSelectedPhotos = (categoryName: string) => {
    if (!categoryName) return
    
    setPhotos((current) => 
      current.map(photo => 
        selectedPhotos.includes(photo.id) 
          ? { ...photo, suggestedCategory: categoryName }
          : photo
      )
    )
    setSelectedPhotos([])
    setBulkActionCategory('')
  }

  // Create new category
  const createNewCategory = () => {
    if (!newCategoryName.trim()) return
    
    const newCategory: Category = {
      name: newCategoryName.trim(),
      path: `${newCategoryName.trim()}/`,
      count: selectedPhotos.length,
      pattern: newCategoryPattern.trim() || `Custom category: ${newCategoryName.trim()}`
    }
    
    setCategories((current) => [...current, newCategory])
    
    // Move selected photos to new category
    if (selectedPhotos.length > 0) {
      setPhotos((current) => 
        current.map(photo => 
          selectedPhotos.includes(photo.id) 
            ? { ...photo, suggestedCategory: newCategoryName.trim() }
            : photo
        )
      )
      setSelectedPhotos([])
    }
    
    // Reset form
    setNewCategoryName('')
    setNewCategoryPattern('')
    setIsCreateCategoryOpen(false)
  }

  const deleteCategory = (categoryName: string) => {
    setCategories((current) => current.filter(cat => cat.name !== categoryName))
    
    // Move photos from deleted category to "Unsorted"
    setPhotos((current) => 
      current.map(photo => 
        photo.suggestedCategory === categoryName 
          ? { ...photo, suggestedCategory: 'Unsorted' }
          : photo
      )
    )
  }

  // Edit category functionality
  const openEditCategory = (index: number) => {
    const category = categories[index]
    setEditingCategory({
      index,
      name: category.name,
      pattern: category.pattern
    })
    setIsEditCategoryOpen(true)
  }

  const saveEditCategory = () => {
    if (!editingCategory || !editingCategory.name.trim()) return
    
    const oldCategoryName = categories[editingCategory.index].name
    const newCategoryName = editingCategory.name.trim()
    
    // Update category
    setCategories((current) => 
      current.map((cat, index) => 
        index === editingCategory.index 
          ? { 
              ...cat, 
              name: newCategoryName,
              pattern: editingCategory.pattern.trim() || `Custom category: ${newCategoryName}`
            }
          : cat
      )
    )
    
    // Update photos that belong to this category
    if (oldCategoryName !== newCategoryName) {
      setPhotos((current) => 
        current.map(photo => 
          photo.suggestedCategory === oldCategoryName 
            ? { ...photo, suggestedCategory: newCategoryName }
            : photo
        )
      )
    }
    
    // Close edit dialog
    setEditingCategory(null)
    setIsEditCategoryOpen(false)
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
                Analyze Existing Structure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileDropZone onDrop={(files) => analyzeExistingStructure(files)}>
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">Upload your existing photo folders</p>
                <p className="text-muted-foreground mb-4">
                  Drop your organized photo folders here so we can learn your categorization patterns
                </p>
                <Button>Select Folders</Button>
              </FileDropZone>
              
              {isAnalyzing && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing folder structure...</span>
                  </div>
                  <Progress value={75} className="w-full" />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Categories Display */}
        {analysis && currentStep !== 'upload' && (
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
                    key={`${category.name}-${index}`}
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
                        <Badge variant="secondary">{category.count} photos</Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditCategory(index)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <PencilSimple className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteCategory(category.name)}
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
                              <SelectItem key={category.name} value={category.name}>
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
                        src={photo.dataUrl}
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
                          <img src={photo.dataUrl} alt={photo.name} className="w-full h-auto rounded-lg" />
                          <div className="space-y-2">
                            <p><strong>Size:</strong> {(photo.size / 1024 / 1024).toFixed(2)} MB</p>
                            <p><strong>Suggested Category:</strong> {photo.suggestedCategory}</p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    {photo.suggestedCategory && (
                      <Badge className="absolute top-2 left-2" variant="secondary">
                        {photo.suggestedCategory}
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
        {duplicates.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Duplicates Found ({duplicates.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertDescription>
                  We found {duplicates.length} duplicate photos. Review and remove them to keep your library clean.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                {duplicates.map((duplicate) => (
                  <div key={duplicate.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <img
                      src={duplicate.dataUrl}
                      alt={duplicate.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{duplicate.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(duplicate.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeDuplicate(duplicate.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {photos.length > 0 && (
          <div className="flex justify-center space-x-4">
            <Button onClick={() => setCurrentStep('upload')} variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Upload More
            </Button>
            <Button>
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