import React from 'react'
import { SmartAlbumRule } from '@/services/smartAlbums'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Plus,
  Trash,
  Edit,
  Lightbulb,
  Check,
  X,
  Settings,
  Sparkles,
  Info
} from '@phosphor-icons/react'
import { toast } from 'sonner'

interface SmartAlbumRulesManagerProps {
  predefinedRules: SmartAlbumRule[]
  customRules: SmartAlbumRule[]
  suggestedRules: SmartAlbumRule[]
  onCreateRule: (rule: Omit<SmartAlbumRule, 'id'>) => void
  onUpdateRule: (ruleId: string, updates: Partial<SmartAlbumRule>) => void
  onDeleteRule: (ruleId: string) => void
  onAcceptSuggestion: (ruleId: string) => void
  onRejectSuggestion: (ruleId: string) => void
  onGenerateSuggestions: () => void
}

interface RuleFormData {
  name: string
  description: string
  type: SmartAlbumRule['type']
  enabled: boolean
  autoUpdate: boolean
  color: string
  icon: string
}

const ruleTypeOptions = [
  { value: 'ai-content', label: 'AI Content Analysis', description: 'Analyze photo content using AI' },
  { value: 'metadata', label: 'Metadata Based', description: 'Use file size, dimensions, etc.' },
  { value: 'pattern', label: 'Name/Path Pattern', description: 'Match filename or folder patterns' },
  { value: 'temporal', label: 'Time Based', description: 'Group by date ranges' },
  { value: 'location', label: 'Location Based', description: 'Group by location data' }
]

const colorOptions = [
  '#f59e0b', '#10b981', '#f97316', '#6366f1', '#ec4899',
  '#8b5cf6', '#06b6d4', '#64748b', '#ef4444', '#22c55e'
]

const iconOptions = [
  'User', 'Tree', 'PartyPopper', 'Buildings', 'Clock',
  'Star', 'Image', 'Monitor', 'Calendar', 'Folder'
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
  const [activeTab, setActiveTab] = React.useState('predefined')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [editingRule, setEditingRule] = React.useState<SmartAlbumRule | null>(null)
  const [formData, setFormData] = React.useState<RuleFormData>({
    name: '',
    description: '',
    type: 'ai-content',
    enabled: true,
    autoUpdate: true,
    color: '#6366f1',
    icon: 'Image'
  })

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'ai-content',
      enabled: true,
      autoUpdate: true,
      color: '#6366f1',
      icon: 'Image'
    })
  }

  const handleCreateRule = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a rule name')
      return
    }

    const newRule: Omit<SmartAlbumRule, 'id'> = {
      ...formData,
      conditions: [] // Start with empty conditions, user can add them later
    }

    onCreateRule(newRule)
    setIsCreateDialogOpen(false)
    resetForm()
  }

  const handleUpdateRule = (rule: SmartAlbumRule, updates: Partial<SmartAlbumRule>) => {
    onUpdateRule(rule.id, updates)
  }

  const handleEditRule = (rule: SmartAlbumRule) => {
    setEditingRule(rule)
    setFormData({
      name: rule.name,
      description: rule.description,
      type: rule.type,
      enabled: rule.enabled,
      autoUpdate: rule.autoUpdate,
      color: rule.color,
      icon: rule.icon
    })
  }

  const handleSaveEdit = () => {
    if (!editingRule) return
    
    if (!formData.name.trim()) {
      toast.error('Please enter a rule name')
      return
    }

    handleUpdateRule(editingRule, formData)
    setEditingRule(null)
    resetForm()
  }

  const handleCancelEdit = () => {
    setEditingRule(null)
    resetForm()
  }

  const renderRuleCard = (rule: SmartAlbumRule, isCustom = false, isSuggested = false) => {
    const isEditing = editingRule?.id === rule.id

    return (
      <Card key={rule.id} className={`group ${!rule.enabled ? 'opacity-60' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div 
                className="p-2 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: rule.color + '20', color: rule.color }}
              >
                <div className="w-4 h-4" /> {/* Icon placeholder */}
              </div>
              
              <div className="min-w-0 flex-1">
                {isEditing ? (
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="font-medium"
                    placeholder="Rule name"
                  />
                ) : (
                  <div>
                    <CardTitle className="text-base truncate">{rule.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {rule.type.replace('-', ' ')}
                      </Badge>
                      {!rule.enabled && (
                        <Badge variant="secondary" className="text-xs">
                          Disabled
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {isSuggested ? (
                <div className="flex items-center gap-1">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => onAcceptSuggestion(rule.id)}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => onRejectSuggestion(rule.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  {isCustom && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleEditRule(rule)}
                      disabled={isEditing}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {!isEditing && (
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(checked) => handleUpdateRule(rule, { enabled: checked })}
                    />
                  )}
                  
                  {isCustom && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => onDeleteRule(rule.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this rule does"
                    rows={2}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as SmartAlbumRule['type'] }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ruleTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="color">Color</Label>
                    <Select value={formData.color} onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {colorOptions.map((color) => (
                          <SelectItem key={color} value={color}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: color }} 
                              />
                              {color}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="enabled"
                        checked={formData.enabled}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
                      />
                      <Label htmlFor="enabled">Enabled</Label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        id="autoUpdate"
                        checked={formData.autoUpdate}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoUpdate: checked }))}
                      />
                      <Label htmlFor="autoUpdate">Auto-update</Label>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveEdit}>
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <CardDescription className="text-sm">
                  {rule.description}
                </CardDescription>
                
                {rule.conditions.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {rule.conditions.length} condition{rule.conditions.length !== 1 ? 's' : ''}
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Auto-update: {rule.autoUpdate ? 'On' : 'Off'}</span>
                  {isSuggested && (
                    <Badge variant="outline" className="text-xs">
                      <Lightbulb className="h-3 w-3 mr-1" />
                      Suggested
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Smart Album Rules
          </h2>
          <p className="text-muted-foreground">
            Manage how smart albums are created and organized
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onGenerateSuggestions}>
            <Lightbulb className="h-4 w-4 mr-2" />
            Get Suggestions
          </Button>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Rule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Smart Album Rule</DialogTitle>
                <DialogDescription>
                  Define a new rule for automatically organizing photos into smart albums.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., My Vacation Photos"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this rule does"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="type">Rule Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as SmartAlbumRule['type'] }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ruleTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-muted-foreground">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="color">Color</Label>
                    <Select value={formData.color} onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {colorOptions.map((color) => (
                          <SelectItem key={color} value={color}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: color }} 
                              />
                              {color}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="icon">Icon</Label>
                    <Select value={formData.icon} onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {iconOptions.map((icon) => (
                          <SelectItem key={icon} value={icon}>
                            {icon}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="enabled"
                        checked={formData.enabled}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
                      />
                      <Label htmlFor="enabled">Enabled</Label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        id="autoUpdate"
                        checked={formData.autoUpdate}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoUpdate: checked }))}
                      />
                      <Label htmlFor="autoUpdate">Auto-update</Label>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateRule}>
                    Create Rule
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="predefined">
            Predefined ({predefinedRules.length})
          </TabsTrigger>
          <TabsTrigger value="custom">
            Custom ({customRules.length})
          </TabsTrigger>
          {suggestedRules.length > 0 && (
            <TabsTrigger value="suggested" className="relative">
              Suggested ({suggestedRules.length})
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="predefined" className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              These are built-in smart album rules. You can enable or disable them, but you cannot edit or delete them.
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {predefinedRules.map((rule) => renderRuleCard(rule, false, false))}
          </div>
        </TabsContent>
        
        <TabsContent value="custom" className="space-y-4">
          {customRules.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">No Custom Rules Yet</h3>
                  <p className="text-muted-foreground">
                    Create custom smart album rules to organize photos based on your specific needs.
                  </p>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Rule
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {customRules.map((rule) => renderRuleCard(rule, true, false))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="suggested" className="space-y-4">
          {suggestedRules.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Lightbulb className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">No Suggestions Available</h3>
                  <p className="text-muted-foreground">
                    We'll analyze your photo collection and suggest smart album rules based on patterns we find.
                  </p>
                </div>
                <Button onClick={onGenerateSuggestions}>
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Generate Suggestions
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  These rules are suggested based on patterns in your photo collection. Accept the ones you like or dismiss them.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {suggestedRules.map((rule) => renderRuleCard(rule, false, true))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}