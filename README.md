# OneDrive Photo Sorter - Setup Guide

## Prerequisites

1. **Microsoft Azure App Registration**
   - Go to [Azure Portal](https://portal.azure.com) > App registrations
   - Create a new registration with these settings:
     - Name: "OneDrive Photo Sorter"
     - Account types: "Accounts in any organizational directory and personal Microsoft accounts"
     - Redirect URI: `http://localhost:5173/auth/callback` (for development)

2. **API Permissions**
   - Add these Microsoft Graph permissions:
     - `Files.ReadWrite` (Delegated)
     - `offline_access` (Delegated)
     - `User.Read` (Delegated)

## Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your Azure app details:
   ```
   VITE_ONEDRIVE_CLIENT_ID=your-azure-app-client-id
   ```

## Features

### Cloud Integration
- **Microsoft OneDrive Authentication**: Secure OAuth 2.0 login
- **Parallel Photo Loading**: Fast retrieval with configurable concurrency
- **Batch Operations**: Process multiple photos simultaneously
- **Real-time Sync**: Direct integration with OneDrive storage

### Advanced Duplicate Detection
- **Multi-Algorithm Approach**:
  - File size comparison
  - Filename similarity using Levenshtein distance
  - Content hash comparison (SHA1 and QuickXOR)
  - Configurable similarity thresholds

### Batch Processing
- **Parallel API Requests**: Up to 20 requests per batch (Microsoft Graph limit)
- **Concurrent Batch Processing**: Multiple batches processed simultaneously
- **Progress Tracking**: Real-time progress updates for long operations
- **Error Resilience**: Automatic retry with exponential backoff

### Smart Categorization
- **Pattern-Based Matching**: Custom patterns for auto-categorization
- **Color-Coded Categories**: Visual organization with user-customizable colors
- **Drag-and-Drop Organization**: Intuitive category management
- **Folder Creation**: Automatic OneDrive folder creation for categories

## Usage

1. **Authentication**
   - Click "Connect to OneDrive" 
   - Sign in with your Microsoft account
   - Grant necessary permissions

2. **Load Photos**
   - Click "Load Photos from OneDrive"
   - Photos are loaded in parallel from various OneDrive locations
   - Thumbnails are automatically generated

3. **Create Categories**
   - Use "New Category" to create organizational groups
   - Define matching patterns (e.g., "vacation, beach, holiday")
   - Choose category colors for visual organization

4. **Organize Photos**
   - Select multiple photos using checkboxes
   - Move to categories using bulk actions
   - Create new categories on-the-fly

5. **Duplicate Detection**
   - Click "Scan for Duplicates"
   - Adjust detection settings (similarity threshold, detection methods)
   - Review duplicate groups and choose which photos to keep
   - Use batch actions to process multiple groups at once

## Performance Features

### Parallel Processing
- Configurable concurrency limits (default: 5 parallel requests)
- Batch size optimization (20 items per Microsoft Graph batch)
- Smart throttling to respect API rate limits

### Caching Strategy
- Local KV storage for categories and user preferences
- OneDrive thumbnail caching for faster loading
- Progress state persistence across sessions

### Error Handling
- Automatic token refresh for expired authentication
- Retry logic for network failures
- Graceful degradation for API errors
- User-friendly error messages with recovery options

## Technical Architecture

### Frontend Stack
- **React 18** with TypeScript for type safety
- **Microsoft Graph API** for OneDrive integration
- **shadcn/ui** components for consistent UI
- **Tailwind CSS** for styling
- **KV storage** for local data persistence

### API Integration
- **Microsoft Graph API v1.0** for file operations
- **OAuth 2.0** for secure authentication
- **Batch API** for optimized bulk operations
- **Search API** for photo discovery

### Security
- **OAuth 2.0** with automatic token refresh
- **Minimal permissions** (Files.ReadWrite, User.Read)
- **Client-side only** - no server-side data storage
- **Secure token storage** in browser localStorage

## Development

Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

Make sure your Azure app registration includes `http://localhost:5173/auth/callback` as a redirect URI for development.

## Production Deployment

1. Update redirect URI in Azure app registration to your production domain
2. Update environment variables for production
3. Deploy to your preferred hosting service

The application is fully client-side and can be deployed to any static hosting service.