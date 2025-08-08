import React from 'react'
import { useKV } from '@github/spark/hooks'
import { smartAlbumsService, SmartAlbum, SmartAlbumRule } from '@/services/smartAlbums'
import { UnifiedPhoto } from '@/hooks/usePhotoStorage'
import { toast } from 'sonner'
import { log } from '@/lib/logger'

export interface SmartAlbumsState {
  albums: SmartAlbum[]
  customRules: SmartAlbumRule[]
  suggestedRules: SmartAlbumRule[]
  isGenerating: boolean
  lastGenerated: Date | null
  autoUpdateEnabled: boolean
}

export function useSmartAlbums(photos: UnifiedPhoto[]) {
  const [albums, setAlbums] = useKV<SmartAlbum[]>('smart-albums', [])
  const [customRules, setCustomRules] = useKV<SmartAlbumRule[]>('smart-album-custom-rules', [])
  const [suggestedRules, setSuggestedRules] = useKV<SmartAlbumRule[]>('smart-album-suggested-rules', [])
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useKV<boolean>('smart-albums-auto-update', true)
  const [lastGenerated, setLastGenerated] = useKV<Date | null>('smart-albums-last-generated', null)
  
  const [isGenerating, setIsGenerating] = React.useState(false)

  // Generate smart albums from current photo collection
  const generateSmartAlbums = React.useCallback(async (forceRegenerate = false) => {
    if (photos.length === 0) {
      toast.error('No photos available to analyze')
      return
    }

    if (isGenerating) {
      toast.warning('Smart album generation already in progress')
      return
    }

    try {
      setIsGenerating(true)
      log.info('Starting smart album generation', { photoCount: photos.length, forceRegenerate })

      // Check if we need to regenerate
      if (!forceRegenerate && lastGenerated) {
        const hoursSinceLastGeneration = (Date.now() - new Date(lastGenerated).getTime()) / (1000 * 60 * 60)
        if (hoursSinceLastGeneration < 1 && albums && albums.length > 0) {
          log.info('Smart albums generated recently, skipping regeneration', { hoursSince: hoursSinceLastGeneration })
          toast.info('Smart albums are up to date')
          return
        }
      }

      // Generate new albums
      const newAlbums = await smartAlbumsService.generateSmartAlbums(photos, customRules)
      
      setAlbums(newAlbums)
      setLastGenerated(new Date())
      
      log.info('Smart albums generated successfully', { 
        albumCount: newAlbums.length,
        totalPhotosOrganized: newAlbums.reduce((sum, album) => sum + album.photoCount, 0)
      })
      
      toast.success(`Generated ${newAlbums.length} smart albums with ${newAlbums.reduce((sum, album) => sum + album.photoCount, 0)} photos organized`)
      
    } catch (error) {
      log.error('Error generating smart albums', { photoCount: photos.length }, error as Error)
      toast.error('Failed to generate smart albums')
    } finally {
      setIsGenerating(false)
    }
  }, [photos, customRules, lastGenerated, albums?.length || 0, isGenerating, setAlbums, setLastGenerated])

  // Generate suggested rules based on photo collection
  const generateSuggestedRules = React.useCallback(async () => {
    if (photos.length === 0) {
      toast.error('No photos available to analyze')
      return
    }

    try {
      log.info('Generating suggested smart album rules', { photoCount: photos.length })
      
      const suggestions = await smartAlbumsService.suggestRulesForCollection(photos)
      setSuggestedRules(suggestions)
      
      if (suggestions.length > 0) {
        toast.success(`Found ${suggestions.length} smart album suggestions`)
      } else {
        toast.info('No new smart album suggestions found')
      }
      
    } catch (error) {
      log.error('Error generating suggested rules', { photoCount: photos.length }, error as Error)
      toast.error('Failed to generate suggestions')
    }
  }, [photos, setSuggestedRules])

  // Accept a suggested rule
  const acceptSuggestedRule = React.useCallback((ruleId: string) => {
    const rule = suggestedRules?.find(r => r.id === ruleId)
    if (!rule) return

    // Add to custom rules and enable it
    const enabledRule: SmartAlbumRule = { ...rule, enabled: true }
    setCustomRules(current => current ? [...current, enabledRule] : [enabledRule])
    
    // Remove from suggestions
    setSuggestedRules(current => current ? current.filter(r => r.id !== ruleId) : [])
    
    toast.success(`Added "${rule.name}" to your smart albums`)
    log.info('Accepted suggested rule', { ruleName: rule.name, ruleType: rule.type })
  }, [suggestedRules, setCustomRules, setSuggestedRules])

  // Reject a suggested rule
  const rejectSuggestedRule = React.useCallback((ruleId: string) => {
    setSuggestedRules(current => current ? current.filter(r => r.id !== ruleId) : [])
    toast.info('Suggestion dismissed')
  }, [setSuggestedRules])

  // Create a custom rule
  const createCustomRule = React.useCallback((rule: Omit<SmartAlbumRule, 'id'>) => {
    const newRule = smartAlbumsService.createCustomRule(rule)
    setCustomRules(current => current ? [...current, newRule] : [newRule])
    
    toast.success(`Created custom rule: ${rule.name}`)
    log.info('Created custom smart album rule', { ruleName: rule.name, ruleType: rule.type })
    
    return newRule
  }, [setCustomRules])

  // Update a custom rule
  const updateCustomRule = React.useCallback((ruleId: string, updates: Partial<SmartAlbumRule>) => {
    setCustomRules(current => 
      current ? current.map(rule => 
        rule.id === ruleId ? { ...rule, ...updates } : rule
      ) : []
    )
    
    toast.success('Smart album rule updated')
    log.info('Updated custom smart album rule', { ruleId, updates })
  }, [setCustomRules])

  // Delete a custom rule
  const deleteCustomRule = React.useCallback((ruleId: string) => {
    const rule = customRules?.find(r => r.id === ruleId)
    if (!rule) return

    setCustomRules(current => current ? current.filter(r => r.id !== ruleId) : [])
    
    // Remove any albums generated from this rule
    setAlbums(current => current ? current.filter(album => album.rule.id !== ruleId) : [])
    
    toast.success(`Deleted rule: ${rule.name}`)
    log.info('Deleted custom smart album rule', { ruleName: rule.name })
  }, [customRules, setCustomRules, setAlbums])

  // Get album by ID
  const getAlbumById = React.useCallback((albumId: string) => {
    return albums?.find(album => album.id === albumId)
  }, [albums])

  // Get photos in album
  const getAlbumPhotos = React.useCallback((albumId: string) => {
    const album = getAlbumById(albumId)
    return album ? album.photos : []
  }, [getAlbumById])

  // Toggle auto-update
  const toggleAutoUpdate = React.useCallback(() => {
    setAutoUpdateEnabled(current => !current)
    toast.success(autoUpdateEnabled ? 'Auto-update disabled' : 'Auto-update enabled')
  }, [autoUpdateEnabled, setAutoUpdateEnabled])

  // Auto-generate albums when photos change (if enabled)
  React.useEffect(() => {
    if (autoUpdateEnabled && photos.length > 0) {
      // Debounce the generation to avoid excessive API calls
      const timeoutId = setTimeout(() => {
        generateSmartAlbums(false) // Don't force regenerate on auto-update
      }, 2000)

      return () => clearTimeout(timeoutId)
    }
  }, [photos.length, autoUpdateEnabled, generateSmartAlbums])

  // Auto-generate suggestions when photos change significantly
  React.useEffect(() => {
    if (photos.length > 0 && photos.length % 50 === 0) { // Every 50 new photos
      generateSuggestedRules()
    }
  }, [photos.length, generateSuggestedRules])

  // Get predefined rules
  const predefinedRules = React.useMemo(() => {
    return smartAlbumsService.getPredefinedRules()
  }, [])

  // Get statistics
  const statistics = React.useMemo(() => {
    const totalPhotosInAlbums = albums?.reduce((sum, album) => sum + album.photoCount, 0) || 0
    const averageConfidence = albums && albums.length > 0 
      ? albums.reduce((sum, album) => sum + album.confidence, 0) / albums.length 
      : 0
    const organizationPercentage = photos.length > 0 
      ? (totalPhotosInAlbums / photos.length) * 100 
      : 0

    return {
      totalAlbums: albums?.length || 0,
      totalPhotosInAlbums,
      averageConfidence,
      organizationPercentage,
      customRulesCount: customRules?.length || 0,
      suggestedRulesCount: suggestedRules?.length || 0
    }
  }, [albums, photos.length, customRules?.length, suggestedRules?.length])

  return {
    // Data
    albums,
    customRules,
    suggestedRules,
    predefinedRules,
    statistics,
    
    // State
    isGenerating,
    lastGenerated,
    autoUpdateEnabled,
    
    // Actions
    generateSmartAlbums,
    generateSuggestedRules,
    acceptSuggestedRule,
    rejectSuggestedRule,
    createCustomRule,
    updateCustomRule,
    deleteCustomRule,
    getAlbumById,
    getAlbumPhotos,
    toggleAutoUpdate
  }
}