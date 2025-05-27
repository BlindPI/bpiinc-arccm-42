import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Mail, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmailTemplate {
  id: string;
  name: string;
  subject_template: string;
  body_template: string;
  location_id: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateEmailTemplateRequest {
  name: string;
  subject_template: string;
  body_template: string;
  location_id: string;
  is_default: boolean;
}

export const EmailTemplateManager: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('location_email_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as EmailTemplate[];
    }
  });

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .eq('status', 'ACTIVE');
      
      if (error) throw error;
      return data;
    }
  });

  const createTemplate = useMutation({
    mutationFn: async (template: CreateEmailTemplateRequest) => {
      const { data, error } = await supabase
        .from('location_email_templates')
        .insert(template)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Email template created successfully');
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      setShowCreateDialog(false);
    }
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EmailTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('location_email_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Email template updated successfully');
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      setSelectedTemplate(null);
    }
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('location_email_templates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Email template deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Template Manager</h2>
          <p className="text-muted-foreground">Customize notification email templates</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Email Template</DialogTitle>
            </DialogHeader>
            <EmailTemplateForm
              locations={locations || []}
              onSubmit={(data) => createTemplate.mutate(data)}
              isLoading={createTemplate.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {templates?.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  {template.name}
                </CardTitle>
                {template.is_default && (
                  <Badge variant="default">Default</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Subject</Label>
                  <p className="text-sm text-muted-foreground truncate">
                    {template.subject_template}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTemplate(template);
                      setShowPreviewDialog(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteTemplate.mutate(template.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Template Dialog */}
      {selectedTemplate && !showPreviewDialog && (
        <Dialog open={true} onOpenChange={() => setSelectedTemplate(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Email Template</DialogTitle>
            </DialogHeader>
            <EmailTemplateForm
              template={selectedTemplate}
              locations={locations || []}
              onSubmit={(data) => updateTemplate.mutate({ id: selectedTemplate.id, ...data })}
              isLoading={updateTemplate.isPending}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Preview Dialog */}
      {selectedTemplate && showPreviewDialog && (
        <Dialog open={true} onOpenChange={() => setShowPreviewDialog(false)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Email Template Preview</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Subject</Label>
                <div className="p-3 bg-muted rounded-md">
                  {selectedTemplate.subject_template}
                </div>
              </div>
              <div>
                <Label>Body</Label>
                <div className="p-3 bg-muted rounded-md max-h-96 overflow-y-auto">
                  <div dangerouslySetInnerHTML={{ __html: selectedTemplate.body_template }} />
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

interface EmailTemplateFormProps {
  template?: EmailTemplate;
  locations: Array<{ id: string; name: string }>;
  onSubmit: (data: CreateEmailTemplateRequest) => void;
  isLoading: boolean;
}

const EmailTemplateForm: React.FC<EmailTemplateFormProps> = ({
  template,
  locations,
  onSubmit,
  isLoading
}) => {
  const [formData, setFormData] = useState<CreateEmailTemplateRequest>({
    name: template?.name || '',
    subject_template: template?.subject_template || 'Your {{course_name}} Certificate',
    body_template: template?.body_template || `
      <h1>Hello {{recipient_name}},</h1>
      <p>Your certificate for {{course_name}} is now available.</p>
      {{#if certificate_url}}
      <p><a href="{{certificate_url}}" target="_blank">Click here to view your certificate</a></p>
      {{/if}}
      <p>Best regards,<br/>{{location_name}}</p>
    `,
    location_id: template?.location_id || '',
    is_default: template?.is_default || false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Template Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="location">Location</Label>
        <Select value={formData.location_id} onValueChange={(value) => setFormData({ ...formData, location_id: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent>
            {locations.map((location) => (
              <SelectItem key={location.id} value={location.id}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="subject">Subject Template</Label>
        <Input
          id="subject"
          value={formData.subject_template}
          onChange={(e) => setFormData({ ...formData, subject_template: e.target.value })}
          placeholder="Use {{variables}} for dynamic content"
          required
        />
      </div>

      <div>
        <Label htmlFor="body">Body Template</Label>
        <Textarea
          id="body"
          value={formData.body_template}
          onChange={(e) => setFormData({ ...formData, body_template: e.target.value })}
          placeholder="Use {{variables}} and {{#if condition}}...{{/if}} for dynamic content"
          className="min-h-48"
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_default"
          checked={formData.is_default}
          onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
        />
        <Label htmlFor="is_default">Set as default template</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
        </Button>
      </div>
    </form>
  );
};
