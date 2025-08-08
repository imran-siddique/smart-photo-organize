import React from 'react'
import { SmartAlbumRule } from '@/services/smartAlbums'
import { Card, CardContent, CardDescription, Ca
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, Sel
import { Tabs, TabsContent, TabsList, TabsTri
import { Separator } from '@/components/ui/se
import { 
  Trash,
  Lightbulb,
  X,
  Sparkles,
} from '@phosphor-icons/react'

  predefi
  sugge
  onUpda
  onAcc
  onGenerate

  na
  type: Sma
  autoUpdat
  icon

  { value: 'ai-content', label

  { value: 'location', label: 'Location

  '#f59e0b', '#10b981', '#f9731
]
const iconOptions = [
  'Star', 'Image', 'Monitor', 'Calendar', 'Folder'

  predefinedRules,
  suggestedRules,
  onUpdateRule,
 

  const [activeTab, setA
  const [editi
    name: '',
    type: 'ai-content',
    autoUpdate: tr
    icon: 'Image'

    setFormDat
 

      color: '#6366f1',
    })

    if (!formData.name.trim()) {
      return

 

    onCreateRule(newRu
    resetForm()

 

    setEditingRule(ru
      name: rule.name,
      type: rule.type,
 

  }
  const handleSave
    
      toast.error
    }
    handleUpdat
    resetForm()

    setEditingRule(nu
  }
  const renderRuleCard = (rule: S

      <Card key={rule.id} className={`group ${!rule.enabled ? 'opacity-60' 
          <div className="flex items-start justify-between">
              <div 
             
                <div
              
                {i
                    v
                    c
                 
    

                        {ru
                 
               
                      
                  </div>
              </div>
            
              {isSugges
                  <
      
   

                  <Button 
                    variant="gho
                    className="text-red-600 h
            
     

                    <Button 
                  
                      disabled={isEditing}
     

                  {!isEdi
                      checked={r
               
   

                      variant="ghost" 
                      className="t
   

              )}
          </div>
        
          <div classNa
              <div className="space-
                  <Lab
                    id="desc
                    onChange={(e) 
                    rows
                </div
      
   

                      </SelectTr
                        {rul
    
                        ))}
                    </Select>
            
     

                      </SelectTrigger>
                        
               
   

                            </div>
                        
               
   

                    <div className="flex items-center gap-2">
                        id="enabled"

            
                    
                      <Switch
                        checked={formData.autoUpdate}
                      />
                   
                  
                    <Button size="sm" variant="outline" onClick={handleCancelEdit
               
                      Save
                  </
              
              <div className="space-y-2">
                  {rule.descri
                
                  <div className="text-xs
                  </div>
                
                  <span>Auto-update: {rule.
                    
                     
                  )}
              </div>
          </div>
      </Card>
  }
  return (
      <div className="flex items-center j
          <h2 className="text-2xl font-semibold flex items-center gap-2
            Smart Album Rules
          <p className="text-mut
          </p>
        
          <Button varian
            Get Su
          
            <Dialo
            
              </Button>
            <DialogContent>
                <DialogTitle>Create Smart Album Rule</Dia
                  Define a
              </DialogHeader>
              <div className="space-
                  <Label htmlFor="name">Name</Label>
                    id="name"
                   
                  />
                
                  <Label h
                    id="descri
                    onChange={(e) =>
                    rows={3}
                </div>
                <di
                  <Select value={formData.typ
                      <Sele
                    <S
                   
                  
                          </div>
                      ))}
                  </Select>
                
                  <div>
                    <Select value={formDat
                     
                      <SelectContent>
                          <Se
                    
                  
                              {col
                          <
                      </SelectContent>
                  </div>
                  <div
                    
                  
                      <SelectCon
                          <S
                          </Sele
                      </SelectContent>
                  </div>
                
                  <di
                      <Switch
                        check
                    
                   
                
                  
                
                     
        
                
                  <Button variant="ou
                  </Button
                    Create Rule
                </div
            </DialogContent>
        </div>

        <TabsList>
            Predefined ({predefinedRules.length})
          <TabsTrigger value="custom">
          </TabsTrigger>
            <TabsTri
              <div cla
          )}
        
          <Alert>
            <AlertDescription>
            </AlertDescription>
          
            {predefinedRules.map((rule)
        </TabsContent>
        <TabsContent value="custom" c
            <Card className="p-12 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 f
                </div>
                  <h3 className="text-l
                    Create 
                </div>
                  <Plus class
                </Button
            </Card
            <div classN
            </div>
        </TabsContent>
        <TabsContent value="suggested
            <Card className="p-12 text-
                <div className="mx-aut
                </div>
                  <h3 className="text-lg font-medium">
                    We'll analyze your photo collection and sugg
                </div>
                  <Lightbulb classN
                </Button>
            </Card>
            <div className="spac
                <Lightbulb className=
                  These rules are 
              </Alert>
              <div classNam
              </div>
          )}
      </Tabs>
  )
















































































































































































































































































































