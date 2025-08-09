// Photo management hook and provider

import React from 'react'
import { PhotoManagementService } from '../services'

const PhotoManagementContext = React.createContext<{
  service: PhotoManagementService
  // Add other context values as needed
} | null>(null)

export function PhotoManagementProvider({ children }: { children: React.ReactNode }) {
  const service = React.useMemo(() => new PhotoManagementService(), [])

  return (
    <PhotoManagementContext.Provider value={{ service }}>
      {children}
    </PhotoManagementContext.Provider>
  )
}

export function usePhotoManagement() {
  const context = React.useContext(PhotoManagementContext)
  
  if (!context) {
    throw new Error('usePhotoManagement must be used within a PhotoManagementProvider')
  }

  return context
}