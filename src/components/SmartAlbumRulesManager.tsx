import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { SmartAlbumRule } from '@/services/smartAlbums'
import {
  Check,
  X,
  Lightbulb,
  Sparkle,
  Star,
  Image,
  Calendar,
  MapPin,
  Tag,
  Plus,
  Trash
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
  { value: 'pattern', label: 'Pattern Matching' },
  { value: 'temporal', label: 'Time Based' },
  { value: 'location', label: 'Location Based' }
] as const

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
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
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
    setIsDialogOpen(false)
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
    setIsDialogOpen(true)
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
    setIsDialogOpen(false)
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
        </TabsList>

        <TabsContent value="custom" className="space-y-4">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="w-full"
                onClick={() => {
                  resetForm()
                  setIsDialogOpen(true)
                }}
              >
                <Plus className="mr-2" />
                Create New Rule
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingRule ? 'Edit Smart Album Rule' : 'Create Smart Album Rule'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rule-name">Rule Name</Label>
                  <Input
                    id="rule-name"
                    placeholder="Enter rule name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rule-description">Description</Label>
                  <Input
                    id="rule-description"
                    placeholder="Enter rule description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rule-type">Rule Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as SmartAlbumRule['type'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ruleTypeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rule-icon">Icon</Label>
                  <Select 
                    value={formData.icon}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map(option => {
                        const IconComponent = option.component
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <IconComponent size={16} />
                              {option.value}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label>Color</Label>
                  <div className="flex gap-2">
                    {colorOptions.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          formData.color === color ? 'border-foreground scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="rule-enabled"
                      checked={formData.enabled}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
                    />
                    <Label htmlFor="rule-enabled">Enable this rule</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto-update"
                      checked={formData.autoUpdate}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoUpdate: checked }))}
                    />
                    <Label htmlFor="auto-update">Auto-update album contents</Label>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={editingRule ? handleUpdateRule : handleCreateRule}
                  disabled={!formData.name.trim()}
                  className="flex-1"
                >
                  {editingRule ? 'Update Rule' : 'Create Rule'}
                </Button>
                {editingRule && (
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <div className="space-y-3">
            {customRules.map(rule => {
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
          {suggestedRules.length > 0 && (
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertDescription>
                These rules are generated based on your photo collection patterns.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
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
                            <Sparkle size={16} className="text-primary" />
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
          </div>
        </TabsContent>

        <TabsContent value="predefined" className="space-y-4">
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              These are built-in rules that cannot be modified or deleted.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
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

            {predefinedRules.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    No predefined rules available.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}