import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { FileText, Folder, Image, ChartBar, TestTube, Download } from '@phosphor-icons/react'

interface TestingPanelProps {
  photos: any[]
  fileTypeStats: Record<string, number>
  folderStats: Record<string, number>
  onTestDuplicates: () => void
  onGenerateTestFiles: () => void
  isTestingInProgress: boolean
}

export function TestingPanel({
  photos,
  fileTypeStats,
  folderStats,
  onTestDuplicates,
  onGenerateTestFiles,
  isTestingInProgress
}: TestingPanelProps) {
  const [activeTests, setActiveTests] = React.useState<string[]>([])
  
  const testScenarios = [
    {
      id: 'mixed-formats',
      name: 'Mixed File Formats',
      description: 'Test JPEG, PNG, GIF, WebP, HEIC, AVIF support',
      status: 'ready'
    },
    {
      id: 'deep-folders',
      name: 'Deep Folder Structure',
      description: 'Test nested folders up to 5 levels deep',
      status: 'ready'
    },
    {
      id: 'special-chars',
      name: 'Special Characters',
      description: 'Test files with unicode, spaces, special chars',
      status: 'ready'
    },
    {
      id: 'large-files',
      name: 'Large File Handling',
      description: 'Test files over 10MB, memory management',
      status: 'ready'
    },
    {
      id: 'edge-cases',
      name: 'Edge Cases',
      description: 'Test corrupted files, 0-byte files, symlinks',
      status: 'ready'
    }
  ]

  const runTest = async (testId: string) => {
    setActiveTests(prev => [...prev, testId])
    
    // Simulate test execution
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setActiveTests(prev => prev.filter(id => id !== testId))
  }

  const downloadTestDataset = () => {
    // Create a test dataset info file
    const testData = {
      info: 'Photo Sorter Test Dataset',
      recommendations: [
        'Create a folder with 20-30 photos of different formats',
        'Include subfolders like "Vacation/2023", "Family/Kids", "Work/Screenshots"',
        'Mix file types: JPG, PNG, GIF, WebP if available',
        'Include some duplicate photos with slight variations',
        'Add files with special characters in names',
        'Test with both very small (< 100KB) and large (> 5MB) files'
      ],
      supportedFormats: [
        'JPEG (.jpg, .jpeg)',
        'PNG (.png)', 
        'GIF (.gif)',
        'WebP (.webp)',
        'BMP (.bmp)',
        'TIFF (.tiff, .tif)',
        'SVG (.svg)',
        'ICO (.ico)',
        'AVIF (.avif)',
        'HEIC (.heic)',
        'HEIF (.heif)'
      ],
      folderStructureExample: {
        'Photos': {
          'Vacation': {
            '2023': ['beach1.jpg', 'beach2.png', 'mountains.webp'],
            '2022': ['skiing.jpg', 'hiking.gif']
          },
          'Family': {
            'Kids': ['birthday.jpg', 'school.png'],
            'Pets': ['dog.jpg', 'cat.heic']
          },
          'Work': ['screenshot1.png', 'chart.jpg', 'presentation.gif'],
          'Screenshots': ['screen1.png', 'screen2.jpg'],
          'Duplicates': ['photo.jpg', 'photo_copy.jpg', 'photo_edited.jpg']
        }
      }
    }
    
    const blob = new Blob([JSON.stringify(testData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'photo-sorter-test-guide.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Testing & Diagnostics
          </CardTitle>
          <Button onClick={downloadTestDataset} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Test Guide
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="file-types">File Types</TabsTrigger>
            <TabsTrigger value="folders">Folders</TabsTrigger>
            <TabsTrigger value="tests">Test Suite</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <Alert>
              <Image className="w-4 h-4" />
              <AlertDescription>
                Current collection: {photos.length} photos across {Object.keys(folderStats).length} folders
                with {Object.keys(fileTypeStats).length} different file types.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{photos.length}</div>
                  <div className="text-sm text-muted-foreground">Total Photos</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{Object.keys(fileTypeStats).length}</div>
                  <div className="text-sm text-muted-foreground">File Types</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{Object.keys(folderStats).length}</div>
                  <div className="text-sm text-muted-foreground">Folders</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">
                    {Math.round(photos.reduce((sum, p) => sum + p.size, 0) / 1024 / 1024)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total MB</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="file-types" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">File Type Distribution</h3>
              <Badge variant="outline">
                {Object.keys(fileTypeStats).length} types
              </Badge>
            </div>
            
            <div className="space-y-3">
              {Object.entries(fileTypeStats)
                .sort(([,a], [,b]) => b - a)
                .map(([type, count]) => {
                  const percentage = (count / photos.length) * 100
                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span>{type || 'unknown'}</span>
                        </div>
                        <Badge variant="secondary">
                          {count} files ({Math.round(percentage)}%)
                        </Badge>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })
              }
            </div>
            
            {Object.keys(fileTypeStats).length === 0 && (
              <Alert>
                <AlertDescription>
                  No photos loaded yet. Load some photos to see file type statistics.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
          
          <TabsContent value="folders" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Folder Structure</h3>
              <Badge variant="outline">
                {Object.keys(folderStats).length} folders
              </Badge>
            </div>
            
            <div className="space-y-3">
              {Object.entries(folderStats)
                .sort(([,a], [,b]) => b - a)
                .map(([folder, count]) => {
                  const percentage = (count / photos.length) * 100
                  const depth = folder.split('/').length - 1
                  
                  return (
                    <div key={folder} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Folder className="w-4 h-4" />
                          <span style={{ paddingLeft: `${depth * 12}px` }}>
                            {folder.split('/').pop() || folder}
                          </span>
                          {depth > 0 && (
                            <Badge variant="outline" className="text-xs">
                              L{depth + 1}
                            </Badge>
                          )}
                        </div>
                        <Badge variant="secondary">
                          {count} files ({Math.round(percentage)}%)
                        </Badge>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })
              }
            </div>
            
            {Object.keys(folderStats).length === 0 && (
              <Alert>
                <AlertDescription>
                  No folder structure detected. Load photos from a directory to see folder statistics.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
          
          <TabsContent value="tests" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Automated Test Suite</h3>
              <Button
                onClick={onTestDuplicates}
                disabled={isTestingInProgress || photos.length < 2}
                size="sm"
              >
                Run Duplicate Tests
              </Button>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              {testScenarios.map((test) => (
                <Card key={test.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{test.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {test.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {activeTests.includes(test.id) ? (
                          <Badge variant="secondary">Running...</Badge>
                        ) : (
                          <Button
                            onClick={() => runTest(test.id)}
                            size="sm"
                            variant="outline"
                            disabled={isTestingInProgress}
                          >
                            Run Test
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <Separator />
            
            <Alert>
              <ChartBar className="w-4 h-4" />
              <AlertDescription>
                <strong>Test Recommendations:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>Test with folders containing 100+ mixed format photos</li>
                  <li>Include files with special characters and Unicode names</li>
                  <li>Test nested folder structures (3+ levels deep)</li>
                  <li>Add some identical duplicates and near-duplicates</li>
                  <li>Include very large files (10MB+) and very small files</li>
                  <li>Test with corrupted or unusual file extensions</li>
                </ul>
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}