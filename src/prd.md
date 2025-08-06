# Photo Sorter - Frontend/Backend Architecture PRD

## Core Purpose & Success
- **Mission Statement**: Intelligent photo organization system with pattern recognition, duplicate detection, and drag-and-drop management split between React frontend and C# backend.
- **Success Indicators**: Fast photo uploads, accurate categorization, seamless user experience with persistent data storage.
- **Experience Qualities**: Efficient, intuitive, professional

## Project Classification & Approach
- **Complexity Level**: Complex Application (advanced functionality with backend API)
- **Primary User Activity**: Creating and organizing photo collections with real-time interaction

## Architecture Overview
- **Frontend**: React application with TypeScript handling UI interactions, drag-and-drop, and real-time updates
- **Backend**: C# Web API handling file storage, image processing, duplicate detection, and category management
- **Communication**: RESTful API with JSON data exchange
- **Storage**: Server-side file system for images, database for metadata

## Essential Features

### Frontend Features
- Drag-and-drop photo uploads with progress indicators
- Real-time category management with drag-and-drop reordering  
- Bulk photo selection with checkbox multi-select
- Photo gallery with preview dialogs
- Category creation and editing with pattern matching
- Duplicate photo review and removal interface

### Backend Features  
- RESTful API endpoints for all CRUD operations
- Image file upload and storage management
- Duplicate detection using file hashes and metadata
- Category pattern matching and auto-categorization
- Photo metadata extraction and storage
- File system organization based on categories

## API Design
- `GET /api/categories` - Retrieve all categories
- `POST /api/categories` - Create new category
- `PUT /api/categories/{id}` - Update category
- `DELETE /api/categories/{id}` - Delete category
- `POST /api/photos/upload` - Upload photos
- `GET /api/photos` - Retrieve photos with filtering
- `PUT /api/photos/{id}/category` - Move photo to category
- `DELETE /api/photos/{id}` - Delete photo
- `GET /api/photos/duplicates` - Get duplicate photos

## Design Direction

### Visual Tone & Identity
- **Emotional Response**: Professional efficiency with delightful micro-interactions
- **Design Personality**: Clean, modern, Apple-inspired with glass morphism effects
- **Visual Metaphors**: Folder organization, photo gallery aesthetics
- **Simplicity Spectrum**: Minimal interface that progressively reveals functionality

### Color Strategy
- **Color Scheme Type**: Monochromatic with blue accent
- **Primary Color**: Deep blue (oklch(0.47 0.12 264)) for trust and professionalism
- **Secondary Colors**: Light grays for neutral backgrounds
- **Accent Color**: Bright blue for interactive elements and progress indicators
- **Color Psychology**: Blue conveys trust and organization, grays provide calm focus
- **Foreground/Background Pairings**: High contrast with WCAG AA compliance

### Typography System
- **Font Pairing Strategy**: Inter for all text (unified, clean approach)
- **Typographic Hierarchy**: Clear size relationships from h1 (24px) to body (14px)
- **Font Personality**: Modern, readable, tech-forward
- **Typography Consistency**: Consistent spacing and weights throughout

### UI Elements & Component Selection
- **Component Usage**: shadcn/ui components for consistency and accessibility
- **File Upload**: Drag-and-drop zones with visual feedback
- **Photo Grid**: Responsive grid with hover states and selection indicators
- **Category Cards**: Draggable cards with edit/delete actions on hover
- **Progress Indicators**: For uploads and processing operations

### Implementation Considerations
- **API Integration**: Axios or fetch for HTTP requests with proper error handling
- **State Management**: React hooks with persistence via backend API
- **File Handling**: Chunked uploads for large files, preview generation
- **Error Handling**: User-friendly error messages with recovery options
- **Performance**: Image optimization, lazy loading, pagination for large collections

### Backend Architecture
- **Framework**: ASP.NET Core Web API
- **Database**: Entity Framework Core with SQL Server/SQLite
- **File Storage**: Local file system with configurable paths
- **Image Processing**: System.Drawing or ImageSharp for thumbnails and metadata
- **Authentication**: JWT tokens for future multi-user support