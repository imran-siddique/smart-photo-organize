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

interface TestingPanelNewProps {
  photos: any[]
  fileTypeStats: Record<string, number>
  folderStats: Record<string, number>
  onTestDuplicates: () => void
  onRunAdvancedDuplicateTest: (thresholds: number[], methods: string[]) => Promise<TestResult[]>
  onGenerateTestFiles: () => void
  isTestingInProgress: boolean
}

export function TestingPanelNew({
  photos,
  fileTypeStats,
  folderStats,
  onTestDuplicates,
  onRunAdvancedDuplicateTest,
  onGenerateTestFiles,
  isTestingInProgress
}: TestingPanelNewProps) {
  const [testResults, setTestResults] = React.useState<TestResult[]>([])
  const [isAdvancedTesting, setIsAdvancedTesting] = React.useState(false)
  
  // Advanced duplicate detection test settings
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
      console.log('🔬 === ENHANCED DUPLICATE DETECTION TEST SUITE ===')
      console.log(`📊 Testing ${selectedThresholds.length} thresholds: ${selectedThresholds.join(', ')}%`)
      console.log(`🔍 Using methods: ${methods.join(', ')}`)
      console.log(`📁 Photo set: ${photos.length} photos`)
      
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

  const addThreshold = (threshold: number) => {
    if (!selectedThresholds.includes(threshold)) {
      setSelectedThresholds(prev => [...prev, threshold].sort((a, b) => a - b))
    }
  }

  const removeThreshold = (threshold: number) => {
    setSelectedThresholds(prev => prev.filter(t => t !== threshold))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Enhanced Duplicate Detection Testing
          </CardTitle>
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
                Run Enhanced Test
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Test Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Test Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Similarity Thresholds</Label>
                  <div className="flex flex-wrap gap-2">
                    {[50, 60, 70, 75, 80, 85, 90, 95, 98].map(threshold => (
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
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedThresholds([60, 75, 90])}
                    >
                      Quick Set: Balanced
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedThresholds([80, 85, 90, 95])}
                    >
                      High Precision
                    </Button>
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
                    <p>Run enhanced duplicate detection test to see results</p>
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
                            <div>
                              <span className="text-muted-foreground">Efficiency:</span>
                              <div className="font-medium">
                                {result.groupsFound > 0 ? (result.totalDuplicates / result.groupsFound).toFixed(2) : '0'} dup/group
                              </div>
                            </div>
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
        </div>
      </CardContent>
    </Card>
  )
}