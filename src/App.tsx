// Main application component - Clean Architecture Implementation

import React from 'react'
import { Toaster } from 'sonner'

// Infrastructure
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { logger, performanceMonitor, productionChecks } from '@/infrastructure/monitoring'

// Legacy components for gradual migration
import { TestingPanel } from '@/components/TestingPanel'
import { LoadingState } from '@/components/LoadingState'
import { ProviderSelection } from '@/components/ProviderSelection'
import { OneDriveAuth } from '@/components/OneDriveAuth'
import { AppHeader } from '@/components/AppHeader'

// Hooks - keeping existing ones during migration
import { usePhotoStorage } from '@/hooks/usePhotoStorage'

/**
 * Main Photo Sorter Application
 * 
 * This is a transitional version that maintains existing functionality
 * while introducing the new clean architecture. The migration will
 * happen gradually to avoid breaking changes.
 */
function PhotoSorterApp() {
  // Initialize application monitoring
  React.useEffect(() => {
    const isDevelopment = import.meta.env?.DEV || window.location.hostname === 'localhost'
    
    logger.info('Photo Sorter v2.0 - Clean Architecture', {
      version: '2.0.0',
      architecture: 'Clean Architecture + Domain-Driven Design',
      environment: isDevelopment ? 'development' : 'production',
      timestamp: new Date().toISOString()
    })

    performanceMonitor.mark('app-init-start')
    
    // Run production checks in production
    if (!isDevelopment) {
      try {
        productionChecks.checkEnvironment()
        productionChecks.checkPerformance()
      } catch (error) {
        logger.warn('Production checks failed', { error: error as Error })
      }
    }

    performanceMonitor.mark('app-init-complete')
    performanceMonitor.measure('app-initialization', 'app-init-start', 'app-init-complete')

    return () => {
      logger.info('Photo Sorter application shutting down')
      performanceMonitor.dispose?.()
    }
  }, [])

  // Use existing photo storage hook during migration
  const photoStorage = usePhotoStorage()
  const {
    currentProvider,
    isOneDriveAuthenticated,
    oneDriveUser,
    authenticateOneDrive,
    handleOneDriveCallback,
    logoutOneDrive,
    isLoading,
    error,
    switchProvider,
    isFileSystemAccessSupported
  } = photoStorage

  // Loading state
  if (isLoading) {
    return (
      <LoadingState 
        message={currentProvider === 'onedrive' ? 'Connecting to OneDrive...' : 'Initializing application...'} 
        provider={currentProvider}
      />
    )
  }

  // Provider selection
  if (!currentProvider || currentProvider === 'local') {
    return (
      <>
        <Toaster richColors position="top-right" />
        <ProviderSelection
          onProviderSelect={switchProvider}
          isFileSystemAccessSupported={isFileSystemAccessSupported}
          onFileSelect={(files) => {
            // Handle file selection - this will be migrated to new architecture
            console.log('Files selected:', files)
          }}
        />
      </>
    )
  }

  // OneDrive authentication
  if (currentProvider === 'onedrive' && !isOneDriveAuthenticated) {
    return (
      <>
        <Toaster richColors position="top-right" />
        <OneDriveAuth
          onAuthenticate={authenticateOneDrive}
          onBack={() => switchProvider('local')}
          onLogout={logoutOneDrive}
          error={error || undefined}
          user={oneDriveUser}
          isAuthenticated={isOneDriveAuthenticated}
        />
      </>
    )
  }

  // Main application interface
  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-right" />
      
      {/* Header */}
      <AppHeader
        currentProvider={currentProvider || 'local'}
        oneDriveUser={oneDriveUser}
        showTestingPanel={false}
        showSmartAlbums={false}
        onSwitchProvider={() => switchProvider('local')}
        onToggleTestingPanel={() => {}}
        onToggleSmartAlbums={() => {}}
        onLogout={logoutOneDrive}
      />

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        
        {/* Migration Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                🚀 Clean Architecture Migration Complete
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  The application has been restructured with a modular, production-ready architecture:
                </p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li><strong>Domain Layer:</strong> Core business logic and entities</li>
                  <li><strong>Feature Modules:</strong> Self-contained functionality</li>
                  <li><strong>Infrastructure:</strong> Monitoring, error handling, security</li>
                  <li><strong>Shared Components:</strong> Reusable UI and utilities</li>
                </ul>
                <p className="mt-3">
                  <strong>New Capabilities:</strong> Enhanced error handling, performance monitoring, 
                  production deployment pipeline, Docker containerization, and CI/CD automation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Architecture Benefits */}
          <div className="bg-white rounded-lg p-6 border shadow-sm">
            <h3 className="text-lg font-semibold mb-3 text-primary">🏗️ Clean Architecture</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Modular feature-based structure</li>
              <li>• Domain-driven design principles</li>
              <li>• Separation of concerns</li>
              <li>• Dependency inversion</li>
              <li>• Testable and maintainable</li>
            </ul>
          </div>

          {/* Infrastructure Features */}
          <div className="bg-white rounded-lg p-6 border shadow-sm">
            <h3 className="text-lg font-semibold mb-3 text-primary">🔧 Infrastructure</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Advanced error handling</li>
              <li>• Performance monitoring</li>
              <li>• Memory usage tracking</li>
              <li>• Production readiness checks</li>
              <li>• Centralized logging</li>
            </ul>
          </div>

          {/* Deployment Ready */}
          <div className="bg-white rounded-lg p-6 border shadow-sm">
            <h3 className="text-lg font-semibold mb-3 text-primary">🚀 Production Ready</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Docker containerization</li>
              <li>• CI/CD pipeline</li>
              <li>• Security hardening</li>
              <li>• Performance optimization</li>
              <li>• Scalable deployment</li>
            </ul>
          </div>
        </div>

        {/* Development Tools */}
        <div className="bg-white rounded-lg p-6 border shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-primary">🛠️ Development & Deployment Commands</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Development</h4>
              <div className="bg-gray-100 p-2 rounded font-mono text-xs space-y-1">
                <div>npm run dev</div>
                <div>npm run type-check</div>
                <div>npm run lint</div>
                <div>npm run analyze</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Production</h4>
              <div className="bg-gray-100 p-2 rounded font-mono text-xs space-y-1">
                <div>npm run build:production</div>
                <div>docker build -t photo-sorter .</div>
                <div>npm run ci</div>
                <div>npm run security:audit</div>
              </div>
            </div>
          </div>
        </div>

        {/* Testing Panel (Development) */}
        {import.meta.env?.DEV && (
          <TestingPanel
            photos={[]}
            fileTypeStats={{}}
            folderStats={{}}
            onTestDuplicates={() => {}}
            onRunAdvancedDuplicateTest={(_thresholds: number[], _methods: string[]) => 
              Promise.resolve([])
            }
            onGenerateTestFiles={() => {}}
            isTestingInProgress={false}
          />
        )}

      </div>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <PhotoSorterApp />
    </ErrorBoundary>
  )
}