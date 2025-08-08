import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
  Check,
  X,
  Lightbulb,
  Sparkles,
  Star,
  Image,
  Calendar,
  MapPin,
  Tag
} from '@phosphor-icons/react'

interface SmartAlbumRulesManagerProps {
  predefinedRules: SmartAlbumRule[]
  customRules: SmartAlbumRule[]
  suggestedRules: SmartAlbumRule[]
  onCreateRule: (rule: Omit<SmartAlbumRule, 'id'>) => void
  onUpdateRule: (id: string, rule: Partial<SmartAlbumRule>) => void
  onDeleteRule: (id: string) => void
  onAcceptSuggestion: (suggestionId: string) => void
  onRejectSuggestion: (suggestionId: string) => void
  onGenerateSuggestions: () => void
}

const ruleTypeOptions = [
  { value: 'ai-content', label: 'AI Content Analysis' },
  { value: 'metadata', label: 'Metadata Based' },
  { value: 'location', label: 'Location Based' },
  { value: 'temporal', label: 'Time Based' },
  { value: 'pattern', label: 'Pattern Matching' }
]

const colorOptions = [
  '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#10b981', '#f97316'
]

const iconOptions = [
  { value: 'Star', component: Star },
  { value: 'Image', component: Image },
  { value: 'Calendar', component: Calendar },
  { value: 'MapPin', component: MapPin },
  { value: 'Tag', component: Tag }
]

