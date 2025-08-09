// Photo management service implementation

import { PhotoEntity, CategoryEntity, PhotoMetadata } from '../../../domain/entities'
import { PhotoPath, FileSize } from '../../../domain/value-objects'
import { PhotoFilter, PhotoSort, PhotoLoadOptions, PhotoOperationResult } from '../types'
import { logger, performanceMonitor, memoryMonitor } from '../../../infrastructure/monitoring'
import { ErrorFactory, AppError } from '../../../infrastructure/security/error-handling'
import { generateId, sanitizeFiles, chunk, groupBy } from '../../../shared/utils'
import { APP_CONFIG, SUPPORTED_FILE_TYPES } from '../../../shared/constants'

export class PhotoManagementService {
  private photos: Map<string, PhotoEntity> = new Map()
  private categories: Map<string, CategoryEntity> = new Map()

  /**
   * Load photos from various sources
   */
  async loadPhotos(
    source: 'files' | 'folder',
    input: FileList | string,
    options: PhotoLoadOptions = {}
  ): Promise<PhotoEntity[]> {
    const {
      includeMetadata = true,
      generateThumbnails = true,
      batchSize = APP_CONFIG.MAX_PHOTOS_PER_BATCH,
      onProgress
    } = options

    logger.info('Starting photo load', { source, photoCount: input instanceof FileList ? input.length : 1 })
    performanceMonitor.mark('photo-load-start')

    try {
      let files: File[]
      
      if (source === 'files' && input instanceof FileList) {
        files = sanitizeFiles(input)
      } else {
        throw ErrorFactory.validationFailed('input', input, 'Invalid input type for photo loading')
      }

      if (files.length === 0) {
        throw ErrorFactory.validationFailed('files', files, 'No valid image files found')
      }

      const loadedPhotos: PhotoEntity[] = []
      const batches = chunk(files, batchSize)
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i]
        const batchPhotos = await this.processBatch(batch, {
          includeMetadata,
          generateThumbnails
        })
        
        loadedPhotos.push(...batchPhotos)
        
        // Update progress
        const progress = ((i + 1) / batches.length) * 100
        onProgress?.(progress, `Processing batch ${i + 1} of ${batches.length}`)
        
        // Memory management - small delay between batches
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 50))
          memoryMonitor.recordMemoryUsage(`batch-${i + 1}-complete`)
        }
      }

      // Store loaded photos
      loadedPhotos.forEach(photo => {
        this.photos.set(photo.id, photo)
      })

      performanceMonitor.measure('photo-load-total', 'photo-load-start')
      logger.info('Photo loading completed', { loadedCount: loadedPhotos.length })
      
      return loadedPhotos
    } catch (error) {
      logger.error('Photo loading failed', { 
        source, 
        error: error as Error 
      })
      throw ErrorFactory.processingFailed('photo loading', error as Error)
    }
  }

  /**
   * Process a batch of files into PhotoEntity objects
   */
  private async processBatch(
    files: File[],
    options: { includeMetadata: boolean; generateThumbnails: boolean }
  ): Promise<PhotoEntity[]> {
    const photos: PhotoEntity[] = []
    
    const promises = files.map(async (file) => {
      try {
        return await this.processFile(file, options)
      } catch (error) {
        logger.warn('Failed to process file', { 
          filename: file.name, 
          error: error as Error 
        })
        return null
      }
    })

    const results = await Promise.allSettled(promises)
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        photos.push(result.value)
      } else if (result.status === 'rejected') {
        logger.warn('File processing rejected', { 
          filename: files[index]?.name,
          error: result.reason 
        })
      }
    })

    return photos
  }

  /**
   * Process a single file into a PhotoEntity
   */
  private async processFile(
    file: File,
    options: { includeMetadata: boolean; generateThumbnails: boolean }
  ): Promise<PhotoEntity> {
    const photoPath = PhotoPath.fromString(file.name)
    
    if (!photoPath.isImageFile()) {
      throw ErrorFactory.invalidFileType(file.name, file.type)
    }

    const fileSize = FileSize.fromBytes(file.size)
    let photoData = {
      id: generateId('photo'),
      name: photoPath.filename,
      path: photoPath.fullPath,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      metadata: undefined as PhotoMetadata | undefined,
      preview: undefined as string | undefined,
      hash: undefined as string | undefined
    }

    if (options.generateThumbnails) {
      try {
        photoData.preview = await this.generateThumbnail(file)
      } catch (error) {
        logger.warn('Thumbnail generation failed', { 
          filename: file.name, 
          error: error as Error 
        })
      }
    }

    if (options.includeMetadata) {
      try {
        photoData.metadata = await this.extractMetadata(file)
      } catch (error) {
        logger.warn('Metadata extraction failed', { 
          filename: file.name, 
          error: error as Error 
        })
      }
    }

    return photoData as PhotoEntity
  }

  /**
   * Generate thumbnail for a photo
   */
  private async generateThumbnail(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        try {
          const size = APP_CONFIG.THUMBNAIL_SIZE
          
          // Calculate dimensions maintaining aspect ratio
          let { width, height } = img
          if (width > height) {
            if (width > size) {
              height = (height * size) / width
              width = size
            }
          } else {
            if (height > size) {
              width = (width * size) / height
              height = size
            }
          }

          canvas.width = width
          canvas.height = height
          
          ctx?.drawImage(img, 0, 0, width, height)
          
          const thumbnail = canvas.toDataURL('image/jpeg', 0.8)
          resolve(thumbnail)
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => reject(new Error('Failed to load image for thumbnail'))
      
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * Extract metadata from photo file
   */
  private async extractMetadata(file: File): Promise<any> {
    // Basic metadata extraction
    // In a real implementation, you would use libraries like exif-js or piexifjs
    const img = new Image()
    
    return new Promise((resolve) => {
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          format: file.type,
          colorSpace: 'sRGB', // Default assumption
          hasAlpha: file.type === 'image/png'
        })
      }
      
      img.onerror = () => {
        resolve({
          width: 0,
          height: 0,
          format: file.type
        })
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * Filter photos based on criteria
   */
  filterPhotos(photos: PhotoEntity[], filter: PhotoFilter): PhotoEntity[] {
    logger.debug('Filtering photos', { 
      totalPhotos: photos.length,
      filter: {
        hasQuery: !!filter.query,
        categoryCount: filter.categoryIds?.length || 0,
        hasDateRange: !!filter.dateRange,
        fileTypeCount: filter.fileTypes?.length || 0
      }
    })

    let filtered = [...photos]

    // Text search
    if (filter.query) {
      const query = filter.query.toLowerCase()
      filtered = filtered.filter(photo => 
        photo.name.toLowerCase().includes(query) ||
        photo.path.toLowerCase().includes(query)
      )
    }

    // File type filter
    if (filter.fileTypes && filter.fileTypes.length > 0) {
      filtered = filtered.filter(photo => 
        filter.fileTypes!.some(type => photo.type.includes(type))
      )
    }

    // Size range filter
    if (filter.sizeRange) {
      filtered = filtered.filter(photo => 
        photo.size >= filter.sizeRange!.min && 
        photo.size <= filter.sizeRange!.max
      )
    }

    // Date range filter
    if (filter.dateRange) {
      filtered = filtered.filter(photo => 
        filter.dateRange!.contains(new Date(photo.lastModified))
      )
    }

    logger.debug('Photo filtering completed', { 
      originalCount: photos.length,
      filteredCount: filtered.length 
    })

    return filtered
  }

  /**
   * Sort photos based on criteria
   */
  sortPhotos(photos: PhotoEntity[], sort: PhotoSort): PhotoEntity[] {
    const sorted = [...photos]

    sorted.sort((a, b) => {
      let comparison = 0

      switch (sort.field) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'date':
          comparison = a.lastModified - b.lastModified
          break
        case 'size':
          comparison = a.size - b.size
          break
        case 'type':
          comparison = a.type.localeCompare(b.type)
          break
        default:
          comparison = 0
      }

      return sort.order === 'asc' ? comparison : -comparison
    })

    return sorted
  }

  /**
   * Delete photos
   */
  async deletePhotos(photoIds: string[]): Promise<PhotoOperationResult> {
    logger.info('Deleting photos', { photoIds })

    const errors: Array<{ photoId: string; error: string }> = []
    let processedCount = 0

    for (const photoId of photoIds) {
      try {
        if (this.photos.has(photoId)) {
          this.photos.delete(photoId)
          processedCount++
        } else {
          errors.push({ photoId, error: 'Photo not found' })
        }
      } catch (error) {
        errors.push({ photoId, error: (error as Error).message })
      }
    }

    const result: PhotoOperationResult = {
      success: errors.length === 0,
      processedCount,
      errors,
      message: `Processed ${processedCount} photos${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
    }

    logger.info('Photo deletion completed', result)
    return result
  }

  /**
   * Get photo by ID
   */
  getPhoto(id: string): PhotoEntity | null {
    return this.photos.get(id) || null
  }

  /**
   * Get all photos
   */
  getAllPhotos(): PhotoEntity[] {
    return Array.from(this.photos.values())
  }

  /**
   * Get photo statistics
   */
  getStatistics(): {
    totalCount: number
    totalSize: number
    fileTypeDistribution: Record<string, number>
    averageFileSize: number
  } {
    const photos = this.getAllPhotos()
    const totalCount = photos.length
    const totalSize = photos.reduce((sum, photo) => sum + photo.size, 0)
    const fileTypeDistribution = groupBy(photos, photo => photo.type)
    
    // Convert to count distribution
    const typeDistribution: Record<string, number> = {}
    Object.entries(fileTypeDistribution).forEach(([type, photoList]) => {
      typeDistribution[type] = photoList.length
    })

    return {
      totalCount,
      totalSize,
      fileTypeDistribution: typeDistribution,
      averageFileSize: totalCount > 0 ? totalSize / totalCount : 0
    }
  }

  /**
   * Clear all photos
   */
  clear(): void {
    this.photos.clear()
    logger.info('Photo storage cleared')
  }
}

// Create singleton instance
export const photoManagementService = new PhotoManagementService()