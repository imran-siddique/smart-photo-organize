import React from 'react'
import { toast, Toaster } from 'sonner'

// Hooks
import { usePhotoStorage, UnifiedPhoto, UnifiedCategory } from '@/hooks/usePhotoStorage'
import { useSmartAlbums } from '@/hooks/useSmartAlbums'

// Components
import { TestingPanel } from '@/components/TestingPanel'
import { TestDocumentation } from '@/components/TestDocumentation'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { LoadingState } from '@/components/LoadingState'
import { ProviderSelection } from '@/components/ProviderSelection'
import { OneDriveAuth } from '@/components/OneDriveAuth'
import { AppHeader } from '@/components/AppHeader'
import { ProgressBar } from '@/components/ProgressBar'
import { SearchAndFilter } from '@/components/SearchAndFilter'
import { CategoriesGrid } from '@/components/CategoriesGrid'
import { PhotoLoader } from '@/components/PhotoLoader'
import { PhotosGrid } from '@/components/PhotosGrid'
import { DuplicatesReview } from '@/components/DuplicatesReview'
import { PhotoComparison } from '@/components/PhotoComparison'
import { ActionButtons } from '@/components/ActionButtons'
import { EmptyState } from '@/components/EmptyState'
import { SmartAlbumsGrid } from '@/components/SmartAlbumsGrid'
import { SmartAlbumRulesManager } from '@/components/SmartAlbumRulesManager'

