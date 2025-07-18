import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Save, Trash2, Edit3, Search, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CourseTemplate {
  id?: string;
  name: string;
  code: string;
  description?: string;
  duration_hours: number;
  max_students: number;
  required_specialties?: string[];
  course_components?: any;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const CourseTemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<CourseTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CourseTemplate | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<CourseTemplate>({
    name: '',
    code: '',
    description: '',
    duration_hours: 8,
    max_students: 18,
    required_specialties: [],
    course_components: {},
    is_active: true
  });
  const [newSpecialty, setNewSpecialty] = useState('');
  const [componentJson, setComponentJson] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      // Use type casting to work around TypeScript issues
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
      course_components: {},
      is_active: true
    });
    setComponentJson('');
    setEditingTemplate(undefined);
    setShowForm(false);
  };

  const handleEdit = (template: CourseTemplate) => {
    setFormData({ ...template });
    setComponentJson(template.course_components ? JSON.stringify(template.course_components, null, 2) : '');
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleDelete = async (template: CourseTemplate) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) return;

    try {
      // Use type casting to work around TypeScript issues
      const { error } = await (supabase as any)
        .from('course_templates')
        .delete()
        .eq('id', template.id);

      if (error) throw error;
      toast.success('Course template deleted successfully');
      loadTemplates();
    } catch (error) {
      console.error('Error deleting course template:', error);
      toast.error('Failed to delete course template');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      // Validate required fields
      if (!formData.name.trim() || !formData.code.trim() || !formData.duration_hours) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Parse course components JSON if provided
      let parsedComponents = {};
      if (componentJson.trim()) {
        try {
          parsedComponents = JSON.parse(componentJson);
        } catch (error) {
          toast.error('Invalid JSON format in Course Components');
          return;
        }
      }

      const templateData = {
        ...formData,
        course_components: parsedComponents,
        code: formData.code.toUpperCase(),
      };

      if (editingTemplate?.id) {
        // Update existing template
        const { error } = await (supabase as any)
          .from('course_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast.success('Course template updated successfully');
      } else {
        // Create new template
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

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading course templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!showForm ? (
        <>
          {/* Header and Search */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">Course Templates</h3>
              <p className="text-sm text-muted-foreground">
                Simple CRUD interface for course template management
              </p>
            </div>
            <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Template
            </Button>
          </div>

          <div className="flex gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Templates List */}
          <div className="grid gap-4">
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map((template) => (
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
                          {template.required_specialties && template.required_specialties.length > 0 && (
                            <span>Specialties: {template.required_specialties.length}</span>
                          )}
                        </div>
                        {template.required_specialties && template.required_specialties.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {template.required_specialties.map((specialty, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(template)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(template)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
                    {searchQuery ? 'No templates match your search.' : 'Create your first course template to get started.'}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => setShowForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Template
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </>
      ) : (
        /* Form */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              {editingTemplate ? 'Edit Course Template' : 'Create New Course Template'}
            </CardTitle>
            <CardDescription>
              Simple form to create or edit course template entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Basic CPR Training"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g., CPR-BASIC"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description of the course template..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration_hours">Duration Hours *</Label>
                  <Input
                    id="duration_hours"
                    type="number"
                    step="0.25"
                    min="0.25"
                    max="40"
                    value={formData.duration_hours}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration_hours: parseFloat(e.target.value) }))}
                    required
                  />
                </div>

                <div className="space-y-2">
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
              </div>

              <div className="space-y-2">
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

              <div className="space-y-2">
                <Label htmlFor="course_components">Course Components (JSON)</Label>
                <Textarea
                  id="course_components"
                  value={componentJson}
                  onChange={(e) => setComponentJson(e.target.value)}
                  placeholder='Optional JSON data, e.g., {"modules": ["theory", "practical"], "assessment": true}'
                  rows={4}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Optional JSON configuration for course components
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: !!checked }))}
                />
                <Label htmlFor="is_active">Is Active</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={formLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {formLoading ? 'Saving...' : 'Save Template'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CourseTemplateManager;