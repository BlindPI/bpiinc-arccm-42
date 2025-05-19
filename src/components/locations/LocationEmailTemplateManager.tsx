import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Plus, Star, StarOff, Trash, Edit, Eye, EyeOff } from 'lucide-react';
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

// A standalone dialog for template editing/creation that doesn't depend on parent component state
export function TemplateEditorDialog({ 
  isOpen, 
  onClose, 
  template, 
  locationId, 
  locationName, 
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  template: LocationEmailTemplate | null; 
  locationId: string; 
  locationName?: string;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [subjectTemplate, setSubjectTemplate] = useState('');
  const [bodyTemplate, setBodyTemplate] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Set initial form values when template changes
  useEffect(() => {
    if (template) {
      setTemplateName(template.name);
      setSubjectTemplate(template.subject_template);
      setBodyTemplate(template.body_template);
      setIsDefault(template.is_default);
    } else {
      // Default values for new template
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
    }
  }, [template, isOpen]);
  
  // Template mutation
  const templateMutation = useMutation({
    mutationFn: async (data: Partial<LocationEmailTemplate>) => {
      if (template?.id) {
        // Update existing template
        const { data: updatedTemplate, error } = await supabase
          .from('location_email_templates')
          .update({
            name: data.name,
            subject_template: data.subject_template,
            body_template: data.body_template,
            is_default: data.is_default
          })
          .eq('id', template.id)
          .select()
          .single();
          
        if (error) throw error;
        
        // If this template is set as default, update other templates
        if (data.is_default) {
          await supabase
            .from('location_email_templates')
            .update({ is_default: false })
            .eq('location_id', locationId)
            .neq('id', template.id);
        }
        
        return updatedTemplate;
      } else {
        // Create new template
        const { data: newTemplate, error } = await supabase
          .from('location_email_templates')
          .insert({
            location_id: locationId,
            name: data.name,
            subject_template: data.subject_template,
            body_template: data.body_template,
            is_default: data.is_default
          })
          .select()
          .single();
          
        if (error) throw error;
        
        // If this template is set as default, update other templates
        if (data.is_default) {
          await supabase
            .from('location_email_templates')
            .update({ is_default: false })
            .eq('location_id', locationId)
            .neq('id', newTemplate.id);
        }
        
        return newTemplate;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates', locationId] });
      toast.success(template?.id ? "Template updated successfully" : "Template created successfully");
      if (onSuccess) onSuccess();
      handleClose();
    },
    onError: (error) => {
      console.error('Error saving template:', error);
      toast.error(`Failed to ${template?.id ? "update" : "create"} template: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsSubmitting(false);
    }
  });
  
  const handleClose = () => {
    if (!isSubmitting) {
      setIsSubmitting(false);
      onClose();
    }
  };
  
  const handleSaveTemplate = async () => {
    if (!templateName || !subjectTemplate || !bodyTemplate) {
      toast.error("All fields are required");
      return;
    }
    
    setIsSubmitting(true);
    
    templateMutation.mutate({
      name: templateName,
      subject_template: subjectTemplate,
      body_template: bodyTemplate,
      is_default: isDefault
    });
  };
  
  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open && !isSubmitting) {
          handleClose();
        }
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? 'Edit' : 'Add'} Email Template</DialogTitle>
          <DialogDescription>
            {template ? 'Edit' : 'Create a new'} email template for {locationName || 'this location'}.
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
              disabled={isSubmitting}
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="subjectTemplate" className="text-right">Subject</Label>
            <Input
              id="subjectTemplate"
              value={subjectTemplate}
              onChange={(e) => setSubjectTemplate(e.target.value)}
              className="col-span-3"
              disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
              <div className="flex items-center space-x-2">
                <Switch
                  id="preview"
                  checked={showPreview}
                  onCheckedChange={setShowPreview}
                  disabled={isSubmitting}
                />
                <Label htmlFor="preview">
                  {showPreview ? <Eye className="h-4 w-4 inline mr-1" /> : <EyeOff className="h-4 w-4 inline mr-1" />}
                  {showPreview ? "Hide Preview" : "Show Preview"}
                </Label>
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
                <p><code>{'{{verification_code}}'}</code> - Certificate verification code</p>
                <p><code>{'{{location_email}}'}</code> - Location email</p>
                <p><code>{'{{location_phone}}'}</code> - Location phone</p>
                <p><code>{'{{location_website}}'}</code> - Location website</p>
                <p><code>{'{{certificate_url}}'}</code> - Certificate download URL</p>
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
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveTemplate}
            disabled={isSubmitting || !templateName || !subjectTemplate || !bodyTemplate}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {template ? 'Update' : 'Save'} Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// A standalone dialog for template deletion confirmation
export function DeleteTemplateDialog({
  isOpen,
  onClose,
  templateId,
  templateName,
  locationId,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  templateId: string;
  templateName: string;
  locationId: string;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('location_email_templates')
        .delete()
        .eq('id', templateId);
        
      if (error) throw error;
      return templateId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates', locationId] });
      toast.success(`Template "${templateName}" deleted successfully`);
      if (onSuccess) onSuccess();
      handleClose();
    },
    onError: (error) => {
      console.error('Error deleting template:', error);
      toast.error(`Failed to delete template: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsDeleting(false);
    }
  });
  
  const handleClose = () => {
    if (!isDeleting) {
      setIsDeleting(false);
      onClose();
    }
  };
  
  const handleDelete = () => {
    setIsDeleting(true);
    deleteMutation.mutate();
  };
  
  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open && !isDeleting) {
          handleClose();
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Template</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the template "{templateName}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex space-x-2 justify-end pt-4">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function LocationEmailTemplateManager({ locationId, locationName }: LocationEmailTemplateManagerProps) {
  const dialogStateRef = useRef({ editorOpen: false, deleteOpen: false });
  const queryClient = useQueryClient();
  const [editorDialogOpen, setEditorDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<LocationEmailTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<{ id: string, name: string } | null>(null);
  
  // Set refs to maintain dialog state across re-renders
  useEffect(() => {
    dialogStateRef.current = {
      editorOpen: editorDialogOpen,
      deleteOpen: deleteDialogOpen
    };
  }, [editorDialogOpen, deleteDialogOpen]);

  // Get templates for this location
  const { data: templates, isLoading, refetch } = useQuery({
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

  // Set default mutation
  const setDefaultMutation = useMutation({
    mutationFn: async (templateId: string) => {
      // First, set all templates for this location to non-default
      await supabase
        .from('location_email_templates')
        .update({ is_default: false })
        .eq('location_id', locationId);
      
      // Then set the selected template as default
      const { error } = await supabase
        .from('location_email_templates')
        .update({ is_default: true })
        .eq('id', templateId);
        
      if (error) throw error;
      return templateId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates', locationId] });
      toast.success("Default template set successfully");
    },
    onError: (error) => {
      console.error('Error setting default template:', error);
      toast.error(`Failed to set default template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  const handleAddTemplate = () => {
    setCurrentTemplate(null);
    setEditorDialogOpen(true);
  };

  const handleEditTemplate = (template: LocationEmailTemplate) => {
    setCurrentTemplate(template);
    setEditorDialogOpen(true);
  };

  const handleDeleteTemplate = (templateId: string, templateName: string) => {
    setTemplateToDelete({ id: templateId, name: templateName });
    setDeleteDialogOpen(true);
  };

  const handleSetDefaultTemplate = (templateId: string) => {
    setDefaultMutation.mutate(templateId);
  };
  
  const handleTemplateActionSuccess = () => {
    refetch();
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
                        disabled={setDefaultMutation.isPending}
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
                      onClick={() => handleDeleteTemplate(template.id, template.name)}
                      className="text-destructive hover:bg-destructive/10"
                      title="Delete Template"
                      disabled={template.is_default}
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
      
      {/* Editor dialog as a separate component */}
      <TemplateEditorDialog
        isOpen={editorDialogOpen}
        onClose={() => setEditorDialogOpen(false)}
        template={currentTemplate}
        locationId={locationId}
        locationName={locationName}
        onSuccess={handleTemplateActionSuccess}
      />
      
      {/* Delete confirmation dialog as a separate component */}
      {templateToDelete && (
        <DeleteTemplateDialog
          isOpen={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          templateId={templateToDelete.id}
          templateName={templateToDelete.name}
          locationId={locationId}
          onSuccess={handleTemplateActionSuccess}
        />
      )}
    </div>
  );
}