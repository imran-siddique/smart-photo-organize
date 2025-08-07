// Local File System Service for Photo Organization

export interface LocalPhoto {
  id: string
  type: string
  size: number
  type: string
  lastModified: number
  dimensions
  url: string // Object URL for display
  thumbnailUrl?: string
  folder: string
  dimensions?: {
    width: number
  patterns: string
  }
e

  checkFileSize: boolean
  checkHash:
}
export class LocalPh
  private categ

  async loadPhotosF
    const fileArray
 

          newPhotos.push(photo)
      }

    return newPhotos
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
   

        resolve({ width: img.naturalWidth, height: img.naturalHeight })
      }
    
      }
    })

    try {
      const ctx = canvas.getContext('2d

      return new Promise
          const maxSize = 200
          
          c
          ctx.drawImage(img, 0, 0, canvas.width, 
          canvas.toBlob((blob) => {
              resolve(URL.createObjectURL(blob))
              resolve(null)
            URL.revok
        }
          URL.
        }
      }
      console.error('
    }


  }
  // Photo Managemen
   

    return this.photos.find(photo => photo.id === id)

    const idsToDelete = new Set(ph
    // Clean up object URLs
      .filter(photo => idsToDelete.has(photo.id))
      
          URL.revokeObjectURL(pho
      })
    this.photos = this.p

    // Clean up all obje
      URL.revokeObjectURL(photo.url)
        URL.r
    })
    this.photos = []
  }
  // Ca


    const newCategory: LocalCategory = {
      id: this.generateId
    
    ret

    const index = 

    return this.categories[index]

    c



  categorizePhotos(): void {
      const matchingCategory 
          photo.name.toLow
        resolve({ width: img.naturalWidth, height: img.naturalHeight })
        URL.revokeObjectURL(img.src)
       
      img.onerror = () => {
        URL.revokeObjectURL(img.src)
        resolve(undefined)
      }
      img.src = URL.createObjectURL(file)
    })
   

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

        }
        console.warn('Hash calculation faile
    }
   

      
        score += 20
      } else if (widthDiff 
   

    return { score: Math.min(100, score), reason

   


      for (let j = i + 1; j < photos.leng
    
      }

  }
  private calculateNameSi
    const n1 = normalize(name1)


    const
    if (

  }
  p

    for (let j = 0; j <= s
    for (let j = 1; j <= str2.l
        const indicator = str1[i -
          matrix[j][i - 1] + 1,
          matrix[j - 1][i - 1] 
      }
    
  }
  pr
    const hashBuffer
    return hashArray.map(b =>



  filterPhotos(query: string, catego

   

        (photo.folder && photo.folder.toLowerCase().includes(lowerQuer
    }
    // Filter by c
      const category = this
     
    
          )
      }


  // Utility Methods
    return `local_${Date.now()}_${Math.random().toString(36).subs


    let unitIndex = 0
    while (size >= 1024 && unitIn
   

  }
  // Check if File System Access API is supported
    return 'showDirectoryPicker' i

  cleanup(): void {
    this.catego
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