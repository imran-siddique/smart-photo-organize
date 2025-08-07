// Local File System Service for Photo Organization

  name: string
  size: numb
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
  f
}

export interface LocalCategory {
export inter
  name: string
  patterns: string[]
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
    }
          newPhotos.push(photo)
    retur
      }
  pri

    this.photos = [...this.photos, ...newPhotos]
    return newPhotos
   

  async loadPhotosFromDirectory(dirHandle: FileSystemDirectoryHandle): Promise<LocalPhoto[]> {
    const newPhotos: LocalPhoto[] = []
    
    for await (const [name, handle] of dirHandle.entries()) {
        url: URL.createObjectURL(fi
        const file = await handle.getFile()
        if (this.isImageFile(file)) {
          const photo = await this.createPhotoFromFile(file, dirHandle.name)
      return photo
            newPhotos.push(photo)
      retur
        }
      } else if (handle.kind === 'directory') {
        // Recursively process subdirectories
        const subPhotos = await this.loadPhotosFromDirectory(handle)
        newPhotos.push(...subPhotos)
      }
    }

    this.photos = [...this.photos, ...newPhotos]

  }

  private isImageFile(file: File): boolean {

  }

  private async createPhotoFromFile(file: File, folderName = ''): Promise<LocalPhoto | null> {
         
      const dimensions = await this.getImageDimensions(file)
          

            if (blob) {
        id: `${file.name}_${file.size}_${file.lastModified}`,
              resolve(un
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        url: URL.createObjectURL(file),
        thumbnailUrl,
        img.src = URL.creat
        dimensions
      c

  }
    } catch (error) {
      console.error('Error creating photo:', error)
      return null

  }

  private async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight })
        )
      }
    return filtered

  asyn


    for (let i = 0; i < this.photos.length; i++) {

      const duplicates = [photo1]
      for (let j = i + 1; j < this.photos


        if (result.isDuplicate) {
          processed.add(photo2.
      }
      if (duplicates.length >
          id: `group_${Date.now()}_${i}`,
          
        }
      }
      proc

    return groups

    photo1: LocalPhoto, 
    options: Duplica
    let matchPoints = 0

    if (options.checkFileSize) {
      const sizeDiff = Math.abs
        m
    }
    // Filename similarity
      totalPoints += 1
      if 
      }

    if (options.check
      if (photo1.size === photo2.size && 
          photo1.dimen
    }
  }

      similarity: ove
  }
  private calculateStr
  }

    const editDistance = this.levenshteinDistance(lo
  }
  p

    for (let j = 0; j <= str2.length; j++)
    for (let j = 1; j <= str2.length; j++
    
          matrix[j][i - 1] 
          matri
      }

  }
  private getDuplicateReasons(pho

      rea

    

  }

  }
  // Utility Methods
    if (bytes === 0) return '0 Bytes'
   

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i

    return 'showDirect

  cle
    
      if (photo.thumbnailUrl) {
      }
   

  }

export const localPhotoService = 














  filterPhotos(query: string, categoryId?: string): LocalPhoto[] {
    let filtered = [...this.photos]

    if (query.trim()) {
      const lowerQuery = query.toLowerCase()
      filtered = filtered.filter(photo =>
        photo.name.toLowerCase().includes(lowerQuery) ||

      )
    }


      const category = this.categories.find(cat => cat.id === categoryId)

        filtered = filtered.filter(photo =>
          category.patterns.some(pattern =>
            photo.name.toLowerCase().includes(pattern.toLowerCase()) ||

          )

      }



  }









































  }
















    }

























  }





























































    return 'showDirectoryPicker' in window



  cleanup(): void {









    this.categories = []


}


export const localPhotoService = new LocalPhotoService()