import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TestTube, PlayCircle, CheckCircle, AlertCircle, BarChart3, Settings, Info, Target, TrendUp, Clock } from '@phosphor-icons/react'
import { apiService } from '@/services/api'
import { toast } from 'sonner'
import { MOCK_TEST_SCENARIOS, getTestScenarioDescription, EXPECTED_RESULTS } from '@/utils/testScenarios'

interface TestResult {
  id: string
  name: string
  description?: string
  settings: DetectionSettings
  result?: {
    totalFound: number
    groups: number
    executionTime: number
    timestamp: string
    efficiency?: number // duplicates found per second
    accuracy?: number // comparison with expected results
  }
  status: 'pending' | 'running' | 'completed' | 'failed'
  error?: string
  expectedResults?: any
}

interface DetectionSettings {
  similarityThreshold: number
  checkFileSize: boolean
  checkFilename: boolean
  checkImageHash: boolean
  checkVisualSimilarity: boolean
}

const PREDEFINED_TESTS: Omit<TestResult, 'result' | 'status'>[] = [
  {
    id: 'strict-hash-only',
    name: 'Strict Hash Only',
    description: 'Uses only image hash matching with 95% threshold - best for exact duplicates',
    settings: {
      similarityThreshold: 95,
      checkFileSize: false,
      checkFilename: false,
      checkImageHash: true,
      checkVisualSimilarity: false
    },
    expectedResults: EXPECTED_RESULTS.highThresholdHashOnly
  },
  {
    id: 'moderate-multi-method',
    name: 'Moderate Multi-Method',
    description: 'Combines multiple detection methods with 85% threshold - balanced approach',
    settings: {
      similarityThreshold: 85,
      checkFileSize: true,
      checkFilename: true,
      checkImageHash: true,
      checkVisualSimilarity: false
    },
    expectedResults: EXPECTED_RESULTS.mediumThresholdMultiMethod
  },
  {
    id: 'loose-visual-similarity',
    name: 'Loose with Visual Similarity',
    description: 'Includes visual similarity detection with 70% threshold - catches similar photos',
    settings: {
      similarityThreshold: 70,
      checkFileSize: true,
      checkFilename: false,
      checkImageHash: true,
      checkVisualSimilarity: true
    },
    expectedResults: EXPECTED_RESULTS.lowThresholdVisual
  },
  {
    id: 'filename-focused',
    name: 'Filename Focused',
    description: 'Focuses on filename patterns - useful for organized libraries',
    settings: {
      similarityThreshold: 80,
      checkFileSize: false,
      checkFilename: true,
      checkImageHash: false,
      checkVisualSimilarity: false
    }
  },
  {
    id: 'size-and-hash',
    name: 'Size + Hash Combination',
    description: 'Combines file size and hash matching - efficient and accurate',
    settings: {
      similarityThreshold: 90,
      checkFileSize: true,
      checkFilename: false,
      checkImageHash: true,
      checkVisualSimilarity: false
    }
  },
  {
    id: 'comprehensive-strict',
    name: 'Comprehensive Strict',
    description: 'All methods enabled with high threshold - thorough but strict',
    settings: {
      similarityThreshold: 95,
      checkFileSize: true,
      checkFilename: true,
      checkImageHash: true,
      checkVisualSimilarity: true
    }
  },
  {
    id: 'comprehensive-moderate',
    name: 'Comprehensive Moderate',
    description: 'All methods with moderate threshold - good balance of coverage and precision',
    settings: {
      similarityThreshold: 80,
      checkFileSize: true,
      checkFilename: true,
      checkImageHash: true,
      checkVisualSimilarity: true
    }
  },
  {
    id: 'comprehensive-loose',
    name: 'Comprehensive Loose',
    description: 'All methods with low threshold - maximum coverage, may include false positives',
    settings: {
      similarityThreshold: 65,
      checkFileSize: true,
      checkFilename: true,
      checkImageHash: true,
      checkVisualSimilarity: true
    }
  },
  // Performance-focused tests
  {
    id: 'speed-optimized',
    name: 'Speed Optimized',
    description: 'Fast detection using only file size and basic hash matching',
    settings: {
      similarityThreshold: 90,
      checkFileSize: true,
      checkFilename: false,
      checkImageHash: true,
      checkVisualSimilarity: false
    }
  },
  {
    id: 'accuracy-optimized',
    name: 'Accuracy Optimized',
    description: 'Prioritizes accuracy over speed with all methods enabled',
    settings: {
      similarityThreshold: 88,
      checkFileSize: true,
      checkFilename: true,
      checkImageHash: true,
      checkVisualSimilarity: true
    }
  }
]

