import React from 'react'
import { Button } from '@/components/ui/button'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'

import { Label } from '@/components/ui/label'
  fileTypeStats: Record<string, number>
import { FileText, Folder, Image, ChartBar, TestTube, Download, Lightning, MagnifyingGlass, Target, TrendUp, Clock, CheckCircle } from '@phosphor-icons/react'

interface TestingPanelProps {
}
  fileTypeStats: Record<string, number>
  threshold: number
  onTestDuplicates: () => void
  onRunAdvancedDuplicateTest: (thresholds: number[], methods: string[]) => Promise<TestResult[]>
  onGenerateTestFiles: () => void
  accuracy?: number
}

interface TestResult {
  threshold: number
  methods: string[]
  onGenerateTestFiles
  totalDuplicates: number
  executionTime: number
  memoryUsage?: number
  
}

    const methods = Object.ent
      .ma
    try {
      console.
      console.log(`
      const results = await o
      
      console.log('\n
        console.log(`\n
        console.log(`  Total Duplicates: ${result.totalDuplicates}`)
        console.log(`  Methods: ${result.methods.join(', ')}`)
          console.log(`  Accuracy: ${result.accuracy.toFixed(1)}%`)
  
    } catch (error) {
    } finally {
    }

    if (!selected
    
  
    setSelectedThresholds(prev => prev.filter(t => t !== threshold))

    <Card>
        <div classN
            <T
    
  
            size="sm"
            {isAdvancedTesting ? (
    
              </>
              <>
    
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
            Advanced Duplicate Detection Testing
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
                Run Advanced Test
              </>
              
                   
              
                  
      
                   
                          testResults.reduce((best, current) =>
                          ).threshol
                
                        
                          testResults.reduce((best, current) => 
                         
                      </AlertDescription>
                  )}
              )}
          </Card>
        
        {testResults.length
            <CardHeader>
            </CardHeader>
              <div className="s
                  <h4 className="text-
                    {testResults.map((result, index) => {
                      const percentage = maxGroups >
                      return (
                          <div className="flex it
                         
                        
                     
                  </div>
                
                
                  <h4 
                    {testResults.map((result, index) => {
                      const percentage = maxTime > 0 ? (result.exe
                    
                    
              
                          <
              
                  </div>
              </div>
          </Card>
      </CardContent>
  )























































































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
          <Card className="mt-6">
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
      </CardContent>
    </Card>
  )
}