import React from 'react'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'
import { localPhotoService, LocalPhoto, LocalCategory, LocalDuplicateGroup, DuplicateDetectionOptions } from '@/services/local'
import { oneDriveService, OneDriveItem, CategoryPattern, DuplicateGroup, OneDriveUser } from '@/services/onedrive'

type StorageProvider = 'local' | 'onedrive'

export interface UnifiedPhoto {
  id: string
  name: string
  size: number
  lastModified: string | number
  url: string
  thumbnailUrl?: string
  dimensions?: { width: number; height: number }
  folder?: string
  type?: string
  provider: StorageProvider
}

export interface UnifiedCategory {
  id: string
  name: string
  patterns: string[]
  color: string
  folder: string
  autoSort: boolean
  sortOrder: number
}

export interface UnifiedDuplicateGroup {
  id: string
  photos: UnifiedPhoto[]
  similarity: number
  reason: string[]
}

export interface Progress {
  operation: string
  current: number
  total: number
}

export interface TestResult {
  threshold: number
  methods: string[]
  groupsFound: number
  totalDuplicates: number
  executionTime: number
  accuracy?: number
}

export function usePhotoStorage() {
  const [currentProvider, setCurrentProvider] = useKV<StorageProvider>('photo-storage-provider', 'local')
  const [localPhotos, setLocalPhotos] = useKV<LocalPhoto[]>('local-photos', [])
  const [localCategories, setLocalCategories] = useKV<LocalCategory[]>('local-categories', [])
  const [localDuplicates, setLocalDuplicates] = useKV<LocalDuplicateGroup[]>('local-duplicates', [])
  
  // OneDrive state
  const [oneDriveUser, setOneDriveUser] = React.useState<OneDriveUser | null>(null)
  const [oneDrivePhotos, setOneDrivePhotos] = React.useState<OneDriveItem[]>([])
  const [oneDriveCategories, setOneDriveCategories] = useKV<CategoryPattern[]>('onedrive-categories', [])
  const [oneDriveDuplicates, setOneDriveDuplicates] = React.useState<DuplicateGroup[]>([])
  
  // Common state
  const [filteredPhotos, setFilteredPhotos] = React.useState<UnifiedPhoto[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [progress, setProgress] = React.useState<Progress | null>(null)
  const [isLoadingPhotos, setIsLoadingPhotos] = React.useState(false)
  const [isDuplicateDetectionRunning, setIsDuplicateDetectionRunning] = React.useState(false)

  // Convert between different photo formats
  const convertLocalToUnified = (photo: LocalPhoto): UnifiedPhoto => ({
    id: photo.id,
    name: photo.name,
    size: photo.size,
    lastModified: photo.lastModified,
    url: photo.url,
    thumbnailUrl: photo.thumbnailUrl,
    dimensions: photo.dimensions,
    folder: photo.folder,
    type: photo.type,
    provider: 'local'
  })

  const convertOneDriveToUnified = (item: OneDriveItem): UnifiedPhoto => ({
    id: item.id,
    name: item.name,
    size: item.size,
    lastModified: item.lastModifiedDateTime,
    url: `https://graph.microsoft.com/v1.0/me/drive/items/${item.id}/content`,
    thumbnailUrl: oneDriveService.getThumbnailUrl(item) || undefined,
    dimensions: item.image ? { width: item.image.width, height: item.image.height } : undefined,
    folder: item.parentReference?.path || undefined,
    provider: 'onedrive'
  })

  const convertLocalCategoryToUnified = (category: LocalCategory): UnifiedCategory => category
  const convertOneDriveCategoryToUnified = (category: CategoryPattern): UnifiedCategory => category

  const convertLocalDuplicateToUnified = (group: LocalDuplicateGroup): UnifiedDuplicateGroup => ({
    id: group.id,
    photos: group.photos.map(convertLocalToUnified),
    similarity: group.similarity,
    reason: group.reason
  })

  const convertOneDriveDuplicateToUnified = (group: DuplicateGroup): UnifiedDuplicateGroup => ({
    id: group.id,
    photos: group.items.map(convertOneDriveToUnified),
    similarity: group.similarity,
    reason: group.reason
  })

  // Get unified data based on current provider
  const photos = React.useMemo(() => {
    if (currentProvider === 'local') {
      return (localPhotos || []).map(convertLocalToUnified)
    } else {
      return oneDrivePhotos.map(convertOneDriveToUnified)
    }
  }, [currentProvider, localPhotos, oneDrivePhotos])

  const categories = React.useMemo(() => {
    if (currentProvider === 'local') {
      return (localCategories || []).map(convertLocalCategoryToUnified)
    } else {
      return (oneDriveCategories || []).map(convertOneDriveCategoryToUnified)
    }
  }, [currentProvider, localCategories, oneDriveCategories])

  const duplicateGroups = React.useMemo(() => {
    if (currentProvider === 'local') {
      return (localDuplicates || []).map(convertLocalDuplicateToUnified)
    } else {
      return oneDriveDuplicates.map(convertOneDriveDuplicateToUnified)
    }
  }, [currentProvider, localDuplicates, oneDriveDuplicates, convertLocalDuplicateToUnified, convertOneDriveDuplicateToUnified])

  // Provider switching
  const switchProvider = async (provider: StorageProvider) => {
    setCurrentProvider(provider)
    setError(null)
    setFilteredPhotos([])
    
    if (provider === 'onedrive' && !oneDriveService.isAuthenticated()) {
      // Don't auto-authenticate, let user click the button
      return
    }
  }

  // Local photo operations
  const loadLocalPhotos = async (files?: FileList | File[]) => {
    if (!files) {
      try {
        if (localPhotoService.isFileSystemAccessSupported()) {
          console.log(`=== Directory Selection Test ===`)
          const dirHandle = await (window as any).showDirectoryPicker()
          console.log(`Selected directory: ${dirHandle.name}`)
          setIsLoadingPhotos(true)
          setProgress({ operation: 'Loading photos from folder...', current: 0, total: 100 })
          
          const photos = await localPhotoService.loadPhotosFromDirectory(dirHandle)
          setLocalPhotos(localPhotoService.getPhotos())
          
          console.log(`=== Load Results ===`)
          console.log(`Loaded ${photos.length} photos from directory`)
          console.log('File type breakdown:', localPhotoService.getFileTypeStatistics())
          console.log('Folder breakdown:', localPhotoService.getFolderStatistics())
          
          toast.success(`Loaded ${photos.length} photos from folder`)
        } else {
          // Fallback to file input
          const input = document.createElement('input')
          input.type = 'file'
          input.multiple = true
          input.accept = 'image/*'
          input.webkitdirectory = true
          
          input.onchange = (e) => {
            const files = (e.target as HTMLInputElement).files
            if (files) {
              loadLocalPhotos(files)
            }
          }
          
          input.click()
          return
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          return // User cancelled
        }
        console.error('Error loading photos:', error)
        setError('Failed to load photos from folder')
        toast.error('Failed to load photos from folder')
      } finally {
        setIsLoadingPhotos(false)
        setProgress(null)
      }
    } else {
      try {
        console.log(`=== File List Processing Test ===`)
        setIsLoadingPhotos(true)
        setProgress({ operation: 'Processing photos...', current: 0, total: files.length })
        
        const photos = await localPhotoService.loadPhotosFromFiles(files)
        setLocalPhotos(localPhotoService.getPhotos())
        
        console.log(`=== Processing Results ===`)
        console.log(`Processed ${photos.length} photos from file list`)
        console.log('File type breakdown:', localPhotoService.getFileTypeStatistics())
        console.log('Folder breakdown:', localPhotoService.getFolderStatistics())
        
        toast.success(`Loaded ${photos.length} photos`)
      } catch (error) {
        console.error('Error processing photos:', error)
        setError('Failed to process selected photos')
        toast.error('Failed to process selected photos')
      } finally {
        setIsLoadingPhotos(false)
        setProgress(null)
      }
    }
  }

  // OneDrive operations
  const authenticateOneDrive = async () => {
    try {
      setIsLoading(true)
      const authUrl = oneDriveService.getAuthUrl()
      window.location.href = authUrl
    } catch (error) {
      console.error('Authentication error:', error)
      setError('Failed to authenticate with OneDrive')
      toast.error('Failed to authenticate with OneDrive')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOneDriveCallback = async (hash: string): Promise<boolean> => {
    try {
      const success = await oneDriveService.exchangeCodeForTokens(hash)
      if (success) {
        const user = await oneDriveService.getCurrentUser()
        setOneDriveUser(user)
        toast.success(`Connected to OneDrive as ${user.displayName}`)
        return true
      }
      return false
    } catch (error) {
      console.error('OneDrive callback error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown authentication error'
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    }
  }

  const loadOneDrivePhotos = async () => {
    if (!oneDriveService.isAuthenticated()) {
      setError('Not authenticated with OneDrive')
      return
    }

    try {
      setIsLoadingPhotos(true)
      setProgress({ operation: 'Loading photos from OneDrive...', current: 0, total: 100 })
      
      const photos = await oneDriveService.getAllPhotos()
      const detailedPhotos = await oneDriveService.getPhotoDetails(photos)
      
      setOneDrivePhotos(detailedPhotos)
      toast.success(`Loaded ${detailedPhotos.length} photos from OneDrive`)
    } catch (error) {
      console.error('Error loading OneDrive photos:', error)
      setError('Failed to load photos from OneDrive')
      toast.error('Failed to load photos from OneDrive')
    } finally {
      setIsLoadingPhotos(false)
      setProgress(null)
    }
  }

  const logoutOneDrive = () => {
    oneDriveService.logout()
    setOneDriveUser(null)
    setOneDrivePhotos([])
    setOneDriveDuplicates([])
    toast.success('Logged out of OneDrive')
  }

  // Unified operations
  const loadPhotos = async (refresh = false, files?: FileList | File[]) => {
    if (currentProvider === 'local') {
      await loadLocalPhotos(files)
    } else {
      if (refresh || oneDrivePhotos.length === 0) {
        await loadOneDrivePhotos()
      }
    }
  }

  const createCategory = async (categoryData: Omit<UnifiedCategory, 'id'>) => {
    try {
      if (currentProvider === 'local') {
        const newCategory = await localPhotoService.createCategory(categoryData)
        setLocalCategories(localPhotoService.getCategories())
        toast.success(`Created category: ${newCategory.name}`)
      } else {
        // OneDrive category creation
        const newCategory: CategoryPattern = {
          ...categoryData,
          id: `category_${Date.now()}`
        }
        setOneDriveCategories(current => [...(current || []), newCategory])
        toast.success(`Created category: ${newCategory.name}`)
      }
    } catch (error) {
      console.error('Error creating category:', error)
      toast.error('Failed to create category')
    }
  }

  const updateCategory = async (id: string, updates: Partial<UnifiedCategory>) => {
    try {
      if (currentProvider === 'local') {
        const updated = await localPhotoService.updateCategory(id, updates)
        if (updated) {
          setLocalCategories(localPhotoService.getCategories())
          toast.success('Category updated')
        }
      } else {
        setOneDriveCategories(current =>
          (current || []).map(cat => cat.id === id ? { ...cat, ...updates } : cat)
        )
        toast.success('Category updated')
      }
    } catch (error) {
      console.error('Error updating category:', error)
      toast.error('Failed to update category')
    }
  }

  const deleteCategory = async (id: string) => {
    try {
      if (currentProvider === 'local') {
        const deleted = await localPhotoService.deleteCategory(id)
        if (deleted) {
          setLocalCategories(localPhotoService.getCategories())
          toast.success('Category deleted')
        }
      } else {
        setOneDriveCategories(current => (current || []).filter(cat => cat.id !== id))
        toast.success('Category deleted')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Failed to delete category')
    }
  }

  const deletePhotos = async (photoIds: string[]) => {
    try {
      if (currentProvider === 'local') {
        await localPhotoService.deletePhotos(photoIds)
        setLocalPhotos(localPhotoService.getPhotos())
        toast.success(`Deleted ${photoIds.length} photos`)
      } else {
        await oneDriveService.deleteItems(photoIds)
        setOneDrivePhotos(current => current.filter(photo => !photoIds.includes(photo.id)))
        toast.success(`Deleted ${photoIds.length} photos`)
      }
    } catch (error) {
      console.error('Error deleting photos:', error)
      toast.error('Failed to delete photos')
    }
  }

  const runDuplicateDetection = async (options: DuplicateDetectionOptions) => {
    if (photos.length === 0) {
      toast.error('No photos loaded')
      return
    }

    try {
      setIsDuplicateDetectionRunning(true)
      setProgress({ operation: 'Scanning for duplicates...', current: 0, total: photos.length })

      if (currentProvider === 'local') {
        const groups = await localPhotoService.findDuplicates(options)
        setLocalDuplicates(groups)
        toast.success(`Found ${groups.length} duplicate groups`)
      } else {
        const groups = await oneDriveService.findDuplicatePhotos(oneDrivePhotos, options)
        setOneDriveDuplicates(groups)
        toast.success(`Found ${groups.length} duplicate groups`)
      }
    } catch (error) {
      console.error('Error detecting duplicates:', error)
      toast.error('Failed to detect duplicates')
    } finally {
      setIsDuplicateDetectionRunning(false)
      setProgress(null)
    }
  }

  const filterPhotos = (query: string, categoryId?: string) => {
    const effectiveCategoryId = categoryId === 'all' ? undefined : categoryId
    
    if (currentProvider === 'local') {
      const filtered = localPhotoService.filterPhotos(query, effectiveCategoryId)
      setFilteredPhotos(filtered.map(convertLocalToUnified))
    } else {
      let filtered = [...oneDrivePhotos]
      
      if (query.trim()) {
        const lowerQuery = query.toLowerCase()
        filtered = filtered.filter(photo =>
          photo.name.toLowerCase().includes(lowerQuery)
        )
      }
      
      if (effectiveCategoryId) {
        const category = (oneDriveCategories || []).find(cat => cat.id === effectiveCategoryId)
        if (category) {
          filtered = filtered.filter(photo =>
            category.patterns.some(pattern =>
              photo.name.toLowerCase().includes(pattern.toLowerCase())
            )
          )
        }
      }
      
      setFilteredPhotos(filtered.map(convertOneDriveToUnified))
    }
  }

  const runAdvancedDuplicateTest = async (thresholds: number[], methods: string[]): Promise<TestResult[]> => {
    const results: TestResult[] = []
    
    for (const threshold of thresholds) {
      const startTime = performance.now()
      
      const options: DuplicateDetectionOptions = {
        similarityThreshold: threshold,
        checkFileSize: methods.includes('fileSize'),
        checkFilename: methods.includes('filename'),
        checkHash: methods.includes('hash')
      }
      
      try {
        setProgress({ operation: `Testing ${threshold}% threshold...`, current: 0, total: thresholds.length })
        
        let groups: UnifiedDuplicateGroup[] = []
        
        if (currentProvider === 'local') {
          const localGroups = await localPhotoService.findDuplicates(options)
          groups = localGroups.map(convertLocalDuplicateToUnified)
        } else {
          const oneDriveGroups = await oneDriveService.findDuplicatePhotos(oneDrivePhotos, options)
          groups = oneDriveGroups.map(convertOneDriveDuplicateToUnified)
        }
        
        const endTime = performance.now()
        const executionTime = Math.round(endTime - startTime)
        
        const totalDuplicates = groups.reduce((sum, group) => sum + group.photos.length, 0)
        
        // Calculate accuracy based on group quality
        const accuracy = groups.length > 0 ? 
          groups.reduce((sum, group) => sum + group.similarity, 0) / groups.length : 100
        
        results.push({
          threshold,
          methods,
          groupsFound: groups.length,
          totalDuplicates,
          executionTime,
          accuracy
        })
        
        console.log(`Threshold ${threshold}%: ${groups.length} groups, ${totalDuplicates} duplicates (${executionTime}ms)`)
        
      } catch (error) {
        console.error(`Error testing threshold ${threshold}%:`, error)
        results.push({
          threshold,
          methods,
          groupsFound: 0,
          totalDuplicates: 0,
          executionTime: 0,
          accuracy: 0
        })
      }
    }
    
    setProgress(null)
    return results
  }

  // Auto-filter when photos change
  React.useEffect(() => {
    setFilteredPhotos(photos)
  }, [photos])

  return {
    // Provider management
    currentProvider,
    switchProvider,
    isFileSystemAccessSupported: localPhotoService.isFileSystemAccessSupported(),
    
    // Authentication (OneDrive)
    isOneDriveAuthenticated: oneDriveService.isAuthenticated(),
    oneDriveUser,
    authenticateOneDrive,
    handleOneDriveCallback,
    logoutOneDrive,
    
    // Common data
    photos,
    filteredPhotos,
    categories,
    duplicateGroups,
    
    // State
    isLoading,
    isLoadingPhotos,
    isDuplicateDetectionRunning,
    error,
    progress,
    
    // Operations
    loadPhotos,
    createCategory,
    updateCategory,
    deleteCategory,
    deletePhotos,
    runDuplicateDetection,
    runAdvancedDuplicateTest,
    filterPhotos,
    
    // Utility
    formatFileSize: currentProvider === 'local' 
      ? localPhotoService.formatFileSize 
      : oneDriveService.formatFileSize
  }
}