// Shared TypeScript types and interfaces

// Import and re-export domain entities
import { 
  PhotoEntity, 
  CategoryEntity, 
  DuplicateGroupEntity,
  DuplicateDetectionMethod
} from '../../domain/entities'
import { DateRange } from '../../domain/value-objects'

export type { 
  PhotoEntity, 
  CategoryEntity, 
  DuplicateGroupEntity,
  DuplicateDetectionMethod,
  DateRange
}

export * from '../../domain/entities'
export * from '../../domain/value-objects'

// UI-specific types
export interface UIState {
  isLoading: boolean
  error: string | null
  selectedItems: string[]
  searchQuery: string
  sortBy: SortField
  sortOrder: SortOrder
  currentView: ViewMode
}

export type SortField = 'name' | 'date' | 'size' | 'type'
export type SortOrder = 'asc' | 'desc'
export type ViewMode = 'grid' | 'list' | 'masonry'

// Form types
export interface FormField<T = any> {
  value: T
  error?: string
  touched: boolean
  required?: boolean
  validator?: (value: T) => string | undefined
}

export interface FormState<T extends Record<string, any>> {
  fields: { [K in keyof T]: FormField<T[K]> }
  isValid: boolean
  isSubmitting: boolean
  submitError?: string
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
  message?: string
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
  timestamp: Date
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

// Storage Provider types
export interface StorageProvider {
  readonly type: StorageProviderType
  readonly name: string
  readonly isAuthenticated: boolean
  
  authenticate(): Promise<void>
  disconnect(): Promise<void>
  loadPhotos(options?: LoadPhotosOptions): Promise<PhotoEntity[]>
  uploadPhoto(photo: File): Promise<PhotoEntity>
  deletePhoto(photoId: string): Promise<void>
  createFolder(name: string, parentId?: string): Promise<void>
}

export type StorageProviderType = 'local' | 'onedrive' | 'googledrive' | 's3'

export interface LoadPhotosOptions {
  folderId?: string
  recursive?: boolean
  includeMetadata?: boolean
  batchSize?: number
  onProgress?: (progress: number) => void
}

// Event types
export interface AppEvent {
  type: string
  payload?: any
  timestamp: Date
}

export interface PhotoEvent extends AppEvent {
  type: 'photo:loaded' | 'photo:deleted' | 'photo:selected' | 'photo:deselected'
  payload: {
    photoId: string
    photo?: PhotoEntity
  }
}

export interface CategoryEvent extends AppEvent {
  type: 'category:created' | 'category:updated' | 'category:deleted'
  payload: {
    categoryId: string
    category?: CategoryEntity
  }
}

export interface DuplicateEvent extends AppEvent {
  type: 'duplicate:detected' | 'duplicate:resolved' | 'duplicate:ignored'
  payload: {
    groupId: string
    group?: DuplicateGroupEntity
  }
}

// Hook return types
export interface UseAsyncResult<T> {
  data: T | null
  loading: boolean
  error: Error | null
  execute: () => Promise<void>
  reset: () => void
}

export interface UseFormResult<T extends Record<string, any>> {
  state: FormState<T>
  setValue: <K extends keyof T>(field: K, value: T[K]) => void
  setError: <K extends keyof T>(field: K, error: string) => void
  validate: () => boolean
  reset: () => void
  submit: () => Promise<void>
}

// Component prop types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
  'data-testid'?: string
}

export interface LoadingProps extends BaseComponentProps {
  message?: string
  progress?: number
  showProgress?: boolean
}

export interface ErrorProps extends BaseComponentProps {
  error: Error | string
  onRetry?: () => void
  showDetails?: boolean
}

export interface ConfirmationProps extends BaseComponentProps {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  destructive?: boolean
}

// Settings types
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  photosPerPage: number
  defaultView: ViewMode
  autoSave: boolean
  showThumbnails: boolean
  enableAnimations: boolean
}

export interface AppSettings {
  duplicateDetection: DuplicateDetectionSettings
  smartAlbums: SmartAlbumSettings
  performance: PerformanceSettings
  privacy: PrivacySettings
}

export interface DuplicateDetectionSettings {
  threshold: number
  methods: DuplicateDetectionMethod[]
  autoResolve: boolean
  keepLargest: boolean
}

export interface SmartAlbumSettings {
  maxAlbums: number
  minPhotosPerAlbum: number
  autoUpdate: boolean
  analysisDepth: 'basic' | 'detailed' | 'comprehensive'
}

export interface PerformanceSettings {
  enableWebWorkers: boolean
  maxConcurrentOperations: number
  cacheEnabled: boolean
  cacheSizeLimit: number
}

export interface PrivacySettings {
  sendAnalytics: boolean
  sendCrashReports: boolean
  shareUsageData: boolean
  enableTelemetry: boolean
}

// Search and filter types
export interface SearchFilter {
  query?: string
  categories?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  sizeRange?: {
    min: number
    max: number
  }
  fileTypes?: string[]
  tags?: string[]
}

export interface SearchResult<T> {
  items: T[]
  total: number
  query: string
  facets: SearchFacet[]
  suggestions: string[]
}

export interface SearchFacet {
  name: string
  values: Array<{
    value: string
    count: number
    selected: boolean
  }>
}

// Animation and transition types
export interface AnimationConfig {
  duration: number
  delay?: number
  easing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear'
  fill?: 'none' | 'forwards' | 'backwards' | 'both'
}

export interface TransitionConfig {
  enter: AnimationConfig
  exit: AnimationConfig
}

// Keyboard shortcut types
export interface KeyboardShortcut {
  key: string
  modifiers?: Array<'ctrl' | 'cmd' | 'shift' | 'alt'>
  action: string
  description: string
  handler: (event: KeyboardEvent) => void
}

// Performance monitoring types
export interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: Date
  context?: Record<string, any>
}

export interface MemoryUsage {
  used: number
  total: number
  limit: number
  percentage: number
  timestamp: Date
}

// Logging types
export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  timestamp: Date
  context?: Record<string, any>
  error?: Error
  source?: string
}