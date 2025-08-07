// Local File System Service for Photo Organization

export interface LocalPhoto {
  id: string
  name: string
  size: number
  type: string
  lastModified: number
  file: File
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

export class LocalPhotoService {
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
    
    try {
      for await (const [name, handle] of dirHandle.entries()) {
        if (handle.kind === 'file') {
          const file = await handle.getFile()
          if (this.isImageFile(file)) {
            const photo = await this.createPhotoFromFile(file, name)
            if (photo) {
              newPhotos.push(photo)
            }
          }
        } else if (handle.kind === 'directory') {
          // Recursively load from subdirectories
          const subPhotos = await this.loadPhotosFromDirectory(handle)
          newPhotos.push(...subPhotos.map(photo => ({
            ...photo,
            folder: `${name}/${photo.folder || ''}`.replace(/\/$/, '')
          })))
        }
      }
    } catch (error) {
      console.error('Error reading directory:', error)
    }

    this.photos = [...this.photos, ...newPhotos]
    return newPhotos
  }

  private async createPhotoFromFile(file: File, folderPath?: string): Promise<LocalPhoto | null> {
    try {
      const id = this.generateId()
      const url = URL.createObjectURL(file)
      const dimensions = await this.getImageDimensions(file)
      
      const photo: LocalPhoto = {
        id,
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        file,
        url,
        folder: folderPath || '',
        dimensions
      }

      // Create thumbnail
      const thumbnailUrl = await this.createThumbnail(file)
      if (thumbnailUrl) {
        photo.thumbnailUrl = thumbnailUrl
      }

      return photo
    } catch (error) {
      console.error('Error creating photo from file:', error)
      return null
    }
  }

  private async getImageDimensions(file: File): Promise<{ width: number; height: number } | undefined> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight })
        URL.revokeObjectURL(img.src)
      }
      img.onerror = () => {
        URL.revokeObjectURL(img.src)
        resolve(undefined)
      }
      img.src = URL.createObjectURL(file)
    })
  }

  private async createThumbnail(file: File): Promise<string | null> {
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return null

      const img = new Image()
      return new Promise((resolve) => {
        img.onload = () => {
          const maxSize = 200
          const ratio = Math.min(maxSize / img.naturalWidth, maxSize / img.naturalHeight)
          
          canvas.width = img.naturalWidth * ratio
          canvas.height = img.naturalHeight * ratio
          
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(URL.createObjectURL(blob))
            } else {
              resolve(null)
            }
            URL.revokeObjectURL(img.src)
          }, 'image/jpeg', 0.8)
        }
        img.onerror = () => {
          URL.revokeObjectURL(img.src)
          resolve(null)
        }
        img.src = URL.createObjectURL(file)
      })
    } catch (error) {
      console.error('Error creating thumbnail:', error)
      return null
    }
  }

  private isImageFile(file: File): boolean {
    return file.type.startsWith('image/') &&
           /\.(jpg|jpeg|png|gif|bmp|webp|tiff|tif)$/i.test(file.name)
  }

  // Photo Management
  getPhotos(): LocalPhoto[] {
    return [...this.photos]
  }

  getPhoto(id: string): LocalPhoto | undefined {
    return this.photos.find(photo => photo.id === id)
  }

  deletePhotos(photoIds: string[]): void {
    const idsToDelete = new Set(photoIds)
    
    // Clean up object URLs
    this.photos
      .filter(photo => idsToDelete.has(photo.id))
      .forEach(photo => {
        URL.revokeObjectURL(photo.url)
        if (photo.thumbnailUrl) {
          URL.revokeObjectURL(photo.thumbnailUrl)
        }
      })

    this.photos = this.photos.filter(photo => !idsToDelete.has(photo.id))
  }

  clearAllPhotos(): void {
    // Clean up all object URLs
    this.photos.forEach(photo => {
      URL.revokeObjectURL(photo.url)
      if (photo.thumbnailUrl) {
        URL.revokeObjectURL(photo.thumbnailUrl)
      }
    })
    
    this.photos = []
    this.duplicateGroups = []
  }

  // Category Management
  getCategories(): LocalCategory[] {
    return [...this.categories]
  }

  createCategory(category: Omit<LocalCategory, 'id'>): LocalCategory {
    const newCategory: LocalCategory = {
      ...category,
      id: this.generateId()
    }
    
    this.categories.push(newCategory)
    return newCategory
  }

  updateCategory(id: string, updates: Partial<LocalCategory>): LocalCategory | null {
    const index = this.categories.findIndex(cat => cat.id === id)
    if (index === -1) return null

    this.categories[index] = { ...this.categories[index], ...updates }
    return this.categories[index]
  }

  deleteCategory(id: string): boolean {
    const index = this.categories.findIndex(cat => cat.id === id)
    if (index === -1) return false

    this.categories.splice(index, 1)
    return true
  }

  // Photo Categorization
  categorizePhotos(): void {
    for (const photo of this.photos) {
      const matchingCategory = this.categories.find(category =>
        category.autoSort && category.patterns.some(pattern =>
          photo.name.toLowerCase().includes(pattern.toLowerCase()) ||
          (photo.folder && photo.folder.toLowerCase().includes(pattern.toLowerCase()))
        )
      )

      if (matchingCategory) {
        photo.folder = matchingCategory.folder
      }
    }
  }

  getPhotosByCategory(categoryId: string): LocalPhoto[] {
    const category = this.categories.find(cat => cat.id === categoryId)
    if (!category) return []

    return this.photos.filter(photo =>
      category.patterns.some(pattern =>
        photo.name.toLowerCase().includes(pattern.toLowerCase()) ||
        (photo.folder && photo.folder.toLowerCase().includes(pattern.toLowerCase()))
      )
    )
  }

  // Duplicate Detection
  async findDuplicates(options: DuplicateDetectionOptions): Promise<LocalDuplicateGroup[]> {
    const groups: LocalDuplicateGroup[] = []
    const processedIds = new Set<string>()

    for (let i = 0; i < this.photos.length; i++) {
      const photo1 = this.photos[i]
      if (processedIds.has(photo1.id)) continue

      const duplicates: LocalPhoto[] = [photo1]
      const reasons: string[] = []

      for (let j = i + 1; j < this.photos.length; j++) {
        const photo2 = this.photos[j]
        if (processedIds.has(photo2.id)) continue

        const similarity = await this.calculateSimilarity(photo1, photo2, options)
        
        if (similarity.score >= options.similarityThreshold) {
          duplicates.push(photo2)
          processedIds.add(photo2.id)
          reasons.push(...similarity.reasons)
        }
      }

      if (duplicates.length > 1) {
        const group: LocalDuplicateGroup = {
          id: this.generateId(),
          photos: duplicates,
          similarity: await this.calculateGroupSimilarity(duplicates, options),
          reason: [...new Set(reasons)] // Remove duplicates
        }
        
        groups.push(group)
        duplicates.forEach(photo => processedIds.add(photo.id))
      }
    }

    this.duplicateGroups = groups
    return groups
  }

  private async calculateSimilarity(
    photo1: LocalPhoto, 
    photo2: LocalPhoto,
    options: DuplicateDetectionOptions
  ): Promise<{ score: number; reasons: string[] }> {
    let score = 0
    const reasons: string[] = []

    // File size comparison
    if (options.checkFileSize) {
      const sizeDiff = Math.abs(photo1.size - photo2.size) / Math.max(photo1.size, photo2.size)
      if (sizeDiff < 0.1) {
        score += 30
        reasons.push('Similar file size')
      }
    }

    // Filename comparison  
    if (options.checkFilename) {
      const nameSimilarity = this.calculateNameSimilarity(photo1.name, photo2.name)
      if (nameSimilarity > 0.7) {
        score += 40
        reasons.push('Similar filename')
      }
    }

    // Hash comparison
    if (options.checkHash) {
      try {
        const hash1 = await this.calculateFileHash(photo1.file)
        const hash2 = await this.calculateFileHash(photo2.file)
        
        if (hash1 === hash2) {
          score += 50
          reasons.push('Identical content')
        }
      } catch (error) {
        console.warn('Hash calculation failed:', error)
      }
    }

    // Dimension comparison
    if (photo1.dimensions && photo2.dimensions) {
      const widthDiff = Math.abs(photo1.dimensions.width - photo2.dimensions.width)
      const heightDiff = Math.abs(photo1.dimensions.height - photo2.dimensions.height)
      
      if (widthDiff === 0 && heightDiff === 0) {
        score += 20
        reasons.push('Same dimensions')
      } else if (widthDiff < 10 && heightDiff < 10) {
        score += 10
        reasons.push('Similar dimensions')
      }
    }

    return { score: Math.min(100, score), reasons }
  }

  private async calculateGroupSimilarity(photos: LocalPhoto[], options: DuplicateDetectionOptions): Promise<number> {
    if (photos.length < 2) return 0

    let totalScore = 0
    let comparisons = 0

    for (let i = 0; i < photos.length; i++) {
      for (let j = i + 1; j < photos.length; j++) {
        const similarity = await this.calculateSimilarity(photos[i], photos[j], options)
        totalScore += similarity.score
        comparisons++
      }
    }

    return comparisons > 0 ? totalScore / comparisons : 0
  }

  private calculateNameSimilarity(name1: string, name2: string): number {
    const normalize = (str: string) => str.toLowerCase().replace(/\.(jpg|jpeg|png|gif|bmp|webp|tiff|tif)$/i, '')
    const n1 = normalize(name1)
    const n2 = normalize(name2)

    if (n1 === n2) return 1

    const longer = n1.length > n2.length ? n1 : n2
    const shorter = n1.length > n2.length ? n2 : n1

    if (longer.length === 0) return 1

    const distance = this.levenshteinDistance(longer, shorter)
    return (longer.length - distance) / longer.length
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        )
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  private async calculateFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  getDuplicateGroups(): LocalDuplicateGroup[] {
    return [...this.duplicateGroups]
  }

  // Filtering
  filterPhotos(query: string, categoryId?: string): LocalPhoto[] {
    let filtered = [...this.photos]

    // Filter by search query
    if (query.trim()) {
      const lowerQuery = query.toLowerCase()
      filtered = filtered.filter(photo =>
        photo.name.toLowerCase().includes(lowerQuery) ||
        (photo.folder && photo.folder.toLowerCase().includes(lowerQuery))
      )
    }

    // Filter by category
    if (categoryId) {
      const category = this.categories.find(cat => cat.id === categoryId)
      if (category) {
        filtered = filtered.filter(photo =>
          category.patterns.some(pattern =>
            photo.name.toLowerCase().includes(pattern.toLowerCase()) ||
            (photo.folder && photo.folder.toLowerCase().includes(pattern.toLowerCase()))
          )
        )
      }
    }

    return filtered
  }

  // Utility Methods
  private generateId(): string {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  // Check if File System Access API is supported
  static isFileSystemAccessSupported(): boolean {
    return 'showDirectoryPicker' in window
  }

  // Cleanup method
  cleanup(): void {
    this.clearAllPhotos()
    this.categories = []
    this.duplicateGroups = []
  }
}

export const localPhotoService = new LocalPhotoService()