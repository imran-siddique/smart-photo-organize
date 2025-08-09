// Shared utility functions used across the application

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { APP_CONFIG, ERROR_CODES } from '../constants'

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Generate a unique ID
 */
export function generateId(prefix = ''): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2)
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`
}

/**
 * Debounce function to limit the rate of function execution
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Throttle function to limit function execution frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Sanitize text input to prevent XSS and ensure data quality
 */
export function sanitizeTextInput(input: string, maxLength = 1000): string {
  if (!input || typeof input !== 'string') return ''
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>&"']/g, (match) => {
      const htmlEntities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&#x27;'
      }
      return htmlEntities[match] || match
    })
}

/**
 * Validate and sanitize color input
 */
export function sanitizeColor(color: string): string {
  if (!color || typeof color !== 'string') return '#6366f1'
  
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  if (hexRegex.test(color)) {
    return color.toLowerCase()
  }
  
  return '#6366f1' // Default fallback color
}

/**
 * Validate file list and filter out invalid files
 */
export function sanitizeFiles(files: FileList): File[] {
  const validFiles: File[] = []
  const maxSize = APP_CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    
    // Check file size
    if (file.size > maxSize) {
      console.warn(`File ${file.name} exceeds maximum size limit`)
      continue
    }
    
    // Check if it's an image file
    if (!file.type.startsWith('image/')) {
      console.warn(`File ${file.name} is not an image file`)
      continue
    }
    
    validFiles.push(file)
  }
  
  return validFiles
}

/**
 * Rate limiter utility
 */
export class RateLimiter {
  private attempts = new Map<string, number[]>()
  
  isRateLimited(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now()
    const windowStart = now - windowMs
    
    // Get existing attempts for this key
    const keyAttempts = this.attempts.get(key) || []
    
    // Filter out attempts outside the time window
    const validAttempts = keyAttempts.filter(timestamp => timestamp > windowStart)
    
    // Check if we've exceeded the limit
    if (validAttempts.length >= maxAttempts) {
      return true
    }
    
    // Add current attempt
    validAttempts.push(now)
    this.attempts.set(key, validAttempts)
    
    return false
  }
  
  reset(key: string): void {
    this.attempts.delete(key)
  }
  
  clear(): void {
    this.attempts.clear()
  }
}

/**
 * Create a singleton rate limiter instance
 */
export const rateLimiter = new RateLimiter()

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry utility with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number
    baseDelay?: number
    maxDelay?: number
    backoffFactor?: number
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2
  } = options
  
  let lastError: Error = new Error('Retry function failed without specific error')
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxAttempts) {
        throw lastError
      }
      
      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt - 1),
        maxDelay
      )
      
      await sleep(delay)
    }
  }
  
  throw lastError as Error
}

/**
 * Format date in a user-friendly way
 */
export function formatDate(date: Date | string | number): string {
  const d = new Date(date)
  
  if (isNaN(d.getTime())) {
    return 'Invalid Date'
  }
  
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return 'Today'
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    return d.toLocaleDateString()
  }
}

/**
 * Extract file extension from filename or path
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  return lastDot === -1 ? '' : filename.substring(lastDot + 1).toLowerCase()
}

/**
 * Check if file is a supported image type
 */
export function isImageFile(filename: string): boolean {
  const extension = getFileExtension(filename)
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'svg', 'heic', 'heif']
  return imageExtensions.includes(extension)
}

/**
 * Create an error with additional context
 */
export function createError(
  code: keyof typeof ERROR_CODES,
  message: string,
  context?: Record<string, any>
): Error & { code: string; context?: Record<string, any> } {
  const error = new Error(message) as Error & { code: string; context?: Record<string, any> }
  error.code = ERROR_CODES[code]
  error.context = context
  return error
}

/**
 * Check if error has a specific code
 */
export function isErrorWithCode(error: any, code: keyof typeof ERROR_CODES): boolean {
  return error && error.code === ERROR_CODES[code]
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(current: number, total: number): number {
  if (total === 0) return 0
  return Math.min(Math.max((current / total) * 100, 0), 100)
}

/**
 * Chunk array into smaller arrays
 */
export function chunk<T>(array: T[], size: number): T[][] {
  if (size <= 0) throw new Error('Chunk size must be greater than 0')
  
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

/**
 * Group array items by a key function
 */
export function groupBy<T, K extends string | number>(
  array: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return array.reduce((groups, item) => {
    const key = keyFn(item)
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(item)
    return groups
  }, {} as Record<K, T[]>)
}

/**
 * Remove duplicates from array based on a key function
 */
export function uniqueBy<T>(array: T[], keyFn: (item: T) => any): T[] {
  const seen = new Set()
  return array.filter(item => {
    const key = keyFn(item)
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

/**
 * Deep clone an object (JSON-safe only)
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as unknown as T
  }
  
  const cloned = {} as T
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key])
    }
  }
  
  return cloned
}