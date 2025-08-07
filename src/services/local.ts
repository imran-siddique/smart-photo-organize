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
        const file = await handle.getFile()
        if (this.isImageFile(file)) {
          const photo = await this.createPhotoFromFile(file, dirHandle.name)
          if (photo) {
            newPhotos.push(photo)
          }
        }
      } else if (handle.kind === 'directory') {
        // Recursively process subdirectories
        const subPhotos = await this.loadPhotosFromDirectory(handle)
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

      const photo: LocalPhoto = {
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

      return photo
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

  private async createThumbnail(file: File): Promise<string | undefined> {
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return undefined

      return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
          const maxSize = 200
          const ratio = Math.min(maxSize / img.width, maxSize / img.height)
          
          canvas.width = img.width * ratio
          canvas.height = img.height * ratio
          
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(URL.createObjectURL(blob))
            } else {
              resolve(undefined)
            }
            URL.revokeObjectURL(img.src)
          }, 'image/jpeg', 0.8)
        }
        img.onerror = () => {
          URL.revokeObjectURL(img.src)
          resolve(undefined)
        }
        img.src = URL.createObjectURL(file)
      })
    } catch (error) {
      console.error('Error creating thumbnail:', error)
      return undefined
    }
  }

  // Photo Management
  getPhotos(): LocalPhoto[] {
    return this.photos
  }

  getPhotoById(id: string): LocalPhoto | undefined {
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

  // Category Management
  getCategories(): LocalCategory[] {
    return this.categories.sort((a, b) => a.sortOrder - b.sortOrder)
  }

  createCategory(categoryData: Omit<LocalCategory, 'id'>): LocalCategory {
    const newCategory: LocalCategory = {
      ...categoryData,
      id: `category_${Date.now()}`
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

  // Filtering and Search
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

  // Duplicate Detection
  async findDuplicates(options: DuplicateDetectionOptions): Promise<LocalDuplicateGroup[]> {
    if (this.photos.length < 2) return []

    const groups: LocalDuplicateGroup[] = []
    const processed = new Set<string>()

    for (let i = 0; i < this.photos.length; i++) {
      if (processed.has(this.photos[i].id)) continue

      const photo1 = this.photos[i]
      const duplicates = [photo1]

      for (let j = i + 1; j < this.photos.length; j++) {
        if (processed.has(this.photos[j].id)) continue

        const photo2 = this.photos[j]
        const result = await this.comparePhotos(photo1, photo2, options)

        if (result.isDuplicate) {
          duplicates.push(photo2)
          processed.add(photo2.id)
        }
      }

      if (duplicates.length > 1) {
        const group: LocalDuplicateGroup = {
          id: `group_${Date.now()}_${i}`,
          photos: duplicates,
          similarity: options.similarityThreshold,
          reason: this.getDuplicateReasons(duplicates[0], duplicates[1], options)
        }
        groups.push(group)
      }

      processed.add(photo1.id)
    }

    this.duplicateGroups = groups
    return groups
  }

  private async comparePhotos(
    photo1: LocalPhoto, 
    photo2: LocalPhoto, 
    options: DuplicateDetectionOptions
  ): Promise<{ isDuplicate: boolean; similarity: number }> {
    let matchPoints = 0
    let totalPoints = 0

    // File size check
    if (options.checkFileSize) {
      totalPoints += 1
      const sizeDiff = Math.abs(photo1.size - photo2.size) / Math.max(photo1.size, photo2.size)
      if (sizeDiff < 0.05) { // 5% tolerance
        matchPoints += 1
      }
    }

    // Filename similarity
    if (options.checkFilename) {
      totalPoints += 1
      const similarity = this.calculateStringSimilarity(photo1.name, photo2.name)
      if (similarity > options.similarityThreshold / 100) {
        matchPoints += similarity
      }
    }

    // Hash check (simplified - using basic properties)
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
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    const editDistance = this.levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        )
      }
    }

    return matrix[str2.length][str1.length]
  }

  private getDuplicateReasons(photo1: LocalPhoto, photo2: LocalPhoto, options: DuplicateDetectionOptions): string[] {
    const reasons: string[] = []

    if (options.checkFileSize && Math.abs(photo1.size - photo2.size) / Math.max(photo1.size, photo2.size) < 0.05) {
      reasons.push('Similar file size')
    }

    if (options.checkFilename && this.calculateStringSimilarity(photo1.name, photo2.name) > 0.8) {
      reasons.push('Similar filename')
    }

    if (options.checkHash && photo1.size === photo2.size) {
      reasons.push('Identical properties')
    }

    return reasons
  }

  // Utility Methods
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  static isFileSystemAccessSupported(): boolean {
    return 'showDirectoryPicker' in window
  }

  // Cleanup
  cleanup(): void {
    // Clean up all object URLs
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

export { LocalPhotoService }
export const localPhotoService = new LocalPhotoService()