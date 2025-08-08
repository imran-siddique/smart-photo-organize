// Production Configuration
export const config = {
  // Application
  app: {
    name: 'Photo Sorter',
    version: process.env.VITE_APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  },

  // OneDrive Configuration
  onedrive: {
    clientId: process.env.VITE_ONEDRIVE_CLIENT_ID || 'your-onedrive-client-id',
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: typeof window !== 'undefined' ? window.location.origin : '',
    scopes: ['User.Read', 'Files.Read.All', 'Files.ReadWrite.All'],
  },

  // Security
  security: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedImageTypes: [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/gif',
      'image/bmp',
      'image/heic',
      'image/heif'
    ],
    maxFilesPerBatch: 1000,
    maxCategories: 50,
    maxPatterns: 20
  },

  // Performance
  performance: {
    thumbnailSize: 200,
    batchSize: 50,
    debounceDelay: 300,
    duplicateDetectionTimeout: 30000
  },

  // Features
  features: {
    enableTesting: process.env.NODE_ENV === 'development',
    enableAdvancedDuplicateDetection: true,
    enableParallelProcessing: true,
    enableCaching: true
  }
}

// Validation
export function validateConfig() {
  const errors: string[] = []

  if (!config.onedrive.clientId || config.onedrive.clientId === 'your-onedrive-client-id') {
    console.warn('OneDrive client ID not configured - OneDrive functionality will be limited')
  }

  if (config.security.maxFileSize < 1024 * 1024) {
    errors.push('Max file size must be at least 1MB')
  }

  if (config.security.maxFilesPerBatch < 1) {
    errors.push('Max files per batch must be at least 1')
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed: ${errors.join(', ')}`)
  }

  return true
}

// Initialize configuration on module load
validateConfig()