// Services and utilities
import { localPhotoService } from '@/services/local'
import { log } from '@/lib/logger'
import { sanitizeTextInput, sanitizeColor, sanitizeFiles, rateLimiter } from '@/lib/sanitizer'
import { performanceMonitor, memoryMonitor, productionChecks } from '@/lib/performance'

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
    runAdvancedDuplicateTest,
    filterPhotos,
    formatFileSize,
    setError
  } = usePhotoStorage()

  // Smart Albums hook
  const {
    albums,
    customRules,
    suggestedRules,
    predefinedRules,
    statistics: smartAlbumStats,
    isGenerating: isGeneratingSmartAlbums,
    generateSmartAlbums,
    generateSuggestedRules,
    acceptSuggestedRule,
    rejectSuggestedRule,
    createCustomRule,
    updateCustomRule,
    deleteCustomRule
  } = useSmartAlbums(photos)

  // State for UI components
  const [selectedItems, setSelectedItems] = React.useState<string[]>([])
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = React.useState<string>('all')
  const [sortBy, setSortBy] = React.useState<'name' | 'date' | 'size'>('name')
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc')
  const [showProviderSelection, setShowProviderSelection] = React.useState(!currentProvider || currentProvider === 'local')
  const [showTestingPanel, setShowTestingPanel] = React.useState(false)
  const [showSmartAlbums, setShowSmartAlbums] = React.useState(false)
  const [showSmartAlbumRules, setShowSmartAlbumRules] = React.useState(false)

  // Duplicate detection state
  const [selectedDuplicateGroups, setSelectedDuplicateGroups] = React.useState<string[]>([])
  const [compareItems, setCompareItems] = React.useState<UnifiedPhoto[]>([])
  const [isCompareOpen, setIsCompareOpen] = React.useState(false)

  const [detectionSettings, setDetectionSettings] = React.useState({
    similarityThreshold: 85,
    checkFileSize: true,
    checkFilename: true,
    checkHash: true
  })

  // Get statistics for testing with memoization
  const fileTypeStats = React.useMemo(() => {
    if (currentProvider === 'local' && photos.length > 0) {
      return localPhotoService.getFileTypeStatistics()
    }
    return {}
  }, [photos.length, currentProvider])

  const folderStats = React.useMemo(() => {
    if (currentProvider === 'local' && photos.length > 0) {
      return localPhotoService.getFolderStatistics()
    }
    return {}
  }, [photos.length, currentProvider])

  // Run production readiness checks on mount
  React.useEffect(() => {
    // Check if we're in production by looking for development-specific features
    const isDevelopment = import.meta.env?.DEV || window.location.hostname === 'localhost'
    
    if (!isDevelopment) {
      productionChecks.checkEnvironment()
      productionChecks.checkPerformance()
    }
  }, [])

  // Handle auth callback for OneDrive with error handling
  React.useEffect(() => {
    if (currentProvider !== 'onedrive') return
    
    const hash = window.location.hash
    
    if (hash && hash.includes('access_token')) {
      log.info('Processing OneDrive authentication callback')
      handleOneDriveCallback(hash).then(success => {
        if (success) {
          window.history.replaceState({}, document.title, window.location.pathname)
          log.info('OneDrive authentication successful')
        }
      }).catch(error => {
        log.error('OneDrive authentication error', {}, error as Error)
        toast.error('Failed to authenticate with OneDrive')
        setError('Authentication failed. Please try again.')
      })
    } else if (hash && hash.includes('error')) {
      const params = new URLSearchParams(hash.replace('#', ''))
      const error = params.get('error')
      const errorDescription = params.get('error_description')
      
      log.error('OAuth error', { error, errorDescription })
      
      let errorMessage = 'Authentication failed'
      if (error === 'access_denied') {
        errorMessage = 'Access was denied. Please try again and grant the necessary permissions.'
      } else if (errorDescription) {
        errorMessage = errorDescription
      }
      
      toast.error(errorMessage)
      setError(errorMessage)
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [handleOneDriveCallback, currentProvider, setError])

  // Filter photos effect
  React.useEffect(() => {
    try {
      filterPhotos(searchQuery, selectedCategoryFilter)
    } catch (error) {
      log.error('Error filtering photos', { searchQuery, selectedCategoryFilter }, error as Error)
      toast.error('Failed to filter photos')
    }
  }, [searchQuery, selectedCategoryFilter, photos, filterPhotos])

  // Sorted photos memoization
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

  // Event handlers
  const handleProviderSelect = (provider: 'local' | 'onedrive') => {
    switchProvider(provider)
    setShowProviderSelection(false)
  }

  const handleFileSelect = (files: FileList) => {
    const sanitizedFiles = sanitizeFiles(files)
    if (sanitizedFiles.length > 0) {
      loadPhotos(false, files)
    }
  }

  const handleToggleSelection = React.useCallback((itemId: string) => {
    setSelectedItems(current => 
      current.includes(itemId)
        ? current.filter(id => id !== itemId)
        : [...current, itemId]
    )
  }, [])

  const handleSelectAll = React.useCallback(() => {
    setSelectedItems(sortedPhotos.map(photo => photo.id))
  }, [sortedPhotos])

  const handleDeselectAll = React.useCallback(() => {
    setSelectedItems([])
  }, [])

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) return
    
    try {
      await deletePhotos(selectedItems)
      setSelectedItems([])
      toast.success(`Deleted ${selectedItems.length} photos`)
    } catch (error) {
      log.error('Error deleting photos', { selectedItemsCount: selectedItems.length }, error as Error)
      toast.error('Failed to delete photos')
    }
  }

  // Duplicate detection handlers
  const handleCreateCategory = async (categoryData: {
    name: string
    patterns: string[]
    folder: string
    color: string
    autoSort: boolean
    sortOrder: number
  }) => {
    const trimmedName = sanitizeTextInput(categoryData.name, 100)
    if (!trimmedName) {
      toast.error('Category name cannot be empty')
      throw new Error('Category name cannot be empty')
    }

    if (categories.some(cat => cat.name.toLowerCase() === trimmedName.toLowerCase())) {
      toast.error('A category with this name already exists')
      throw new Error('A category with this name already exists')
    }

    if (rateLimiter.isRateLimited('create-category', 5, 60000)) {
      toast.error('Too many category creation requests. Please wait a moment.')
      throw new Error('Rate limited')
    }

    log.info('Creating new category', { name: trimmedName })
    
    const sanitizedColor = sanitizeColor(categoryData.color)
    
    await createCategory({
      ...categoryData,
      name: trimmedName,
      color: sanitizedColor
    })
    
    log.info('Category created successfully', { name: trimmedName, patterns: categoryData.patterns })
    toast.success(`Category "${trimmedName}" created successfully`)
  }

  const handleUpdateCategory = async (id: string, category: Partial<UnifiedCategory>) => {
    const trimmedName = category.name?.trim()
    if (trimmedName && trimmedName.length > 100) {
      toast.error('Category name must be less than 100 characters')
      throw new Error('Category name too long')
    }

    if (trimmedName && categories.some(cat => 
      cat.id !== id && 
      cat.name.toLowerCase() === trimmedName.toLowerCase()
    )) {
      toast.error('A category with this name already exists')
      throw new Error('Duplicate category name')
    }
    
    try {
      await updateCategory(id, category)
      toast.success(`Category "${trimmedName}" updated successfully`)
    } catch (error) {
      log.error('Error updating category', { categoryId: id, categoryName: trimmedName }, error as Error)
      toast.error('Failed to update category')
      throw error
    }
  }

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory(id)
      toast.success('Category deleted successfully')
    } catch (error) {
      log.error('Error deleting category', { categoryId: id }, error as Error)
      toast.error('Failed to delete category')
    }
  }

  const handleRunDuplicateDetection = async () => {
    try {
      performanceMonitor.mark('duplicate-detection-start')
      memoryMonitor.logMemoryUsage('Before duplicate detection')
      
      await runDuplicateDetection({
        checkFileSize: detectionSettings.checkFileSize,
        checkFilename: detectionSettings.checkFilename,
        checkHash: detectionSettings.checkHash,
        similarityThreshold: detectionSettings.similarityThreshold
      })
      
      performanceMonitor.measure('duplicate-detection', 'duplicate-detection-start')
      memoryMonitor.logMemoryUsage('After duplicate detection')
      
      toast.success('Duplicate detection completed')
    } catch (error) {
      log.error('Error running duplicate detection', { settings: detectionSettings }, error as Error)
      toast.error('Failed to run duplicate detection')
    }
  }

  const handleToggleDuplicateGroupSelection = (groupId: string) => {
    setSelectedDuplicateGroups(current => 
      current.includes(groupId)
        ? current.filter(id => id !== groupId)
        : [...current, groupId]
    )
  }

  const handleComparePhotosInGroup = (photos: UnifiedPhoto[]) => {
    setCompareItems(photos)
    setIsCompareOpen(true)
  }

  const handleKeepPhotoInGroup = async (groupPhotos: UnifiedPhoto[], keepPhoto: UnifiedPhoto) => {
    try {
      const photosToDelete = groupPhotos.filter(photo => photo.id !== keepPhoto.id).map(photo => photo.id)
      if (photosToDelete.length > 0) {
        await deletePhotos(photosToDelete)
        setIsCompareOpen(false)
        toast.success(`Kept "${keepPhoto.name}" and deleted ${photosToDelete.length} duplicates`)
      }
    } catch (error) {
      log.error('Error processing duplicates', { keepPhotoId: keepPhoto.id, groupSize: groupPhotos.length }, error as Error)
      toast.error('Failed to process duplicates')
    }
  }

  const handleProcessSelectedDuplicateGroups = async (action: 'keep-first' | 'keep-largest' | 'keep-newest') => {
    if (selectedDuplicateGroups.length === 0) return

    try {
      const photosToDelete: string[] = []

      for (const groupId of selectedDuplicateGroups) {
        const group = duplicateGroups.find(g => g.id === groupId)
        if (!group || group.photos.length < 2) continue

        let photoToKeep: UnifiedPhoto

        switch (action) {
          case 'keep-first':
            photoToKeep = group.photos[0]
            break
          case 'keep-largest':
            photoToKeep = group.photos.reduce((prev, current) => 
              prev.size > current.size ? prev : current
            )
            break
          case 'keep-newest':
            photoToKeep = group.photos.reduce((prev, current) => {
              const prevTime = typeof prev.lastModified === 'string' 
                ? new Date(prev.lastModified).getTime()
                : prev.lastModified
              const currentTime = typeof current.lastModified === 'string'
                ? new Date(current.lastModified).getTime()
                : current.lastModified
              return prevTime > currentTime ? prev : current
            })
            break
          default:
            continue
        }

        const groupPhotosToDelete = group.photos
          .filter(photo => photo.id !== photoToKeep.id)
          .map(photo => photo.id)
        
        photosToDelete.push(...groupPhotosToDelete)
      }

      if (photosToDelete.length > 0) {
        await deletePhotos(photosToDelete)
        setSelectedDuplicateGroups([])
        toast.success(`Processed ${selectedDuplicateGroups.length} duplicate groups, deleted ${photosToDelete.length} photos`)
      }
    } catch (error) {
      log.error('Error processing duplicate groups', { selectedGroupsCount: selectedDuplicateGroups.length, action }, error as Error)
      toast.error('Failed to process duplicate groups')
    }
  }

  // Testing functions
  const testAdvancedDuplicateDetection = async () => {
    if (photos.length < 2) {
      toast.error('Need at least 2 photos to test duplicate detection')
      return
    }
    await runAdvancedDuplicateTest([85, 90, 95], ['fileSize', 'filename', 'hash'])
    toast.success('Duplicate detection test completed - check console for details')
  }

  const generateTestFiles = () => {
    console.log('=== Test File Generation Guide ===')
    console.log('Create test files with various duplicates and similar patterns')
    toast.info('Test file generation guide printed to console')
  }

  // Provider selection screen
  if (showProviderSelection) {
    return (
      <>
        <Toaster richColors position="top-right" />
        <ProviderSelection
          onProviderSelect={handleProviderSelect}
          isFileSystemAccessSupported={isFileSystemAccessSupported}
          onFileSelect={handleFileSelect}
        />
      </>
    )
  }

  // OneDrive authentication screen
  if (currentProvider === 'onedrive' && !isOneDriveAuthenticated && !isLoading) {
    return (
      <>
        <Toaster richColors position="top-right" />
        <OneDriveAuth
          onAuthenticate={authenticateOneDrive}
          onBack={() => setShowProviderSelection(true)}
          onLogout={logoutOneDrive}
          error={error}
          user={oneDriveUser}
          isAuthenticated={isOneDriveAuthenticated}
        />
      </>
    )
  }

  // Loading screen
  if (isLoading) {
    return (
      <LoadingState 
        message={currentProvider === 'onedrive' ? 'Connecting to OneDrive...' : 'Loading application...'} 
        provider={currentProvider}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <Toaster richColors position="top-right" />
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <AppHeader
          currentProvider={currentProvider}
          oneDriveUser={oneDriveUser}
          showTestingPanel={showTestingPanel}
          showSmartAlbums={showSmartAlbums}
          onSwitchProvider={() => setShowProviderSelection(true)}
          onToggleTestingPanel={() => setShowTestingPanel(!showTestingPanel)}
          onToggleSmartAlbums={() => {
            setShowSmartAlbums(!showSmartAlbums)
            setShowSmartAlbumRules(false)
          }}
          onLogout={logoutOneDrive}
        />

        {/* Progress Bar */}
        <ProgressBar progress={progress} />

        {/* Search and Filter Controls */}
        <SearchAndFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategoryFilter={selectedCategoryFilter}
          onCategoryFilterChange={setSelectedCategoryFilter}
          categories={categories}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
        />

        {/* Testing Panel */}
        {showTestingPanel && (
          <div className="space-y-6">
            <TestingPanel
              photos={photos}
              fileTypeStats={fileTypeStats}
              folderStats={folderStats}
              onTestDuplicates={testAdvancedDuplicateDetection}
              onRunAdvancedDuplicateTest={runAdvancedDuplicateTest}
              onGenerateTestFiles={generateTestFiles}
              isTestingInProgress={isDuplicateDetectionRunning}
            />
            
            <TestDocumentation />
          </div>
        )}

        {/* Smart Albums Section */}
        {showSmartAlbums && !showSmartAlbumRules && (
          <SmartAlbumsGrid
            albums={albums}
            isGenerating={isGeneratingSmartAlbums}
            statistics={smartAlbumStats}
            onViewAlbum={(album) => {
              log.info('Viewing smart album', { albumName: album.name, photoCount: album.photoCount })
              toast.info(`Viewing "${album.name}" with ${album.photoCount} photos`)
            }}
            onGenerateAlbums={() => generateSmartAlbums(true)}
            onManageRules={() => setShowSmartAlbumRules(true)}
          />
        )}

        {/* Smart Album Rules Manager */}
        {showSmartAlbums && showSmartAlbumRules && (
          <SmartAlbumRulesManager
            predefinedRules={predefinedRules}
            customRules={customRules}
            suggestedRules={suggestedRules}
            onCreateRule={createCustomRule}
            onUpdateRule={updateCustomRule}
            onDeleteRule={deleteCustomRule}
            onAcceptSuggestion={acceptSuggestedRule}
            onRejectSuggestion={rejectSuggestedRule}
            onGenerateSuggestions={generateSuggestedRules}
          />
        )}

        {/* Categories Grid */}
        {!showSmartAlbums && (
          <CategoriesGrid
            categories={categories}
            photos={photos}
            selectedItemsCount={selectedItems.length}
            onCreateCategory={handleCreateCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        )}

        {/* Photo Loader */}
        {!showSmartAlbums && (
          <PhotoLoader
            currentProvider={currentProvider}
            photos={photos}
            filteredPhotos={filteredPhotos}
            isLoadingPhotos={isLoadingPhotos}
            isFileSystemAccessSupported={isFileSystemAccessSupported}
            onLoadPhotos={loadPhotos}
            onFileSelect={handleFileSelect}
          />
        )}

        {/* Photos Grid */}
        {!showSmartAlbums && sortedPhotos.length > 0 && (
          <PhotosGrid
            photos={sortedPhotos}
            selectedItems={selectedItems}
            onToggleSelection={handleToggleSelection}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onDeleteSelected={handleDeleteSelected}
            formatFileSize={formatFileSize}
          />
        )}

        {/* Duplicates Review */}
        {!showSmartAlbums && (
          <DuplicatesReview
            duplicateGroups={duplicateGroups}
            selectedDuplicateGroups={selectedDuplicateGroups}
            isDuplicateDetectionRunning={isDuplicateDetectionRunning}
            detectionSettings={detectionSettings}
            onDetectionSettingsChange={setDetectionSettings}
            onToggleGroupSelection={handleToggleDuplicateGroupSelection}
            onComparePhotos={handleComparePhotosInGroup}
            onKeepPhoto={handleKeepPhotoInGroup}
            onDeletePhoto={deletePhotos}
            onRunDetection={handleRunDuplicateDetection}
            onProcessSelectedGroups={handleProcessSelectedDuplicateGroups}
            formatFileSize={formatFileSize}
          />
        )}

        {/* Photo Comparison Dialog */}
        <PhotoComparison
          isOpen={isCompareOpen}
          onOpenChange={setIsCompareOpen}
          compareItems={compareItems}
          onKeepPhoto={handleKeepPhotoInGroup}
          onDeletePhoto={deletePhotos}
          formatFileSize={formatFileSize}
        />

        {/* Action Buttons */}
        {!showSmartAlbums && (
          <ActionButtons
            currentProvider={currentProvider}
            photosCount={photos.length}
            isDuplicateDetectionRunning={isDuplicateDetectionRunning}
            onLoadPhotos={loadPhotos}
            onOpenDuplicateDetection={() => handleRunDuplicateDetection()}
          />
        )}

        {/* Empty State */}
        {!showSmartAlbums && photos.length === 0 && !isLoadingPhotos && (
          <EmptyState
            currentProvider={currentProvider}
            isFileSystemAccessSupported={isFileSystemAccessSupported}
            onLoadPhotos={loadPhotos}
            onFileSelect={handleFileSelect}
          />
        )}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <PhotoSorter />
    </ErrorBoundary>
  )
}