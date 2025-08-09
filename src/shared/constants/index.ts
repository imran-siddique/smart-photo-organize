// Application-wide constants and configuration

export const APP_CONFIG = {
  // Application metadata
  NAME: 'Photo Sorter',
  VERSION: '2.0.0',
  DESCRIPTION: 'Professional photo organization with AI-powered smart albums',
  
  // Performance limits
  MAX_PHOTOS_PER_BATCH: 1000,
  MAX_FILE_SIZE_MB: 100,
  MAX_CONCURRENT_OPERATIONS: 3,
  THUMBNAIL_SIZE: 200,
  PREVIEW_SIZE: 800,
  
  // Duplicate detection
  DEFAULT_SIMILARITY_THRESHOLD: 85,
  MIN_SIMILARITY_THRESHOLD: 50,
  MAX_SIMILARITY_THRESHOLD: 99,
  
  // Smart albums
  MAX_SMART_ALBUMS: 50,
  MIN_PHOTOS_PER_ALBUM: 3,
  MAX_ALBUM_RULES: 10,
  
  // UI configuration
  PHOTOS_PER_PAGE: 100,
  GRID_COLUMNS: {
    MOBILE: 2,
    TABLET: 3,
    DESKTOP: 4,
    LARGE: 6
  },
  
  // Storage
  CACHE_DURATION_MS: 24 * 60 * 60 * 1000, // 24 hours
  MAX_CACHE_SIZE_MB: 500,
  
  // Animation timings
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500
  }
} as const

export const SUPPORTED_FILE_TYPES = {
  IMAGES: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.svg'],
  RAW_FORMATS: ['.raw', '.cr2', '.nef', '.arw', '.dng', '.orf', '.rw2'],
  HEIC_FORMATS: ['.heic', '.heif'],
  ALL: [] as string[] // Will be populated below
} as const

// Populate ALL with all supported formats
SUPPORTED_FILE_TYPES.ALL.push(
  ...SUPPORTED_FILE_TYPES.IMAGES,
  ...SUPPORTED_FILE_TYPES.RAW_FORMATS,
  ...SUPPORTED_FILE_TYPES.HEIC_FORMATS
)

export const MIME_TYPES = {
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg', 
  'png': 'image/png',
  'gif': 'image/gif',
  'bmp': 'image/bmp',
  'webp': 'image/webp',
  'tiff': 'image/tiff',
  'svg': 'image/svg+xml',
  'heic': 'image/heic',
  'heif': 'image/heif',
  'raw': 'image/x-canon-cr2',
  'cr2': 'image/x-canon-cr2',
  'nef': 'image/x-nikon-nef',
  'arw': 'image/x-sony-arw',
  'dng': 'image/x-adobe-dng'
} as const

export const ERROR_CODES = {
  // File system errors
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_ACCESS_DENIED: 'FILE_ACCESS_DENIED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  
  // Authentication errors  
  AUTH_FAILED: 'AUTH_FAILED',
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  AUTH_CANCELLED: 'AUTH_CANCELLED',
  
  // Processing errors
  PROCESSING_FAILED: 'PROCESSING_FAILED',
  DUPLICATE_DETECTION_FAILED: 'DUPLICATE_DETECTION_FAILED',
  THUMBNAIL_GENERATION_FAILED: 'THUMBNAIL_GENERATION_FAILED',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Storage errors
  STORAGE_FULL: 'STORAGE_FULL',
  STORAGE_PERMISSION_DENIED: 'STORAGE_PERMISSION_DENIED',
  STORAGE_UNAVAILABLE: 'STORAGE_UNAVAILABLE',
  
  // Validation errors
  INVALID_INPUT: 'INVALID_INPUT',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION'
} as const

export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1, 
  INFO: 2,
  DEBUG: 3
} as const

export const STORAGE_KEYS = {
  // User preferences
  USER_PREFERENCES: 'user_preferences',
  THEME_SETTINGS: 'theme_settings',
  VIEW_SETTINGS: 'view_settings',
  
  // Application state
  SELECTED_PROVIDER: 'selected_provider',
  LAST_OPENED_FOLDER: 'last_opened_folder',
  RECENT_FOLDERS: 'recent_folders',
  
  // Processing settings
  DUPLICATE_SETTINGS: 'duplicate_detection_settings',
  SMART_ALBUM_SETTINGS: 'smart_album_settings',
  CATEGORY_RULES: 'category_rules',
  
  // Cache
  PHOTO_CACHE: 'photo_cache',
  THUMBNAIL_CACHE: 'thumbnail_cache',
  METADATA_CACHE: 'metadata_cache'
} as const

export const API_ENDPOINTS = {
  ONEDRIVE: {
    AUTH: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    TOKEN: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    GRAPH: 'https://graph.microsoft.com/v1.0',
    DRIVE: 'https://graph.microsoft.com/v1.0/me/drive',
    FILES: 'https://graph.microsoft.com/v1.0/me/drive/items'
  }
} as const

export const ONEDRIVE_CONFIG = {
  CLIENT_ID: import.meta.env.VITE_ONEDRIVE_CLIENT_ID || '',
  SCOPES: ['Files.Read', 'Files.ReadWrite', 'User.Read'],
  REDIRECT_URI: window.location.origin,
  RESPONSE_TYPE: 'token',
  RESPONSE_MODE: 'fragment'
} as const

export const PERFORMANCE_THRESHOLDS = {
  // Loading times (milliseconds)
  INITIAL_LOAD: 2000,
  PHOTO_GRID_RENDER: 100,
  THUMBNAIL_LOAD: 500,
  SEARCH_RESPONSE: 300,
  
  // Memory usage (MB)
  MAX_MEMORY_USAGE: 500,
  MEMORY_WARNING_THRESHOLD: 400,
  
  // File processing
  MAX_PROCESSING_TIME: 30000, // 30 seconds
  BATCH_PROCESSING_DELAY: 10, // milliseconds between items
  
  // Network
  REQUEST_TIMEOUT: 10000, // 10 seconds
  MAX_CONCURRENT_REQUESTS: 5
} as const

export const BREAKPOINTS = {
  MOBILE: 640,
  TABLET: 768, 
  DESKTOP: 1024,
  LARGE: 1280,
  XLARGE: 1536
} as const

export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
  TOAST: 1080
} as const