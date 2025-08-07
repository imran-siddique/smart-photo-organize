// Local File System Service for Photo Organization

export interface LocalPhoto {
  id: string
  name: string
  type: string
  size: number
  lastModified: number
  url: string // Object URL for display
  thumbnailUrl?: string
  folder: string
  dimensions?: {
    width: number
    height: number
  }
}

export interface LocalCategory {
  id: string
  name: string
  patterns: string[]
  folder: string
  color: string
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

  // File Input Methods
  async loadPhotosFromFiles(files: FileList | File[]): Promise<LocalPhoto[]> {
    const newPhotos: LocalPhoto[] = []
    const fileArray = Array.from(files)

    for (const file of fileArray) {
      if (this.isImageFile(file)) {
        const photo = await this.createPhotoFromFile(file)
        if (photo) {
          newPhotos.push(photo)
        }
      }
    }

    this.photos = [...this.photos, ...newPhotos]
    return newPhotos
  }

  async loadPhotosFromDirectory(dirHandle: FileSystemDirectoryHandle): Promise<LocalPhoto[]> {
    const newPhotos: LocalPhoto[] = []
    
    for await (const [name, handle] of dirHandle.entries()) {
      if (handle.kind === 'file') {
        const fileHandle = handle as FileSystemFileHandle
        const file = await fileHandle.getFile()
        if (this.isImageFile(file)) {
          const photo = await this.createPhotoFromFile(file, dirHandle.name)
          if (photo) {
            newPhotos.push(photo)
          }
        }
      } else if (handle.kind === 'directory') {
        // Recursively process subdirectories
        const dirHandle = handle as FileSystemDirectoryHandle
        const subPhotos = await this.loadPhotosFromDirectory(dirHandle)
        newPhotos.push(...subPhotos)
      }
    }

    this.photos = [...this.photos, ...newPhotos]
    return newPhotos
  }

  private isImageFile(file: File): boolean {
    return file.type.startsWith('image/')
  }

  private async createPhotoFromFile(file: File, folderName = ''): Promise<LocalPhoto | null> {
    try {
      const dimensions = await this.getImageDimensions(file)
      const thumbnailUrl = await this.createThumbnail(file)

      return {
        id: `${file.name}_${file.size}_${file.lastModified}`,
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        url: URL.createObjectURL(file),
        thumbnailUrl,
        folder: folderName,
        dimensions
      }
    } catch (error) {
      console.error('Error creating photo:', error)
      return null
    }
  }

