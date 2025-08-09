// Value objects representing immutable concepts with business meaning

export class FileSize {
  private constructor(private readonly bytes: number) {
    if (bytes < 0) {
      throw new Error('File size cannot be negative')
    }
  }

  static fromBytes(bytes: number): FileSize {
    return new FileSize(bytes)
  }

  get value(): number {
    return this.bytes
  }

  format(): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = this.bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
  }

  isLargerThan(other: FileSize): boolean {
    return this.bytes > other.value
  }

  equals(other: FileSize): boolean {
    return this.bytes === other.value
  }
}

export class SimilarityScore {
  private constructor(private readonly score: number) {
    if (score < 0 || score > 100) {
      throw new Error('Similarity score must be between 0 and 100')
    }
  }

  static fromPercentage(percentage: number): SimilarityScore {
    return new SimilarityScore(percentage)
  }

  get value(): number {
    return this.score
  }

  isHighSimilarity(threshold = 85): boolean {
    return this.score >= threshold
  }

  equals(other: SimilarityScore): boolean {
    return Math.abs(this.score - other.value) < 0.1
  }
}

export class PhotoPath {
  private constructor(
    private readonly fullPath: string,
    private readonly filename: string,
    private readonly directory: string,
    private readonly extension: string
  ) {}

  static fromString(path: string): PhotoPath {
    const normalizedPath = path.replace(/\\/g, '/')
    const lastSlash = normalizedPath.lastIndexOf('/')
    const filename = lastSlash === -1 ? normalizedPath : normalizedPath.substring(lastSlash + 1)
    const directory = lastSlash === -1 ? '' : normalizedPath.substring(0, lastSlash)
    const lastDot = filename.lastIndexOf('.')
    const extension = lastDot === -1 ? '' : filename.substring(lastDot + 1).toLowerCase()

    return new PhotoPath(normalizedPath, filename, directory, extension)
  }

  get fullPath(): string {
    return this.fullPath
  }

  get filename(): string {
    return this.filename
  }

  get directory(): string {
    return this.directory
  }

  get extension(): string {
    return this.extension
  }

  get nameWithoutExtension(): string {
    const lastDot = this.filename.lastIndexOf('.')
    return lastDot === -1 ? this.filename : this.filename.substring(0, lastDot)
  }

  isImageFile(): boolean {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'svg', 'heic', 'raw', 'cr2', 'nef', 'arw']
    return imageExtensions.includes(this.extension)
  }

  equals(other: PhotoPath): boolean {
    return this.fullPath === other.fullPath
  }
}

export class ColorTheme {
  private constructor(
    private readonly primary: string,
    private readonly secondary: string,
    private readonly accent: string
  ) {
    this.validateHexColor(primary, 'primary')
    this.validateHexColor(secondary, 'secondary') 
    this.validateHexColor(accent, 'accent')
  }

  static fromHex(primary: string, secondary: string, accent: string): ColorTheme {
    return new ColorTheme(primary, secondary, accent)
  }

  private validateHexColor(color: string, name: string): void {
    if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
      throw new Error(`${name} color must be a valid hex color`)
    }
  }

  get primary(): string {
    return this.primary
  }

  get secondary(): string {
    return this.secondary
  }

  get accent(): string {
    return this.accent
  }
}

export class DateRange {
  private constructor(
    private readonly startDate: Date,
    private readonly endDate: Date
  ) {
    if (startDate > endDate) {
      throw new Error('Start date must be before or equal to end date')
    }
  }

  static fromDates(startDate: Date, endDate: Date): DateRange {
    return new DateRange(new Date(startDate), new Date(endDate))
  }

  static today(): DateRange {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
    return new DateRange(startOfDay, endOfDay)
  }

  get start(): Date {
    return new Date(this.startDate)
  }

  get end(): Date {
    return new Date(this.endDate)
  }

  contains(date: Date): boolean {
    return date >= this.startDate && date <= this.endDate
  }

  overlaps(other: DateRange): boolean {
    return this.startDate <= other.endDate && this.endDate >= other.startDate
  }

  getDuration(): number {
    return this.endDate.getTime() - this.startDate.getTime()
  }
}