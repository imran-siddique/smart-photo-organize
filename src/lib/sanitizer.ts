import { config } from './config'

/**
 * Sanitize and validate file names
 */
export function sanitizeFileName(fileName: string): string {
  if (typeof fileName !== 'string') return 'untitled'
  
  return fileName
    .trim()
    // Remove or replace potentially dangerous characters
    // eslint-disable-next-line no-control-regex
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    // Limit length
    .substring(0, 255)
    // Ensure not empty
    || 'untitled'
}

/**
 * Validate file type against allowed types
 */
export function validateFileType(file: File): boolean {
  if (!file || !file.type) return false
  return config.security.allowedImageTypes.includes(file.type)
}

/**
 * Validate file size
 */
export function validateFileSize(file: File): boolean {
  if (!file) return false
  return file.size <= config.security.maxFileSize && file.size > 0
}

/**
 * Sanitize text input (for category names, patterns, etc.)
 */
export function sanitizeTextInput(input: string, maxLength = 100): string {
  if (typeof input !== 'string') return ''
  
  return input
    .trim()
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script-like content
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    // Limit length
    .substring(0, maxLength)
}

/**
 * Validate and sanitize category patterns
 */
export function sanitizePatterns(patterns: string[]): string[] {
  if (!Array.isArray(patterns)) return []
  
  return patterns
    .map(pattern => sanitizeTextInput(pattern, 50))
    .filter(pattern => pattern.length > 0)
    .slice(0, config.security.maxPatterns) // Limit number of patterns
}

/**
 * Validate color hex value
 */
export function validateColor(color: string): boolean {
  if (typeof color !== 'string') return false
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
}

/**
 * Sanitize color input
 */
export function sanitizeColor(color: string): string {
  if (validateColor(color)) return color
  return '#3b82f6' // Default blue color
}

/**
 * Validate and sanitize search query
 */
export function sanitizeSearchQuery(query: string): string {
  if (typeof query !== 'string') return ''
  
  return query
    .trim()
    // Remove special regex characters that could cause issues
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // Limit length
    .substring(0, 100)
}

/**
 * Rate limiting utility
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  
  /**
   * Check if action is rate limited
   * @param key - Unique key for the action
   * @param maxRequests - Maximum requests allowed
   * @param windowMs - Time window in milliseconds
   */
  isRateLimited(key: string, maxRequests = 10, windowMs = 60000): boolean {
    const now = Date.now()
    const requests = this.requests.get(key) || []
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs)
    
    if (validRequests.length >= maxRequests) {
      return true
    }
    
    // Add current request
    validRequests.push(now)
    this.requests.set(key, validRequests)
    
    return false
  }
  
  /**
   * Clear rate limit data for a key
   */
  clearRateLimit(key: string) {
    this.requests.delete(key)
  }
}

export const rateLimiter = new RateLimiter()

/**
 * Sanitize File objects for security
 */
export function sanitizeFile(file: File): File | null {
  try {
    // Basic validation
    if (!validateFileType(file)) {
      console.warn(`Invalid file type: ${file.type}`)
      return null
    }
    
    if (!validateFileSize(file)) {
      console.warn(`Invalid file size: ${file.size} bytes`)
      return null
    }
    
    // Create a new File object with sanitized name
    const sanitizedName = sanitizeFileName(file.name)
    
    return new File([file], sanitizedName, {
      type: file.type,
      lastModified: file.lastModified
    })
    
  } catch (error) {
    console.error('Error sanitizing file:', error)
    return null
  }
}

/**
 * Sanitize array of files
 */
export function sanitizeFiles(files: FileList | File[]): File[] {
  if (!files) return []
  
  const fileArray = Array.from(files)
  
  // Limit number of files
  if (fileArray.length > config.security.maxFilesPerBatch) {
    console.warn(`Too many files: ${fileArray.length}, limiting to ${config.security.maxFilesPerBatch}`)
    fileArray.splice(config.security.maxFilesPerBatch)
  }
  
  return fileArray
    .map(sanitizeFile)
    .filter((file): file is File => file !== null)
}