# Photo Sorter - Deployment Guide

## Overview

This application is built with a clean, modular architecture designed for production deployment. The codebase has been restructured following Domain-Driven Design principles with clear separation of concerns.

## Architecture

### Folder Structure
```
src/
├── domain/              # Core business logic
│   ├── entities/        # Business entities
│   ├── value-objects/   # Immutable value objects
│   ├── repositories/    # Data access contracts
│   └── services/        # Domain services
├── features/            # Feature modules
│   ├── photo-management/
│   ├── smart-albums/
│   ├── duplicate-detection/
│   └── storage-providers/
├── infrastructure/      # External concerns
│   ├── storage/         # Storage implementations
│   ├── monitoring/      # Observability
│   └── security/        # Security utilities
├── shared/              # Cross-cutting concerns
│   ├── components/      # Reusable UI components
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Utility functions
│   ├── types/          # TypeScript definitions
│   └── constants/      # Application constants
└── components/          # UI component library
    └── ui/             # shadcn/ui components
```

## Deployment Options

### 1. Static Site Deployment (Recommended)

The application is built as a Single Page Application (SPA) suitable for static hosting.

**Build Command:**
```bash
npm run build:production
```

**Supported Platforms:**
- **Vercel**: Zero-config deployment with automatic HTTPS
- **Netlify**: Easy deployment with continuous integration
- **GitHub Pages**: Free hosting for public repositories
- **AWS S3 + CloudFront**: Scalable CDN distribution
- **Azure Static Web Apps**: Integrated with Azure services

### 2. Docker Deployment

**Dockerfile:**
```dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Build and run:**
```bash
docker build -t photo-sorter .
docker run -p 80:80 photo-sorter
```

### 3. CDN Deployment

For optimal performance, deploy static assets to a CDN:

**Environment Variables:**
```bash
VITE_CDN_URL=https://cdn.yourdomain.com
VITE_ONEDRIVE_CLIENT_ID=your-client-id
```

## Environment Configuration

### Development
```bash
# .env.development
VITE_LOG_LEVEL=DEBUG
VITE_ENABLE_DEVTOOLS=true
VITE_API_TIMEOUT=5000
```

### Production
```bash
# .env.production
VITE_LOG_LEVEL=INFO
VITE_ENABLE_ANALYTICS=true
VITE_API_TIMEOUT=10000
VITE_ONEDRIVE_CLIENT_ID=your-production-client-id
```

## Performance Optimization

### Bundle Analysis
```bash
npm run analyze
```

### Code Splitting
- Automatic route-based splitting
- Feature-based lazy loading
- Component-level splitting for large components

### Build Optimization
- Tree shaking enabled
- CSS purging
- Asset compression
- Service worker for caching

## Monitoring & Observability

### Error Tracking
- Centralized error handling
- User-friendly error messages
- Detailed logging in development
- Error reporting to external services

### Performance Monitoring
- Core Web Vitals tracking
- Memory usage monitoring
- Bundle size tracking
- Runtime performance metrics

### Production Checks
```typescript
// Automatic production readiness checks
- HTTPS validation
- Environment variables verification
- Browser compatibility checks
- Performance threshold validation
```

## Security Considerations

### Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
               font-src 'self' https://fonts.gstatic.com; 
               img-src 'self' data: blob: https://graph.microsoft.com;">
```

### Input Sanitization
- All user inputs are sanitized
- File validation for uploads
- Rate limiting for API calls
- XSS protection

### Authentication Security
- Secure token handling
- Automatic token refresh
- Logout on token expiration
- HTTPS-only cookies

## CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build application
        run: npm run build:production
        env:
          VITE_ONEDRIVE_CLIENT_ID: ${{ secrets.ONEDRIVE_CLIENT_ID }}
      
      - name: Deploy to hosting
        run: npm run deploy
        env:
          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
```

## Database & Storage

### Local Storage Strategy
- Photo metadata in browser localStorage
- User preferences in localStorage  
- Category rules in localStorage
- Temporary caches with TTL

### External Storage
- **OneDrive**: Microsoft Graph API integration
- **Google Drive**: Future integration planned
- **AWS S3**: For enterprise deployments
- **Local File System**: File System Access API

## Scaling Considerations

### Horizontal Scaling
- Stateless application design
- CDN for asset distribution
- Edge computing compatibility
- Multi-region deployment support

### Performance Scaling
- Virtual scrolling for large photo sets
- Web Workers for intensive operations
- Progressive image loading
- Background processing

### Feature Scaling
- Modular feature architecture
- Plugin system for extensions
- API-first design for integrations
- Microservice compatibility

## Maintenance

### Updates
```bash
# Update dependencies
npm update

# Security audit
npm audit

# Bundle analysis
npm run analyze
```

### Monitoring Checklist
- [ ] Error rates below 0.1%
- [ ] Page load times under 2 seconds
- [ ] Memory usage below 500MB
- [ ] Bundle size under 2MB
- [ ] Lighthouse score above 90

### Backup Strategy
- User preferences backed up to cloud storage
- Configuration versioning
- Rollback procedures documented
- Data export capabilities

## Support & Documentation

### User Documentation
- In-app help system
- Video tutorials
- Feature documentation
- Troubleshooting guides

### Developer Documentation
- API documentation
- Component documentation
- Architecture decision records
- Deployment runbooks

This deployment guide ensures the Photo Sorter application can be successfully deployed and maintained in production environments with enterprise-grade reliability and performance.