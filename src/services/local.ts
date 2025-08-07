// Local File System Service for Photo Organization


export interface LocalPhoto {
    width: n
  name: string
  size: number
  type: string
  lastModified: number
  file: File
  url: string // Object URL for display
  thumbnailUrl?: string
  folder: string
  sortOrder: numb

  i
  similarity: num
}

  checkFilename: boolean
  similarity

  private photos: Lo
  private dupli
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
  p

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
    return file.type.
      console.error('Error reading directory:', error)


    return [...this.photos]
    return newPhotos
  }

  private async createPhotoFromFile(file: File, folderPath?: string): Promise<LocalPhoto | null> {
    try {
    
      const url = URL.createObjectURL(file)
      const dimensions = await this.getImageDimensions(file)
      
        if (ph
        id,
        name: file.name,
        size: file.size,
  }
        lastModified: file.lastModified,
    // Revoke
        url,
      if (photo.thu
        folder: folderPath || ''
    })
    } catch (error) {
      console.error('Error creating photo from file:', error)
      return null
  // 
  }

  private async getImageDimensions(file: File): Promise<{ width: number; height: number } | undefined> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight })
    return newCategory
      }
      img.onerror = () => resolve(undefined)
      img.src = URL.createObjectURL(file)
    })
  }

  private isImageFile(file: File): boolean {
    const index = this.categories.findIndex(c
           /\.(jpg|jpeg|png|gif|bmp|webp|tiff|tif)$/i.test(file.name)
   

  // Photo Management
  getPhotos(): LocalPhoto[] {
    return [...this.photos]
  }

  getPhoto(id: string): LocalPhoto | undefined {
    return this.photos.find(photo => photo.id === id)
  }

  deletePhotos(photoIds: string[]): void {
    const idsToDelete = new Set(photoIds)
    
    const category = this.categories.find(cat => 
    this.photos
      .filter(photo => idsToDelete.has(photo.id))
      .forEach(photo => {
        URL.revokeObjectURL(photo.url)
        if (photo.thumbnailUrl) {
          URL.revokeObjectURL(photo.thumbnailUrl)
        }
  async 

    this.photos = this.photos.filter(photo => !idsToDelete.has(photo.id))
  }

  clearAllPhotos(): void {
      const reasons: string[]
    this.photos.forEach(photo => {
        const photo2 = this.photos[j
      if (photo.thumbnailUrl) {
        URL.revokeObjectURL(photo.thumbnailUrl)
      }
      
    
    this.photos = []
    this.duplicateGroups = []
   

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
      con
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

  }

  // Duplicate Detection
  async findDuplicates(options: DuplicateDetectionOptions): Promise<LocalDuplicateGroup[]> {
    const groups: LocalDuplicateGroup[] = []
    const processedIds = new Set<string>()

    const shorter = n1.length > n2.length ? n2 : n
      const photo1 = this.photos[i]
      if (processedIds.has(photo1.id)) continue

      const duplicates: LocalPhoto[] = [photo1]
      const reasons: string[] = []

      for (let j = i + 1; j < this.photos.length; j++) {
    for (let j = 0; j <= str2.length;
        if (processedIds.has(photo2.id)) continue

        const similarity = await this.calculateSimilarity(photo1, photo2, options)
        
        if (similarity.score >= options.similarityThreshold) {
        )
          reasons.push(...similarity.reasons)
    
      }

      if (duplicates.length > 1) {
        const group: LocalDuplicateGroup = {
          id: this.generateId(),
          photos: duplicates,
          similarity: await this.calculateGroupSimilarity(duplicates, options),
    return [...this.duplicateGroups]
        }
  // Fil
        groups.push(group)

      }
    }

    this.duplicateGroups = groups
    return groups


  private async calculateSimilarity(
    photo1: LocalPhoto, 
          category.patte
    options: DuplicateDetectionOptions
  ): Promise<{ score: number; reasons: string[] }> {
    let score = 0
    const reasons: string[] = []

  }
    if (options.checkFileSize) {
      const sizeDiff = Math.abs(photo1.size - photo2.size) / Math.max(photo1.size, photo2.size)
      if (sizeDiff < 0.1) {
        score += 30
        reasons.push('Similar file size')
      }
    }

    // Filename comparison  
    }
      const nameSimilarity = this.calculateNameSimilarity(photo1.name, photo2.name)
      if (nameSimilarity > 0.7) {
        score += 40
  static isFileSystemAccessSupported(): 
      }


    this.clearAllPhotos()
    if (options.checkHash) {
}
        const hash1 = await this.calculateFileHash(photo1.file)
        const hash2 = await this.calculateFileHash(photo2.file)
        

          score += 50

        }
      } catch (error) {
        console.warn('Hash calculation failed:', error)

    }

    // Dimension comparison

      const widthDiff = Math.abs(photo1.dimensions.width - photo2.dimensions.width)
      const heightDiff = Math.abs(photo1.dimensions.height - photo2.dimensions.height)
      
      if (widthDiff === 0 && heightDiff === 0) {
        score += 20
        reasons.push('Same dimensions')
      } else if (widthDiff < 10 && heightDiff < 10) {

        reasons.push('Similar dimensions')

    }

    return { score: Math.min(100, score), reasons }


  private async calculateGroupSimilarity(photos: LocalPhoto[], options: DuplicateDetectionOptions): Promise<number> {
    if (photos.length < 2) return 0

    let totalScore = 0
    let comparisons = 0

    for (let i = 0; i < photos.length; i++) {
      for (let j = i + 1; j < photos.length; j++) {
        const similarity = await this.calculateSimilarity(photos[i], photos[j], options)
        totalScore += similarity.score

      }
    }

    return comparisons > 0 ? totalScore / comparisons : 0
  }

  private calculateNameSimilarity(name1: string, name2: string): number {
    const normalize = (str: string) => str.toLowerCase().replace(/\.(jpg|jpeg|png|gif|bmp|webp|tiff|tif)$/i, '')
    const n1 = normalize(name1)


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

      }

    
    return matrix[str2.length][str1.length]
  }

  private async calculateFileHash(file: File): Promise<string> {

    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')


  getDuplicateGroups(): LocalDuplicateGroup[] {
    return [...this.duplicateGroups]



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

      const category = this.categories.find(cat => cat.id === categoryId)

        filtered = filtered.filter(photo =>
          category.patterns.some(pattern =>
            photo.name.toLowerCase().includes(pattern.toLowerCase()) ||
            (photo.folder && photo.folder.toLowerCase().includes(pattern.toLowerCase()))
          )

      }



  }

  // Utility Methods
  private generateId(): string {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']

    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  // Check if File System Access API is supported

    return 'showDirectoryPicker' in window


  // Cleanup method
  cleanup(): void {

    this.categories = []

}

export const localPhotoService = new LocalPhotoService()