import React from 'react'
import { Plus, PencilSimple, Trash, FolderPlus } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UnifiedCategory, UnifiedPhoto } from '@/hooks/usePhotoStorage'

interface CategoriesGridProps {
  categories: UnifiedCategory[]
  photos: UnifiedPhoto[]
  selectedItemsCount: number
  onCreateCategory: (category: {
    name: string
    patterns: string[]
    folder: string
    color: string
    autoSort: boolean
    sortOrder: number
  }) => Promise<void>
  onUpdateCategory: (id: string, category: Partial<UnifiedCategory>) => Promise<void>
  onDeleteCategory: (id: string) => Promise<void>
}

export function CategoriesGrid({
  categories,
  photos,
  selectedItemsCount,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory
}: CategoriesGridProps) {
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = React.useState(false)
  const [newCategoryName, setNewCategoryName] = React.useState('')
  const [newCategoryPatterns, setNewCategoryPatterns] = React.useState('')
  const [newCategoryColor, setNewCategoryColor] = React.useState('#3b82f6')
  const [editingCategory, setEditingCategory] = React.useState<UnifiedCategory | null>(null)
  const [isEditCategoryOpen, setIsEditCategoryOpen] = React.useState(false)

  const createNewCategory = async () => {
    if (!newCategoryName.trim()) return

    try {
      const patterns = newCategoryPatterns
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 0)
      
      const finalPatterns = patterns.length > 0 ? patterns : [newCategoryName.toLowerCase()]
      
      await onCreateCategory({
        name: newCategoryName.trim(),
        patterns: finalPatterns,
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
    } catch (error) {
      console.error('Error creating category:', error)
    }
  }

  const openEditCategory = (category: UnifiedCategory) => {
    setEditingCategory({ ...category })
    setIsEditCategoryOpen(true)
  }

  const saveEditCategory = async () => {
    if (!editingCategory) return
    
    try {
      const updatedCategory = {
        ...editingCategory,
        name: editingCategory.name.trim(),
        patterns: editingCategory.patterns
          .map(p => p.trim())
          .filter(p => p.length > 0)
      }

      await onUpdateCategory(editingCategory.id, updatedCategory)
      setEditingCategory(null)
      setIsEditCategoryOpen(false)
    } catch (error) {
      console.error('Error updating category:', error)
    }
  }

  if (categories.length === 0) {
    return null
  }

  return (
    <>
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
                  {selectedItemsCount > 0 && (
                    <Alert>
                      <AlertDescription>
                        {selectedItemsCount} selected photos will be moved to this new category.
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
                      {photos.filter(photo => 
                        category.patterns.some(pattern =>
                          photo.name.toLowerCase().includes(pattern.toLowerCase())
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
                      onClick={() => onDeleteCategory(category.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash className="w-4 h-4" />
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
    </>
  )
}