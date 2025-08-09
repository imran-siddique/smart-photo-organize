// Local File System Service for Photo Organization
import { toast } from 'sonner'

export interface LocalPhoto {
  id: string
  name: string
  type: string
  size: number
  lastModified: number
  url: string
  thumbnailUrl?: string
  dimensions?: { width: number; height: number }
  folder: string
  hash?: string
}

export interface LocalCategory {
  id: string
  name: string
  patterns: string[]
  color: string
  folder: string
  autoSort: boolean
  sortOrder: number
}

export interface LocalDuplicateGroup {
  id: string
  photos: LocalPhoto[]
  similarity: number
  reason: string[]
}

export interface DuplicateDetectionOptions {
  checkFileSize: boolean
  checkFilename: boolean
  checkHash: boolean
  similarityThreshold: number
}

class LocalPhotoService {
  private photos: LocalPhoto[] = []
  private categories: LocalCategory[] = []
  private duplicateGroups: LocalDuplicateGroup[] = []

  // Supported image formats - comprehensive list for testing
  private readonly SUPPORTED_IMAGE_TYPES = new Set([
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/tiff',
    'image/svg+xml',
    'image/ico',
    'image/x-icon',
    'image/avif',
    'image/heic',
    'image/heif'
  ])

  // File extensions for testing
  private readonly SUPPORTED_EXTENSIONS = new Set([
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', 
    '.tiff', '.tif', '.svg', '.ico', '.avif', '.heic', '.heif'
  ])

  // File Input Methods
  async loadPhotosFromFiles(files: FileList | File[]): Promise<LocalPhoto[]> {
    const newPhotos: LocalPhoto[] = []
    const fileArray = Array.from(files)

    console.log(`Processing ${fileArray.length} files...`)

    for (const file of fileArray) {
      const isImage = this.isImageFile(file)
      console.log(`File: ${file.name}, Type: ${file.type}, Is Image: ${isImage}`)
      
      if (isImage) {
        try {
          const photo = await this.createPhotoFromFile(file)
          if (photo) {
            newPhotos.push(photo)
            console.log(`Added photo: ${photo.name} (${photo.type})`)
          }
        } catch (error) {
          console.error(`Failed to process ${file.name}:`, error)
          const errorMessage = error instanceof Error ? error.message : 'Unknown processing error'
          toast.error(`Failed to process ${file.name}: ${errorMessage}`)
        }
      } else {
        console.warn(`Skipped non-image file: ${file.name} (${file.type})`)
      }
    }

    this.photos = [...this.photos, ...newPhotos]
    console.log(`Successfully loaded ${newPhotos.length} photos`)
    return newPhotos
  }

  async loadPhotosFromDirectory(dirHandle: FileSystemDirectoryHandle): Promise<LocalPhoto[]> {
    const newPhotos: LocalPhoto[] = []
    const folderStructure: Map<string, string[]> = new Map()
    
    console.log('Starting directory traversal...')
    
    // Recursive directory traversal
    const processDirectory = async (handle: FileSystemDirectoryHandle, path = '') => {
      const currentPath = path ? `${path}/${handle.name}` : handle.name
      const filesInFolder: string[] = []
      
      // Check if entries method is available (newer browsers)
      if ('entries' in handle && typeof handle.entries === 'function') {
        for await (const [name, fileHandle] of handle.entries()) {
          if (fileHandle.kind === 'file') {
            const file = await (fileHandle as FileSystemFileHandle).getFile()
            const isImage = this.isImageFile(file)
            
            console.log(`Found file: ${currentPath}/${name}, Type: ${file.type}, Is Image: ${isImage}`)
            
            if (isImage) {
              try {
                const photo = await this.createPhotoFromFile(file, currentPath)
                if (photo) {
                  newPhotos.push(photo)
                  filesInFolder.push(name)
                  console.log(`Added from folder: ${photo.name} in ${currentPath}`)
                }
              } catch (error) {
                console.error(`Failed to process ${currentPath}/${name}:`, error)
              }
            }
          } else if (fileHandle.kind === 'directory') {
            console.log(`Entering subdirectory: ${currentPath}/${name}`)
            await processDirectory(fileHandle as FileSystemDirectoryHandle, currentPath)
          }
        }
      } else {
        // Fallback for browsers that don't support entries method
        console.warn('FileSystemDirectoryHandle.entries() not supported in this browser')
      }
      
      if (filesInFolder.length > 0) {
        folderStructure.set(currentPath, filesInFolder)
      }
    }
    
    await processDirectory(dirHandle)
    
    // Log folder structure for testing
    console.log('Folder structure discovered:')
    folderStructure.forEach((files, folder) => {
      console.log(`  ${folder}: ${files.length} images`)
      files.forEach(file => console.log(`    - ${file}`))
    })

    this.photos = [...this.photos, ...newPhotos]
    console.log(`Successfully loaded ${newPhotos.length} photos from directory structure`)
    return newPhotos
  }

