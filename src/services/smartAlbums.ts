import { UnifiedPhoto } from '@/hooks/usePhotoStorage'

/**
 * Smart Album Service - AI-powered photo organization
 * Creates intelligent albums based on content analysis and metadata patterns
 */

export interface SmartAlbumRule {
  id: string
  name: string
  description: string
  type: 'ai-content' | 'metadata' | 'pattern' | 'temporal' | 'location'
  conditions: AlbumCondition[]
  enabled: boolean
  autoUpdate: boolean
  color: string
  icon: string
}

export interface AlbumCondition {
  field: string
  operator: 'contains' | 'equals' | 'greater' | 'less' | 'between' | 'similar' | 'regex'
  value: any
  weight: number // 0-1, importance of this condition
}

export interface SmartAlbum {
  id: string
  name: string
  description: string
  rule: SmartAlbumRule
  photos: UnifiedPhoto[]
  photoCount: number
  lastUpdated: Date
  confidence: number // Average confidence of photo matches
  tags: string[]
}

export interface AIAnalysisResult {
  confidence: number
  tags: string[]
  subjects: string[]
  colors: string[]
  composition: {
    type: 'portrait' | 'landscape' | 'macro' | 'group' | 'nature' | 'architecture' | 'event'
    confidence: number
  }
  quality: {
    score: number
    issues: string[]
  }
  emotions: string[]
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'
  season?: 'spring' | 'summer' | 'fall' | 'winter'
}

class SmartAlbumsService {
  private predefinedRules: SmartAlbumRule[] = [
    {
      id: 'portraits',
      name: 'Portraits',
      description: 'Photos containing people and faces',
      type: 'ai-content',
      conditions: [
        { field: 'subjects', operator: 'contains', value: 'person', weight: 0.8 },
        { field: 'composition.type', operator: 'equals', value: 'portrait', weight: 0.6 }
      ],
      enabled: true,
      autoUpdate: true,
      color: '#f59e0b',
      icon: 'User'
    },
    {
      id: 'nature',
      name: 'Nature',
      description: 'Landscape and nature photography',
      type: 'ai-content',
      conditions: [
        { field: 'subjects', operator: 'contains', value: 'landscape', weight: 0.7 },
        { field: 'subjects', operator: 'contains', value: 'nature', weight: 0.6 },
        { field: 'composition.type', operator: 'equals', value: 'nature', weight: 0.8 }
      ],
      enabled: true,
      autoUpdate: true,
      color: '#10b981',
      icon: 'Tree'
    },
    {
      id: 'events',
      name: 'Events & Celebrations',
      description: 'Special occasions and gatherings',
      type: 'ai-content',
      conditions: [
        { field: 'subjects', operator: 'contains', value: 'group', weight: 0.7 },
        { field: 'composition.type', operator: 'equals', value: 'event', weight: 0.8 },
        { field: 'emotions', operator: 'contains', value: 'happy', weight: 0.5 }
      ],
      enabled: true,
      autoUpdate: true,
      color: '#f97316',
      icon: 'PartyPopper'
    },
    {
      id: 'architecture',
      name: 'Architecture',
      description: 'Buildings and architectural photography',
      type: 'ai-content',
      conditions: [
        { field: 'subjects', operator: 'contains', value: 'building', weight: 0.8 },
        { field: 'composition.type', operator: 'equals', value: 'architecture', weight: 0.9 }
      ],
      enabled: true,
      autoUpdate: true,
      color: '#6366f1',
      icon: 'Buildings'
    },
    {
      id: 'recent',
      name: 'Recent Photos',
      description: 'Photos from the last 30 days',
      type: 'temporal',
      conditions: [
        { field: 'lastModified', operator: 'greater', value: 30, weight: 1.0 }
      ],
      enabled: true,
      autoUpdate: true,
      color: '#ec4899',
      icon: 'Clock'
    },
    {
      id: 'favorites',
      name: 'High Quality',
      description: 'Best quality photos based on composition and clarity',
      type: 'metadata',
      conditions: [
        { field: 'quality.score', operator: 'greater', value: 0.8, weight: 0.9 },
        { field: 'size', operator: 'greater', value: 1024 * 1024, weight: 0.3 }
      ],
      enabled: true,
      autoUpdate: true,
      color: '#8b5cf6',
      icon: 'Star'
    },
    {
      id: 'large-photos',
      name: 'Large Photos',
      description: 'High resolution photos over 5MB',
      type: 'metadata',
      conditions: [
        { field: 'size', operator: 'greater', value: 5 * 1024 * 1024, weight: 1.0 }
      ],
      enabled: true,
      autoUpdate: true,
      color: '#06b6d4',
      icon: 'Image'
    },
    {
      id: 'screenshots',
      name: 'Screenshots',
      description: 'Screen captures and interface images',
      type: 'pattern',
      conditions: [
        { field: 'name', operator: 'regex', value: /(screenshot|screen shot|capture)/i, weight: 0.8 },
        { field: 'name', operator: 'contains', value: 'IMG_', weight: 0.3 }
      ],
      enabled: true,
      autoUpdate: true,
      color: '#64748b',
      icon: 'Monitor'
    }
  ]

  /**
   * Analyze photo content using AI-powered analysis
   * In a real implementation, this would call an AI service
   */
  async analyzePhotoContent(photo: UnifiedPhoto): Promise<AIAnalysisResult> {
    // Simulate AI analysis based on filename and metadata patterns
    const analysis: AIAnalysisResult = {
      confidence: 0.7,
      tags: [],
      subjects: [],
      colors: [],
      composition: { type: 'landscape', confidence: 0.6 },
      quality: { score: 0.7, issues: [] },
      emotions: []
    }

    const name = photo.name.toLowerCase()
    const folder = photo.folder?.toLowerCase() || ''

    // Pattern-based analysis (placeholder for real AI)
    if (name.includes('portrait') || folder.includes('people') || name.includes('selfie')) {
      analysis.subjects.push('person', 'face')
      analysis.composition.type = 'portrait'
      analysis.composition.confidence = 0.8
      analysis.tags.push('people', 'portrait')
    }

    if (name.includes('landscape') || name.includes('nature') || folder.includes('nature')) {
      analysis.subjects.push('landscape', 'nature', 'outdoor')
      analysis.composition.type = 'nature'
      analysis.composition.confidence = 0.8
      analysis.tags.push('nature', 'landscape', 'outdoor')
    }

    if (name.includes('party') || name.includes('wedding') || name.includes('birthday')) {
      analysis.subjects.push('group', 'event')
      analysis.composition.type = 'event'
      analysis.emotions.push('happy', 'celebration')
      analysis.tags.push('event', 'celebration', 'group')
    }

    if (name.includes('building') || name.includes('architecture') || folder.includes('buildings')) {
      analysis.subjects.push('building', 'architecture')
      analysis.composition.type = 'architecture'
      analysis.tags.push('architecture', 'building', 'structure')
    }

    if (name.includes('screenshot') || name.includes('screen')) {
      analysis.subjects.push('interface', 'screen')
      analysis.tags.push('screenshot', 'digital', 'interface')
    }

    // Quality analysis based on file size and dimensions
    if (photo.size > 5 * 1024 * 1024) {
      analysis.quality.score = Math.min(analysis.quality.score + 0.2, 1.0)
    }

    if (photo.dimensions) {
      const megapixels = (photo.dimensions.width * photo.dimensions.height) / (1024 * 1024)
      if (megapixels > 12) {
        analysis.quality.score = Math.min(analysis.quality.score + 0.1, 1.0)
      }
    }

    // Time-based analysis
    const date = new Date(photo.lastModified)
    const hour = date.getHours()
    
    if (hour >= 6 && hour < 12) {
      analysis.timeOfDay = 'morning'
    } else if (hour >= 12 && hour < 17) {
      analysis.timeOfDay = 'afternoon'
    } else if (hour >= 17 && hour < 21) {
      analysis.timeOfDay = 'evening'
    } else {
      analysis.timeOfDay = 'night'
    }

    // Season analysis
    const month = date.getMonth()
    if (month >= 2 && month <= 4) analysis.season = 'spring'
    else if (month >= 5 && month <= 7) analysis.season = 'summer'
    else if (month >= 8 && month <= 10) analysis.season = 'fall'
    else analysis.season = 'winter'

    return analysis
  }

