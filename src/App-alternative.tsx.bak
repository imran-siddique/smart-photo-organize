// Main application component - simplified and modularized

import React from 'react'
import { Toaster } from 'sonner'

// Infrastructure
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { logger, performanceMonitor, productionChecks } from '@/infrastructure/monitoring'

// Features
import { PhotoManagementProvider } from '@/features/photo-management/hooks/usePhotoManagement'
import { StorageProviderProvider } from '@/features/storage-providers/hooks/useStorageProvider'

// Components
import { AppLayout } from '@/shared/components/AppLayout'
import { AppRouter } from '@/shared/components/AppRouter'

function PhotoSorterApp() {
  // Initialize application
  React.useEffect(() => {
    const isDevelopment = import.meta.env?.DEV || window.location.hostname === 'localhost'
    
    logger.info('Photo Sorter application starting', {
      version: '2.0.0',
      environment: isDevelopment ? 'development' : 'production',
      timestamp: new Date().toISOString()
    })

    performanceMonitor.mark('app-init-start')
    
    // Run production checks in production
    if (!isDevelopment) {
      productionChecks.checkEnvironment()
      productionChecks.checkPerformance()
    }

    performanceMonitor.mark('app-init-complete')
    performanceMonitor.measure('app-initialization', 'app-init-start', 'app-init-complete')

    // Cleanup on unmount
    return () => {
      logger.info('Photo Sorter application shutting down')
    }
  }, [])

  return (
    <ErrorBoundary>
      <StorageProviderProvider>
        <PhotoManagementProvider>
          <AppLayout>
            <AppRouter />
          </AppLayout>
          <Toaster richColors position="top-right" />
        </PhotoManagementProvider>
      </StorageProviderProvider>
    </ErrorBoundary>
  )
}

export default function App() {
  return <PhotoSorterApp />
}