export function SmartAlbumRulesManager({
  predefinedRules,
  customRules,
  suggestedRules,
  onCreateRule,
  onUpdateRule,
  onDeleteRule,
  onAcceptSuggestion,
  onRejectSuggestion,
  onGenerateSuggestions
}: SmartAlbumRulesManagerProps) {
  const [activeTab, setActiveTab] = React.useState('custom')
  const [editingRule, setEditingRule] = React.useState<string | null>(null)
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    type: 'ai-content' as SmartAlbumRule['type'],
    enabled: true,
    autoUpdate: true,
    icon: 'Image',
    color: colorOptions[0]
  })

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'ai-content',
      enabled: true,
      autoUpdate: true,
      icon: 'Image',
      color: colorOptions[0]
    })
    setEditingRule(null)
  }

  const handleCreateRule = () => {
    if (!formData.name.trim()) return

    onCreateRule({
      name: formData.name,
      description: formData.description || `${formData.name} album created automatically`,
      type: formData.type,
      conditions: [], // Empty conditions for now - will be filled by the service
      enabled: formData.enabled,
      autoUpdate: formData.autoUpdate,
      icon: formData.icon,
      color: formData.color
    })

    resetForm()
  }

  const handleEditRule = (rule: SmartAlbumRule) => {
    setFormData({
      name: rule.name,
      description: rule.description,
      type: rule.type,
      enabled: rule.enabled,
      autoUpdate: rule.autoUpdate,
      icon: rule.icon || 'Image',
      color: rule.color || colorOptions[0]
    })
    setEditingRule(rule.id)
  }

  const handleUpdateRule = () => {
    if (!editingRule || !formData.name.trim()) return

    onUpdateRule(editingRule, {
      name: formData.name,
      description: formData.description,
      type: formData.type,
      enabled: formData.enabled,
      autoUpdate: formData.autoUpdate,
      icon: formData.icon,
      color: formData.color
    })

    resetForm()
  }

  const getIconComponent = (iconName: string) => {
    const icon = iconOptions.find(opt => opt.value === iconName)
    return icon ? icon.component : Image
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Smart Album Rules</h2>
          <p className="text-muted-foreground">
            Manage rules for automatically organizing photos into smart albums
          </p>
        </div>
        <Button 
          onClick={onGenerateSuggestions}
          className="flex items-center gap-2"
        >
          <Lightbulb weight="fill" />
          Generate Suggestions
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="custom">Custom Rules</TabsTrigger>
          <TabsTrigger value="suggested">
            Suggestions
            {suggestedRules.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {suggestedRules.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="predefined">Predefined</TabsTrigger>
                  </
              
              <div className="space-y-2">Name="space-y-4">
                  {rule.descrirm */}
                
                  <div className="text-xs
                  </div> className="flex items-center gap-2">
                <Plus />
                  <span>Auto-update: {rule.: 'Create New Rule'}
                    Title>
                     der>
                  )}tent className="space-y-4">
              </div>lassName="grid grid-cols-1 md:grid-cols-2 gap-4">
          </div><div className="space-y-2">
      </Card>     <Label htmlFor="rule-name">Rule Name</Label>
  }               <Input
  return (          id="rule-name"
      <div className="flex items-center jle name"
          <h2 className="text-2xl font-semibold flex items-center gap-2
            Smart Album Rules{(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          <p className="text-mut
          </p>  </div>
        
          <Button varianssName="space-y-2">
            Get Su<Label htmlFor="rule-description">Description</Label>
                  <Input
            <Dialo  id="rule-description"
                    placeholder="Enter rule description"
              </Button>ue={formData.description}
            <DialogContent>e={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                <DialogTitle>Create Smart Album Rule</Dia
                  Define a
              </DialogHeader>
              <div className="space-e-y-2">
                  <Label htmlFor="name">Name</Label>pe</Label>
                    id="name"
                    value={formData.type} 
                  />onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as SmartAlbumRule['type'] }))}
                  >
                  <Label htTrigger>
                    id="descrialue />
                    onChange={(e) =>
                    rows={3}ontent>
                </div>{ruleTypeOptions.map(option => (
                <di     <SelectItem key={option.value} value={option.value}>
                  <Select value={formData.typ
                      <SeleelectItem>
                    <S))}
                    </SelectContent>
                  </Select>
                          </div>
                      ))}
                  </Select>ame="space-y-2">
                  <Label htmlFor="rule-icon">Icon</Label>
                  <div>ct 
                    <Select value={formDat
                     nValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}
                      <SelectContent>
                          <Seigger>
                      <SelectValue />
                    </SelectTrigger>
                              {col>
                          <Options.map(option => {
                      </SelectContent>onent = option.component
                  </div>return (
                  <div    <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <IconComponent size={16} />
                      <SelectConption.value}
                          <S</div>
                          </SelectItem>
                      </SelectContent>
                  </div>}
                    </SelectContent>
                  <dielect>
                      <Switch
                        check
                     className="space-y-2 md:col-span-2">
                   Label>Color</Label>
                  <div className="flex gap-2">
                    {colorOptions.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                  <Button variant="oulor === color ? 'border-foreground scale-110' : 'border-transparent'
                  </Button}
                    Create Rule{ backgroundColor: color }}
                </div   onClick={() => setFormData(prev => ({ ...prev, color }))}
            </DialogContent>
        </div>      ))}
                  </div>
        <TabsList>div>
            Predefined ({predefinedRules.length})
          <TabsTrigger value="custom">
          </TabsTrigger>Name="space-y-3">
            <TabsTri className="flex items-center space-x-2">
              <div clatch
          )}        id="rule-enabled"
                    checked={formData.enabled}
          <Alert>   onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
            <AlertDescription>
            </AlertDescription>r="rule-enabled">Enable this rule</Label>
                </div>
            {predefinedRules.map((rule)
        </TabsContent>lassName="flex items-center space-x-2">
        <TabsContent value="custom" c
            <Card className="p-12 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 f
                </div>CheckedChange={(checked) => setFormData(prev => ({ ...prev, autoUpdate: checked }))}
                  <h3 className="text-l
                    Create mlFor="auto-update">Auto-update album contents</Label>
                </div>
                  <Plus class
                </Button
            </Card className="flex gap-2">
            <div classN 
            </div>onClick={editingRule ? handleUpdateRule : handleCreateRule}
        </TabsContent>bled={!formData.name.trim()}
        <TabsContent value="suggested
            <Card className="p-12 text-e Rule' : 'Create Rule'}
                <div className="mx-aut
                </div>ngRule && (
                  <h3 className="text-lg font-medium">esetForm}>
                    We'll analyze your photo collection and sugg
                </div>tton>
                  <Lightbulb classN
                </Button>
            </Card>ontent>
            <div className="spac
                <Lightbulb className=
                  These rules are }
              </Alert>me="space-y-3">
              <div classNamp(rule => {
              </div>IconComponent = getIconComponent(rule.icon || 'Image')
          )}  return (
      </Tabs>   <Card key={rule.id}>
  )               <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: rule.color || colorOptions[0] }}
                        >
                          <IconComponent size={20} className="text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium">{rule.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {ruleTypeOptions.find(opt => opt.value === rule.type)?.label}
                          </p>
                        </div>
                        {rule.autoUpdate && (
                          <Badge variant="secondary" className="text-xs">
                            Auto-update
                          </Badge>
                        )}
                        {!rule.enabled && (
                          <Badge variant="outline" className="text-xs">
                            Disabled
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRule(rule)}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDeleteRule(rule.id)}
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {customRules.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    No custom rules created yet. Create your first rule above.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="suggested" className="space-y-4">
          {suggestedRules.map(rule => {
            const IconComponent = getIconComponent(rule.icon || 'Image')
            return (
              <Card key={rule.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: rule.color || colorOptions[0] }}
                      >
                        <IconComponent size={20} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium flex items-center gap-2">
                          {rule.name}
                          <Sparkles size={16} className="text-primary" />
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {ruleTypeOptions.find(opt => opt.value === rule.type)?.label}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAcceptSuggestion(rule.id)}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <Check size={16} />
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRejectSuggestion(rule.id)}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <X size={16} />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {suggestedRules.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Lightbulb size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  No suggestions available. Generate suggestions based on your photo collection.
                </p>
                <Button onClick={onGenerateSuggestions}>
                  Generate Suggestions
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="predefined" className="space-y-4">
          {predefinedRules.map(rule => {
            const IconComponent = getIconComponent(rule.icon || 'Image')
            return (
              <Card key={rule.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: rule.color || colorOptions[0] }}
                    >







































































































































































                      <IconComponent size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium">{rule.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {ruleTypeOptions.find(opt => opt.value === rule.type)?.label}
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-auto">
                      Built-in
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>
      </Tabs>
    </div>
  )
}