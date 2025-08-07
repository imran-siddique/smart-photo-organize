// Local File System Service for Photo Organization

export interface LocalPhoto {
  id: string
  name: string
  type: string
  size: number
  lastModified: number
  folder: string
    width: number
  }

  id: string
  patterns: string
  c
 

  id: string
  similarity
}
export interface Dup
  checkFilename:
  similarityThr

  private photos: L
 

    const newPhotos: LocalPhoto[] = []

      if (this.isImage
        if (photo) {
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
      const thumbnailUrl = await th
      return {
        name: file.name,
        size: file.size,
        url: URL.creat
        folder: folderName,
      }
      con
    }

    return new Promise((resolve, reject) => {
      img.onload = () => {
       
     


    return new Promi
   

        const { width, height } = img
        
   

          newHeight = maxSize
        }
        canvas.width = newWidth
        

          if (
          } else {
          }
        
      }
      img.src = URL.createObjectURL(file
  }
  // Photo Management
    return [...this.photos]

    ret
      
      photosToDelete.forEach(photo => {
        if (photo
     


      this.duplicateGroups = this.duplicateGroups
          ...group,
        }))

    })

    let
    if (query.trim()) {
      filtered = filtered.filter(photo =>
      
   

      if (category) {
          category.patterns.some(patt
            photo.folder.toLowerCase().includes(patte
        )
    }


  getCategories(): LocalCategory[] {
  }
  create
      const newCategory: LocalC
        id: `category_${Date.
      
      resolve(newCategory)
  }
  updateCategory(id: string, 
      const categoryIndex = this.categorie
      if 


      resolve(this.categories[cat
  }
  deleteCategory(id: string): Promise<boolean> {
      co
      resolve(this.categories.len
  }
  // Duplicate Detection
    return this.de

    const g

      co
      if (processed.has(photo1.id)) 
      c
      
        

   

        }

        groups.push({
   

        
      }

    re

    photo1: LocalPhoto, 
    options: DuplicateDetectionOptions
    let matchPoints = 0

    if (o
      co

    }
    //
      totalPoints += 1
      if (similarity > 0.7) {
      }

    if (options.checkHash) {
      if (p
          photo1.dimensions?.height === photo2.di


    
   


    const editDistance = this.leven


    const matrix: number[][] = []
    for (let i = 0; i <= str2.length; i++
    }
    for (let j = 0; j <= str1.length; j++) {
    }
    f

        } else {
            matrix[i - 1][j - 1] + 1,
            matrix[i 
        }
    }
    return matrix[str2.length][str1.length]

    let tot

      f
     


  }


    const sizes = photos.map(p => p.
      reasons.push('Same file s


      const similarities: number[] = []
        for (let j = i + 1; j < names
        }
      const avgSimil
        reasons.push('Similar filenames')
    }
    //
    if (dimensions.length === photos.le
    }
    re



  formatFileSize(bytes: number): stri
    
    co
    
  }
  isFileSystem
  }

    this.photos.forEach(photo => {
      if (photo.thumbnailUrl) {
      
   

  }



















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
    const matrix = []

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
      const similarities = []
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