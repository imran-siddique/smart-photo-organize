// Photo management feature types

import { PhotoEntity, CategoryEntity } from '../../../domain/entities'
import { DateRange } from '../../../domain/value-objects'

export interface PhotoManagementState {
  photos: PhotoEntity[]
  filteredPhotos: PhotoEntity[]
  selectedPhotos: string[]
  currentFolder: string | null
  isLoading: boolean
  isProcessing: boolean
  error: string | null
  searchQuery: string
  sortBy: SortField
  sortOrder: SortOrder
  viewMode: ViewMode
}

export interface PhotoFilter {
  query?: string
  categoryIds?: string[]
  dateRange?: DateRange
  sizeRange?: SizeRange
  fileTypes?: string[]
  tags?: string[]
}

export interface SizeRange {
  min: number
  max: number
}

export interface PhotoSort {
  field: SortField
  order: SortOrder
}

export type SortField = 'name' | 'date' | 'size' | 'type' | 'category'
export type SortOrder = 'asc' | 'desc'
export type ViewMode = 'grid' | 'list' | 'masonry'

export interface PhotoLoadOptions {
  includeMetadata?: boolean
  generateThumbnails?: boolean
  batchSize?: number
  recursive?: boolean
  onProgress?: (progress: number, message?: string) => void
}

export interface PhotoOperationResult {
  success: boolean
  processedCount: number
  errors: Array<{ photoId: string; error: string }>
  message?: string
}

// Re-export domain entities for convenience
export type { PhotoEntity, CategoryEntity } from '../../../domain/entities'
export type { PhotoPath, FileSize } from '../../../domain/value-objects'