  /**
   * Check if a photo matches a smart album rule
   */
  async checkPhotoMatchesRule(photo: UnifiedPhoto, rule: SmartAlbumRule): Promise<{ matches: boolean; confidence: number }> {
    let totalWeight = 0
    let matchedWeight = 0
    
    // Get AI analysis for content-based rules
    let analysis: AIAnalysisResult | null = null
    if (rule.type === 'ai-content') {
      analysis = await this.analyzePhotoContent(photo)
    }

    for (const condition of rule.conditions) {
      totalWeight += condition.weight

      let matches = false
      let conditionConfidence = 0

      switch (condition.field) {
        case 'subjects':
          if (analysis) {
            matches = analysis.subjects.some(subject => 
              subject.toLowerCase().includes(condition.value.toLowerCase())
            )
            conditionConfidence = matches ? analysis.confidence : 0
          }
          break

        case 'composition.type':
          if (analysis) {
            matches = analysis.composition.type === condition.value
            conditionConfidence = matches ? analysis.composition.confidence : 0
          }
          break

        case 'emotions':
          if (analysis) {
            matches = analysis.emotions.includes(condition.value)
            conditionConfidence = matches ? analysis.confidence : 0
          }
          break

        case 'quality.score': {
          if (analysis) {
            const value = parseFloat(condition.value)
            matches = condition.operator === 'greater' 
              ? analysis.quality.score > value
              : analysis.quality.score < value
            conditionConfidence = matches ? analysis.quality.score : 0
          }
          break
        }

        case 'name': {
          if (condition.operator === 'regex') {
            const regex = new RegExp(condition.value)
            matches = regex.test(photo.name)
          } else if (condition.operator === 'contains') {
            matches = photo.name.toLowerCase().includes(condition.value.toLowerCase())
          }
          conditionConfidence = matches ? 1.0 : 0
          break
        }

        case 'size': {
          const value = parseInt(condition.value)
          matches = condition.operator === 'greater' 
            ? photo.size > value
            : photo.size < value
          conditionConfidence = matches ? 1.0 : 0
          break
        }

        case 'lastModified': {
          const daysAgo = parseInt(condition.value)
          const date = new Date(photo.lastModified)
          const now = new Date()
          const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
          
          matches = condition.operator === 'greater'
            ? diffDays <= daysAgo  // "greater" means more recent
            : diffDays > daysAgo
          conditionConfidence = matches ? 1.0 : 0
          break
        }
      }

      if (matches) {
        matchedWeight += condition.weight * conditionConfidence
      }
    }

    const confidence = totalWeight > 0 ? matchedWeight / totalWeight : 0
    const matches = confidence >= 0.5 // Require at least 50% match confidence

    return { matches, confidence }
  }

  /**
   * Generate smart albums for a collection of photos
   */
  async generateSmartAlbums(photos: UnifiedPhoto[], customRules: SmartAlbumRule[] = []): Promise<SmartAlbum[]> {
    const allRules = [...this.predefinedRules, ...customRules].filter(rule => rule.enabled)
    const albums: SmartAlbum[] = []

    for (const rule of allRules) {
      const matchedPhotos: { photo: UnifiedPhoto; confidence: number }[] = []

      for (const photo of photos) {
        const result = await this.checkPhotoMatchesRule(photo, rule)
        if (result.matches) {
          matchedPhotos.push({ photo, confidence: result.confidence })
        }
      }

      if (matchedPhotos.length > 0) {
        const avgConfidence = matchedPhotos.reduce((sum, item) => sum + item.confidence, 0) / matchedPhotos.length
        
        // Generate tags based on analysis
        const allTags = new Set<string>()
        for (const { photo } of matchedPhotos.slice(0, 10)) { // Sample first 10 photos
          const analysis = await this.analyzePhotoContent(photo)
          analysis.tags.forEach(tag => allTags.add(tag))
        }

        albums.push({
          id: rule.id,
          name: rule.name,
          description: rule.description,
          rule,
          photos: matchedPhotos.map(item => item.photo),
          photoCount: matchedPhotos.length,
          lastUpdated: new Date(),
          confidence: avgConfidence,
          tags: Array.from(allTags).slice(0, 5) // Top 5 tags
        })
      }
    }

    // Sort albums by photo count and confidence
    albums.sort((a, b) => {
      const scoreA = a.photoCount * a.confidence
      const scoreB = b.photoCount * b.confidence
      return scoreB - scoreA
    })

    return albums
  }

  /**
   * Get predefined smart album rules
   */
  getPredefinedRules(): SmartAlbumRule[] {
    return [...this.predefinedRules]
  }

  /**
   * Create a custom smart album rule
   */
  createCustomRule(rule: Omit<SmartAlbumRule, 'id'>): SmartAlbumRule {
    return {
      ...rule,
      id: `custom_${Date.now()}`
    }
  }

