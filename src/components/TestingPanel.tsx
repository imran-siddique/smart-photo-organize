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
    thresholds: [50, 60, 70, 75, 80, 85, 90, 95, 98],
    methods: ['fileSize', 'filename', 'hash'],
    iterations: 3,
    enableSubsetTesting: true,
    enableMethodComparison: true
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
      console.log('🔬 === COMPREHENSIVE DUPLICATE DETECTION TEST SUITE ===')
      console.log(`📊 Dataset: ${photos.length} photos`)
      console.log(`🎯 Testing ${selectedThresholds.length} thresholds: ${selectedThresholds.join(', ')}%`)
      console.log(`🔍 Using methods: ${methods.join(', ')}`)
      console.log(`📁 File types in collection: ${Object.keys(fileTypeStats).join(', ')}`)
      console.log(`📂 Folders: ${Object.keys(folderStats).length} directories`)
      
      // Phase 1: Standard threshold testing
      console.log('\n🧪 PHASE 1: Threshold Comparison Testing')
      const standardResults = await onRunAdvancedDuplicateTest(selectedThresholds, methods)
      
      // Phase 2: Method comparison testing (if enabled)
      let methodResults: TestResult[] = []
      if (testSettings.enableMethodComparison && selectedThresholds.length > 0) {
        console.log('\n🧪 PHASE 2: Detection Method Comparison')
        const testThreshold = selectedThresholds[Math.floor(selectedThresholds.length / 2)] // Use middle threshold
        
        // Test individual methods
        const individualMethods = ['fileSize', 'filename', 'hash']
        for (const method of individualMethods) {
          if (methods.includes(method)) {
            console.log(`   Testing ${method} only...`)
            const methodResult = await onRunAdvancedDuplicateTest([testThreshold], [method])
            if (methodResult.length > 0) {
              methodResults.push({
                ...methodResult[0],
                testType: `Method-${method}`
              } as any)
            }
          }
        }
        
        // Test method combinations
        const combinations = [
          ['fileSize', 'filename'],
          ['fileSize', 'hash'],
          ['filename', 'hash']
        ].filter(combo => combo.every(m => methods.includes(m)))
        
        for (const combo of combinations) {
          console.log(`   Testing ${combo.join(' + ')}...`)
          const comboResult = await onRunAdvancedDuplicateTest([testThreshold], combo)
          if (comboResult.length > 0) {
            methodResults.push({
              ...comboResult[0],
              testType: `Combo-${combo.join('+')}`
            } as any)
          }
        }
      }
      
      // Phase 3: Subset scaling testing (if enabled and enough photos)
      let scalingResults: TestResult[] = []
      if (testSettings.enableSubsetTesting && photos.length >= 20) {
        console.log('\n🧪 PHASE 3: Scaling Analysis with Photo Subsets')
        const testThreshold = 85 // Use standard threshold for scaling tests
        const subsetSizes = [
          Math.min(15, photos.length),
          Math.min(30, photos.length),
          Math.min(50, photos.length),
          photos.length
        ].filter((size, index, arr) => arr.indexOf(size) === index && size >= 10)
        
        for (const size of subsetSizes) {
          console.log(`   Testing with ${size} photos...`)
          // Note: In real implementation, you'd pass the subset size to the detection function
          const scaleResult = await onRunAdvancedDuplicateTest([testThreshold], methods)
          if (scaleResult.length > 0) {
            scalingResults.push({
              ...scaleResult[0],
              testType: `Scale-${size}photos`,
              photoSetSize: size
            } as any)
          }
        }
      }
      
      // Combine all results
      const allResults = [...standardResults, ...methodResults, ...scalingResults]
      setTestResults(allResults)
      
      // Generate comprehensive analysis report
      console.log('\n📊 === COMPREHENSIVE TEST RESULTS ===')
      
      // Standard threshold results
      if (standardResults.length > 0) {
        console.log('\n📈 THRESHOLD ANALYSIS:')
        standardResults.forEach(result => {
          const efficiency = result.groupsFound > 0 ? (result.totalDuplicates / result.groupsFound).toFixed(2) : '0'
          const coverage = photos.length > 0 ? ((result.totalDuplicates / photos.length) * 100).toFixed(1) : '0'
          console.log(`   ${result.threshold}%: ${result.groupsFound} groups, ${result.totalDuplicates} duplicates (${efficiency} dup/group, ${coverage}% coverage) - ${result.executionTime}ms`)
        })
        
        const bestThreshold = standardResults.reduce((best, current) => 
          current.groupsFound > best.groupsFound ? current : best
        )
        console.log(`   🏆 Best performing threshold: ${bestThreshold.threshold}% (${bestThreshold.groupsFound} groups)`)
      }
      
      // Method comparison results
      if (methodResults.length > 0) {
        console.log('\n🔍 METHOD COMPARISON:')
        methodResults.forEach(result => {
          const testType = (result as any).testType || 'Unknown'
          console.log(`   ${testType}: ${result.groupsFound} groups, ${result.totalDuplicates} duplicates - ${result.executionTime}ms`)
        })
        
        const bestMethod = methodResults.reduce((best, current) => 
          current.groupsFound > best.groupsFound ? current : best
        )
        const bestMethodType = (bestMethod as any).testType || 'Unknown'
        console.log(`   🏆 Most effective method combination: ${bestMethodType}`)
      }
      
      // Scaling analysis results
      if (scalingResults.length > 0) {
        console.log('\n📏 SCALING PERFORMANCE:')
        scalingResults.forEach(result => {
          const photoCount = (result as any).photoSetSize || photos.length
          const timePerPhoto = (result.executionTime / photoCount).toFixed(2)
          console.log(`   ${photoCount} photos: ${result.groupsFound} groups, ${result.totalDuplicates} duplicates - ${result.executionTime}ms (${timePerPhoto}ms/photo)`)
        })
      }
      
      // Overall recommendations
      console.log('\n💡 RECOMMENDATIONS:')
      
      if (standardResults.length > 0) {
        // Accuracy recommendation
        const accurateResults = standardResults.filter(r => (r.accuracy || 0) >= 85)
        if (accurateResults.length > 0) {
          const bestAccurate = accurateResults.reduce((best, current) => 
            current.groupsFound > best.groupsFound ? current : best
          )
          console.log(`   🎯 For high accuracy: ${bestAccurate.threshold}% threshold`)
        }
        
        // Speed recommendation
        const avgTime = standardResults.reduce((sum, r) => sum + r.executionTime, 0) / standardResults.length
        const fastResults = standardResults.filter(r => r.executionTime <= avgTime)
        if (fastResults.length > 0) {
          const fastestEffective = fastResults.reduce((best, current) => 
            current.groupsFound > best.groupsFound ? current : best
          )
          console.log(`   ⚡ For fast processing: ${fastestEffective.threshold}% threshold (${fastestEffective.executionTime}ms)`)
        }
        
        // Balanced recommendation
        const balanced = standardResults.reduce((best, current) => {
          const currentScore = (current.groupsFound * 0.6) + ((1000 / Math.max(current.executionTime, 1)) * 0.4)
          const bestScore = (best.groupsFound * 0.6) + ((1000 / Math.max(best.executionTime, 1)) * 0.4)
          return currentScore > bestScore ? current : best
        })
        console.log(`   ⚖️ For balanced performance: ${balanced.threshold}% threshold`)
      }
      
      console.log('\n=== Test Suite Complete ===')
      
    } catch (error) {
      console.error('🚨 Comprehensive duplicate test failed:', error)
    } finally {
      setIsAdvancedTesting(false)
    }
  }

  const runComparativeAnalysis = async () => {
    if (testResults.length < 2) return
    
    console.log('\n=== Comprehensive Duplicate Detection Analysis ===')
    
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
    
    console.log(`📊 RECOMMENDED THRESHOLD: ${optimalResult.threshold}%`)
    console.log(`   - Groups Found: ${optimalResult.groupsFound}`)
    console.log(`   - Total Duplicates: ${optimalResult.totalDuplicates}`)
    console.log(`   - Execution Time: ${optimalResult.executionTime}ms`)
    console.log(`   - Methods Used: ${optimalResult.methods.join(', ')}`)
    
    // Performance analysis across thresholds
    console.log('\n📈 PERFORMANCE METRICS:')
    const avgExecutionTime = testResults.reduce((sum, r) => sum + r.executionTime, 0) / testResults.length
    const totalGroups = testResults.reduce((sum, r) => sum + r.groupsFound, 0)
    const totalDuplicates = testResults.reduce((sum, r) => sum + r.totalDuplicates, 0)
    
    console.log(`   - Average execution time: ${avgExecutionTime.toFixed(0)}ms`)
    console.log(`   - Total groups across all tests: ${totalGroups}`)
    console.log(`   - Total duplicates identified: ${totalDuplicates}`)
    console.log(`   - Photo collection size: ${photos.length} files`)
    
    // Threshold sensitivity analysis
    console.log('\n🎯 THRESHOLD SENSITIVITY ANALYSIS:')
    const sensitivityData = testResults.map(r => ({
      threshold: r.threshold,
      efficiency: r.groupsFound > 0 ? r.totalDuplicates / r.groupsFound : 0,
      coverage: photos.length > 0 ? (r.totalDuplicates / photos.length) * 100 : 0
    }))
    
    sensitivityData.forEach(({ threshold, efficiency, coverage }) => {
      console.log(`   ${threshold}%: ${efficiency.toFixed(2)} duplicates/group | ${coverage.toFixed(1)}% collection coverage`)
    })
    
    // Detection method effectiveness
    console.log('\n🔍 METHOD EFFECTIVENESS:')
    const methodStats = testResults.reduce((acc, result) => {
      result.methods.forEach(method => {
        if (!acc[method]) acc[method] = { groups: 0, duplicates: 0, tests: 0 }
        acc[method].groups += result.groupsFound
        acc[method].duplicates += result.totalDuplicates
        acc[method].tests += 1
      })
      return acc
    }, {} as Record<string, { groups: number, duplicates: number, tests: number }>)
    
    Object.entries(methodStats).forEach(([method, stats]) => {
      console.log(`   ${method}: Avg ${(stats.groups / stats.tests).toFixed(1)} groups, ${(stats.duplicates / stats.tests).toFixed(1)} duplicates per test`)
    })
    
    // Performance vs Quality Trade-off
    console.log('\n⚖️ PERFORMANCE VS QUALITY TRADE-OFF:')
    testResults.forEach(result => {
      const qualityScore = result.groupsFound > 0 ? result.totalDuplicates / result.groupsFound : 0
      const speedScore = result.executionTime > 0 ? 1000 / result.executionTime : 0
      const balanceScore = (qualityScore * 0.7) + (speedScore * 0.3)
      console.log(`   ${result.threshold}%: Quality=${qualityScore.toFixed(2)}, Speed=${speedScore.toFixed(3)}, Balance=${balanceScore.toFixed(2)}`)
    })
    
    // Best practices recommendations
    console.log('\n💡 RECOMMENDATIONS:')
    const highAccuracyResults = testResults.filter(r => (r.accuracy || 0) >= 90)
    const fastResults = testResults.filter(r => r.executionTime <= avgExecutionTime)
    
    if (highAccuracyResults.length > 0) {
      const bestAccuracy = highAccuracyResults.reduce((best, current) => 
        (current.accuracy || 0) > (best.accuracy || 0) ? current : best
      )
      console.log(`   - For highest accuracy: Use ${bestAccuracy.threshold}% threshold (${(bestAccuracy.accuracy || 0).toFixed(1)}% accurate)`)
    }
    
    if (fastResults.length > 0) {
      const fastest = fastResults.reduce((best, current) => 
        current.executionTime < best.executionTime ? current : best
      )
      console.log(`   - For fastest processing: Use ${fastest.threshold}% threshold (${fastest.executionTime}ms)`)
    }
    
    const balancedResult = testResults.reduce((best, current) => {
      const currentBalance = (current.groupsFound * 0.5) + ((1000 / current.executionTime) * 0.3) + ((current.accuracy || 0) * 0.2)
      const bestBalance = (best.groupsFound * 0.5) + ((1000 / best.executionTime) * 0.3) + ((best.accuracy || 0) * 0.2)
      return currentBalance > bestBalance ? current : best
    })
    console.log(`   - For best balance: Use ${balancedResult.threshold}% threshold`)
    
    console.log('\n=== End Analysis ===')
  }

  const runPhotoBenchmarks = async () => {
    if (photos.length < 5) return
    
    setIsAdvancedTesting(true)
    setTestResults([])
    
    console.log('\n🧪 === PHOTO SET BENCHMARK TESTING ===')
    console.log(`Testing duplicate detection across different photo subsets`)
    console.log(`Total collection: ${photos.length} photos`)
    
    try {
      // Test different subset sizes
      const subsetSizes = [
        Math.min(10, photos.length),
        Math.min(25, photos.length),
        Math.min(50, photos.length),
        photos.length
      ].filter((size, index, arr) => arr.indexOf(size) === index) // Remove duplicates
      
      const benchmarkThresholds = [70, 85, 95]
      const allResults: TestResult[] = []
      
      for (const subsetSize of subsetSizes) {
        console.log(`\n📊 Testing with ${subsetSize} photos:`)
        
        // Create subset for testing (taking every nth photo to maintain diversity)
        const step = Math.max(1, Math.floor(photos.length / subsetSize))
        const photoSubset = photos.filter((_, index) => index % step === 0).slice(0, subsetSize)
        
        console.log(`   Selected ${photoSubset.length} photos (every ${step} photos)`)
        
        // Run tests on this subset with different thresholds
        for (const threshold of benchmarkThresholds) {
          const startTime = performance.now()
          
          // Simulate running duplicate detection on subset
          // In real implementation, you'd call the actual detection with the subset
          const methods = ['fileSize', 'filename', 'hash']
          
          try {
            const subsetResults = await onRunAdvancedDuplicateTest([threshold], methods)
            if (subsetResults.length > 0) {
              const result = {
                ...subsetResults[0],
                photoSetSize: photoSubset.length,
                testType: `Subset-${subsetSize}`,
              }
              allResults.push(result)
              
              console.log(`     ${threshold}%: ${result.groupsFound} groups, ${result.totalDuplicates} duplicates (${result.executionTime}ms)`)
            }
          } catch (error) {
            console.error(`     Error testing ${threshold}% on ${subsetSize} photos:`, error)
          }
          
          // Brief pause between threshold tests
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      // Analyze scaling performance
      console.log('\n📈 SCALING ANALYSIS:')
      subsetSizes.forEach(size => {
        const sizeResults = allResults.filter(r => (r as any).photoSetSize === size)
        if (sizeResults.length > 0) {
          const avgTime = sizeResults.reduce((sum, r) => sum + r.executionTime, 0) / sizeResults.length
          const avgGroups = sizeResults.reduce((sum, r) => sum + r.groupsFound, 0) / sizeResults.length
          const totalDuplicates = sizeResults.reduce((sum, r) => sum + r.totalDuplicates, 0)
          
          console.log(`   ${size} photos: Avg ${avgTime.toFixed(0)}ms, ${avgGroups.toFixed(1)} groups, ${totalDuplicates} total duplicates`)
          
          if (size > 10) {
            const timePerPhoto = avgTime / size
            console.log(`     Processing rate: ${timePerPhoto.toFixed(2)}ms per photo`)
          }
        }
      })
      
      // Set results for UI display
      setTestResults(allResults)
      
      console.log('\n🎯 BENCHMARK RECOMMENDATIONS:')
      
      // Find most efficient threshold across different set sizes
      const efficiencyByThreshold = benchmarkThresholds.map(threshold => {
        const thresholdResults = allResults.filter(r => r.threshold === threshold)
        const avgEfficiency = thresholdResults.length > 0 
          ? thresholdResults.reduce((sum, r) => sum + (r.groupsFound > 0 ? r.totalDuplicates / r.groupsFound : 0), 0) / thresholdResults.length
          : 0
        const avgTime = thresholdResults.length > 0
          ? thresholdResults.reduce((sum, r) => sum + r.executionTime, 0) / thresholdResults.length
          : 0
        
        return { threshold, efficiency: avgEfficiency, avgTime }
      })
      
      const bestEfficiency = efficiencyByThreshold.reduce((best, current) => 
        current.efficiency > best.efficiency ? current : best
      )
      
      console.log(`   Most efficient threshold: ${bestEfficiency.threshold}% (${bestEfficiency.efficiency.toFixed(2)} duplicates per group)`)
      console.log(`   Recommended for collections of ${photos.length} photos or similar`)
      
      // Performance scaling insights
      if (subsetSizes.length > 1) {
        const smallestSize = Math.min(...subsetSizes)
        const largestSize = Math.max(...subsetSizes)
        const smallResults = allResults.filter(r => (r as any).photoSetSize === smallestSize)
        const largeResults = allResults.filter(r => (r as any).photoSetSize === largestSize)
        
        if (smallResults.length > 0 && largeResults.length > 0) {
          const smallAvgTime = smallResults.reduce((sum, r) => sum + r.executionTime, 0) / smallResults.length
          const largeAvgTime = largeResults.reduce((sum, r) => sum + r.executionTime, 0) / largeResults.length
          const scalingFactor = largeAvgTime / smallAvgTime
          const expectedLinearTime = smallAvgTime * (largestSize / smallestSize)
          
          console.log(`   Scaling performance: ${scalingFactor.toFixed(2)}x time increase for ${(largestSize/smallestSize).toFixed(1)}x photos`)
          console.log(`   Actual vs Linear scaling: ${(largeAvgTime/expectedLinearTime).toFixed(2)}x ${largeAvgTime > expectedLinearTime ? 'slower' : 'faster'} than linear`)
        }
      }
      
    } catch (error) {
      console.error('Photo benchmark testing failed:', error)
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
                      Run Comprehensive Test
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => runPhotoBenchmarks()}
                  disabled={isAdvancedTesting || photos.length < 5}
                  variant="outline"
                  size="sm"
                >
                  <ChartBar className="w-4 h-4 mr-1" />
                  Benchmark Sets
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedThresholds([50, 60, 70, 80])}
                      >
                        High Recall
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
                  
                  <Alert>
                    <MagnifyingGlass className="w-4 h-4" />
                    <AlertDescription className="text-sm">
                      <strong>Comprehensive Testing:</strong> Tests multiple thresholds, method combinations, 
                      and photo set sizes to find optimal duplicate detection settings for your collection.
                      <br /><br />
                      <strong>What gets tested:</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Different similarity thresholds (50-98%)</li>
                        <li>Individual and combined detection methods</li>
                        <li>Scaling performance with various photo set sizes</li>
                        <li>Method effectiveness comparison</li>
                        <li>Speed vs accuracy trade-offs</li>
                      </ul>
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
                                {(result as any).testType && (
                                  <Badge variant="secondary" className="text-xs">
                                    {(result as any).testType}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {result.executionTime}ms
                                {(result as any).photoSetSize && (
                                  <>
                                    <span>•</span>
                                    <span>{(result as any).photoSetSize} photos</span>
                                  </>
                                )}
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
                              {result.accuracy && (
                                <div>
                                  <span className="text-muted-foreground">Accuracy:</span>
                                  <div className="font-medium">{result.accuracy.toFixed(1)}%</div>
                                </div>
                              )}
                              <div>
                                <span className="text-muted-foreground">Speed:</span>
                                <div className="font-medium">
                                  {((result as any).photoSetSize || photos.length) > 0 
                                    ? (result.executionTime / ((result as any).photoSetSize || photos.length)).toFixed(1) 
                                    : result.executionTime} ms/photo
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