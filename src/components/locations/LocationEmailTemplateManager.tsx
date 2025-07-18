import React, { useState, useEffect } from 'react';
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

export function LocationEmailTemplateManager({ locationId, locationName }: LocationEmailTemplateManagerProps) {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<LocationEmailTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [subjectTemplate, setSubjectTemplate] = useState('Your {{course_name}} Certificate from {{location_name}}');
  const [bodyTemplate, setBodyTemplate] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

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
        
        // If this template is set as default, update other templates
        if (template.is_default) {
          await supabase
            .from('location_email_templates')
            .update({ is_default: false })
            .eq('location_id', locationId)
            .neq('id', currentTemplate.id);
        }
        
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
        
        // If this template is set as default, update other templates
        if (template.is_default) {
          await supabase
            .from('location_email_templates')
            .update({ is_default: false })
            .eq('location_id', locationId)
            .neq('id', data.id);
        }
        
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates', locationId] });
      toast.success(currentTemplate?.id ? "Template updated" : "Template created");
      // Close dialogs and reset form after successful save
      setIsAddDialogOpen(false);
      setIsEditDialogOpen(false);
      setTimeout(() => resetForm(), 100); // Delay reset to prevent race conditions
    },
    onError: (error) => {
      console.error('Error saving template:', error);
      toast.error(`Failed to ${currentTemplate?.id ? "update" : "create"} template. ${error instanceof Error ? error.message : ''}`);
      // Don't reset the form on error so the user can try again
      setIsSubmitting(false);
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
      queryClient.invalidateQueries({ queryKey: ['email-templates', locationId] });
      toast.success("Email template deleted");
      setDeleteConfirmationOpen(false);
      setTemplateToDelete(null);
    },
    onError: (error) => {
      console.error('Error deleting template:', error);
      toast.error(`Failed to delete template. ${error instanceof Error ? error.message : ''}`);
      setDeleteConfirmationOpen(false);
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
      toast.success("Default template updated");
    },
    onError: (error) => {
      console.error('Error setting default template:', error);
      toast.error(`Failed to set default template. ${error instanceof Error ? error.message : ''}`);
    }
  });

  const resetForm = () => {
    console.log('Reset form called');
    setCurrentTemplate(null);
    setTemplateName('');
    setSubjectTemplate('Your {{course_name}} Certificate from {{location_name}}');
    setBodyTemplate('');
    setIsDefault(false);
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setIsSubmitting(false);
  };

  const handleAddTemplate = () => {
    resetForm();
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

  const handleEditTemplate = (e: React.MouseEvent, template: LocationEmailTemplate) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Edit template clicked:', template.name);
    setCurrentTemplate(template);
    setTemplateName(template.name);
    setSubjectTemplate(template.subject_template);
    setBodyTemplate(template.body_template);
    setIsDefault(template.is_default);
    setIsEditDialogOpen(true);
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

  const handleDeleteTemplate = (templateId: string) => {
    setTemplateToDelete(templateId);
    setDeleteConfirmationOpen(true);
  };

  const confirmDeleteTemplate = () => {
    if (templateToDelete) {
      deleteMutation.mutate(templateToDelete);
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
                        disabled={setDefaultMutation.isPending}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={(e) => handleEditTemplate(e, template)}
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
                      disabled={deleteMutation.isPending || template.is_default}
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
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        if (!isSubmitting && !open) resetForm();
        else if (!isSubmitting) setIsAddDialogOpen(open);
      }}>
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
              onClick={resetForm}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveTemplate}
              disabled={isSubmitting || !templateName || !subjectTemplate || !bodyTemplate}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Template Dialog - same as add dialog but with different title */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        if (!isSubmitting && !open) resetForm();
        else if (!isSubmitting) setIsEditDialogOpen(open);
      }}>
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
              onClick={resetForm}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveTemplate}
              disabled={isSubmitting || !templateName || !subjectTemplate || !bodyTemplate}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmationOpen} onOpenChange={setDeleteConfirmationOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end pt-4">
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirmationOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDeleteTemplate}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}