  /**
   * Suggest smart album rules based on photo collection patterns
   */
  async suggestRulesForCollection(photos: UnifiedPhoto[]): Promise<SmartAlbumRule[]> {
    const suggestions: SmartAlbumRule[] = []
    
    // Analyze file naming patterns
    const commonPatterns = this.extractCommonPatterns(photos)
    
    for (const pattern of commonPatterns) {
      if (pattern.count >= 5 && pattern.percentage >= 0.1) { // At least 5 photos and 10% of collection
        suggestions.push({
          id: `pattern_${Date.now()}_${pattern.pattern}`,
          name: `${pattern.pattern.charAt(0).toUpperCase() + pattern.pattern.slice(1)} Photos`,
          description: `Photos matching the pattern "${pattern.pattern}"`,
          type: 'pattern',
          conditions: [
            { field: 'name', operator: 'contains', value: pattern.pattern, weight: 1.0 }
          ],
          enabled: true,
          autoUpdate: true,
          color: this.generateRandomColor(),
          icon: 'Folder'
        })
      }
    }

    // Suggest time-based albums for clusters of photos
    const timeClusters = this.analyzeTimeClusters(photos)
    
    for (const cluster of timeClusters) {
      if (cluster.photoCount >= 10) {
        suggestions.push({
          id: `time_${Date.now()}_${cluster.startDate.getTime()}`,
          name: `Photos from ${cluster.startDate.toLocaleDateString()}`,
          description: `${cluster.photoCount} photos taken around ${cluster.startDate.toLocaleDateString()}`,
          type: 'temporal',
          conditions: [
            { field: 'lastModified', operator: 'between', value: [cluster.startDate, cluster.endDate], weight: 1.0 }
          ],
          enabled: false, // Suggest but don't auto-enable
          autoUpdate: false,
          color: this.generateRandomColor(),
          icon: 'Calendar'
        })
      }
    }

    return suggestions
  }

  private extractCommonPatterns(photos: UnifiedPhoto[]): Array<{ pattern: string; count: number; percentage: number }> {
    const patterns = new Map<string, number>()
    
    for (const photo of photos) {
      const name = photo.name.toLowerCase()
      
      // Extract common words and patterns
      const words = name.replace(/\.[^/.]+$/, "").split(/[_\-\s.]+/)
      
      for (const word of words) {
        if (word.length > 2 && !this.isCommonWord(word)) {
          patterns.set(word, (patterns.get(word) || 0) + 1)
        }
      }
      
      // Extract folder-based patterns
      if (photo.folder) {
        const folderParts = photo.folder.toLowerCase().split(/[/\\]/)
        for (const part of folderParts) {
          if (part.length > 2 && !this.isCommonWord(part)) {
            patterns.set(part, (patterns.get(part) || 0) + 1)
          }
        }
      }
    }
    
    return Array.from(patterns.entries())
      .map(([pattern, count]) => ({
        pattern,
        count,
        percentage: count / photos.length
      }))
      .filter(p => p.count >= 3)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  private isCommonWord(word: string): boolean {
    const commonWords = ['img', 'dsc', 'pic', 'photo', 'image', 'file', 'new', 'old', 'copy', 'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'may', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use']
    return commonWords.includes(word) || /^\d+$/.test(word)
  }

  private analyzeTimeClusters(photos: UnifiedPhoto[]): Array<{ startDate: Date; endDate: Date; photoCount: number }> {
    const clusters: Array<{ startDate: Date; endDate: Date; photoCount: number }> = []
    
    // Sort photos by date
    const sortedPhotos = [...photos].sort((a, b) => {
      const aTime = new Date(a.lastModified).getTime()
      const bTime = new Date(b.lastModified).getTime()
      return aTime - bTime
    })
    
    let currentCluster: { startDate: Date; endDate: Date; photos: UnifiedPhoto[] } | null = null
    const clusterThreshold = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    
    for (const photo of sortedPhotos) {
      const photoDate = new Date(photo.lastModified)
      
      if (!currentCluster) {
        currentCluster = {
          startDate: photoDate,
          endDate: photoDate,
          photos: [photo]
        }
      } else {
        const timeDiff = photoDate.getTime() - currentCluster.endDate.getTime()
        
        if (timeDiff <= clusterThreshold) {
          // Add to current cluster
          currentCluster.endDate = photoDate
          currentCluster.photos.push(photo)
        } else {
          // Close current cluster and start new one
          if (currentCluster.photos.length >= 10) {
            clusters.push({
              startDate: currentCluster.startDate,
              endDate: currentCluster.endDate,
              photoCount: currentCluster.photos.length
            })
          }
          
          currentCluster = {
            startDate: photoDate,
            endDate: photoDate,
            photos: [photo]
          }
        }
      }
    }
    
    // Don't forget the last cluster
    if (currentCluster && currentCluster.photos.length >= 10) {
      clusters.push({
        startDate: currentCluster.startDate,
        endDate: currentCluster.endDate,
        photoCount: currentCluster.photos.length
      })
    }
    
    return clusters
  }

  private generateRandomColor(): string {
    const colors = [
      '#f59e0b', '#10b981', '#f97316', '#6366f1', '#ec4899',
      '#8b5cf6', '#06b6d4', '#64748b', '#ef4444', '#22c55e'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }
}

export const smartAlbumsService = new SmartAlbumsService()