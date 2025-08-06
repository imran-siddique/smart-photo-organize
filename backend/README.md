# PhotoSorter Backend API

A C# Web API backend for the PhotoSorter application that handles photo storage, categorization, and duplicate detection.

## Quick Start

### Prerequisites
- .NET 8 SDK
- Visual Studio 2022 or VS Code

### Running the API

1. **Navigate to the backend directory:**
   ```bash
   cd backend/PhotoSorter.API
   ```

2. **Restore dependencies:**
   ```bash
   dotnet restore
   ```

3. **Run the application:**
   ```bash
   dotnet run
   ```

The API will be available at `https://localhost:7001` and `http://localhost:5000`.

### Database Setup

The application uses SQLite with Entity Framework Core. The database is automatically created on first run with default categories.

### API Documentation

When running in development mode, Swagger documentation is available at:
- `https://localhost:7001/swagger`

## Architecture

### Project Structure
```
PhotoSorter.API/
├── Controllers/          # API controllers
├── Data/                # Entity Framework context
├── DTOs/               # Data Transfer Objects
├── Models/             # Entity models
├── Services/           # Business logic services
├── wwwroot/            # Static files (photos, thumbnails)
└── Program.cs          # Application entry point
```

### Key Components

#### Models
- **Photo**: Represents uploaded photos with metadata
- **Category**: Organizes photos into groups with patterns

#### Services
- **PhotoService**: Handles photo upload, storage, and management
- **CategoryService**: Manages photo categories and pattern matching
- **DuplicateDetectionService**: Identifies and manages duplicate photos

#### Controllers
- **PhotosController**: Photo upload, retrieval, and management endpoints
- **CategoriesController**: Category CRUD operations and reordering
- **DuplicatesController**: Duplicate photo detection and removal

### Features

#### Photo Management
- **Upload**: Single and bulk photo uploads with progress tracking
- **Storage**: File system storage with thumbnail generation
- **Metadata**: Automatic extraction of photo metadata
- **Categories**: Automatic categorization using pattern matching

#### Duplicate Detection
- **Hash-based**: Uses MD5 file hashing for duplicate detection
- **Management**: Mark and remove duplicate photos
- **Auto-detection**: Automatically identifies duplicates during upload

#### Category System
- **Pattern Matching**: Text-based pattern matching for auto-categorization
- **Drag & Drop**: Reorderable categories with sort order management
- **CRUD Operations**: Full category management capabilities

### Configuration

#### File Storage
Configure file storage paths in `appsettings.json`:
```json
{
  "FileStorage": {
    "PhotosPath": "wwwroot/photos",
    "ThumbnailsPath": "wwwroot/thumbnails",
    "MaxFileSize": 10485760,
    "AllowedExtensions": [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"]
  }
}
```

#### Database
SQLite connection string in `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=photosorter.db"
  }
}
```

### API Endpoints

#### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create new category
- `PUT /api/categories/{id}` - Update category
- `DELETE /api/categories/{id}` - Delete category
- `POST /api/categories/reorder` - Reorder categories

#### Photos
- `GET /api/photos` - Get all photos (optional categoryId filter)
- `POST /api/photos/upload` - Upload single photo
- `POST /api/photos/upload/multiple` - Upload multiple photos
- `PUT /api/photos/{id}/category` - Update photo category
- `PUT /api/photos/bulk/category` - Bulk update photo categories
- `DELETE /api/photos/{id}` - Delete photo
- `GET /api/photos/{id}/file` - Get photo file

#### Duplicates
- `GET /api/duplicates` - Get all duplicate photos
- `POST /api/duplicates/{photoId}/mark-duplicate/{originalPhotoId}` - Mark as duplicate
- `DELETE /api/duplicates/{duplicatePhotoId}` - Remove duplicate

### Development

#### Adding New Features
1. Create/modify models in `Models/`
2. Update Entity Framework context in `Data/`
3. Create DTOs in `DTOs/`
4. Implement business logic in `Services/`
5. Add API endpoints in `Controllers/`

#### Database Migrations
```bash
# Add new migration
dotnet ef migrations add MigrationName

# Update database
dotnet ef database update
```

### Error Handling

The API includes comprehensive error handling:
- **Validation**: Model validation with detailed error messages
- **File Operations**: Graceful handling of file system errors
- **Database**: Entity Framework exception handling
- **HTTP**: Appropriate HTTP status codes and error responses

### Security Considerations

- **File Validation**: Strict file type and size validation
- **Path Traversal**: Protected against directory traversal attacks
- **CORS**: Configured for frontend origin only
- **Input Validation**: All inputs are validated and sanitized

This backend provides a robust foundation for photo management with room for future enhancements like authentication, cloud storage, and advanced image processing.