export function DuplicateDetectionTester({ onClose }: { onClose: () => void }) {
  const [tests, setTests] = React.useState<TestResult[]>(
    PREDEFINED_TESTS.map(test => ({ ...test, status: 'pending' as const }))
  )
  const [isRunningBatch, setIsRunningBatch] = React.useState(false)
  const [currentTestIndex, setCurrentTestIndex] = React.useState(-1)
  const [customSettings, setCustomSettings] = React.useState<DetectionSettings>({
    similarityThreshold: 85,
    checkFileSize: true,
    checkFilename: true,
    checkImageHash: true,
    checkVisualSimilarity: false
  })

  // Helper function to calculate accuracy against expected results
  const calculateAccuracy = (actual: { totalFound: number; groups: number }, expected: any): number => {
    if (!expected) return 0
    
    // Simple accuracy calculation - can be enhanced based on specific requirements
    const expectedTotal = Object.values(expected).reduce((sum: number, val: any) => 
      sum + (typeof val === 'number' ? val : 0), 0
    )
    
    if (expectedTotal === 0) return actual.totalFound === 0 ? 100 : 0
    
    const accuracy = Math.max(0, 100 - Math.abs(actual.totalFound - expectedTotal) / expectedTotal * 100)
    return Math.round(accuracy)
  }

  // Run a single test
  const runSingleTest = async (testId: string) => {
    const testIndex = tests.findIndex(t => t.id === testId)
    if (testIndex === -1) return

    setTests(prev => prev.map((test, index) => 
      index === testIndex 
        ? { ...test, status: 'running' as const, error: undefined }
        : test
    ))

    try {
      const test = tests[testIndex]
      const startTime = Date.now()
      
      const result = await apiService.runDuplicateDetection(test.settings)
      const executionTime = Date.now() - startTime
      
      // Calculate efficiency and accuracy metrics
      const efficiency = result.totalFound / (executionTime / 1000) // duplicates per second
      const accuracy = test.expectedResults 
        ? calculateAccuracy(result, test.expectedResults)
        : undefined

      setTests(prev => prev.map((test, index) => 
        index === testIndex 
          ? { 
              ...test, 
              status: 'completed' as const,
              result: {
                ...result,
                executionTime,
                efficiency,
                accuracy,
                timestamp: new Date().toISOString()
              }
            }
          : test
      ))

      toast.success(`Test "${test.name}" completed: ${result.totalFound} duplicates found`)
    } catch (error) {
      setTests(prev => prev.map((test, index) => 
        index === testIndex 
          ? { 
              ...test, 
              status: 'failed' as const,
              error: (error as Error).message
            }
          : test
      ))
      
      toast.error(`Test "${tests[testIndex].name}" failed: ${(error as Error).message}`)
    }
  }

  // Run all tests sequentially
  const runAllTests = async () => {
    setIsRunningBatch(true)
    setCurrentTestIndex(0)

    // Reset all tests to pending
    setTests(prev => prev.map(test => ({ 
      ...test, 
      status: 'pending' as const,
      result: undefined,
      error: undefined
    })))

    for (let i = 0; i < tests.length; i++) {
      setCurrentTestIndex(i)
      await runSingleTest(tests[i].id)
      
      // Small delay between tests
      if (i < tests.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    setCurrentTestIndex(-1)
    setIsRunningBatch(false)
    toast.success('All tests completed!')
  }

  // Run custom test
  const runCustomTest = async () => {
    const customTest: TestResult = {
      id: 'custom-' + Date.now(),
      name: `Custom Test (${customSettings.similarityThreshold}% threshold)`,
      settings: customSettings,
      status: 'pending'
    }

    setTests(prev => [customTest, ...prev])
    await runSingleTest(customTest.id)
  }

  // Clear all results
  const clearResults = () => {
    setTests(PREDEFINED_TESTS.map(test => ({ ...test, status: 'pending' as const })))
    setCurrentTestIndex(-1)
    setIsRunningBatch(false)
  }

  // Calculate statistics
  const completedTests = tests.filter(t => t.status === 'completed')
  const avgExecutionTime = completedTests.length > 0 
    ? completedTests.reduce((sum, test) => sum + (test.result?.executionTime || 0), 0) / completedTests.length
    : 0
    
  const avgEfficiency = completedTests.length > 0
    ? completedTests.reduce((sum, test) => sum + (test.result?.efficiency || 0), 0) / completedTests.length
    : 0

  const avgAccuracy = completedTests.filter(t => t.result?.accuracy !== undefined).length > 0
    ? completedTests.filter(t => t.result?.accuracy !== undefined)
        .reduce((sum, test) => sum + (test.result?.accuracy || 0), 0) / 
      completedTests.filter(t => t.result?.accuracy !== undefined).length
    : 0

  const bestPerforming = completedTests.reduce((best, test) => 
    !best || (test.result?.totalFound || 0) > (best.result?.totalFound || 0) ? test : best
  , null as TestResult | null)

  const fastestTest = completedTests.reduce((fastest, test) => 
    !fastest || (test.result?.executionTime || Infinity) < (fastest.result?.executionTime || Infinity) ? test : fastest
  , null as TestResult | null)
  
  const mostAccurate = completedTests.reduce((accurate, test) => 
    !accurate || (test.result?.accuracy || 0) > (accurate.result?.accuracy || 0) ? test : accurate
  , null as TestResult | null)

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'running':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <div className="w-4 h-4 rounded-full bg-muted" />
    }
  }

  const getMethodsBadges = (settings: DetectionSettings) => {
    const methods = []
    if (settings.checkFileSize) methods.push('Size')
    if (settings.checkFilename) methods.push('Filename')
    if (settings.checkImageHash) methods.push('Hash')
    if (settings.checkVisualSimilarity) methods.push('Visual')
    
    return methods.map(method => (
      <Badge key={method} variant="outline" className="text-xs">
        {method}
      </Badge>
    ))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TestTube className="w-6 h-6" />
            Duplicate Detection Testing Suite
          </h2>
          <p className="text-muted-foreground">
            Test different detection methods and thresholds to optimize duplicate finding
          </p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      <Tabs defaultValue="tests" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tests">Test Suite</TabsTrigger>
          <TabsTrigger value="custom">Custom Test</TabsTrigger>
          <TabsTrigger value="results">Results Analysis</TabsTrigger>
          <TabsTrigger value="help">Help & Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="space-y-4">
          {/* Batch Controls */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <PlayCircle className="w-5 h-5" />
                  Test Controls
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={runAllTests}
                    disabled={isRunningBatch}
                  >
                    {isRunningBatch ? 'Running Tests...' : 'Run All Tests'}
                  </Button>
                  <Button variant="outline" onClick={clearResults}>
                    Clear Results
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isRunningBatch && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Running test {currentTestIndex + 1} of {tests.length}</span>
                    <span>{Math.round(((currentTestIndex + 1) / tests.length) * 100)}%</span>
                  </div>
                  <Progress value={((currentTestIndex + 1) / tests.length) * 100} />
                  {currentTestIndex >= 0 && (
                    <p className="text-sm text-muted-foreground">
                      Current: {tests[currentTestIndex]?.name}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Results */}
          <div className="grid gap-4">
            {tests.map((test, index) => (
              <Card key={test.id} className={`${
                currentTestIndex === index ? 'ring-2 ring-blue-500' : ''
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(test.status)}
                        <h3 className="font-medium">{test.name}</h3>
                        <Badge variant="secondary">
                          {test.settings.similarityThreshold}% threshold
                        </Badge>
                        {test.result?.accuracy !== undefined && (
                          <Badge variant={test.result.accuracy > 80 ? "default" : "outline"}>
                            {test.result.accuracy}% accurate
                          </Badge>
                        )}
                      </div>
                      
                      {test.description && (
                        <p className="text-sm text-muted-foreground">{test.description}</p>
                      )}
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        {getMethodsBadges(test.settings)}
                      </div>

                      {test.result && (
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Found:</span>
                            <p className="font-medium">{test.result.totalFound} duplicates</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Groups:</span>
                            <p className="font-medium">{test.result.groups}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Time:</span>
                            <p className="font-medium">{(test.result.executionTime / 1000).toFixed(2)}s</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Efficiency:</span>
                            <p className="font-medium">{test.result.efficiency?.toFixed(1)}/s</p>
                          </div>
                        </div>
                      )}

                      {test.error && (
                        <Alert className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            {test.error}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => runSingleTest(test.id)}
                        disabled={test.status === 'running' || isRunningBatch}
                      >
                        {test.status === 'running' ? 'Running...' : 'Run Test'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Custom Test Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Similarity Threshold: {customSettings.similarityThreshold}%</Label>
                  <Slider
                    value={[customSettings.similarityThreshold]}
                    onValueChange={([value]) => 
                      setCustomSettings(prev => ({ ...prev, similarityThreshold: value }))
                    }
                    max={100}
                    min={50}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher values = more strict matching
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Detection Methods</Label>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="custom-size" className="text-sm">File Size Matching</Label>
                      <Switch
                        id="custom-size"
                        checked={customSettings.checkFileSize}
                        onCheckedChange={(checked) => 
                          setCustomSettings(prev => ({ ...prev, checkFileSize: checked }))
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="custom-filename" className="text-sm">Filename Similarity</Label>
                      <Switch
                        id="custom-filename"
                        checked={customSettings.checkFilename}
                        onCheckedChange={(checked) => 
                          setCustomSettings(prev => ({ ...prev, checkFilename: checked }))
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="custom-hash" className="text-sm">Image Hash Matching</Label>
                      <Switch
                        id="custom-hash"
                        checked={customSettings.checkImageHash}
                        onCheckedChange={(checked) => 
                          setCustomSettings(prev => ({ ...prev, checkImageHash: checked }))
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="custom-visual" className="text-sm">Visual Similarity (slower)</Label>
                      <Switch
                        id="custom-visual"
                        checked={customSettings.checkVisualSimilarity}
                        onCheckedChange={(checked) => 
                          setCustomSettings(prev => ({ ...prev, checkVisualSimilarity: checked }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={runCustomTest}>
                  Run Custom Test
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {completedTests.length > 0 ? (
            <>
              {/* Summary Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">Tests Completed</span>
                    </div>
                    <p className="text-2xl font-bold">{completedTests.length}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">Avg Time</span>
                    </div>
                    <p className="text-2xl font-bold">{(avgExecutionTime / 1000).toFixed(2)}s</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendUp className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium">Avg Efficiency</span>
                    </div>
                    <p className="text-2xl font-bold">{avgEfficiency.toFixed(1)}/s</p>
                  </CardContent>
                </Card>

                {avgAccuracy > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-medium">Avg Accuracy</span>
                      </div>
                      <p className="text-2xl font-bold">{avgAccuracy.toFixed(0)}%</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Best Performing Tests */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {bestPerforming && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        Most Duplicates Found
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="font-medium">{bestPerforming.name}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary">
                            {bestPerforming.settings.similarityThreshold}% threshold
                          </Badge>
                          {getMethodsBadges(bestPerforming.settings)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Found {bestPerforming.result?.totalFound} duplicates in {bestPerforming.result?.groups} groups
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {fastestTest && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-500" />
                        Fastest Execution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="font-medium">{fastestTest.name}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary">
                            {fastestTest.settings.similarityThreshold}% threshold
                          </Badge>
                          {getMethodsBadges(fastestTest.settings)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Completed in {((fastestTest.result?.executionTime || 0) / 1000).toFixed(2)}s
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {mostAccurate && mostAccurate.result?.accuracy !== undefined && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="w-5 h-5 text-orange-500" />
                        Most Accurate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="font-medium">{mostAccurate.name}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary">
                            {mostAccurate.settings.similarityThreshold}% threshold
                          </Badge>
                          {getMethodsBadges(mostAccurate.settings)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {mostAccurate.result.accuracy}% accuracy score
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Detailed Results Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Test Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {completedTests
                      .sort((a, b) => (b.result?.totalFound || 0) - (a.result?.totalFound || 0))
                      .map((test) => (
                      <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{test.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {test.settings.similarityThreshold}%
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            {getMethodsBadges(test.settings)}
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm text-right">
                          <div>
                            <div className="font-medium">{test.result?.totalFound || 0}</div>
                            <div className="text-muted-foreground">duplicates</div>
                          </div>
                          <div>
                            <div className="font-medium">{test.result?.groups || 0}</div>
                            <div className="text-muted-foreground">groups</div>
                          </div>
                          <div>
                            <div className="font-medium">{((test.result?.executionTime || 0) / 1000).toFixed(2)}s</div>
                            <div className="text-muted-foreground">time</div>
                          </div>
                          <div>
                            <div className="font-medium">
                              {test.result?.efficiency?.toFixed(1) || 0}/s
                              {test.result?.accuracy !== undefined && (
                                <span className="ml-2 text-xs">
                                  ({test.result.accuracy}% acc)
                                </span>
                              )}
                            </div>
                            <div className="text-muted-foreground">efficiency</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">No Test Results Yet</p>
                <p className="text-muted-foreground">
                  Run some tests to see detailed analysis and comparison of different detection methods.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="help" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Testing Methodology & Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Detection Methods Explained</h3>
                  
                  <div className="space-y-3">
                    <div className="border rounded-lg p-3">
                      <h4 className="font-medium mb-1">File Size Matching</h4>
                      <p className="text-sm text-muted-foreground">
                        Fastest method. Compares file sizes to identify potential duplicates. 
                        Good for exact copies but may miss compressed versions.
                      </p>
                    </div>
                    
                    <div className="border rounded-lg p-3">
                      <h4 className="font-medium mb-1">Filename Similarity</h4>
                      <p className="text-sm text-muted-foreground">
                        Analyzes filename patterns. Effective for organized libraries with 
                        consistent naming conventions.
                      </p>
                    </div>
                    
                    <div className="border rounded-lg p-3">
                      <h4 className="font-medium mb-1">Image Hash Matching</h4>
                      <p className="text-sm text-muted-foreground">
                        Creates content fingerprints. Most accurate for detecting identical 
                        images regardless of filename or minor size differences.
                      </p>
                    </div>
                    
                    <div className="border rounded-lg p-3">
                      <h4 className="font-medium mb-1">Visual Similarity</h4>
                      <p className="text-sm text-muted-foreground">
                        Slowest but most thorough. Detects visually similar images like 
                        burst shots or photos of the same scene.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Threshold Guidelines</h3>
                  
                  <div className="space-y-3">
                    <div className="border rounded-lg p-3">
                      <h4 className="font-medium mb-1 flex items-center gap-2">
                        Conservative (90%+)
                        <Badge variant="outline" className="text-xs">Recommended</Badge>
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Only exact or near-exact duplicates. Minimal false positives. 
                        Best for first-time cleanup.
                      </p>
                    </div>
                    
                    <div className="border rounded-lg p-3">
                      <h4 className="font-medium mb-1">Balanced (75-89%)</h4>
                      <p className="text-sm text-muted-foreground">
                        Good balance of coverage and precision. Catches most duplicates 
                        with reasonable accuracy.
                      </p>
                    </div>
                    
                    <div className="border rounded-lg p-3">
                      <h4 className="font-medium mb-1 flex items-center gap-2">
                        Aggressive (50-74%)
                        <Badge variant="outline" className="text-xs">Review Required</Badge>
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Maximum coverage including burst photos and similar scenes. 
                        Higher chance of false positives.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Recommended Testing Strategy</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4 text-green-500" />
                        Start Here
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Run "Comprehensive Moderate" test first
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• 80% threshold</li>
                        <li>• All methods enabled</li>
                        <li>• Good baseline results</li>
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        For Speed
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Try "Speed Optimized" for regular scans
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Hash + Size only</li>
                        <li>• 90% threshold</li>
                        <li>• Fast execution</li>
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <TrendUp className="w-4 h-4 text-purple-500" />
                        For Thoroughness
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Use "Loose with Visual" for complete coverage
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• All methods including visual</li>
                        <li>• 70% threshold</li>
                        <li>• Manual review needed</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Pro Tip:</strong> Start with conservative settings and gradually increase 
                  coverage based on your comfort level with the results. Always review duplicate 
                  groups manually before bulk deletion.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}