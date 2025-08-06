# PhotoSorter Frontend

A React TypeScript frontend for intelligent photo organization and management, working with the PhotoSorter C# Web API backend.

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation & Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Ensure the backend is running:**
   The frontend expects the C# backend API to be running at `https://localhost:7001`

The frontend will be available at `http://localhost:5173`.

## Architecture

### Tech Stack
- **React 18** with TypeScript
- **Vite** for build tooling and development server
- **Tailwind CSS** for styling with custom design system
- **shadcn/ui** for component library
- **Phosphor Icons** for iconography
- **Sonner** for toast notifications

### Project Structure
```
src/
├── components/ui/       # shadcn/ui components
├── services/           # API service layer
├── App.tsx            # Main application component
├── index.css          # Global styles and theme
└── main.tsx           # Application entry point
```

### Key Features

#### Photo Management
- **Drag & Drop Upload**: Intuitive file upload with visual feedback
- **Bulk Operations**: Multi-select with checkboxes for batch operations
- **Preview**: Full-size photo preview dialogs
- **Grid Display**: Responsive photo grid with hover effects

#### Category System
- **Drag & Drop Reordering**: Visual category reordering
- **Live Creation**: Create categories on-the-fly
- **Pattern Editing**: Modify category patterns and names
- **Smart Suggestions**: Automatic photo categorization

#### Duplicate Management
- **Visual Review**: Side-by-side duplicate comparison
- **One-Click Removal**: Easy duplicate photo removal
- **Smart Detection**: Backend-powered duplicate detection

### API Integration

The frontend communicates with the C# backend through a dedicated API service layer:

```typescript
// services/api.ts
class ApiService {
  // Category operations
  async getCategories(): Promise<CategoryDto[]>
  async createCategory(category: CreateCategoryDto): Promise<CategoryDto>
  
  // Photo operations  
  async uploadPhoto(file: File): Promise<PhotoDto>
  async getPhotos(): Promise<PhotoDto[]>
  
  // Bulk operations
  async updateMultiplePhotosCategory(photoIds: number[], categoryId: number)
}
```

### State Management

The app uses React hooks for state management:
- **Local State**: `useState` for UI state and temporary data
- **API State**: Direct API calls with loading/error handling
- **Real-time Updates**: Automatic data refresh after mutations

### Design System

#### Color Palette
- **Primary**: Deep blue (`oklch(0.47 0.12 264)`) for actions and focus
- **Secondary**: Light gray tones for backgrounds and subtle elements
- **Accent**: Bright blue for interactive highlights
- **Destructive**: Red for delete actions and warnings

#### Typography
- **Font**: Inter (Google Fonts) for all text
- **Hierarchy**: Clear size relationships from headings to body text
- **Spacing**: Consistent vertical rhythm and line heights

#### Components
- **Cards**: Elevated surfaces for content grouping
- **Buttons**: Multiple variants (primary, secondary, outline, ghost)
- **Inputs**: Form controls with focus states and validation
- **Dialogs**: Modal overlays for detailed views and forms

### User Experience

#### Interactions
- **Progressive Disclosure**: Features revealed as needed
- **Visual Feedback**: Loading states, progress bars, and confirmations  
- **Error Handling**: User-friendly error messages with recovery options
- **Responsive Design**: Works on desktop, tablet, and mobile devices

#### Workflows
1. **Photo Upload**: Drag & drop → automatic categorization → duplicate detection
2. **Organization**: Select photos → choose category → bulk move
3. **Category Management**: Create → edit → reorder via drag & drop
4. **Duplicate Review**: View duplicates → compare → remove unwanted copies

### Performance Optimizations

- **Lazy Loading**: Images loaded on demand
- **Optimistic Updates**: Immediate UI feedback before API confirmation
- **Debounced Inputs**: Reduced API calls for search/filter operations
- **Chunked Uploads**: Large files uploaded in chunks with progress tracking

### Error Handling

Comprehensive error handling throughout the application:
- **API Errors**: Network issues and server errors with user-friendly messages
- **Validation**: Form validation with inline error display
- **File Uploads**: File type/size validation with clear feedback
- **Fallbacks**: Graceful degradation when features aren't available

### Accessibility

Built with accessibility in mind:
- **Keyboard Navigation**: Full keyboard support for all interactions
- **Focus Management**: Visible focus indicators and logical tab order
- **ARIA Labels**: Screen reader support for complex UI elements
- **Color Contrast**: WCAG AA compliant color combinations

### Future Enhancements

The architecture supports easy addition of:
- **User Authentication**: Multi-user support with JWT tokens
- **Advanced Filters**: Search and filter photos by metadata
- **Batch Export**: Download organized photo collections
- **Cloud Integration**: Support for cloud storage providers
- **AI Tagging**: Automatic photo tagging using computer vision

This frontend provides an intuitive and efficient interface for photo organization while maintaining excellent performance and user experience standards.