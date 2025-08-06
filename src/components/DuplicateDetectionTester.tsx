import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/co
import { Tabs, TabsContent, TabsList, TabsTrigger }
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTri
import { apiService } from '@/services/api'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TestTube, PlayCircle, CheckCircle, AlertCircle, BarChart3, Settings, Info } from '@phosphor-icons/react'
import { apiService } from '@/services/api'
import { toast } from 'sonner'

interface TestResult {
  id: string
  name: string
  settings: DetectionSettings
  result?: {
    totalFound: number
    groups: number
    executionTime: number
    timestamp: string
  }
  status: 'pending' | 'running' | 'completed' | 'failed'
  error?: string
}

interface DetectionSettings {
  similarityThreshold: number
  {
    name: 'Strict Hash O
      similarityThreshold
      checkFilename: false,
 

    id: 'moderate-multi-method',
   
      checkFileSize: true,
      checkImageHash: true,
    }
  {
    name: 'Loose with Visua
      similarityThreshold: 
      checkFilename: false,
      checkVisualSimilarity: true
  },
    
   
      checkFileSize: false,
      checkImageHash: false,
    }
  {
    name: 'Size + Hash Com
      similarityThreshold:
      checkFilename: false,
      checkVisualSimilarity: false
  },
    
   
      checkFileSize: true,
      checkImageHash: true,
    }
  {
    name: 'Comprehensive M
      similarityThreshold: 
      checkFilename: true,
      checkVisualSimilarity: true
  },
    
   
      checkFileSize: true,
      checkImageHash: true,
    }
]
export function DuplicateDe
    PREDEFINED_TESTS.map(t
  const [isRunningBatch, set
  const [customSettings, setCustom
    c
    
  }
  // Run a single test
    const testIndex = tests.findInde

      index === testIndex 
        : test

      const test = tests[te
      
     
    
   
              status: 'complete
                ...result,
               
            }
      ))
      toast.success(`Test 
      setTests(prev => prev
          ? { 
     
    
   
      toast.error(`Test "${tests[
  }
  // Run all te
    setIsRunningBatch(true)

    setTests(prev => prev.
      status: 'pending' as 
      error: undefined

    
   
      if (i < tests.length - 1
      }

    setIsRunningBatch(false)
  }
  // Run custom test
    const customTest: TestR
      name: `Custom Test (${custo
     

 

  const clearResults = () => {
    setCurrentTestIndex(-1)
  }
  /
  const avgExecutionTime = completedTests.length > 0 
    : 0
  const bestPerforming = completedTests.reduce((best, test) => 
  , null as TestResult | nul
  const fastestTest = co
  , null as TestResult |
  const getStatusIcon = (
      case 'completed':
    

      default:
    }

    const methods = []

    if (settings.checkVisualSimilarity) methods
    return methods.map(met
        {method}
    ))


      <di
          <h2 className="text-2xl f
            Duplicate Detection Te
      
          </p>
        <Button variant="outline" onClick={onClose


        <TabsList className=
          <Tab
        </TabsList>
        <TabsContent value="tests" classNam
          <Card>
              <div classNa
                  <PlayCircle 
                </CardTitle>
               
             
                
        

              </div>
            <CardCont
                <div className="space-y-2">
                    <span>Ru
              
                  {curr
                      Current: {tests[cu
                  )}
             
          </Card
        
      
                currentTestIndex === index ? 'ring-2 ring-blue-500' : ''
     
   

                        <Badge 
                        </Badge>
                      
                        {g

                        <div clas
                            <span classNa
               
                            <span
                        
                      
        

                      {test.error && (
                          <A
                            {test.erro
      
                    </div>
                    <div classNam
                        size="sm" 
       
     

                  </div>
              </Card>
          </div>


              <CardT
                Custom Test Configura
            </CardHeader>
              <div className="spa
                  <Label>Similarity Threshold: {customSettings.similarityThre
                    value={[cus
                      s
     

                  />
                    Higher values = mo
   

                <div c
                  
                    <div className="flex items-center justify-between">
                      <Swit
                        chec
   

                    
                      <Label htmlFor="custom-filename" className="te
                        id="custom-filename"
                        onCheckedChange={(checked) => 
       

                    <div className="flex items-center justify-b
                      <Switch
                        checke

                      />
                    
                      <Label h

                        onCheckedChange={(checked) => 
                     
                    </d
                </div>

                <Button onClick={runCustomTest}>
                </Bu
            </CardContent>
        </Tabs
        <TabsContent value="results" className="space-y-4">
     
   

                      <BarChart3 className="w-4 h-4 text-blue
                    </
                  </CardContent>

                  <CardContent className="p-4">
                      <CheckCircle className="w-4 h-4 text-gre
    
                  </CardContent>

                
              
      
   

          
              {/* Best Performi
                {bes
                    <CardHeader>
             
                      <div className="space-y-2">
                        <div className="flex
                            {bestPerforming.s
               
                        <div className="text-sm
                        </div>
              
              
                {fastestTest && (
               
                 
            

                            {fastestTest.settings.si
                          {getMethodsBadges(fastestTes
                        <div className="text-sm text-muted-fo
                        </div>
                    </CardContent>
                )}

              <Card>
                  <CardTitle>Det
                
                    {com
                      .map((test) => (
                        <div className="flex-1">
                            <span className="font-me
                              {
                          </
                            {getMethodsBadges(test.settin
                        </
                          <div>
                            <div className="t
                   
                            <div className="text-muted-foreground">groups</
                          <
                            <div className="text-muted-foreground">
                        </div>
                    ))}
                </Card
            </>
            <Card>
                <BarChart
                <p className="text
                </p>
            </Card>
        </TabsContent>
    </div>
}



















































































































































































































































































































