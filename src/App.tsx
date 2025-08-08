import React from 'react'
import { MicrosoftOutlookLogo, Image, Trash, Eye, Plus, FolderPlus, PencilSimple, MagnifyingGlass, Warning, Lightning, ArrowsLeftRight, Crown, SignOut, CloudArrowDown, Funnel, SortAscending, Check, X, Folder, Upload } from '@phosphor-icons/react'
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
import { usePhotoStorage, UnifiedPhoto, UnifiedCategory, TestResult } from '@/hooks/usePhotoStorage'
import { TestingPanel } from '@/components/TestingPanel'
import { TestDocumentation } from '@/components/TestDocumentation'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { LoadingState } from '@/components/LoadingState'
import { localPhotoService } from '@/services/local'
import { config } from '@/lib/config'
import { log } from '@/lib/logger'
import { sanitizeTextInput, sanitizeColor, sanitizeSearchQuery, sanitizeFiles, rateLimiter } from '@/lib/sanitizer'
import { performanceMonitor, memoryMonitor, productionChecks } from '@/lib/performance'
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
    runAdvancedDuplicateTest,
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
  const [selectedCategoryFilter, setSelectedCategoryFilter] = React.useState<string>('all')
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
  const [showTestingPanel, setShowTestingPanel] = React.useState(false)

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
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname)
          log.info('OneDrive authentication successful')
        }
      }).catch(error => {
        log.error('OneDrive authentication error', {}, error as Error)
        toast.error('Failed to authenticate with OneDrive')
        setError('Authentication failed. Please try again.')
      })
    } else if (hash && hash.includes('error')) {
      // Handle OAuth errors
      const params = new URLSearchParams(hash.replace('#', ''))
      const error = params.get('error')
      const errorDescription = params.get('error_description')
      
      log.error('OAuth error', { error, errorDescription })
      
      // User-friendly error messages
      let errorMessage = 'Authentication failed'
      if (error === 'access_denied') {
        errorMessage = 'Access was denied. Please try again and grant the necessary permissions.'
      } else if (errorDescription) {
        errorMessage = errorDescription
      }
      
      toast.error(errorMessage)
      setError(errorMessage)
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [handleOneDriveCallback, currentProvider, setError])

  // Filter and sort photos with error handling
  React.useEffect(() => {
    try {
      filterPhotos(searchQuery, selectedCategoryFilter)
    } catch (error) {
      log.error('Error filtering photos', { searchQuery, selectedCategoryFilter }, error as Error)
      toast.error('Failed to filter photos')
    }
  }, [searchQuery, selectedCategoryFilter, photos, filterPhotos])

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

  // Memoized callbacks to prevent unnecessary re-renders
  const toggleItemSelection = React.useCallback((itemId: string) => {
    setSelectedItems(current => 
      current.includes(itemId)
        ? current.filter(id => id !== itemId)
        : [...current, itemId]
    )
  }, [])

  const selectAllItems = React.useCallback(() => {
    setSelectedItems(sortedPhotos.map(photo => photo.id))
  }, [sortedPhotos])

  const deselectAllItems = React.useCallback(() => {
    setSelectedItems([])
  }, [])

  const createNewCategory = async () => {
    const trimmedName = sanitizeTextInput(newCategoryName, 100)
    if (!trimmedName) {
      toast.error('Category name cannot be empty')
      return
    }

    // Check for duplicate names
    if (categories.some(cat => cat.name.toLowerCase() === trimmedName.toLowerCase())) {
      toast.error('A category with this name already exists')
      return
    }

    // Rate limiting
    if (rateLimiter.isRateLimited('create-category', 5, 60000)) {
      toast.error('Too many category creation requests. Please wait a moment.')
      return
    }
    
    try {
      log.info('Creating new category', { name: trimmedName })
      
      const rawPatterns = newCategoryPatterns
        .split(',')
        .map(p => sanitizeTextInput(p.trim(), 50))
        .filter(p => p.length > 0)
        .slice(0, config.security.maxPatterns)
      
      const patterns = rawPatterns.length > 0 ? rawPatterns : [trimmedName.toLowerCase()]
      const sanitizedColor = sanitizeColor(newCategoryColor)
      
      await createCategory({
        name: trimmedName,
        patterns,
        folder: trimmedName,
        color: sanitizedColor,
        autoSort: true,
        sortOrder: categories.length + 1
      })
      
      // Reset form
      setNewCategoryName('')
      setNewCategoryPatterns('')
      setNewCategoryColor('#3b82f6')
      setIsCreateCategoryOpen(false)
      
      log.info('Category created successfully', { name: trimmedName, patterns })
      toast.success(`Category "${trimmedName}" created successfully`)
    } catch (error) {
      log.error('Error creating category', { name: trimmedName }, error as Error)
      toast.error('Failed to create category')
    }
  }

  const deleteSelectedItems = async () => {
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

  const openEditCategory = (category: UnifiedCategory) => {
    setEditingCategory({ ...category })
    setIsEditCategoryOpen(true)
  }

  const saveEditCategory = async () => {
    if (!editingCategory) return
    
    const trimmedName = editingCategory.name.trim()
    if (!trimmedName) {
      toast.error('Category name cannot be empty')
      return
    }

    if (trimmedName.length > 100) {
      toast.error('Category name must be less than 100 characters')
      return
    }

    // Check for duplicate names (excluding current category)
    if (categories.some(cat => 
      cat.id !== editingCategory.id && 
      cat.name.toLowerCase() === trimmedName.toLowerCase()
    )) {
      toast.error('A category with this name already exists')
      return
    }
    
    try {
      const updatedCategory = {
        ...editingCategory,
        name: trimmedName,
        patterns: editingCategory.patterns
          .map(p => p.trim())
          .filter(p => p.length > 0 && p.length <= 50)
          .slice(0, 20)
      }

      await updateCategory(editingCategory.id, updatedCategory)
      setEditingCategory(null)
      setIsEditCategoryOpen(false)
      toast.success(`Category "${trimmedName}" updated successfully`)
    } catch (error) {
      log.error('Error updating category', { categoryId: editingCategory.id, categoryName: trimmedName }, error as Error)
      toast.error('Failed to update category')
    }
  }

  const runDuplicateDetectionWithSettings = async () => {
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
      
      setDuplicateDetectionOpen(false)
      toast.success('Duplicate detection completed')
    } catch (error) {
      log.error('Error running duplicate detection', { settings: detectionSettings }, error as Error)
      toast.error('Failed to run duplicate detection')
    }
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

  const processSelectedDuplicateGroups = async (action: 'keep-first' | 'keep-largest' | 'keep-newest') => {
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

  const testAdvancedDuplicateDetection = async () => {
    if (photos.length < 2) {
      toast.error('Need at least 2 photos to test duplicate detection')
      return
    }

    console.log('🔬 === COMPREHENSIVE DUPLICATE DETECTION TEST SUITE ===')
    console.log(`📊 Testing with ${photos.length} photos`)
    console.log(`🔧 Provider: ${currentProvider}`)
    console.log(`📁 File types: ${Object.keys(fileTypeStats).join(', ')}`)
    console.log(`📂 Folders: ${Object.keys(folderStats).length} directories`)
    
    // Enhanced test configurations for comprehensive analysis
    const testConfigurations = [
      {
        name: 'High Precision Suite',
        thresholds: [80, 85, 90, 95, 98],
        methods: ['fileSize', 'filename', 'hash'],
        description: 'Conservative approach - fewer false positives'
      },
      {
        name: 'Balanced Detection Suite',
        thresholds: [70, 75, 80, 85, 90],
        methods: ['fileSize', 'filename', 'hash'],
        description: 'Balanced precision and recall'
      },
      {
        name: 'High Recall Suite',
        thresholds: [50, 60, 70, 75, 80],
        methods: ['fileSize', 'filename', 'hash'],
        description: 'Aggressive approach - catches more potential duplicates'
      },
      {
        name: 'Method Comparison Suite',
        thresholds: [85],
        methods: ['fileSize', 'filename', 'hash'],
        description: 'Compare individual detection methods',
        testIndividualMethods: true
      }
    ]
    
    const allTestResults = []
    
    for (const config of testConfigurations) {
      console.log(`\n🧪 --- ${config.name} ---`)
      console.log(`   ${config.description}`)
      console.log(`   Thresholds: ${config.thresholds.join(', ')}%`)
      console.log(`   Methods: ${config.methods.join(', ')}`)
      
      try {
        const configResults = await runAdvancedDuplicateTest(config.thresholds, config.methods)
        
        console.log(`   Results:`)
        configResults.forEach(result => {
          const efficiency = result.groupsFound > 0 ? (result.totalDuplicates / result.groupsFound).toFixed(2) : '0'
          const coverage = photos.length > 0 ? ((result.totalDuplicates / photos.length) * 100).toFixed(1) : '0'
          console.log(`     ${result.threshold}%: ${result.groupsFound} groups, ${result.totalDuplicates} duplicates`)
          console.log(`       - Efficiency: ${efficiency} duplicates per group`)
          console.log(`       - Coverage: ${coverage}% of photo collection`)
          console.log(`       - Execution time: ${result.executionTime}ms`)
        })
        
        allTestResults.push({
          configuration: config.name,
          results: configResults
        })
        
        // Test individual methods if specified
        if (config.testIndividualMethods && config.thresholds.length > 0) {
          const testThreshold = config.thresholds[0]
          console.log(`\n   🔍 Individual Method Testing at ${testThreshold}%:`)
          
          for (const method of ['fileSize', 'filename', 'hash']) {
            try {
              const methodResult = await runAdvancedDuplicateTest([testThreshold], [method])
              if (methodResult.length > 0) {
                const result = methodResult[0]
                console.log(`     ${method}: ${result.groupsFound} groups, ${result.totalDuplicates} duplicates (${result.executionTime}ms)`)
              }
            } catch (error) {
              console.log(`     ${method}: Test failed - ${error.message}`)
            }
          }
          
          // Test method combinations
          const methodCombinations = [
            ['fileSize', 'filename'],
            ['fileSize', 'hash'],
            ['filename', 'hash']
          ]
          
          console.log(`\n   🔗 Method Combination Testing at ${testThreshold}%:`)
          for (const combo of methodCombinations) {
            try {
              const comboResult = await runAdvancedDuplicateTest([testThreshold], combo)
              if (comboResult.length > 0) {
                const result = comboResult[0]
                console.log(`     ${combo.join(' + ')}: ${result.groupsFound} groups, ${result.totalDuplicates} duplicates (${result.executionTime}ms)`)
              }
            } catch (error) {
              console.log(`     ${combo.join(' + ')}: Test failed - ${error.message}`)
            }
          }
        }
        
      } catch (error) {
        console.error(`   ❌ Configuration failed: ${error.message}`)
      }
      
      // Brief pause between configurations
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    // Generate comprehensive analysis
    console.log('\n📊 === COMPREHENSIVE ANALYSIS ===')
    
    if (allTestResults.length > 0) {
      // Find best performing configurations
      let bestPrecisionConfig = null
      let bestRecallConfig = null
      let bestBalanceConfig = null
      let maxGroups = 0
      let maxDuplicates = 0
      
      allTestResults.forEach(({ configuration, results }) => {
        const totalGroups = results.reduce((sum, r) => sum + r.groupsFound, 0)
        const totalDuplicates = results.reduce((sum, r) => sum + r.totalDuplicates, 0)
        const avgEfficiency = results.length > 0 ? totalDuplicates / Math.max(totalGroups, 1) : 0
        const avgTime = results.reduce((sum, r) => sum + r.executionTime, 0) / Math.max(results.length, 1)
        
        if (totalGroups > maxGroups) {
          maxGroups = totalGroups
          bestRecallConfig = { configuration, totalGroups, totalDuplicates, avgTime }
        }
        
        if (avgEfficiency > 0 && (!bestPrecisionConfig || avgEfficiency > bestPrecisionConfig.avgEfficiency)) {
          bestPrecisionConfig = { configuration, avgEfficiency, totalGroups, totalDuplicates, avgTime }
        }
        
        const balanceScore = (totalGroups * 0.4) + (avgEfficiency * 0.4) + ((1000 / Math.max(avgTime, 1)) * 0.2)
        if (!bestBalanceConfig || balanceScore > bestBalanceConfig.balanceScore) {
          bestBalanceConfig = { configuration, balanceScore, totalGroups, totalDuplicates, avgTime, avgEfficiency }
        }
      })
      
      console.log('\n🏆 PERFORMANCE WINNERS:')
      if (bestRecallConfig) {
        console.log(`   📈 Best for finding duplicates: ${bestRecallConfig.configuration}`)
        console.log(`      - Found ${bestRecallConfig.totalGroups} groups with ${bestRecallConfig.totalDuplicates} duplicates`)
        console.log(`      - Average time: ${bestRecallConfig.avgTime.toFixed(0)}ms`)
      }
      
      if (bestPrecisionConfig) {
        console.log(`   🎯 Best precision/efficiency: ${bestPrecisionConfig.configuration}`)
        console.log(`      - Efficiency: ${bestPrecisionConfig.avgEfficiency.toFixed(2)} duplicates per group`)
        console.log(`      - Found ${bestPrecisionConfig.totalGroups} groups with ${bestPrecisionConfig.totalDuplicates} duplicates`)
      }
      
      if (bestBalanceConfig) {
        console.log(`   ⚖️ Best overall balance: ${bestBalanceConfig.configuration}`)
        console.log(`      - Balance score: ${bestBalanceConfig.balanceScore.toFixed(2)}`)
        console.log(`      - ${bestBalanceConfig.totalGroups} groups, ${bestBalanceConfig.totalDuplicates} duplicates`)
        console.log(`      - Efficiency: ${(bestBalanceConfig.avgEfficiency || 0).toFixed(2)}, Time: ${bestBalanceConfig.avgTime.toFixed(0)}ms`)
      }
    }
    
    // Photo collection insights
    console.log('\n📋 COLLECTION INSIGHTS:')
    console.log(`   📁 Total photos analyzed: ${photos.length}`)
    console.log(`   📊 File type diversity: ${Object.keys(fileTypeStats).length} types`)
    console.log(`   📂 Folder structure depth: ${Object.keys(folderStats).length} folders`)
    
    if (Object.keys(fileTypeStats).length > 0) {
      const topFileType = Object.entries(fileTypeStats).reduce((a, b) => a[1] > b[1] ? a : b)
      console.log(`   📄 Most common file type: ${topFileType[0]} (${topFileType[1]} files, ${((topFileType[1] / photos.length) * 100).toFixed(1)}%)`)
    }
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS FOR YOUR COLLECTION:')
    console.log(`   🎯 For your ${photos.length}-photo collection:`)
    
    if (photos.length < 50) {
      console.log(`      - Use 80-90% thresholds for good precision`)
      console.log(`      - All detection methods recommended (fileSize + filename + hash)`)
      console.log(`      - Performance should be fast with this collection size`)
    } else if (photos.length < 200) {
      console.log(`      - Use 75-85% thresholds for balanced detection`)
      console.log(`      - Consider fileSize + hash for faster processing`)
      console.log(`      - Monitor execution times with larger batches`)
    } else {
      console.log(`      - Use 70-80% thresholds to handle scale effectively`)
      console.log(`      - Prioritize fileSize + hash for performance`)
      console.log(`      - Consider batch processing for very large collections`)
    }
    
    const fileTypeCount = Object.keys(fileTypeStats).length
    if (fileTypeCount > 3) {
      console.log(`      - High file type diversity (${fileTypeCount} types) - filename matching may be less effective`)
    }
    
    console.log('\n✅ Comprehensive duplicate detection test completed!')
    toast.success('Comprehensive duplicate detection test completed - check console for detailed analysis')
  }

  const generateTestFiles = async () => {
    console.log('=== Test File Generation Guide ===')
    console.log('For comprehensive testing, create test files with the following characteristics:')
    
    const testScenarios = [
      {
        name: 'Exact Duplicates',
        description: 'Identical files with same content but different names',
        examples: ['photo.jpg', 'photo_copy.jpg', 'photo (1).jpg']
      },
      {
        name: 'Similar Names',
        description: 'Different content but very similar filenames',
        examples: ['beach_vacation_2023.jpg', 'beach_vacation_2024.jpg', 'beach_vacation_edit.jpg']
      },
      {
        name: 'Size Variations',
        description: 'Same image at different resolutions/qualities',
        examples: ['high_res_photo.jpg (2MB)', 'medium_res_photo.jpg (500KB)', 'thumbnail_photo.jpg (50KB)']
      },
      {
        name: 'Format Variations',
        description: 'Same image in different formats',
        examples: ['image.jpg', 'image.png', 'image.webp', 'image.heic']
      },
      {
        name: 'Edge Cases',
        description: 'Unusual filenames and sizes',
        examples: ['файл.jpg (unicode)', 'file with spaces.png', 'very-long-filename-with-many-words.jpeg']
      }
    ]
    
    testScenarios.forEach((scenario, index) => {
      console.log(`\n${index + 1}. ${scenario.name}:`)
      console.log(`   ${scenario.description}`)
      console.log(`   Examples: ${scenario.examples.join(', ')}`)
    })
    
    console.log('\n=== Recommended Folder Structure ===')
    const folderStructure = {
      'Test_Photos': {
        'Duplicates': ['exact_copy_1.jpg', 'exact_copy_2.jpg'],
        'Similar': ['beach_2023.jpg', 'beach_2024.jpg', 'beach_edited.jpg'],
        'Formats': ['sample.jpg', 'sample.png', 'sample.webp'],
        'Large_Files': ['high_res_1.jpg (>5MB)', 'high_res_2.jpg (>5MB)'],
        'Small_Files': ['thumbnail_1.jpg (<100KB)', 'thumbnail_2.jpg (<100KB)'],
        'Unicode': ['测试.jpg', 'φωτογραφία.png', 'фото.jpeg'],
        'Nested': {
          'Level_2': {
            'Level_3': ['deep_photo_1.jpg', 'deep_photo_2.png']
          }
        }
      }
    }
    
    console.log(JSON.stringify(folderStructure, null, 2))
    
    toast.info('Test file generation guide printed to console - create these file structures for comprehensive testing')
  }
  // File input handler for local photos with enhanced logging and error handling
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const files = event.target.files
      if (!files || files.length === 0) {
        toast.info('No files selected')
        return
      }

      // Rate limiting
      if (rateLimiter.isRateLimited('file-upload', 10, 60000)) {
        toast.error('Too many upload requests. Please wait a moment.')
        return
      }

      log.info('Processing file input', { fileCount: files.length })
      
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
      
      loadPhotos(false, sanitizedFiles)
      toast.success(`Processing ${sanitizedFiles.length} photos`)
      
    } catch (error) {
      log.error('Error handling file input', {}, error as Error)
      toast.error('Failed to process selected files')
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
                          aria-label="Choose local folder for photo organization"
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
                      aria-label="Connect to Microsoft OneDrive for cloud photo organization"
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
            <Button onClick={authenticateOneDrive} className="w-full" size="lg" aria-label="Sign in with Microsoft account">
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
            <Button 
              variant="outline" 
              onClick={() => setShowTestingPanel(!showTestingPanel)} 
              size="sm"
            >
              {showTestingPanel ? 'Hide' : 'Show'} Testing
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
                    onChange={(e) => setSearchQuery(sanitizeSearchQuery(e.target.value))}
                    className="pl-10"
                    maxLength={100}
                  />
                </div>
              </div>
              
              <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
                <SelectTrigger className="w-48">
                  <Funnel className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id || category.name} value={category.id || `category-${category.name}`}>
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

              <Select value={sortBy} onValueChange={(value: 'name' | 'date' | 'size') => setSortBy(value)}>
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
                          onClick={() => deleteCategory(category.id)}
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
                          <Trash className="w-4 h-4 mr-1" />
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
                          <Trash className="w-4 h-4 mr-1" />
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

export default function App() {
  return (
    <ErrorBoundary>
      <PhotoSorter />
    </ErrorBoundary>
  )
}