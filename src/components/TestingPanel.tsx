import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { FileText, Folder, Image, ChartBar, TestTube, Download, Lightning, MagnifyingGlass, Target, TrendUp, Clock, CheckCircle } from '@phosphor-icons/react'
import { TestResult } from '@/hooks/usePhotoStorage'

interface TestingPanelProps {
  photos: any[]
  fileTypeStats: Record<string, number>
  folderStats: Record<string, number>
  onTestDuplicates: () => void
  onRunAdvancedDuplicateTest: (thresholds: number[], methods: string[]) => Promise<TestResult[]>
  onGenerateTestFiles: () => void
  isTestingInProgress: boolean
}

export function TestingPanel({
  photos,
  fileTypeStats,
  folderStats,
  onTestDuplicates,
  onRunAdvancedDuplicateTest,
  onGenerateTestFiles,
  isTestingInProgress
}: TestingPanelProps) {
  const [activeTests, setActiveTests] = React.useState<string[]>([])
  const [testResults, setTestResults] = React.useState<TestResult[]>([])
  const [isAdvancedTesting, setIsAdvancedTesting] = React.useState(false)
  
  // Advanced duplicate detection test settings
  const [testSettings, setTestSettings] = React.useState({
    thresholds: [50, 65, 75, 85, 90, 95],
    methods: ['fileSize', 'filename', 'hash'],
    iterations: 3
  })
  
  const [selectedThresholds, setSelectedThresholds] = React.useState<number[]>([75, 85, 95])
  const [selectedMethods, setSelectedMethods] = React.useState({
    fileSize: true,
    filename: true,
    hash: true
  })
  
  const runAdvancedDuplicateTest = async () => {
    if (!onRunAdvancedDuplicateTest) return
    
    setIsAdvancedTesting(true)
    setTestResults([])
    
    const methods = Object.entries(selectedMethods)
      .filter(([_, enabled]) => enabled)
      .map(([method, _]) => method)
    
    try {
      console.log('=== Starting Advanced Duplicate Detection Test Suite ===')
      console.log(`Testing ${selectedThresholds.length} thresholds: ${selectedThresholds.join(', ')}%`)
      console.log(`Using methods: ${methods.join(', ')}`)
      console.log(`Photo set: ${photos.length} photos`)
      
      const results = await onRunAdvancedDuplicateTest(selectedThresholds, methods)
      setTestResults(results)
      
      // Generate detailed comparison report
      console.log('\n=== Test Results Comparison ===')
      results.forEach((result, index) => {
        console.log(`\nThreshold ${result.threshold}%:`)
        console.log(`  Groups Found: ${result.groupsFound}`)
        console.log(`  Total Duplicates: ${result.totalDuplicates}`)
        console.log(`  Execution Time: ${result.executionTime}ms`)
        console.log(`  Methods: ${result.methods.join(', ')}`)
        if (result.accuracy) {
          console.log(`  Accuracy: ${result.accuracy.toFixed(1)}%`)
        }
      })
      
    } catch (error) {
      console.error('Advanced duplicate test failed:', error)
    } finally {
      setIsAdvancedTesting(false)
    }
  }

  const runComparativeAnalysis = async () => {
    if (testResults.length < 2) return
    
    console.log('\n=== Comparative Analysis ===')
    
    // Find optimal threshold based on balance of precision and recall
    const optimalResult = testResults.reduce((best, current) => {
      const score = current.groupsFound > 0 ? 
        (current.totalDuplicates / current.groupsFound) * 
        (current.accuracy || 100) / 100 : 0
      const bestScore = best.groupsFound > 0 ? 
        (best.totalDuplicates / best.groupsFound) * 
        (best.accuracy || 100) / 100 : 0
      return score > bestScore ? current : best
    })
    
    console.log(`Recommended threshold: ${optimalResult.threshold}% (${optimalResult.groupsFound} groups, ${optimalResult.totalDuplicates} duplicates)`)
    
    // Performance analysis
    const avgExecutionTime = testResults.reduce((sum, r) => sum + r.executionTime, 0) / testResults.length
    console.log(`Average execution time: ${avgExecutionTime.toFixed(0)}ms`)
    
    // Threshold sensitivity analysis
    const sensitivityData = testResults.map(r => ({
      threshold: r.threshold,
      efficiency: r.groupsFound > 0 ? r.totalDuplicates / r.groupsFound : 0
    }))
    
    console.log('Threshold sensitivity:')
    sensitivityData.forEach(({ threshold, efficiency }) => {
      console.log(`  ${threshold}%: ${efficiency.toFixed(2)} duplicates per group`)
    })
  }

  const addThreshold = (threshold: number) => {
    if (!selectedThresholds.includes(threshold)) {
      setSelectedThresholds(prev => [...prev, threshold].sort((a, b) => a - b))
    }
  }

  const removeThreshold = (threshold: number) => {
    setSelectedThresholds(prev => prev.filter(t => t !== threshold))
  }

  const runTest = async (testId: string) => {
    setActiveTests(prev => [...prev, testId])
    
    // Simulate test execution
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setActiveTests(prev => prev.filter(id => id !== testId))
  }

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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="duplicates">Duplicates</TabsTrigger>
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
          
          <TabsContent value="duplicates" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Advanced Duplicate Detection Testing</h3>
              <div className="flex items-center gap-2">
                <Button
                  onClick={runAdvancedDuplicateTest}
                  disabled={isAdvancedTesting || photos.length < 2}
                  size="sm"
                >
                  {isAdvancedTesting ? (
                    <>
                      <Lightning className="w-4 h-4 mr-1 animate-pulse" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4 mr-1" />
                      Run Advanced Test
                    </>
                  )}
                </Button>
                {testResults.length > 1 && (
                  <Button
                    onClick={runComparativeAnalysis}
                    variant="outline"
                    size="sm"
                  >
                    <TrendUp className="w-4 h-4 mr-1" />
                    Analyze Results
                  </Button>
                )}
              </div>
            </div>
            
            {photos.length < 2 && (
              <Alert>
                <AlertDescription>
                  Load at least 2 photos to run duplicate detection tests.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Test Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Test Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Similarity Thresholds</Label>
                    <div className="flex flex-wrap gap-2">
                      {testSettings.thresholds.map(threshold => (
                        <Button
                          key={threshold}
                          variant={selectedThresholds.includes(threshold) ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            if (selectedThresholds.includes(threshold)) {
                              removeThreshold(threshold)
                            } else {
                              addThreshold(threshold)
                            }
                          }}
                        >
                          {threshold}%
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Selected: {selectedThresholds.length} thresholds
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Detection Methods</Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="method-size" className="text-sm">File Size Comparison</Label>
                        <Switch
                          id="method-size"
                          checked={selectedMethods.fileSize}
                          onCheckedChange={(checked) => 
                            setSelectedMethods(prev => ({ ...prev, fileSize: checked }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="method-filename" className="text-sm">Filename Similarity</Label>
                        <Switch
                          id="method-filename"
                          checked={selectedMethods.filename}
                          onCheckedChange={(checked) => 
                            setSelectedMethods(prev => ({ ...prev, filename: checked }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="method-hash" className="text-sm">Content Hashing</Label>
                        <Switch
                          id="method-hash"
                          checked={selectedMethods.hash}
                          onCheckedChange={(checked) => 
                            setSelectedMethods(prev => ({ ...prev, hash: checked }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Alert>
                    <MagnifyingGlass className="w-4 h-4" />
                    <AlertDescription className="text-sm">
                      This test will systematically compare different similarity thresholds 
                      and detection methods across your photo collection.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
              
              {/* Test Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Test Results</CardTitle>
                </CardHeader>
                <CardContent>
                  {testResults.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Run advanced duplicate detection test to see results</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {testResults.map((result, index) => (
                        <Card key={index} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{result.threshold}%</Badge>
                                <span className="text-sm font-medium">
                                  {result.groupsFound} groups
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {result.executionTime}ms
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Total Duplicates:</span>
                                <div className="font-medium">{result.totalDuplicates}</div>
                              </div>
                              {result.accuracy && (
                                <div>
                                  <span className="text-muted-foreground">Accuracy:</span>
                                  <div className="font-medium">{result.accuracy.toFixed(1)}%</div>
                                </div>
                              )}
                            </div>
                            <div className="mt-2">
                              <div className="flex flex-wrap gap-1">
                                {result.methods.map(method => (
                                  <Badge key={method} variant="secondary" className="text-xs">
                                    {method}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {testResults.length > 1 && (
                        <Alert>
                          <CheckCircle className="w-4 h-4" />
                          <AlertDescription>
                            <strong>Best Result:</strong> {
                              testResults.reduce((best, current) => 
                                current.groupsFound > best.groupsFound ? current : best
                              ).threshold
                            }% threshold found the most duplicate groups ({
                              testResults.reduce((best, current) => 
                                current.groupsFound > best.groupsFound ? current : best
                              ).groupsFound
                            } groups, {
                              testResults.reduce((best, current) => 
                                current.groupsFound > best.groupsFound ? current : best
                              ).totalDuplicates
                            } duplicates)
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Performance Comparison Chart */}
            {testResults.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Groups Found by Threshold</h4>
                      <div className="space-y-2">
                        {testResults.map((result, index) => {
                          const maxGroups = Math.max(...testResults.map(r => r.groupsFound))
                          const percentage = maxGroups > 0 ? (result.groupsFound / maxGroups) * 100 : 0
                          
                          return (
                            <div key={index} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span>{result.threshold}% threshold</span>
                                <span>{result.groupsFound} groups</span>
                              </div>
                              <Progress value={percentage} className="h-2" />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Execution Time Comparison</h4>
                      <div className="space-y-2">
                        {testResults.map((result, index) => {
                          const maxTime = Math.max(...testResults.map(r => r.executionTime))
                          const percentage = maxTime > 0 ? (result.executionTime / maxTime) * 100 : 0
                          
                          return (
                            <div key={index} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span>{result.threshold}% threshold</span>
                                <span>{result.executionTime}ms</span>
                              </div>
                              <Progress value={percentage} className="h-2" />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
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