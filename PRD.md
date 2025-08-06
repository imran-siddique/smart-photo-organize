# Photo Sorter - Product Requirements Document

Intelligent photo organization tool that learns from existing folder structures to automatically categorize new photos and remove duplicates.

**Experience Qualities**:
1. **Intuitive** - Users immediately understand how to upload photos and see results without guidance
2. **Intelligent** - The system feels smart by learning patterns from existing organization structures
3. **Reliable** - Users trust the sorting decisions and duplicate detection accuracy

**Complexity Level**: Light Application (multiple features with basic state)
- Handles file uploads, pattern analysis, and organization suggestions with moderate state management

## Essential Features

### Folder Structure Analysis
- **Functionality**: Scans and analyzes existing photo folder hierarchies to understand categorization patterns
- **Purpose**: Learns user's organizational preferences to apply consistent sorting logic
- **Trigger**: User uploads or selects existing photo folders for analysis
- **Progression**: Upload folders → Analyze structure → Extract categories → Display learned patterns → Ready for sorting
- **Success criteria**: System identifies at least 3 category patterns and displays them clearly

### Photo Upload & Categorization
- **Functionality**: Accepts new photos and suggests categories based on learned patterns
- **Purpose**: Automatically organizes new photos using established folder structure logic
- **Trigger**: User drags/uploads new photos after analysis is complete
- **Progression**: Upload photos → Analyze metadata/content → Match to patterns → Suggest categories → User confirms → Photos organized
- **Success criteria**: 80%+ of photos receive appropriate category suggestions

### Duplicate Detection
- **Functionality**: Identifies identical or very similar photos across the collection
- **Purpose**: Prevents storage waste and maintains clean photo library
- **Trigger**: Runs automatically during upload or can be triggered manually
- **Progression**: Scan photos → Compare file hashes/visual similarity → Flag duplicates → Present options → User chooses to keep/delete
- **Success criteria**: Detects exact duplicates with 100% accuracy, similar photos with 90%+ accuracy

### Category Management
- **Functionality**: Allows users to view, edit, and refine learned categories
- **Purpose**: Gives users control over the organization system
- **Trigger**: User clicks on category management after initial analysis
- **Progression**: View categories → Edit names/rules → Merge/split categories → Save changes → Apply to existing photos
- **Success criteria**: Changes reflect immediately in sorting suggestions

## Edge Case Handling
- **No existing structure**: Guide user to create initial categories manually
- **Conflicting patterns**: Present options and let user choose preferred approach
- **Unsupported file types**: Clear messaging about accepted formats
- **Large file uploads**: Progress indicators and batch processing
- **Network interruptions**: Resume capability for uploads
- **Ambiguous categories**: Provide "Unsorted" option with manual review

## Design Direction
Clean, professional interface that feels like a desktop file manager but with modern web aesthetics - emphasizes clarity and efficiency over playful elements, with a rich interface that shows detailed information about photos and categories.

## Color Selection
Complementary (opposite colors) - Using blue and orange to create clear visual distinction between analysis/input phases and action/output phases, evoking trust and energy.

- **Primary Color**: Deep Blue `oklch(0.45 0.15 240)` - Communicates trust and professionalism for main actions
- **Secondary Colors**: Light Gray `oklch(0.95 0.02 240)` for backgrounds, Dark Gray `oklch(0.25 0.02 240)` for text
- **Accent Color**: Warm Orange `oklch(0.65 0.15 45)` - Attention-grabbing highlight for important actions and progress indicators
- **Foreground/Background Pairings**: 
  - Background (Light Gray): Dark Gray text `oklch(0.25 0.02 240)` - Ratio 7.2:1 ✓
  - Card (White): Dark Gray text `oklch(0.25 0.02 240)` - Ratio 8.1:1 ✓  
  - Primary (Deep Blue): White text `oklch(0.98 0.01 240)` - Ratio 6.8:1 ✓
  - Accent (Orange): White text `oklch(0.98 0.01 45)` - Ratio 4.9:1 ✓
  - Muted (Light Blue-Gray): Dark text `oklch(0.35 0.05 240)` - Ratio 5.2:1 ✓

## Font Selection
Inter font family to convey modern professionalism with excellent readability for file names and technical information.

- **Typographic Hierarchy**: 
  - H1 (App Title): Inter Bold/32px/tight letter spacing
  - H2 (Section Headers): Inter Semibold/24px/normal spacing
  - H3 (Category Names): Inter Medium/18px/normal spacing
  - Body (File Names): Inter Regular/14px/normal spacing
  - Caption (File Details): Inter Regular/12px/wide letter spacing

## Animations
Subtle functionality-focused animations that provide clear feedback for file operations and category assignments, with gentle transitions that don't interfere with productivity workflows.

- **Purposeful Meaning**: Smooth transitions communicate system processing and provide confidence in file operations
- **Hierarchy of Movement**: File upload progress and category assignment get primary animation focus, with secondary attention on hover states

## Component Selection
- **Components**: Cards for photo thumbnails and category displays, Dialogs for duplicate resolution, Progress bars for uploads, Dropzone for file input, Tables for detailed file lists, Badges for category tags
- **Customizations**: Custom file dropzone component, photo grid layout component, category tree visualization
- **States**: Upload areas show hover/active states, photos show selected/processing states, categories show active/suggested states
- **Icon Selection**: Folder icons for categories, Photo icons for images, Trash for duplicates, Eye for preview, Download for export
- **Spacing**: Consistent 4/8/16px spacing scale for tight layouts, 24/32px for section separation
- **Mobile**: Responsive grid that collapses to single column, touch-friendly file selection, swipe gestures for photo review