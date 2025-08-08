import React from 'react'
import { Folder, CloudArrowDown, MagnifyingGlass } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

interface ActionButtonsProps {
  currentProvider: 'local' | 'onedrive'
  photosCount: number
  isDuplicateDetectionRunning: boolean
  onLoadPhotos: (refresh?: boolean) => Promise<void>
  onOpenDuplicateDetection: () => void
}

export function ActionButtons({
  currentProvider,
  photosCount,
  isDuplicateDetectionRunning,
  onLoadPhotos,
  onOpenDuplicateDetection
}: ActionButtonsProps) {
  if (photosCount === 0) {
    return null
  }

  return (
    <div className="flex justify-center space-x-4">
      <Button onClick={() => onLoadPhotos(true)} variant="outline">
        {currentProvider === 'local' ? <Folder className="w-4 h-4 mr-2" /> : <CloudArrowDown className="w-4 h-4 mr-2" />}
        {currentProvider === 'local' ? 'Load More Photos' : 'Refresh Photos'}
      </Button>
      <Button 
        onClick={onOpenDuplicateDetection}
        variant="outline"
        disabled={isDuplicateDetectionRunning}
      >
        <MagnifyingGlass className="w-4 h-4 mr-2" />
        {isDuplicateDetectionRunning ? 'Scanning...' : 'Scan for Duplicates'}
      </Button>
    </div>
  )
}