  private async createPhotoFromFile(file: File, folderName = 'Uploads'): Promise<LocalPhoto | null> {
    try {
      const dimensions = await this.getImageDimensions(file)
      const thumbnailUrl = await this.generateThumbnail(file)
      const hash = await this.generateFileHash(file)
      
      const photo: LocalPhoto = {
        id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: file.type || this.getTypeFromExtension(file.name),
        size: file.size,
        lastModified: file.lastModified,
        url: URL.createObjectURL(file),
        thumbnailUrl,
        dimensions,
        folder: folderName,
        hash
      }
      
      return photo
    } catch (error) {
      console.error('Error creating photo from file:', error)
      return null
    }
  }

  private getTypeFromExtension(filename: string): string {
    const extension = filename.toLowerCase().split('.').pop()
    if (!extension) return 'image/unknown'
    
    const typeMap: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'bmp': 'image/bmp',
      'tiff': 'image/tiff',
      'tif': 'image/tiff',
      'svg': 'image/svg+xml',
      'ico': 'image/x-icon',
      'avif': 'image/avif',
      'heic': 'image/heic',
      'heif': 'image/heif'
    }
    return typeMap[extension] || 'image/unknown'
  }

  private async getImageDimensions(file: File): Promise<{ width: number; height: number } | undefined> {
    return new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      
      img.onload = () => {
        const dimensions = { width: img.naturalWidth, height: img.naturalHeight }
        URL.revokeObjectURL(url)
        resolve(dimensions)
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(url)
        console.warn(`Could not get dimensions for ${file.name}`)
        resolve(undefined)
      }
      
      img.src = url
      
      // Timeout for problematic files
      setTimeout(() => {
        URL.revokeObjectURL(url)
        resolve(undefined)
      }, 5000)
    })
  }

  private async generateThumbnail(file: File, maxSize = 150): Promise<string | undefined> {
    if (!file.type.startsWith('image/')) {
      return undefined
    }

    return new Promise((resolve) => {
      const img = new Image()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        resolve(undefined)
        return
      }

      const url = URL.createObjectURL(file)
      
      img.onload = () => {
        const { width, height } = img
        
        // Calculate new dimensions maintaining aspect ratio
        let newWidth = width
        let newHeight = height
        
        if (width > height) {
          if (width > maxSize) {
            newWidth = maxSize
            newHeight = (height * maxSize) / width
          }
        } else {
          if (height > maxSize) {
            newHeight = maxSize
            newWidth = (width * maxSize) / height
          }
        }
        
        canvas.width = newWidth
        canvas.height = newHeight
        
        ctx.drawImage(img, 0, 0, newWidth, newHeight)
        
        try {
          const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8)
          URL.revokeObjectURL(url)
          resolve(thumbnailDataUrl)
        } catch (error) {
          console.warn('Error generating thumbnail:', error)
          URL.revokeObjectURL(url)
          resolve(undefined)
        }
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(url)
        resolve(undefined)
      }
      
      img.src = url
      
      // Timeout for problematic files
      setTimeout(() => {
        URL.revokeObjectURL(url)
        resolve(undefined)
      }, 5000)
    })
  }

  private async generateFileHash(file: File): Promise<string> {
    try {
      const buffer = await file.arrayBuffer()
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      return hashHex
    } catch (error) {
      console.warn('Error generating file hash:', error)
      return `fallback_${file.size}_${file.lastModified}`
    }
  }

  private isImageFile(file: File): boolean {
    // Check MIME type first
    if (this.SUPPORTED_IMAGE_TYPES.has(file.type)) {
      return true
    }
    
    // Fallback to file extension if MIME type is not reliable
    const extension = '.' + file.name.toLowerCase().split('.').pop()
    return this.SUPPORTED_EXTENSIONS.has(extension)
  }

  // Category Management
  async createCategory(categoryData: Omit<LocalCategory, 'id'>): Promise<LocalCategory> {
    const newCategory: LocalCategory = {
      ...categoryData,
      id: `category_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    
    this.categories.push(newCategory)
    return newCategory
  }

  async updateCategory(id: string, updates: Partial<LocalCategory>): Promise<LocalCategory | null> {
    const index = this.categories.findIndex(cat => cat.id === id)
    if (index === -1) return null
    
    this.categories[index] = { ...this.categories[index], ...updates }
    return this.categories[index]
  }

  async deleteCategory(id: string): Promise<boolean> {
    const index = this.categories.findIndex(cat => cat.id === id)
    if (index === -1) return false
    
    this.categories.splice(index, 1)
    return true
  }

  // Photo Management
  async deletePhotos(photoIds: string[]): Promise<boolean> {
    const initialCount = this.photos.length
    
    // Clean up object URLs to prevent memory leaks
    this.photos.forEach(photo => {
      if (photoIds.includes(photo.id) && photo.url.startsWith('blob:')) {
        URL.revokeObjectURL(photo.url)
        if (photo.thumbnailUrl && photo.thumbnailUrl.startsWith('blob:')) {
          URL.revokeObjectURL(photo.thumbnailUrl)
        }
      }
    })
    
    this.photos = this.photos.filter(photo => !photoIds.includes(photo.id))
    
    return this.photos.length < initialCount
  }

  // Duplicate Detection with Enhanced Testing
  async findDuplicates(options: DuplicateDetectionOptions): Promise<LocalDuplicateGroup[]> {
    if (this.photos.length < 2) {
      return []
    }

    console.log(`Starting duplicate detection with ${this.photos.length} photos`)
    console.log('Detection options:', options)

    const groups: LocalDuplicateGroup[] = []
    const processed = new Set<string>()

    for (let i = 0; i < this.photos.length - 1; i++) {
      const photo1 = this.photos[i]
      
      if (processed.has(photo1.id)) continue

      const duplicates = [photo1]
      processed.add(photo1.id)

      for (let j = i + 1; j < this.photos.length; j++) {
        const photo2 = this.photos[j]
        
        if (processed.has(photo2.id)) continue

        const result = this.comparePhotos(photo1, photo2, options)
        
        console.log(`Comparing ${photo1.name} vs ${photo2.name}: similarity=${result.similarity}%, isDuplicate=${result.isDuplicate}`)
        
        if (result.isDuplicate) {
          duplicates.push(photo2)
          processed.add(photo2.id)
        }
      }

      if (duplicates.length > 1) {
        const group: LocalDuplicateGroup = {
          id: `group_${Date.now()}_${i}`,
          photos: duplicates,
          similarity: this.calculateGroupSimilarity(duplicates, options),
          reason: this.getDuplicateReasons(duplicates, options)
        }
        
        groups.push(group)
        console.log(`Created duplicate group with ${duplicates.length} photos: ${duplicates.map(p => p.name).join(', ')}`)
      }
    }

    this.duplicateGroups = groups
    console.log(`Found ${groups.length} duplicate groups`)
    return groups
  }

  private comparePhotos(photo1: LocalPhoto, photo2: LocalPhoto, options: DuplicateDetectionOptions): { isDuplicate: boolean; similarity: number; reasons: string[] } {
    const reasons: string[] = []
    let totalScore = 0
    let maxScore = 0

    // Exact hash match (highest priority)
    if (options.checkHash && photo1.hash && photo2.hash) {
      maxScore += 100
      if (photo1.hash === photo2.hash) {
        totalScore += 100
        reasons.push('Identical content hash')
        return { isDuplicate: true, similarity: 100, reasons }
      }
    }

    // File size comparison
    if (options.checkFileSize) {
      maxScore += 30
      const sizeDiff = Math.abs(photo1.size - photo2.size)
      const largerSize = Math.max(photo1.size, photo2.size)
      const sizePercentDiff = (sizeDiff / largerSize) * 100
      
      if (sizePercentDiff < 5) { // Less than 5% size difference
        totalScore += 30
        reasons.push('Similar file size')
      } else if (sizePercentDiff < 10) {
        totalScore += 15
        reasons.push('Somewhat similar file size')
      }
    }

    // Filename similarity
    if (options.checkFilename) {
      maxScore += 40
      const similarity = this.calculateStringSimilarity(photo1.name, photo2.name)
      if (similarity > 80) {
        totalScore += 40
        reasons.push('Very similar filename')
      } else if (similarity > 60) {
        totalScore += 20
        reasons.push('Similar filename')
      }
    }

    // Dimension comparison
    if (photo1.dimensions && photo2.dimensions) {
      maxScore += 30
      const widthDiff = Math.abs(photo1.dimensions.width - photo2.dimensions.width)
      const heightDiff = Math.abs(photo1.dimensions.height - photo2.dimensions.height)
      
      if (widthDiff === 0 && heightDiff === 0) {
        totalScore += 30
        reasons.push('Identical dimensions')
      } else if (widthDiff <= 10 && heightDiff <= 10) {
        totalScore += 15
        reasons.push('Similar dimensions')
      }
    }

    const finalSimilarity = maxScore > 0 ? (totalScore / maxScore) * 100 : 0
    const isDuplicate = finalSimilarity >= options.similarityThreshold

    return {
      isDuplicate,
      similarity: finalSimilarity,
      reasons
    }
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 100
    
    const editDistance = this.levenshteinDistance(longer, shorter)
    return ((longer.length - editDistance) / longer.length) * 100
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  private calculateGroupSimilarity(photos: LocalPhoto[], options: DuplicateDetectionOptions): number {
    if (photos.length < 2) return 0
    
    let totalSimilarity = 0
    let comparisons = 0
    
    for (let i = 0; i < photos.length - 1; i++) {
      for (let j = i + 1; j < photos.length; j++) {
        const result = this.comparePhotos(photos[i], photos[j], options)
        totalSimilarity += result.similarity
        comparisons++
      }
    }
    
    return comparisons > 0 ? totalSimilarity / comparisons : 0
  }

  private getDuplicateReasons(photos: LocalPhoto[], options: DuplicateDetectionOptions): string[] {
    const allReasons = new Set<string>()
    
    for (let i = 0; i < photos.length - 1; i++) {
      for (let j = i + 1; j < photos.length; j++) {
        const result = this.comparePhotos(photos[i], photos[j], options)
        result.reasons.forEach(reason => allReasons.add(reason))
      }
    }
    
    return Array.from(allReasons)
  }

  // Photo Filtering with Folder Structure Support
  filterPhotos(query: string, categoryId?: string): LocalPhoto[] {
    let filtered = [...this.photos]

    if (query.trim()) {
      const lowerQuery = query.toLowerCase()
      filtered = filtered.filter(photo =>
        photo.name.toLowerCase().includes(lowerQuery) ||
        photo.folder.toLowerCase().includes(lowerQuery) ||
        photo.type.toLowerCase().includes(lowerQuery)
      )
    }

    if (categoryId) {
      const category = this.categories.find(cat => cat.id === categoryId)
      if (category) {
        filtered = filtered.filter(photo =>
          category.patterns.some(pattern =>
            photo.name.toLowerCase().includes(pattern.toLowerCase()) ||
            photo.folder.toLowerCase().includes(pattern.toLowerCase())
          )
        )
      }
    }

    return filtered
  }

  // Statistics and Testing Methods
  getFileTypeStatistics(): Record<string, number> {
    const stats: Record<string, number> = {}
    
    this.photos.forEach(photo => {
      const type = photo.type || 'unknown'
      stats[type] = (stats[type] || 0) + 1
    })
    
    return stats
  }

  getFolderStatistics(): Record<string, number> {
    const stats: Record<string, number> = {}
    
    this.photos.forEach(photo => {
      const folder = photo.folder || 'root'
      stats[folder] = (stats[folder] || 0) + 1
    })
    
    return stats
  }

  // Getters
  getPhotos(): LocalPhoto[] {
    return [...this.photos]
  }

  getCategories(): LocalCategory[] {
    return [...this.categories]
  }

  getDuplicateGroups(): LocalDuplicateGroup[] {
    return [...this.duplicateGroups]
  }

  // Utility Methods
  formatFileSize(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  isFileSystemAccessSupported(): boolean {
    return typeof window !== 'undefined' && 'showDirectoryPicker' in window
  }

  // Cleanup method to prevent memory leaks
  cleanup(): void {
    this.photos.forEach(photo => {
      if (photo.url.startsWith('blob:')) {
        URL.revokeObjectURL(photo.url)
      }
      if (photo.thumbnailUrl && photo.thumbnailUrl.startsWith('blob:')) {
        URL.revokeObjectURL(photo.thumbnailUrl)
      }
    })
  }
}

export const localPhotoService = new LocalPhotoService()