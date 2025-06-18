import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Mail,
  Plus,
  Eye,
  Edit,
  Trash2,
  Copy,
  Search,
  Filter
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EmailCampaignService, CampaignTemplate } from '@/services/crm/emailCampaignService';
import { toast } from 'sonner';

interface TemplateFormData {
  template_name: string;
  template_type: string;
  subject_line: string;
  content: string;
  html_content?: string;
  variables: string[];
  created_by: string;
}

export function TemplateManagement() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [formData, setFormData] = useState<TemplateFormData>({
    template_name: '',
    template_type: 'general',
    subject_line: '',
    content: '',
    html_content: '',
    variables: [],
    created_by: 'system'
  });

  const queryClient = useQueryClient();

  // Fetch templates using the correct method
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['campaign-templates'],
    queryFn: () => EmailCampaignService.getCampaignTemplates()
  });

  // Create template mutation using the correct method
  const createTemplateMutation = useMutation({
    mutationFn: (templateData: Omit<CampaignTemplate, 'id' | 'created_at'>) => 
      EmailCampaignService.createCampaignTemplate(templateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-templates'] });
      setShowCreateDialog(false);
      resetForm();
      toast.success('Template created successfully');
    },
    onError: (error) => {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    }
  });

  // Update template mutation using the new service method
  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TemplateFormData> }) =>
      EmailCampaignService.updateCampaignTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-templates'] });
      setShowEditDialog(false);
      setSelectedTemplate(null);
      resetForm();
      toast.success('Template updated successfully');
    },
    onError: (error) => {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
    }
  });

  // Delete template mutation using the new service method
  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => EmailCampaignService.deleteCampaignTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-templates'] });
      toast.success('Template deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  });

  const resetForm = () => {
    setFormData({
      template_name: '',
      template_type: 'general',
      subject_line: '',
      content: '',
      html_content: '',
      variables: [],
      created_by: 'system'
    });
  };

  const handleCreateTemplate = () => {
    console.log('🐛 TEMPLATE-CREATION-DEBUG: Creating template with data:', formData);
    
    const templateData: Omit<CampaignTemplate, 'id' | 'created_at'> = {
      template_name: formData.template_name,
      template_type: formData.template_type,
      subject_line: formData.subject_line,
      content: formData.content,
      html_content: formData.html_content,
      variables: formData.variables,
      created_by: formData.created_by
    };
    
    createTemplateMutation.mutate(templateData);
  };

  const handleEditTemplate = (template: CampaignTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      template_name: template.template_name,
      template_type: template.template_type,
      subject_line: template.subject_line,
      content: template.content,
      html_content: template.html_content || '',
      variables: template.variables || [],
      created_by: template.created_by
    });
    setShowEditDialog(true);
  };

  const handleUpdateTemplate = () => {
    if (!selectedTemplate) return;
    console.log('🐛 TEMPLATE-CREATION-DEBUG: Updating template:', selectedTemplate.id, 'with data:', formData);
    updateTemplateMutation.mutate({ id: selectedTemplate.id, data: formData });
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      console.log('🐛 TEMPLATE-CREATION-DEBUG: Deleting template:', id);
      deleteTemplateMutation.mutate(id);
    }
  };

  const handlePreviewTemplate = (template: CampaignTemplate) => {
    setSelectedTemplate(template);
    setShowPreviewDialog(true);
  };

  const handleDuplicateTemplate = (template: CampaignTemplate) => {
    setFormData({
      template_name: `${template.template_name} (Copy)`,
      template_type: template.template_type,
      subject_line: template.subject_line,
      content: template.content,
      html_content: template.html_content || '',
      variables: template.variables || [],
      created_by: 'system'
    });
    setShowCreateDialog(true);
  };

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.template_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.subject_line.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || template.template_type === filterType;
    return matchesSearch && matchesType;
  });

  const templateTypes = ['general', 'welcome', 'reminder', 'promotional', 'notification', 'follow-up'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Email Templates</h2>
          <p className="text-muted-foreground">
            Create and manage email templates for your campaigns
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              console.log('🐛 TEMPLATE-CREATION-DEBUG: Opening create template dialog');
              resetForm();
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
              <DialogDescription>
                Create a new email template for your campaigns
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template_name">Template Name</Label>
                  <Input
                    id="template_name"
                    value={formData.template_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, template_name: e.target.value }))}
                    placeholder="Enter template name"
                  />
                </div>
                <div>
                  <Label htmlFor="template_type">Template Type</Label>
                  <Select value={formData.template_type} onValueChange={(value) => setFormData(prev => ({ ...prev, template_type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {templateTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="subject_line">Subject Line</Label>
                <Input
                  id="subject_line"
                  value={formData.subject_line}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject_line: e.target.value }))}
                  placeholder="Enter email subject line"
                />
              </div>
              
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter email content"
                  rows={6}
                />
              </div>
              
              <div>
                <Label htmlFor="html_content">HTML Content (Optional)</Label>
                <Textarea
                  id="html_content"
                  value={formData.html_content}
                  onChange={(e) => setFormData(prev => ({ ...prev, html_content: e.target.value }))}
                  placeholder="Enter HTML email content"
                  rows={4}
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateTemplate}
                  disabled={createTemplateMutation.isPending || !formData.template_name || !formData.subject_line || !formData.content}
                >
                  {createTemplateMutation.isPending ? 'Creating...' : 'Create Template'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {templateTypes.map(type => (
              <SelectItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.length > 0 ? (
          filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{template.template_type}</Badge>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreviewTemplate(template)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicateTemplate(template)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-lg">{template.template_name}</CardTitle>
                <CardDescription>{template.subject_line}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{template.variables?.length || 0} variables</span>
                  <Badge variant="default">Active</Badge>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Templates Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterType !== 'all' 
                ? 'No templates match your search criteria.' 
                : 'Create your first email template to get started.'
              }
            </p>
            {(!searchTerm && filterType === 'all') && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Template
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Update your email template
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_template_name">Template Name</Label>
                <Input
                  id="edit_template_name"
                  value={formData.template_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, template_name: e.target.value }))}
                  placeholder="Enter template name"
                />
              </div>
              <div>
                <Label htmlFor="edit_template_type">Template Type</Label>
                <Select value={formData.template_type} onValueChange={(value) => setFormData(prev => ({ ...prev, template_type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {templateTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit_subject_line">Subject Line</Label>
              <Input
                id="edit_subject_line"
                value={formData.subject_line}
                onChange={(e) => setFormData(prev => ({ ...prev, subject_line: e.target.value }))}
                placeholder="Enter email subject line"
              />
            </div>
            
            <div>
              <Label htmlFor="edit_content">Content</Label>
              <Textarea
                id="edit_content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter email content"
                rows={6}
              />
            </div>
            
            <div>
              <Label htmlFor="edit_html_content">HTML Content (Optional)</Label>
              <Textarea
                id="edit_html_content"
                value={formData.html_content}
                onChange={(e) => setFormData(prev => ({ ...prev, html_content: e.target.value }))}
                placeholder="Enter HTML email content"
                rows={4}
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateTemplate}
                disabled={updateTemplateMutation.isPending || !formData.template_name || !formData.subject_line || !formData.content}
              >
                {updateTemplateMutation.isPending ? 'Updating...' : 'Update Template'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Preview of {selectedTemplate?.template_name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Template Name</Label>
                  <p className="text-sm font-medium">{selectedTemplate.template_name}</p>
                </div>
                <div>
                  <Label>Type</Label>
                  <Badge variant="outline">{selectedTemplate.template_type}</Badge>
                </div>
              </div>
              
              <div>
                <Label>Subject Line</Label>
                <p className="text-sm font-medium">{selectedTemplate.subject_line}</p>
              </div>
              
              <div>
                <Label>Content</Label>
                <div className="border rounded-lg p-4 bg-muted">
                  <pre className="text-sm whitespace-pre-wrap">{selectedTemplate.content}</pre>
                </div>
              </div>
              
              {selectedTemplate.html_content && (
                <div>
                  <Label>HTML Preview</Label>
                  <div 
                    className="border rounded-lg p-4 bg-white min-h-[200px]"
                    dangerouslySetInnerHTML={{ __html: selectedTemplate.html_content }}
                  />
                </div>
              )}
              
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}