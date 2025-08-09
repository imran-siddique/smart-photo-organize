// Core domain entities representing the fundamental concepts in our photo organization system

export interface PhotoEntity {
  readonly id: string
  readonly name: string
  readonly path: string
  readonly size: number
  readonly type: string
  readonly lastModified: number
  readonly metadata?: PhotoMetadata
  readonly preview?: string
  readonly hash?: string
}

export interface PhotoMetadata {
  width?: number
  height?: number
  exif?: Record<string, any>
  colorProfile?: string
  createdDate?: Date
  gpsLocation?: GeoLocation
}

export interface GeoLocation {
  latitude: number
  longitude: number
  address?: string
}

export interface CategoryEntity {
  readonly id: string
  name: string
  patterns: string[]
  folder: string
  color: string
  autoSort: boolean
  sortOrder: number
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface DuplicateGroupEntity {
  readonly id: string
  readonly photos: PhotoEntity[]
  readonly similarity: number
  readonly detectionMethod: DuplicateDetectionMethod
  readonly createdAt: Date
}

export type DuplicateDetectionMethod = 'fileSize' | 'filename' | 'hash' | 'visual' | 'metadata'

export interface SmartAlbumEntity {
  readonly id: string
  name: string
  description?: string
  rules: SmartAlbumRule[]
  photoCount: number
  readonly createdAt: Date
  readonly updatedAt: Date
  isAutoUpdating: boolean
}

export interface SmartAlbumRule {
  readonly id: string
  type: SmartAlbumRuleType
  field: string
  operator: RuleOperator
  value: any
  weight: number
}

export type SmartAlbumRuleType = 'content' | 'metadata' | 'filename' | 'date' | 'size' | 'location'
export type RuleOperator = 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greater' | 'less' | 'between' | 'exists'

export interface ProcessingJobEntity {
  readonly id: string
  type: JobType
  status: JobStatus
  progress: number
  totalItems: number
  processedItems: number
  readonly startedAt: Date
  completedAt?: Date
  error?: string
  metadata?: Record<string, any>
}

export type JobType = 'duplicate-detection' | 'smart-album-generation' | 'photo-import' | 'category-assignment'
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'