
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Mail, Plus, Edit, Trash2, Eye, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

const REQUIRED_VARIABLES = ['{{verification_code}}', '{{recipient_name}}', '{{course_name}}'];
const RECOMMENDED_VARIABLES = ['{{location_name}}', '{{certificate_url}}', '{{verification_portal_url}}'];

const DEFAULT_TEMPLATE_BODY = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #1e40af; margin: 0;">Certificate Issued</h1>
    <p style="color: #6b7280; margin: 5px 0;">Assured Response Training & Consulting</p>
  </div>
  
  <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #1f2937; margin-top: 0;">Hello {{recipient_name}},</h2>
    <p style="color: #374151; line-height: 1.6;">
      Congratulations! Your certificate for <strong>{{course_name}}</strong> has been successfully issued by {{location_name}}.
    </p>
  </div>
  
  <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
    <h3 style="color: #1e40af; margin: 0 0 10px 0;">Certificate Verification</h3>
    <p style="margin: 5px 0; color: #1e40af;"><strong>Verification Code:</strong> {{verification_code}}</p>
    <p style="margin: 5px 0; color: #374151;">
      To verify this certificate's authenticity, visit: 
      <a href="{{verification_portal_url}}" style="color: #2563eb;">{{verification_portal_url}}</a>
    </p>
  </div>
  
  {{#if certificate_url}}
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{certificate_url}}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      View Your Certificate
    </a>
  </div>
  {{/if}}
  
  <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; color: #6b7280; font-size: 14px;">
    <p><strong>Assured Response Training & Consulting</strong><br/>
    WSIB Approved Training Provider<br/>
    {{location_name}}</p>
    <p style="margin-top: 15px;">
      <em>This certificate is valid and verifiable through our secure verification system.</em>
    </p>
  </div>
</div>
`;

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

  const validateTemplate = (template: EmailTemplate) => {
    const missingRequired = REQUIRED_VARIABLES.filter(variable => 
      !template.body_template.includes(variable) && !template.subject_template.includes(variable)
    );
    const missingRecommended = RECOMMENDED_VARIABLES.filter(variable => 
      !template.body_template.includes(variable) && !template.subject_template.includes(variable)
    );
    
    return {
      isValid: missingRequired.length === 0,
      missingRequired,
      missingRecommended
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Template Manager</h2>
          <p className="text-muted-foreground">Customize certificate notification email templates</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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

      {/* Template Guidelines */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> All email templates must include the verification code ({{verification_code}}) 
          and verification portal URL ({{verification_portal_url}}) for certificate authenticity verification.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {templates?.map((template) => {
          const validation = validateTemplate(template);
          return (
            <Card key={template.id} className={!validation.isValid ? 'border-red-200' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    {template.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {template.is_default && (
                      <Badge variant="default">Default</Badge>
                    )}
                    {!validation.isValid && (
                      <Badge variant="destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Missing Required
                      </Badge>
                    )}
                    {validation.isValid && (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Valid
                      </Badge>
                    )}
                  </div>
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
                  
                  {!validation.isValid && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Missing required variables: {validation.missingRequired.join(', ')}
                      </AlertDescription>
                    </Alert>
                  )}
                  
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
          );
        })}
      </div>

      {/* Edit Template Dialog */}
      {selectedTemplate && !showPreviewDialog && (
        <Dialog open={true} onOpenChange={() => setSelectedTemplate(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
    subject_template: template?.subject_template || 'Your {{course_name}} Certificate - Verification Code: {{verification_code}}',
    body_template: template?.body_template || DEFAULT_TEMPLATE_BODY,
    location_id: template?.location_id || '',
    is_default: template?.is_default || false
  });

  const validation = React.useMemo(() => {
    const missingRequired = REQUIRED_VARIABLES.filter(variable => 
      !formData.body_template.includes(variable) && !formData.subject_template.includes(variable)
    );
    const missingRecommended = RECOMMENDED_VARIABLES.filter(variable => 
      !formData.body_template.includes(variable) && !formData.subject_template.includes(variable)
    );
    
    return {
      isValid: missingRequired.length === 0,
      missingRequired,
      missingRecommended
    };
  }, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validation.isValid) {
      toast.error('Please include all required variables before saving');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>

      <div>
        <Label htmlFor="subject">Subject Template</Label>
        <Input
          id="subject"
          value={formData.subject_template}
          onChange={(e) => setFormData({ ...formData, subject_template: e.target.value })}
          placeholder="Your {{course_name}} Certificate - Verification Code: {{verification_code}}"
          required
        />
      </div>

      <div>
        <Label htmlFor="body">Body Template</Label>
        <Textarea
          id="body"
          value={formData.body_template}
          onChange={(e) => setFormData({ ...formData, body_template: e.target.value })}
          placeholder="Use {{variables}} for dynamic content"
          className="min-h-64 font-mono text-sm"
          required
        />
      </div>

      {/* Validation Display */}
      <div className="space-y-2">
        <Label>Template Validation</Label>
        <div className="space-y-2">
          {!validation.isValid && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Missing required variables: {validation.missingRequired.join(', ')}
              </AlertDescription>
            </Alert>
          )}
          {validation.missingRecommended.length > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Missing recommended variables: {validation.missingRecommended.join(', ')}
              </AlertDescription>
            </Alert>
          )}
          {validation.isValid && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Template validation passed - all required variables included
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Variable Reference */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <Label className="text-sm font-medium mb-2 block">Available Variables</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Required:</strong>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>{{verification_code}} - Certificate verification code</li>
              <li>{{recipient_name}} - Certificate recipient name</li>
              <li>{{course_name}} - Course name</li>
            </ul>
          </div>
          <div>
            <strong>Recommended:</strong>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>{{location_name}} - Issuing location name</li>
              <li>{{certificate_url}} - Direct certificate link</li>
              <li>{{verification_portal_url}} - Verification portal URL</li>
            </ul>
          </div>
        </div>
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
        <Button 
          type="submit" 
          disabled={isLoading || !validation.isValid}
        >
          {isLoading ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
        </Button>
      </div>
    </form>
  );
};