  private async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight })
        URL.revokeObjectURL(img.src)
      }
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  private async createThumbnail(file: File, maxSize = 200): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        const { width, height } = img
        const aspectRatio = width / height
        
        let newWidth, newHeight
        if (width > height) {
          newWidth = maxSize
          newHeight = maxSize / aspectRatio
        } else {
          newHeight = maxSize
          newWidth = maxSize * aspectRatio
        }

        canvas.width = newWidth
        canvas.height = newHeight
        
        ctx?.drawImage(img, 0, 0, newWidth, newHeight)
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(URL.createObjectURL(blob))
          } else {
            resolve(img.src)
          }
        }, 'image/jpeg', 0.7)
        
        URL.revokeObjectURL(img.src)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  // Photo Management
  getPhotos(): LocalPhoto[] {
    return [...this.photos]
  }

  deletePhotos(photoIds: string[]): Promise<void> {
    return new Promise((resolve) => {
      const photosToDelete = this.photos.filter(photo => photoIds.includes(photo.id))
      
      // Clean up object URLs
      photosToDelete.forEach(photo => {
        URL.revokeObjectURL(photo.url)
        if (photo.thumbnailUrl) {
          URL.revokeObjectURL(photo.thumbnailUrl)
        }
      })

      this.photos = this.photos.filter(photo => !photoIds.includes(photo.id))
      
      // Update duplicate groups
      this.duplicateGroups = this.duplicateGroups
        .map(group => ({
          ...group,
          photos: group.photos.filter(photo => !photoIds.includes(photo.id))
        }))
        .filter(group => group.photos.length > 1)

      resolve()
    })
  }

  filterPhotos(query: string, categoryId?: string): LocalPhoto[] {
    let filtered = [...this.photos]

    if (query.trim()) {
      const lowerQuery = query.toLowerCase()
      filtered = filtered.filter(photo =>
        photo.name.toLowerCase().includes(lowerQuery) ||
        photo.folder.toLowerCase().includes(lowerQuery)
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

  // Category Management
  getCategories(): LocalCategory[] {
    return [...this.categories]
  }

  createCategory(category: Omit<LocalCategory, 'id'>): Promise<LocalCategory> {
    return new Promise((resolve) => {
      const newCategory: LocalCategory = {
        ...category,
        id: `category_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
      
      this.categories.push(newCategory)
      resolve(newCategory)
    })
  }

  updateCategory(id: string, updates: Partial<LocalCategory>): Promise<LocalCategory | null> {
    return new Promise((resolve) => {
      const categoryIndex = this.categories.findIndex(cat => cat.id === id)
      
      if (categoryIndex === -1) {
        resolve(null)
        return
      }

      this.categories[categoryIndex] = { ...this.categories[categoryIndex], ...updates }
      resolve(this.categories[categoryIndex])
    })
  }

  deleteCategory(id: string): Promise<boolean> {
    return new Promise((resolve) => {
      const initialLength = this.categories.length
      this.categories = this.categories.filter(cat => cat.id !== id)
      resolve(this.categories.length < initialLength)
    })
  }

  // Duplicate Detection
  async findDuplicates(options: DuplicateDetectionOptions): Promise<LocalDuplicateGroup[]> {
    return this.detectDuplicates(options)
  }

  async detectDuplicates(options: DuplicateDetectionOptions): Promise<LocalDuplicateGroup[]> {
    const groups: LocalDuplicateGroup[] = []
    const processed = new Set<string>()

    for (let i = 0; i < this.photos.length; i++) {
      const photo1 = this.photos[i]
      
      if (processed.has(photo1.id)) continue

      const duplicates = [photo1]
      
      for (let j = i + 1; j < this.photos.length; j++) {
        const photo2 = this.photos[j]
        
        if (processed.has(photo2.id)) continue

        const result = this.comparePhotos(photo1, photo2, options)
        
        if (result.isDuplicate) {
          duplicates.push(photo2)
          processed.add(photo2.id)
        }
      }

      if (duplicates.length > 1) {
        groups.push({
          id: `group_${Date.now()}_${i}`,
          photos: duplicates,
          similarity: this.calculateGroupSimilarity(duplicates, options),
          reason: this.getDuplicateReasons(duplicates, options)
        })
        
        duplicates.forEach(photo => processed.add(photo.id))
      }
    }

    this.duplicateGroups = groups
    return groups
  }

  private comparePhotos(
    photo1: LocalPhoto, 
    photo2: LocalPhoto, 
    options: DuplicateDetectionOptions
  ): { isDuplicate: boolean; similarity: number } {
    let matchPoints = 0
    let totalPoints = 0

    // File size check
    if (options.checkFileSize) {
      totalPoints += 1
      const sizeDiff = Math.abs(photo1.size - photo2.size) / Math.max(photo1.size, photo2.size)
      if (sizeDiff < 0.1) { // Within 10% size difference
        matchPoints += 1
      }
    }

    // Filename similarity
    if (options.checkFilename) {
      totalPoints += 1
      const similarity = this.calculateStringSimilarity(photo1.name, photo2.name)
      if (similarity > 0.7) {
        matchPoints += similarity
      }
    }

    // Content hash (simplified - using size + dimensions as proxy)
    if (options.checkHash) {
      totalPoints += 1
      if (photo1.size === photo2.size && 
          photo1.dimensions?.width === photo2.dimensions?.width &&
          photo1.dimensions?.height === photo2.dimensions?.height) {
        matchPoints += 1
      }
    }

    const overallSimilarity = totalPoints > 0 ? (matchPoints / totalPoints) * 100 : 0
    
    return {
      isDuplicate: overallSimilarity >= options.similarityThreshold,
      similarity: overallSimilarity
    }
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const editDistance = this.levenshteinDistance(str1.toLowerCase(), str2.toLowerCase())
    const maxLength = Math.max(str1.length, str2.length)
    return maxLength === 0 ? 1 : (maxLength - editDistance) / maxLength
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
    let totalSimilarity = 0
    let comparisons = 0

    for (let i = 0; i < photos.length; i++) {
      for (let j = i + 1; j < photos.length; j++) {
        const result = this.comparePhotos(photos[i], photos[j], options)
        totalSimilarity += result.similarity
        comparisons++
      }
    }

    return comparisons > 0 ? totalSimilarity / comparisons : 0
  }

  private getDuplicateReasons(photos: LocalPhoto[], options: DuplicateDetectionOptions): string[] {
    const reasons: string[] = []

    // Check if all have same size
    const sizes = photos.map(p => p.size)
    if (new Set(sizes).size === 1) {
      reasons.push('Same file size')
    }

    // Check filename similarity
    if (options.checkFilename) {
      const names = photos.map(p => p.name.toLowerCase())
      const similarities: number[] = []
      for (let i = 0; i < names.length; i++) {
        for (let j = i + 1; j < names.length; j++) {
          similarities.push(this.calculateStringSimilarity(names[i], names[j]))
        }
      }
      const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length
      if (avgSimilarity > 0.7) {
        reasons.push('Similar filenames')
      }
    }

    // Check dimensions
    const dimensions = photos.filter(p => p.dimensions).map(p => `${p.dimensions!.width}x${p.dimensions!.height}`)
    if (dimensions.length === photos.length && new Set(dimensions).size === 1) {
      reasons.push('Same dimensions')
    }

    return reasons
  }

  getDuplicateGroups(): LocalDuplicateGroup[] {
    return [...this.duplicateGroups]
  }

  // Utility Methods
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  isFileSystemAccessSupported(): boolean {
    return 'showDirectoryPicker' in window
  }

  cleanup(): void {
    // Clean up all object URLs to prevent memory leaks
    this.photos.forEach(photo => {
      URL.revokeObjectURL(photo.url)
      if (photo.thumbnailUrl) {
        URL.revokeObjectURL(photo.thumbnailUrl)
      }
    })
    
    this.photos = []
    this.categories = []
    this.duplicateGroups = []
  }
}

export const localPhotoService = new LocalPhotoService()