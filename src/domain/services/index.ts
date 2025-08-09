// Domain services containing core business logic

import { PhotoEntity, CategoryEntity, DuplicateGroupEntity, SmartAlbumEntity } from '../entities'
import { SimilarityScore, PhotoPath, FileSize } from '../value-objects'
import { PhotoRepository, CategoryRepository, DuplicateGroupRepository } from '../repositories'

export interface DuplicateDetectionService {
  detectDuplicates(
    photos: PhotoEntity[], 
    options: DuplicateDetectionOptions
  ): Promise<DuplicateGroupEntity[]>
  
  calculateSimilarity(
    photo1: PhotoEntity, 
    photo2: PhotoEntity, 
    method: DuplicateDetectionMethod
  ): Promise<SimilarityScore>
  
  groupSimilarPhotos(
    photos: PhotoEntity[], 
    threshold: number
  ): Promise<DuplicateGroupEntity[]>
}

export interface DuplicateDetectionOptions {
  methods: DuplicateDetectionMethod[]
  threshold: number
  includeVisualSimilarity: boolean
  batchSize: number
  onProgress?: (progress: number) => void
}

export type DuplicateDetectionMethod = 'fileSize' | 'filename' | 'hash' | 'visual' | 'metadata'

export interface CategoryService {
  categorizePhoto(photo: PhotoEntity, categories: CategoryEntity[]): CategoryEntity | null
  
  createAutoCategory(
    name: string, 
    patterns: string[], 
    photos: PhotoEntity[]
  ): Promise<CategoryEntity>
  
  suggestCategories(photos: PhotoEntity[]): Promise<CategorySuggestion[]>
  
  validateCategoryRules(category: CategoryEntity): Promise<ValidationResult>
  
  applyCategoryRules(
    photos: PhotoEntity[], 
    categories: CategoryEntity[]
  ): Promise<CategorizationResult[]>
}

export interface CategorySuggestion {
  name: string
  confidence: number
  patterns: string[]
  matchingPhotos: PhotoEntity[]
  reasoning: string
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface CategorizationResult {
  photoId: string
  categoryId: string | null
  confidence: number
  reason: string
}

export interface SmartAlbumService {
  generateAlbums(
    photos: PhotoEntity[], 
    options: SmartAlbumOptions
  ): Promise<SmartAlbumEntity[]>
  
  analyzePhotoContent(photo: PhotoEntity): Promise<ContentAnalysis>
  
  suggestAlbumRules(photos: PhotoEntity[]): Promise<AlbumRuleSuggestion[]>
  
  updateAlbumPhotos(album: SmartAlbumEntity, allPhotos: PhotoEntity[]): Promise<PhotoEntity[]>
  
  validateAlbumRules(rules: SmartAlbumRule[]): ValidationResult
}

export interface SmartAlbumOptions {
  maxAlbums: number
  minPhotosPerAlbum: number
  analysisDepth: 'basic' | 'detailed' | 'comprehensive'
  includeContentAnalysis: boolean
  onProgress?: (progress: number, stage: string) => void
}

export interface ContentAnalysis {
  photoId: string
  tags: ContentTag[]
  dominantColors: string[]
  objectsDetected: DetectedObject[]
  sceneType: SceneType
  qualityScore: number
  faces: FaceDetection[]
}

export interface ContentTag {
  tag: string
  confidence: number
  category: TagCategory
}

export type TagCategory = 'people' | 'objects' | 'animals' | 'nature' | 'architecture' | 'events' | 'food'

export interface DetectedObject {
  name: string
  confidence: number
  boundingBox: BoundingBox
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export type SceneType = 'indoor' | 'outdoor' | 'portrait' | 'landscape' | 'macro' | 'night' | 'action'

export interface FaceDetection {
  confidence: number
  age?: number
  gender?: 'male' | 'female'
  emotion?: string
  boundingBox: BoundingBox
}

export interface SmartAlbumRule {
  id: string
  type: SmartAlbumRuleType
  field: string
  operator: RuleOperator
  value: any
  weight: number
}

export type SmartAlbumRuleType = 'content' | 'metadata' | 'filename' | 'date' | 'size' | 'location'
export type RuleOperator = 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greater' | 'less' | 'between' | 'exists'

export interface AlbumRuleSuggestion {
  name: string
  description: string
  rules: SmartAlbumRule[]
  confidence: number
  estimatedPhotoCount: number
  reasoning: string
}

export interface PhotoProcessingService {
  generateThumbnail(photo: PhotoEntity, size: number): Promise<string>
  
  extractMetadata(photo: PhotoEntity): Promise<PhotoMetadata>
  
  calculateHash(photo: PhotoEntity): Promise<string>
  
  optimizePhoto(photo: PhotoEntity, options: OptimizationOptions): Promise<PhotoEntity>
  
  validatePhoto(photo: PhotoEntity): Promise<ValidationResult>
}

export interface PhotoMetadata {
  width: number
  height: number
  format: string
  colorSpace: string
  hasAlpha: boolean
  density?: number
  exif?: Record<string, any>
  iptc?: Record<string, any>
  xmp?: Record<string, any>
}

export interface OptimizationOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
  preserveMetadata?: boolean
}

export interface FileSystemService {
  readFile(path: string): Promise<ArrayBuffer>
  
  writeFile(path: string, data: ArrayBuffer): Promise<void>
  
  deleteFile(path: string): Promise<void>
  
  moveFile(sourcePath: string, destinationPath: string): Promise<void>
  
  copyFile(sourcePath: string, destinationPath: string): Promise<void>
  
  createDirectory(path: string): Promise<void>
  
  listDirectory(path: string): Promise<DirectoryEntry[]>
  
  getFileInfo(path: string): Promise<FileInfo>
  
  watchDirectory(path: string, callback: (event: FileSystemEvent) => void): Promise<void>
}

export interface DirectoryEntry {
  name: string
  path: string
  type: 'file' | 'directory'
  size: number
  lastModified: Date
}

export interface FileInfo {
  path: string
  size: number
  lastModified: Date
  lastAccessed: Date
  created: Date
  permissions: FilePermissions
}

export interface FilePermissions {
  readable: boolean
  writable: boolean
  executable: boolean
}

export interface FileSystemEvent {
  type: 'created' | 'modified' | 'deleted' | 'moved'
  path: string
  oldPath?: string
  timestamp: Date
}