// Repository interfaces defining data access contracts (implementation agnostic)

import { 
  PhotoEntity, 
  CategoryEntity, 
  DuplicateGroupEntity, 
  SmartAlbumEntity, 
  ProcessingJobEntity 
} from '../entities'

export interface PhotoRepository {
  // Basic CRUD operations
  findById(id: string): Promise<PhotoEntity | null>
  findAll(): Promise<PhotoEntity[]>
  findByCategory(categoryId: string): Promise<PhotoEntity[]>
  findByPath(path: string): Promise<PhotoEntity | null>
  save(photo: PhotoEntity): Promise<void>
  saveMany(photos: PhotoEntity[]): Promise<void>
  delete(id: string): Promise<void>
  deleteMany(ids: string[]): Promise<void>
  
  // Query operations
  search(query: string): Promise<PhotoEntity[]>
  findByExtension(extension: string): Promise<PhotoEntity[]>
  findByDateRange(startDate: Date, endDate: Date): Promise<PhotoEntity[]>
  findBySizeRange(minSize: number, maxSize: number): Promise<PhotoEntity[]>
  findDuplicatesByHash(hash: string): Promise<PhotoEntity[]>
  
  // Bulk operations
  updateMany(photos: Partial<PhotoEntity>[]): Promise<void>
  count(): Promise<number>
  getStatistics(): Promise<PhotoStatistics>
}

export interface CategoryRepository {
  findById(id: string): Promise<CategoryEntity | null>
  findAll(): Promise<CategoryEntity[]>
  findByName(name: string): Promise<CategoryEntity | null>
  save(category: CategoryEntity): Promise<void>
  update(id: string, category: Partial<CategoryEntity>): Promise<void>
  delete(id: string): Promise<void>
  
  // Query operations
  findByPattern(pattern: string): Promise<CategoryEntity[]>
  findAutoSortCategories(): Promise<CategoryEntity[]>
  reorderCategories(categoryIds: string[]): Promise<void>
}

export interface DuplicateGroupRepository {
  findById(id: string): Promise<DuplicateGroupEntity | null>
  findAll(): Promise<DuplicateGroupEntity[]>
  findByPhoto(photoId: string): Promise<DuplicateGroupEntity[]>
  save(group: DuplicateGroupEntity): Promise<void>
  delete(id: string): Promise<void>
  deleteAll(): Promise<void>
  
  // Query operations
  findByMethod(method: string): Promise<DuplicateGroupEntity[]>
  findBySimilarityThreshold(threshold: number): Promise<DuplicateGroupEntity[]>
  count(): Promise<number>
}

export interface SmartAlbumRepository {
  findById(id: string): Promise<SmartAlbumEntity | null>
  findAll(): Promise<SmartAlbumEntity[]>
  findAutoUpdating(): Promise<SmartAlbumEntity[]>
  save(album: SmartAlbumEntity): Promise<void>
  update(id: string, album: Partial<SmartAlbumEntity>): Promise<void>
  delete(id: string): Promise<void>
  
  // Query operations
  findByRuleType(ruleType: string): Promise<SmartAlbumEntity[]>
  updatePhotoCounts(): Promise<void>
}

export interface ProcessingJobRepository {
  findById(id: string): Promise<ProcessingJobEntity | null>
  findAll(): Promise<ProcessingJobEntity[]>
  findByStatus(status: string): Promise<ProcessingJobEntity[]>
  findByType(type: string): Promise<ProcessingJobEntity[]>
  save(job: ProcessingJobEntity): Promise<void>
  update(id: string, job: Partial<ProcessingJobEntity>): Promise<void>
  delete(id: string): Promise<void>
  
  // Query operations
  findActive(): Promise<ProcessingJobEntity[]>
  findCompleted(): Promise<ProcessingJobEntity[]>
  findFailed(): Promise<ProcessingJobEntity[]>
  cleanup(olderThanDays: number): Promise<void>
}

// Supporting types for repository operations
export interface PhotoStatistics {
  totalCount: number
  totalSize: number
  fileTypeDistribution: Record<string, number>
  folderDistribution: Record<string, number>
  dateDistribution: Record<string, number>
  averageFileSize: number
  largestFile: PhotoEntity | null
  oldestPhoto: PhotoEntity | null
  newestPhoto: PhotoEntity | null
}

export interface QueryOptions {
  offset?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  includeDeleted?: boolean
}

export interface SearchOptions extends QueryOptions {
  searchFields?: string[]
  fuzzySearch?: boolean
  minScore?: number
}