# Photo Sorter - Unified Storage Architecture PRD

## Core Purpose & Success
- **Mission Statement**: Intelligent photo organization system with dual storage support - local folder access (default) and Microsoft OneDrive integration, featuring advanced duplicate detection, batch operations, and smart categorization.
- **Success Indicators**: Fast photo processing from local or cloud sources, accurate duplicate detection, seamless batch operations, and intuitive file management across both local and cloud storage.
- **Experience Qualities**: Efficient, privacy-focused, versatile

## Project Classification & Approach
- **Complexity Level**: Complex Application (dual storage architecture with advanced processing)
- **Primary User Activity**: Organizing and managing photos from local computer (default) or OneDrive with flexible provider switching

## Architecture Overview
- **Frontend**: React application with TypeScript and unified storage abstraction
- **Local Storage**: Browser File System Access API for folder access, fallback to file selection
- **Cloud Backend**: Microsoft OneDrive via Graph API for cloud file storage
- **Authentication**: Microsoft OAuth 2.0 for OneDrive (optional)
- **Processing**: Client-side parallel processing with provider-agnostic batch operations
- **Data Persistence**: KV storage for categories, settings, and metadata per provider

## Essential Features

### Storage Provider Features
- **Local Folder Access (Default)**: Direct folder access using File System Access API
- **File Selection Fallback**: Traditional file input for browsers without folder API support
- **OneDrive Integration**: Optional cloud storage with Microsoft authentication
- **Provider Switching**: Seamless transition between local and cloud storage
- **Unified Interface**: Consistent UI/UX regardless of storage provider

### Local Processing Features (Privacy-First)
- Direct file access without uploads to external servers
- Local duplicate detection using advanced algorithms
- In-browser image analysis and categorization
- Fast processing without network dependencies
- Privacy-focused - files never leave the user's device

### Cloud Integration Features (OneDrive)
- Microsoft OneDrive authentication with OAuth 2.0
- Real-time photo loading from OneDrive with parallel processing
- Batch file operations (move, delete, organize) with progress tracking
- Microsoft Graph API batch requests for optimized performance
- Automatic folder creation and organization in OneDrive

### Advanced Processing Features  
- Parallel photo loading with configurable concurrency limits
- Advanced duplicate detection with multiple algorithms (file hash, size, filename similarity)
- Batch duplicate processing with configurable thresholds
- Smart categorization with pattern matching
- Visual photo comparison with side-by-side analysis

### User Experience Features
- Provider selection screen with clear feature comparison
- Category management with color coding and pattern matching
- Bulk photo selection with advanced filtering and sorting
- Real-time progress indicators for all operations
- Search and filter capabilities across photo collections
- Responsive photo grid with thumbnail optimization

## API Integration Design
**Local Storage:**
- File System Access API for folder access
- Web Crypto API for secure file hashing
- Canvas API for image dimension analysis
- Object URLs for efficient image display

**OneDrive Integration:**
- `Microsoft Graph API /me/drive/items` - File and folder operations
- `Microsoft Graph API /$batch` - Batch request processing
- `Microsoft Graph API /me/drive/root/search` - Photo search functionality
- `Microsoft Graph API /me` - User profile information
- OAuth 2.0 endpoints for authentication and token refresh

## Design Direction

### Visual Tone & Identity
- **Emotional Response**: Modern cloud-native experience with enterprise reliability
- **Design Personality**: Clean, Microsoft Fluent-inspired with subtle animations
- **Visual Metaphors**: Cloud storage, batch processing, intelligent organization
- **Simplicity Spectrum**: Progressive disclosure with power-user features available

### Color Strategy
- **Color Scheme Type**: Microsoft-inspired blue palette with accent colors
- **Primary Color**: Microsoft blue (oklch(0.47 0.12 264)) for brand consistency
- **Secondary Colors**: Light grays and whites for clean backgrounds
- **Accent Color**: Bright blue for interactive elements and progress states
- **Color Psychology**: Blue conveys trust and cloud reliability
- **Category Colors**: User-customizable colors for personal organization

### Typography System
- **Font Pairing Strategy**: Inter for modern, cloud-native aesthetic
- **Typographic Hierarchy**: Clear distinction between headings, body, and metadata
- **Font Personality**: Clean, readable, enterprise-friendly
- **Typography Consistency**: Microsoft design language alignment

### UI Elements & Component Selection
- **Component Usage**: shadcn/ui components with Microsoft Fluent influences
- **Photo Grid**: Responsive masonry with thumbnail loading optimization
- **Progress Indicators**: Multi-stage progress for batch operations
- **Category System**: Color-coded cards with drag-and-drop organization
- **Batch Selection**: Advanced selection with filtering capabilities

### Implementation Considerations

#### Performance Optimization
- **Parallel Processing**: Configurable concurrency for API requests
- **Batch Operations**: Microsoft Graph batch API for efficient operations
- **Caching Strategy**: Local KV storage for categories and user preferences
- **Image Optimization**: OneDrive thumbnail API with fallback handling

#### Cloud Integration
- **Authentication**: OAuth 2.0 with automatic token refresh
- **API Resilience**: Retry logic with exponential backoff
- **Offline Handling**: Graceful degradation when connectivity is limited
- **Error Recovery**: User-friendly error states with retry options

#### Advanced Features
- **Duplicate Detection**: Multi-algorithm approach with configurable thresholds
- **Smart Categorization**: Pattern-based auto-organization
- **Batch Processing**: Progress tracking for long-running operations
- **Data Persistence**: OneDrive integration with local caching for performance

### Security & Privacy
- **Authentication**: Microsoft OAuth 2.0 with secure token storage using implicit flow
- **Permissions**: Minimal required OneDrive permissions (Files.ReadWrite)
- **Data Handling**: No server-side storage, direct client-to-OneDrive communication
- **Privacy**: User data remains in their OneDrive account

## Recent Updates
- **Authentication Fix**: Resolved AADSTS700016 error by implementing Microsoft's implicit OAuth flow
- **Client ID**: Using Microsoft's sample application credentials for testing
- **Token Management**: Simplified token handling with implicit flow (no refresh tokens)
- **Error Handling**: Enhanced error reporting for authentication failures
- **Production Note**: For production deployment, register a custom Microsoft App