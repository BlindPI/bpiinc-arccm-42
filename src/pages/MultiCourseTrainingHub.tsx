import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BookOpen,
  Coffee,
  Clock,
  Users,
  Plus,
  X,
  Save,
  ArrowUp,
  ArrowDown,
  Utensils,
  ClipboardCheck,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CourseComponent {
  id: string;
  type: 'COURSE' | 'BREAK' | 'LUNCH' | 'ASSESSMENT' | 'ACTIVITY';
  name: string;
  duration_minutes: number;
  description?: string;
  order: number;
}

interface CourseTemplate {
  id?: string;
  name: string;
  code: string;
  description?: string;
  duration_hours: number;
  max_students: number;
  required_specialties?: string[];
  course_components?: CourseComponent[];
  is_active: boolean;
}

// Component Item without drag and drop
const ComponentItem: React.FC<{
  component: CourseComponent;
  index: number;
  totalComponents: number;
  onUpdate: (id: string, updates: Partial<CourseComponent>) => void;
  onDelete: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}> = ({ component, index, totalComponents, onUpdate, onDelete, onMoveUp, onMoveDown }) => {

  const getIcon = () => {
    switch (component.type) {
      case 'COURSE': return <BookOpen className="h-4 w-4 text-blue-600" />;
      case 'BREAK': return <Coffee className="h-4 w-4 text-orange-600" />;
      case 'LUNCH': return <Utensils className="h-4 w-4 text-green-600" />;
      case 'ASSESSMENT': return <ClipboardCheck className="h-4 w-4 text-purple-600" />;
      case 'ACTIVITY': return <Activity className="h-4 w-4 text-red-600" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getTypeColor = () => {
    switch (component.type) {
      case 'COURSE': return 'border-l-blue-500';
      case 'BREAK': return 'border-l-orange-500';
      case 'LUNCH': return 'border-l-green-500';
      case 'ASSESSMENT': return 'border-l-purple-500';
      case 'ACTIVITY': return 'border-l-red-500';
      default: return 'border-l-gray-500';
    }
  };

  return (
    <Card className={`border-l-4 ${getTypeColor()}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex flex-col gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onMoveUp(index)}
              disabled={index === 0}
              className="h-6 w-6 p-0"
            >
              <ArrowUp className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onMoveDown(index)}
              disabled={index === totalComponents - 1}
              className="h-6 w-6 p-0"
            >
              <ArrowDown className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getIcon()}
                <Input
                  value={component.name}
                  onChange={(e) => onUpdate(component.id, { name: e.target.value })}
                  className="font-medium text-sm h-8 min-w-[200px]"
                  placeholder="Component name"
                />
                <Badge variant="secondary" className="text-xs">
                  {component.type}
                </Badge>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(component.id)}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Duration (minutes)</Label>
                <Input
                  type="number"
                  value={component.duration_minutes}
                  onChange={(e) => onUpdate(component.id, { duration_minutes: parseInt(e.target.value) || 0 })}
                  className="h-8"
                  min="1"
                />
              </div>
              <div>
                <Label className="text-xs">Type</Label>
                <Select
                  value={component.type}
                  onValueChange={(value: any) => onUpdate(component.id, { type: value })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COURSE">Course</SelectItem>
                    <SelectItem value="BREAK">Break</SelectItem>
                    <SelectItem value="LUNCH">Lunch</SelectItem>
                    <SelectItem value="ASSESSMENT">Assessment</SelectItem>
                    <SelectItem value="ACTIVITY">Activity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs">Description</Label>
              <Textarea
                value={component.description || ''}
                onChange={(e) => onUpdate(component.id, { description: e.target.value })}
                className="h-16 text-sm"
                placeholder="Optional description"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const MultiCourseTrainingHub: React.FC = () => {
  const [templates, setTemplates] = useState<CourseTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CourseTemplate | undefined>();
  
  const [formData, setFormData] = useState<CourseTemplate>({
    name: '',
    code: '',
    description: '',
    duration_hours: 8,
    max_students: 18,
    required_specialties: [],
    course_components: [],
    is_active: true
  });
  
  const [components, setComponents] = useState<CourseComponent[]>([]);
  const [newSpecialty, setNewSpecialty] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('course_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading course templates:', error);
      toast.error('Failed to load course templates');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      duration_hours: 8,
      max_students: 18,
      required_specialties: [],
      course_components: [],
      is_active: true
    });
    setComponents([]);
    setEditingTemplate(undefined);
    setShowForm(false);
  };

  const handleEdit = (template: CourseTemplate) => {
    setFormData({ ...template });
    setComponents(template.course_components || []);
    setEditingTemplate(template);
    setShowForm(true);
  };

  const addComponent = (type: CourseComponent['type']) => {
    const defaultDurations = {
      'COURSE': 120,
      'BREAK': 15,
      'LUNCH': 60,
      'ASSESSMENT': 30,
      'ACTIVITY': 45
    };

    const defaultNames = {
      'COURSE': 'New Course',
      'BREAK': 'Break',
      'LUNCH': 'Lunch Break',
      'ASSESSMENT': 'Assessment',
      'ACTIVITY': 'Activity'
    };

    const newComponent: CourseComponent = {
      id: `comp_${Date.now()}`,
      type,
      name: defaultNames[type],
      duration_minutes: defaultDurations[type],
      description: '',
      order: components.length + 1
    };

    setComponents(prev => [...prev, newComponent]);
    calculateTotalDuration([...components, newComponent]);
  };

  const updateComponent = (id: string, updates: Partial<CourseComponent>) => {
    const updatedComponents = components.map(comp =>
      comp.id === id ? { ...comp, ...updates } : comp
    );
    setComponents(updatedComponents);
    calculateTotalDuration(updatedComponents);
  };

  const deleteComponent = (id: string) => {
    const updatedComponents = components.filter(comp => comp.id !== id);
    setComponents(updatedComponents);
    calculateTotalDuration(updatedComponents);
  };

  const moveComponentUp = (index: number) => {
    if (index === 0) return;
    const newComponents = [...components];
    [newComponents[index], newComponents[index - 1]] = [newComponents[index - 1], newComponents[index]];
    
    // Update order numbers
    newComponents.forEach((comp, idx) => {
      comp.order = idx + 1;
    });
    
    setComponents(newComponents);
  };

  const moveComponentDown = (index: number) => {
    if (index === components.length - 1) return;
    const newComponents = [...components];
    [newComponents[index], newComponents[index + 1]] = [newComponents[index + 1], newComponents[index]];
    
    // Update order numbers
    newComponents.forEach((comp, idx) => {
      comp.order = idx + 1;
    });
    
    setComponents(newComponents);
  };

  const calculateTotalDuration = (componentList: CourseComponent[]) => {
    const totalMinutes = componentList.reduce((sum, comp) => sum + comp.duration_minutes, 0);
    const totalHours = Math.round((totalMinutes / 60) * 100) / 100;
    setFormData(prev => ({ ...prev, duration_hours: totalHours }));
  };

  const addSpecialty = () => {
    if (!newSpecialty.trim()) return;
    setFormData(prev => ({
      ...prev,
      required_specialties: [...(prev.required_specialties || []), newSpecialty.trim()]
    }));
    setNewSpecialty('');
  };

  const removeSpecialty = (index: number) => {
    setFormData(prev => ({
      ...prev,
      required_specialties: prev.required_specialties?.filter((_, i) => i !== index) || []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      if (!formData.name.trim() || !formData.code.trim()) {
        toast.error('Please fill in name and code');
        return;
      }

      const templateData = {
        ...formData,
        course_components: components,
        code: formData.code.toUpperCase(),
      };

      if (editingTemplate?.id) {
        const { error } = await (supabase as any)
          .from('course_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast.success('Course template updated successfully');
      } else {
        const { error } = await (supabase as any)
          .from('course_templates')
          .insert([templateData]);

        if (error) throw error;
        toast.success('Course template created successfully');
      }

      resetForm();
      loadTemplates();
    } catch (error: any) {
      console.error('Error saving course template:', error);
      if (error.code === '23505') {
        toast.error('A course template with this code already exists');
      } else {
        toast.error('Failed to save course template');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getTotalMinutes = () => {
    return components.reduce((sum, comp) => sum + comp.duration_minutes, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading course templates...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Course Template Builder</h1>
          <p className="text-muted-foreground">
            Build multi-course training templates with visual timeline
          </p>
        </div>
        <Button onClick={loadTemplates} variant="outline">
          Refresh Data
        </Button>
      </div>

      {!showForm ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold">Existing Templates</h3>
              <p className="text-sm text-muted-foreground">
                Manage your course templates
              </p>
            </div>
            <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Template
            </Button>
          </div>

          <div className="grid gap-4">
            {templates.length > 0 ? (
              templates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-lg">{template.name}</h4>
                          <Badge variant="outline">{template.code}</Badge>
                          <Badge variant={template.is_active ? "default" : "secondary"}>
                            {template.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        {template.description && (
                          <p className="text-muted-foreground">{template.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Duration: {template.duration_hours} hours</span>
                          <span>Max Students: {template.max_students}</span>
                          <span>Components: {template.course_components?.length || 0}</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(template)}
                      >
                        Edit Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No course templates found</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first course template to get started.
                  </p>
                  <Button onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template Configuration */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Template Details</CardTitle>
                <CardDescription>Basic information for your course template</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Full Day CPR & First Aid"
                  />
                </div>

                <div>
                  <Label htmlFor="code">Template Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g., CPR-FA-FULL"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe this training template..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="max_students">Max Students</Label>
                  <Input
                    id="max_students"
                    type="number"
                    min="1"
                    max="50"
                    value={formData.max_students}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_students: parseInt(e.target.value) }))}
                  />
                </div>

                <div>
                  <Label>Required Specialties</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newSpecialty}
                      onChange={(e) => setNewSpecialty(e.target.value)}
                      placeholder="Add specialty..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addSpecialty}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.required_specialties?.map((specialty, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {specialty}
                        <button
                          type="button"
                          onClick={() => removeSpecialty(index)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: !!checked }))}
                  />
                  <Label htmlFor="is_active">Is Active</Label>
                </div>
              </CardContent>
            </Card>

            {/* Timeline Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Timeline Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Duration:</span>
                    <span className="font-medium">{formatDuration(getTotalMinutes())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Components:</span>
                    <span className="font-medium">{components.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Break Time:</span>
                    <span className="font-medium">
                      {formatDuration(components.filter(c => c.type === 'BREAK' || c.type === 'LUNCH').reduce((sum, c) => sum + c.duration_minutes, 0))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Component Builder */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Course Components Timeline
                  <Badge variant="outline">{components.length} components</Badge>
                </CardTitle>
                <CardDescription>
                  Build your course timeline by adding components in sequence
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Add Component Buttons */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-3">Add Components</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => addComponent('COURSE')}>
                      <BookOpen className="h-4 w-4 mr-1" />
                      Course
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addComponent('BREAK')}>
                      <Coffee className="h-4 w-4 mr-1" />
                      Break
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addComponent('LUNCH')}>
                      <Utensils className="h-4 w-4 mr-1" />
                      Lunch
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addComponent('ASSESSMENT')}>
                      <ClipboardCheck className="h-4 w-4 mr-1" />
                      Assessment
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addComponent('ACTIVITY')}>
                      <Activity className="h-4 w-4 mr-1" />
                      Activity
                    </Button>
                  </div>
                </div>

                {/* Components List */}
                <div className="space-y-3">
                  {components.map((component, index) => (
                    <ComponentItem
                      key={component.id}
                      component={component}
                      index={index}
                      totalComponents={components.length}
                      onUpdate={updateComponent}
                      onDelete={deleteComponent}
                      onMoveUp={moveComponentUp}
                      onMoveDown={moveComponentDown}
                    />
                  ))}
                </div>

                {components.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No components added yet</p>
                    <p className="text-sm">Add courses, breaks, or activities above to build your timeline</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-6 pt-6 border-t">
                  <Button onClick={handleSubmit} disabled={formLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    {formLoading ? 'Saving...' : 'Save Template'}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiCourseTrainingHub;