import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, Star, StarOff, Trash, Edit } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LocationEmailTemplate } from '@/types/certificates';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';

interface LocationEmailTemplateManagerProps {
  locationId: string;
  locationName?: string;
}

export function LocationEmailTemplateManager({ locationId, locationName }: LocationEmailTemplateManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<LocationEmailTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [subjectTemplate, setSubjectTemplate] = useState('Your {{course_name}} Certificate from {{location_name}}');
  const [bodyTemplate, setBodyTemplate] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Get templates for this location
  const { data: templates, isLoading } = useQuery({
    queryKey: ['email-templates', locationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('location_email_templates')
        .select('*')
        .eq('location_id', locationId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data as LocationEmailTemplate[];
    }
  });

  // Template mutation
  const templateMutation = useMutation({
    mutationFn: async (template: Partial<LocationEmailTemplate>) => {
      if (currentTemplate?.id) {
        // Update existing template
        const { data, error } = await supabase
          .from('location_email_templates')
          .update({
            name: template.name,
            subject_template: template.subject_template,
            body_template: template.body_template,
            is_default: template.is_default
          })
          .eq('id', currentTemplate.id)
          .select()
          .single();
          
        if (error) throw error;
        return data;
      } else {
        // Create new template
        const { data, error } = await supabase
          .from('location_email_templates')
          .insert({
            location_id: locationId,
            name: template.name,
            subject_template: template.subject_template,
            body_template: template.body_template,
            is_default: template.is_default
          })
          .select()
          .single();
          
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast({
        title: currentTemplate?.id ? "Template updated" : "Template created",
        description: `Email template ${currentTemplate?.id ? "updated" : "added"} successfully.`
      });
      resetForm();
    },
    onError: (error) => {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: `Failed to ${currentTemplate?.id ? "update" : "create"} template.`,
        variant: "destructive"
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from('location_email_templates')
        .delete()
        .eq('id', templateId);
        
      if (error) throw error;
      return templateId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast({
        title: "Template deleted",
        description: "Email template has been deleted."
      });
    },
    onError: (error) => {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template.",
        variant: "destructive"
      });
    }
  });

  // Set default mutation
  const setDefaultMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from('location_email_templates')
        .update({ is_default: true })
        .eq('id', templateId);
        
      if (error) throw error;
      return templateId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast({
        title: "Default template set",
        description: "This template will be used as the default for this location."
      });
    },
    onError: (error) => {
      console.error('Error setting default template:', error);
      toast({
        title: "Error",
        description: "Failed to set default template.",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setCurrentTemplate(null);
    setTemplateName('');
    setSubjectTemplate('Your {{course_name}} Certificate from {{location_name}}');
    setBodyTemplate('');
    setIsDefault(false);
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
  };

  const handleAddTemplate = () => {
    setCurrentTemplate(null);
    setTemplateName('New Template');
    setSubjectTemplate('Your {{course_name}} Certificate from {{location_name}}');
    setBodyTemplate(`<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Certificate of Completion</h2>
  <p>Dear {{recipient_name}},</p>
  <p>Congratulations on successfully completing your {{course_name}} with {{location_name}}! Your official certificate is attached to this email for your records.</p>
  <p>This certification is valid until {{expiry_date}}. We recommend saving a digital copy and printing one for your workplace requirements.</p>
  <p>Need additional training for yourself or your team? We offer regular courses in:</p>
  <ul>
    <li>Standard First Aid & CPR</li>
    <li>Emergency First Aid</li>
    <li>CPR/AED (Levels A, C, and BLS)</li>
    <li>Specialized workplace training</li>
  </ul>
  <p>Contact us for more information or to schedule training.</p>
  <p>Regards,</p>
  <p>{{location_name}}<br>
  {{#if location_phone}}Phone: {{location_phone}}<br>{{/if}}
  {{#if location_email}}Email: {{location_email}}<br>{{/if}}
  {{#if location_website}}Website: {{location_website}}{{/if}}</p>
  <hr>
  <p style="font-size: 12px; color: #666;">This certificate is issued through {{location_name}} and is issued under Assured Response, WSIB authorized issuer.</p>
</div>`);
    setIsDefault(false);
    setIsAddDialogOpen(true);
  };

  const handleEditTemplate = (template: LocationEmailTemplate) => {
    setCurrentTemplate(template);
    setTemplateName(template.name);
    setSubjectTemplate(template.subject_template);
    setBodyTemplate(template.body_template);
    setIsDefault(template.is_default);
    setIsEditDialogOpen(true);
  };

  const handleSaveTemplate = () => {
    if (!templateName || !subjectTemplate || !bodyTemplate) {
      toast({
        title: "Validation Error",
        description: "All fields are required",
        variant: "destructive"
      });
      return;
    }

    templateMutation.mutate({
      name: templateName,
      subject_template: subjectTemplate,
      body_template: bodyTemplate,
      is_default: isDefault
    });
  };

  const handleDeleteTemplate = (templateId: string) => {
    // Ask for confirmation
    if (confirm("Are you sure you want to delete this template? This action cannot be undone.")) {
      deleteMutation.mutate(templateId);
    }
  };

  const handleSetDefaultTemplate = (templateId: string) => {
    setDefaultMutation.mutate(templateId);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Email Templates</h3>
        <Button onClick={handleAddTemplate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Template
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading templates...</span>
        </div>
      ) : templates && templates.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {templates.map(template => (
            <Card key={template.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    {template.name}
                    {template.is_default && (
                      <Badge variant="secondary" className="ml-2">Default</Badge>
                    )}
                  </CardTitle>
                  <div className="flex gap-2">
                    {!template.is_default && (
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => handleSetDefaultTemplate(template.id)}
                        title="Set as Default"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleEditTemplate(template)}
                      title="Edit Template"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-destructive hover:bg-destructive/10"
                      title="Delete Template"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Subject:</span> {template.subject_template}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Template ID:</span> {template.id}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Alert>
          <AlertDescription>
            No email templates found for this location. 
            Add a template to customize certificate emails.
          </AlertDescription>
        </Alert>
      )}

      {/* Add Template Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Email Template</DialogTitle>
            <DialogDescription>
              Create a new email template for {locationName || 'this location'}.
              You can use variables like {'{{recipient_name}}'}, {'{{course_name}}'}, etc.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="templateName" className="text-right">Name</Label>
              <Input
                id="templateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subjectTemplate" className="text-right">Subject</Label>
              <Input
                id="subjectTemplate"
                value={subjectTemplate}
                onChange={(e) => setSubjectTemplate(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="bodyTemplate" className="text-right pt-2">Body (HTML)</Label>
              <div className="col-span-3 space-y-4">
                <Textarea
                  id="bodyTemplate"
                  value={bodyTemplate}
                  onChange={(e) => setBodyTemplate(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
                <div className="flex items-center space-x-2">
                  <Switch
                    id="preview"
                    checked={showPreview}
                    onCheckedChange={setShowPreview}
                  />
                  <Label htmlFor="preview">Show Preview</Label>
                </div>
                
                {showPreview && (
                  <div className="border rounded p-4 bg-slate-50">
                    <div className="text-sm font-medium mb-1">Preview:</div>
                    <div className="text-xs overflow-auto" dangerouslySetInnerHTML={{ __html: bodyTemplate }} />
                  </div>
                )}
                
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Available Variables:</p>
                  <p><code>{'{{recipient_name}}'}</code> - Recipient's name</p>
                  <p><code>{'{{course_name}}'}</code> - Course name</p>
                  <p><code>{'{{location_name}}'}</code> - Location name</p>
                  <p><code>{'{{expiry_date}}'}</code> - Certificate expiry date</p>
                  <p><code>{'{{issue_date}}'}</code> - Certificate issue date</p>
                  <p><code>{'{{location_email}}'}</code> - Location email</p>
                  <p><code>{'{{location_phone}}'}</code> - Location phone</p>
                  <p><code>{'{{location_website}}'}</code> - Location website</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isDefault" className="text-right">Set as Default</Label>
              <div className="col-span-3">
                <Switch
                  id="isDefault"
                  checked={isDefault}
                  onCheckedChange={setIsDefault}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button 
              onClick={handleSaveTemplate}
              disabled={templateMutation.isPending || !templateName || !subjectTemplate || !bodyTemplate}
            >
              {templateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Template Dialog - same as add dialog but with different title */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Email Template</DialogTitle>
            <DialogDescription>
              Edit email template for {locationName || 'this location'}.
            </DialogDescription>
          </DialogHeader>
          
          {/* Same form fields as add dialog */}
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="templateName" className="text-right">Name</Label>
              <Input
                id="templateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subjectTemplate" className="text-right">Subject</Label>
              <Input
                id="subjectTemplate"
                value={subjectTemplate}
                onChange={(e) => setSubjectTemplate(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="bodyTemplate" className="text-right pt-2">Body (HTML)</Label>
              <div className="col-span-3 space-y-4">
                <Textarea
                  id="bodyTemplate"
                  value={bodyTemplate}
                  onChange={(e) => setBodyTemplate(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
                <div className="flex items-center space-x-2">
                  <Switch
                    id="preview"
                    checked={showPreview}
                    onCheckedChange={setShowPreview}
                  />
                  <Label htmlFor="preview">Show Preview</Label>
                </div>
                
                {showPreview && (
                  <div className="border rounded p-4 bg-slate-50">
                    <div className="text-sm font-medium mb-1">Preview:</div>
                    <div className="text-xs overflow-auto" dangerouslySetInnerHTML={{ __html: bodyTemplate }} />
                  </div>
                )}
                
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Available Variables:</p>
                  <p><code>{'{{recipient_name}}'}</code> - Recipient's name</p>
                  <p><code>{'{{course_name}}'}</code> - Course name</p>
                  <p><code>{'{{location_name}}'}</code> - Location name</p>
                  <p><code>{'{{expiry_date}}'}</code> - Certificate expiry date</p>
                  <p><code>{'{{issue_date}}'}</code> - Certificate issue date</p>
                  <p><code>{'{{location_email}}'}</code> - Location email</p>
                  <p><code>{'{{location_phone}}'}</code> - Location phone</p>
                  <p><code>{'{{location_website}}'}</code> - Location website</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isDefault" className="text-right">Set as Default</Label>
              <div className="col-span-3">
                <Switch
                  id="isDefault"
                  checked={isDefault}
                  onCheckedChange={setIsDefault}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button 
              onClick={handleSaveTemplate}
              disabled={templateMutation.isPending || !templateName || !subjectTemplate || !bodyTemplate}
            >
              {templateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
