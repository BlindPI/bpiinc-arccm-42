import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Save, Trash2, Edit3 } from 'lucide-react';
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
}

interface CourseTemplateFormProps {
  template?: CourseTemplate;
  onSave?: (template: CourseTemplate) => void;
  onCancel?: () => void;
  showForm?: boolean;
}

export const CourseTemplateForm: React.FC<CourseTemplateFormProps> = ({
  template,
  onSave,
  onCancel,
  showForm = true
}) => {
  const [formData, setFormData] = useState<CourseTemplate>({
    name: '',
    code: '',
    description: '',
    duration_hours: 8,
    max_students: 18,
    required_specialties: [],
    course_components: {},
    is_active: true,
    ...template
  });

  const [newSpecialty, setNewSpecialty] = useState('');
  const [componentJson, setComponentJson] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (template) {
      setFormData({
        name: '',
        code: '',
        description: '',
        duration_hours: 8,
        max_students: 12,
        required_specialties: [],
        course_components: {},
        is_active: true,
        ...template
      });
      setComponentJson(template.course_components ? JSON.stringify(template.course_components, null, 2) : '');
    }
  }, [template]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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

      // Use raw SQL to avoid TypeScript issues with table types
      if (template?.id) {
        // Update existing template
        const { error } = await supabase.rpc('update_course_template', {
          template_id: template.id,
          template_data: templateData
        });

        if (error) throw error;
        toast.success('Course template updated successfully');
      } else {
        // Create new template
        const { error } = await supabase.rpc('create_course_template', {
          template_data: templateData
        });

        if (error) throw error;
        toast.success('Course template created successfully');
      }

      onSave?.(templateData);
    } catch (error: any) {
      console.error('Error saving course template:', error);
      if (error.code === '23505') {
        toast.error('A course template with this code already exists');
      } else {
        toast.error('Failed to save course template');
      }
    } finally {
      setLoading(false);
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

  if (!showForm) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit3 className="h-5 w-5" />
          {template?.id ? 'Edit Course Template' : 'Create New Course Template'}
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
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Template'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CourseTemplateForm;