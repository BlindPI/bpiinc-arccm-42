import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { 
  Mail,
  Plus,
  Edit,
  Copy,
  Trash2,
  Eye,
  MoreHorizontal,
  FileText,
  Zap,
  TrendingUp,
  Users,
  Calendar,
  Search,
  Filter,
  Download,
  Upload,
  Settings,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import type { EmailTemplate } from '@/types/crm';

// Mock template service (in real implementation, this would be a proper service)
const templateService = {
  async getTemplates() {
    // Mock data - in real implementation, this would fetch from backend
    return {
      success: true,
      data: [
        {
          id: 'template-1',
          name: 'Welcome Series - Introduction',
          type: 'lead_nurture',
          subject: 'Welcome to Assured Response Training',
          content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Welcome to Assured Response Training!</h1>
            <p>Dear {{first_name}},</p>
            <p>Thank you for your interest in our first aid training programs. We're excited to help you or your team gain life-saving skills.</p>
            <div style="background: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h3>What's Next?</h3>
              <ul>
                <li>Browse our course catalog</li>
                <li>Schedule a consultation</li>
                <li>Get a custom quote for your organization</li>
              </ul>
            </div>
            <p>Best regards,<br>The Assured Response Team</p>
          </div>`,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
          usage_count: 45,
          open_rate: 28.5,
          click_rate: 12.3
        },
        {
          id: 'template-2',
          name: 'Corporate Training Proposal',
          type: 'promotional',
          subject: 'Custom Training Solutions for {{company_name}}',
          content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Custom Training Solutions</h1>
            <p>Hello {{first_name}},</p>
            <p>We understand that {{company_name}} has unique training needs in the {{industry}} sector.</p>
            <div style="background: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h3>Our Corporate Services Include:</h3>
              <ul>
                <li>On-site training programs</li>
                <li>Customized curriculum development</li>
                <li>Flexible scheduling options</li>
                <li>Group discounts and packages</li>
              </ul>
            </div>
            <p>Let's schedule a consultation to discuss your specific requirements.</p>
            <p>Best regards,<br>Corporate Training Team</p>
          </div>`,
          created_at: '2024-01-10T14:30:00Z',
          updated_at: '2024-01-20T09:15:00Z',
          usage_count: 23,
          open_rate: 32.1,
          click_rate: 18.7
        },
        {
          id: 'template-3',
          name: 'AP Partnership Invitation',
          type: 'educational',
          subject: 'Join Our Authorized Provider Network',
          content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Expand Your Business with Us</h1>
            <p>Dear {{first_name}},</p>
            <p>We're inviting qualified training professionals to join our Authorized Provider network.</p>
            <div style="background: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h3>Partnership Benefits:</h3>
              <ul>
                <li>Access to proven training materials</li>
                <li>Marketing and sales support</li>
                <li>Ongoing professional development</li>
                <li>Revenue sharing opportunities</li>
              </ul>
            </div>
            <p>Ready to grow your training business? Let's talk.</p>
            <p>Best regards,<br>Partnership Development Team</p>
          </div>`,
          created_at: '2024-01-05T16:45:00Z',
          updated_at: '2024-01-25T11:20:00Z',
          usage_count: 12,
          open_rate: 41.2,
          click_rate: 25.8
        }
      ]
    };
  },

  async createTemplate(templateData: any) {
    // Mock creation
    return {
      success: true,
      data: {
        id: `template-${Date.now()}`,
        ...templateData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        usage_count: 0,
        open_rate: 0,
        click_rate: 0
      }
    };
  },

  async updateTemplate(id: string, updates: any) {
    // Mock update
    return {
      success: true,
      data: { id, ...updates, updated_at: new Date().toISOString() }
    };
  },

  async deleteTemplate(id: string) {
    // Mock deletion
    return { success: true };
  },

  async duplicateTemplate(id: string) {
    // Mock duplication
    return {
      success: true,
      data: {
        id: `template-${Date.now()}`,
        name: 'Copy of Template',
        created_at: new Date().toISOString()
      }
    };
  }
};

// Validation schema
const templateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  type: z.enum(['lead_nurture', 'promotional', 'educational', 'follow_up']),
  subject: z.string().min(1, 'Subject line is required'),
  content: z.string().min(1, 'Email content is required'),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface TemplateManagerProps {
  onSelectTemplate?: (template: any) => void;
  selectedTemplateId?: string;
}

export function TemplateManager({ onSelectTemplate, selectedTemplateId }: TemplateManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);

  const queryClient = useQueryClient();

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      type: 'lead_nurture',
      content: ''
    }
  });

  // Fetch templates
  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['crm', 'email-templates'],
    queryFn: templateService.getTemplates,
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: templateService.createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'email-templates'] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      templateService.updateTemplate(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'email-templates'] });
      setEditingTemplate(null);
      form.reset();
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: templateService.deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'email-templates'] });
    },
  });

  // Duplicate template mutation
  const duplicateTemplateMutation = useMutation({
    mutationFn: templateService.duplicateTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'email-templates'] });
    },
  });

  const templates = templatesData?.data || [];

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || template.type === filterType;
    return matchesSearch && matchesType;
  });

  const onSubmit = (data: TemplateFormData) => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({
        id: editingTemplate.id,
        updates: data
      });
    } else {
      createTemplateMutation.mutate(data);
    }
  };

  const handleEdit = (template: any) => {
    setEditingTemplate(template);
    form.reset({
      name: template.name,
      type: template.type,
      subject: template.subject,
      content: template.content
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteTemplateMutation.mutate(templateId);
    }
  };

  const handleDuplicate = (templateId: string) => {
    duplicateTemplateMutation.mutate(templateId);
  };

  const getTypeColor = (type: string) => {
    const colors = {
      lead_nurture: 'bg-blue-100 text-blue-800',
      promotional: 'bg-green-100 text-green-800',
      educational: 'bg-purple-100 text-purple-800',
      follow_up: 'bg-orange-100 text-orange-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      lead_nurture: 'Lead Nurture',
      promotional: 'Promotional',
      educational: 'Educational',
      follow_up: 'Follow-up'
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Email Templates</h2>
          <p className="text-gray-600">Manage your email campaign templates</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </DialogTitle>
              <DialogDescription>
                {editingTemplate 
                  ? 'Update your email template details and content'
                  : 'Create a new email template for your campaigns'
                }
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter template name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select template type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="lead_nurture">Lead Nurture</SelectItem>
                            <SelectItem value="promotional">Promotional</SelectItem>
                            <SelectItem value="educational">Educational</SelectItem>
                            <SelectItem value="follow_up">Follow-up</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject Line *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter email subject line" {...field} />
                      </FormControl>
                      <FormDescription>
                        Use merge fields like {`{{first_name}}`} and {`{{company_name}}`}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Content *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter your email content (HTML supported)"
                          className="min-h-[300px] font-mono text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        HTML is supported. Available merge fields: {`{{first_name}}, {{company_name}}, {{industry}}`}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      setEditingTemplate(null);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                  >
                    {createTemplateMutation.isPending || updateTemplateMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {editingTemplate ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      editingTemplate ? 'Update Template' : 'Create Template'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="lead_nurture">Lead Nurture</SelectItem>
                <SelectItem value="promotional">Promotional</SelectItem>
                <SelectItem value="educational">Educational</SelectItem>
                <SelectItem value="follow_up">Follow-up</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card 
            key={template.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedTemplateId === template.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
            onClick={() => onSelectTemplate?.(template)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{template.name}</CardTitle>
                  <Badge className={getTypeColor(template.type)}>
                    {getTypeLabel(template.type)}
                  </Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      setPreviewTemplate(template);
                    }}>
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(template);
                    }}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicate(template.id);
                    }}>
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(template.id);
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Subject:</p>
                  <p className="text-sm text-gray-600 truncate">{template.subject}</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{template.usage_count}</p>
                    <p className="text-xs text-gray-500">Uses</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-green-600">{template.open_rate}%</p>
                    <p className="text-xs text-gray-500">Open Rate</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-blue-600">{template.click_rate}%</p>
                    <p className="text-xs text-gray-500">Click Rate</p>
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  Updated {new Date(template.updated_at).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by creating your first email template'
              }
            </p>
            {!searchTerm && filterType === 'all' && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      {previewTemplate && (
        <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Template Preview: {previewTemplate.name}</DialogTitle>
              <DialogDescription>
                Preview how this template will appear to recipients
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">Subject Line:</p>
                <p className="text-gray-900">{previewTemplate.subject}</p>
              </div>
              
              <div className="border rounded-lg p-6 bg-white">
                <div 
                  dangerouslySetInnerHTML={{ __html: previewTemplate.content }}
                  className="prose max-w-none"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}