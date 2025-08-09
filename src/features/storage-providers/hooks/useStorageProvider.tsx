// Storage provider hook and provider

import React from 'react'
import { StorageProvider, StorageProviderType } from '../../../shared/types'

interface StorageProviderContextValue {
  currentProvider: StorageProviderType | null
  switchProvider: (provider: StorageProviderType) => void
  // Add other storage-related functionality
}

const StorageProviderContext = React.createContext<StorageProviderContextValue | null>(null)

export function StorageProviderProvider({ children }: { children: React.ReactNode }) {
  const [currentProvider, setCurrentProvider] = React.useState<StorageProviderType | null>(null)

  const switchProvider = React.useCallback((provider: StorageProviderType) => {
    setCurrentProvider(provider)
  }, [])

  const value = React.useMemo(() => ({
    currentProvider,
    switchProvider
  }), [currentProvider, switchProvider])

  return (
    <StorageProviderContext.Provider value={value}>
      {children}
    </StorageProviderContext.Provider>
  )
}

export function useStorageProvider() {
  const context = React.useContext(StorageProviderContext)
  
  if (!context) {
    throw new Error('useStorageProvider must be used within a StorageProviderProvider')
  }

  return context
}