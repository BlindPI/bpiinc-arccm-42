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
import { Checkbox } from '@/components/ui/checkbox';
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
import { Separator } from '@/components/ui/separator';
import {
  Mail,
  Users,
  Target,
  Calendar,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Send,
  Clock,
  MapPin,
  Building,
  User,
  Zap,
  Eye,
  Settings,
  AlertCircle
} from 'lucide-react';
import { crmEmailCampaignService } from '@/services/crm/crmEmailCampaignService';
import { crmLeadService } from '@/services/crm/crmLeadService';
import type { LeadFilters } from '@/types/crm';

// Validation schema
const campaignSchema = z.object({
  campaign_name: z.string().min(1, 'Campaign name is required'),
  campaign_type: z.enum(['lead_nurture', 'promotional', 'educational', 'follow_up']),
  target_audience: z.enum(['individuals', 'corporate', 'potential_aps', 'all']),
  subject_line: z.string().min(1, 'Subject line is required'),
  email_template_id: z.string().optional(),
  personalization_fields: z.record(z.any()).optional(),
  target_segments: z.record(z.any()).optional(),
  geographic_targeting: z.array(z.string()).optional(),
  industry_targeting: z.array(z.string()).optional(),
  scheduled_date: z.string().optional(),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

interface CampaignWizardProps {
  onSuccess?: (campaign: any) => void;
  onCancel?: () => void;
}

export function CampaignWizard({ onSuccess, onCancel }: CampaignWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [audiencePreview, setAudiencePreview] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const queryClient = useQueryClient();

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      campaign_type: 'lead_nurture',
      target_audience: 'all',
      geographic_targeting: [],
      industry_targeting: []
    }
  });

  // Real campaign creation
  const createCampaignMutation = useMutation({
    mutationFn: async (campaignData: CampaignFormData) => {
      const result = await crmEmailCampaignService.createCampaign(campaignData);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (newCampaign) => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'campaigns'] });
      onSuccess?.(newCampaign);
    },
  });

  // Real audience segmentation
  const { data: segmentPreview } = useQuery({
    queryKey: ['crm', 'segments', form.watch('target_audience'), form.watch('geographic_targeting'), form.watch('industry_targeting')],
    queryFn: async () => {
      const targetAudience = form.getValues('target_audience');
      const filters: LeadFilters = {};
      
      if (targetAudience !== 'all') {
        filters.lead_type = targetAudience === 'individuals' ? 'individual' :
                           targetAudience === 'corporate' ? 'corporate' : 'potential_ap';
      }
      
      const geoTargeting = form.getValues('geographic_targeting');
      if (geoTargeting?.length) {
        filters.province = geoTargeting[0];
      }
      
      const industryTargeting = form.getValues('industry_targeting');
      if (industryTargeting?.length) {
        filters.industry = industryTargeting[0];
      }
      
      const result = await crmLeadService.getLeads(filters, 1, 1);
      if (result.success) {
        return {
          total_count: result.data?.total || 0,
          sample_leads: result.data?.data || []
        };
      }
      return { total_count: 0, sample_leads: [] };
    },
    enabled: currentStep === 2,
  });

  // Mock email templates (in real implementation, this would come from the backend)
  const emailTemplates = [
    {
      id: 'template-1',
      name: 'Welcome Series - Introduction',
      type: 'lead_nurture',
      subject: 'Welcome to Assured Response Training',
      preview: 'Thank you for your interest in our first aid training programs...'
    },
    {
      id: 'template-2',
      name: 'Corporate Training Proposal',
      type: 'promotional',
      subject: 'Custom Training Solutions for Your Team',
      preview: 'We understand your organization has unique training needs...'
    },
    {
      id: 'template-3',
      name: 'AP Partnership Invitation',
      type: 'educational',
      subject: 'Join Our Authorized Provider Network',
      preview: 'Expand your business with our proven training programs...'
    },
    {
      id: 'template-4',
      name: 'Follow-up Reminder',
      type: 'follow_up',
      subject: 'Don\'t Miss Out - Training Deadline Approaching',
      preview: 'We wanted to follow up on your recent inquiry...'
    }
  ];

  const provinces = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'];
  const industries = ['Construction', 'Healthcare', 'Manufacturing', 'Transportation', 'Education', 'Government', 'Retail', 'Other'];

  const steps = [
    { number: 1, title: 'Campaign Details', icon: Mail },
    { number: 2, title: 'Audience Targeting', icon: Users },
    { number: 3, title: 'Template & Content', icon: Target },
    { number: 4, title: 'Schedule & Send', icon: Calendar }
  ];

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const onSubmit = (data: CampaignFormData) => {
    createCampaignMutation.mutate(data);
  };

  const getCampaignTypeDescription = (type: string) => {
    const descriptions = {
      lead_nurture: 'Build relationships with prospects over time through educational content',
      promotional: 'Promote specific training programs or special offers',
      educational: 'Share valuable information about safety and training best practices',
      follow_up: 'Re-engage with leads who have shown interest but haven\'t converted'
    };
    return descriptions[type as keyof typeof descriptions] || '';
  };

  const getAudienceDescription = (audience: string) => {
    const descriptions = {
      individuals: 'Target individuals seeking personal certification',
      corporate: 'Target businesses needing team training solutions',
      potential_aps: 'Target potential Authorized Provider partners',
      all: 'Target all lead types in your database'
    };
    return descriptions[audience as keyof typeof descriptions] || '';
  };

  if (createCampaignMutation.isSuccess) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Campaign Created Successfully!</CardTitle>
          <CardDescription>
            Your email campaign has been created and is ready to be scheduled or sent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Next Steps:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Review your campaign settings and content</li>
              <li>• Test send to verify email rendering</li>
              <li>• Schedule for optimal send time or send immediately</li>
              <li>• Monitor campaign performance and engagement</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => window.location.reload()} className="flex-1">
              Create Another Campaign
            </Button>
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Back to Campaigns
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Steps */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isCompleted 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : isActive 
                        ? 'bg-blue-500 border-blue-500 text-white' 
                        : 'border-gray-300 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="ml-3">
                    <div className={`text-sm font-medium ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`mx-4 h-0.5 w-16 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {React.createElement(steps[currentStep - 1].icon, { className: "h-5 w-5" })}
                {steps[currentStep - 1].title}
              </CardTitle>
              <CardDescription>
                {currentStep === 1 && "Set up your campaign name, type, and basic details"}
                {currentStep === 2 && "Define your target audience and segmentation criteria"}
                {currentStep === 3 && "Choose your email template and customize content"}
                {currentStep === 4 && "Schedule your campaign or send immediately"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Campaign Details */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="campaign_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter campaign name" {...field} />
                        </FormControl>
                        <FormDescription>
                          Choose a descriptive name for internal tracking
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="campaign_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select campaign type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="lead_nurture">Lead Nurture</SelectItem>
                            <SelectItem value="promotional">Promotional</SelectItem>
                            <SelectItem value="educational">Educational</SelectItem>
                            <SelectItem value="follow_up">Follow-up</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {getCampaignTypeDescription(field.value)}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subject_line"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject Line *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter email subject line" {...field} />
                        </FormControl>
                        <FormDescription>
                          Keep it concise and compelling (50-60 characters recommended)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 2: Audience Targeting */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="target_audience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Audience *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select target audience" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="all">All Leads</SelectItem>
                            <SelectItem value="individuals">Individuals</SelectItem>
                            <SelectItem value="corporate">Corporate</SelectItem>
                            <SelectItem value="potential_aps">Potential APs</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {getAudienceDescription(field.value)}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="geographic_targeting"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Geographic Targeting</FormLabel>
                          <FormDescription className="mb-3">
                            Select provinces to target (optional)
                          </FormDescription>
                          <div className="grid grid-cols-3 gap-2">
                            {provinces.map((province) => (
                              <div key={province} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`province-${province}`}
                                  checked={field.value?.includes(province)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, province]);
                                    } else {
                                      field.onChange(current.filter(p => p !== province));
                                    }
                                  }}
                                />
                                <Label htmlFor={`province-${province}`} className="text-sm">
                                  {province}
                                </Label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="industry_targeting"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industry Targeting</FormLabel>
                          <FormDescription className="mb-3">
                            Select industries to target (optional)
                          </FormDescription>
                          <div className="space-y-2">
                            {industries.map((industry) => (
                              <div key={industry} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`industry-${industry}`}
                                  checked={field.value?.includes(industry.toLowerCase())}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    const industryValue = industry.toLowerCase();
                                    if (checked) {
                                      field.onChange([...current, industryValue]);
                                    } else {
                                      field.onChange(current.filter(i => i !== industryValue));
                                    }
                                  }}
                                />
                                <Label htmlFor={`industry-${industry}`} className="text-sm">
                                  {industry}
                                </Label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Audience Preview */}
                  {segmentPreview && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Audience Preview
                      </h4>
                      <div className="text-sm text-blue-800">
                        <p className="mb-2">
                          <strong>{segmentPreview.total_count}</strong> leads match your targeting criteria
                        </p>
                        {segmentPreview.total_count === 0 && (
                          <p className="text-orange-700">
                            No leads found with current targeting. Consider broadening your criteria.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Template & Content */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-medium">Email Template</Label>
                    <p className="text-sm text-gray-600 mb-4">
                      Choose a template that matches your campaign type
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {emailTemplates
                        .filter(template => template.type === form.watch('campaign_type'))
                        .map((template) => (
                          <Card 
                            key={template.id}
                            className={`cursor-pointer transition-colors ${
                              selectedTemplate === template.id 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'hover:border-gray-300'
                            }`}
                            onClick={() => {
                              setSelectedTemplate(template.id);
                              form.setValue('email_template_id', template.id);
                            }}
                          >
                            <CardContent className="p-4">
                              <h4 className="font-medium mb-2">{template.name}</h4>
                              <p className="text-sm text-gray-600 mb-2">{template.subject}</p>
                              <p className="text-xs text-gray-500">{template.preview}</p>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-base font-medium">Personalization</Label>
                    <p className="text-sm text-gray-600 mb-4">
                      Available merge fields: {`{{first_name}}, {{company_name}}, {{industry}}`}
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm">
                        <strong>Preview:</strong> {form.watch('subject_line') || 'Your subject line will appear here'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Schedule & Send */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Send className="h-5 w-5 text-blue-600" />
                        <h4 className="font-medium">Send Immediately</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Send your campaign right away to all targeted recipients
                      </p>
                      <Button 
                        type="button" 
                        className="w-full"
                        onClick={() => form.setValue('scheduled_date', '')}
                      >
                        Send Now
                      </Button>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Clock className="h-5 w-5 text-orange-600" />
                        <h4 className="font-medium">Schedule for Later</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Choose the optimal time to send your campaign
                      </p>
                      <FormField
                        control={form.control}
                        name="scheduled_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="datetime-local"
                                {...field}
                                min={new Date().toISOString().slice(0, 16)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </Card>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Campaign Summary
                    </h4>
                    <div className="text-sm text-yellow-800 space-y-1">
                      <p><strong>Campaign:</strong> {form.watch('campaign_name')}</p>
                      <p><strong>Type:</strong> {form.watch('campaign_type')?.replace('_', ' ')}</p>
                      <p><strong>Audience:</strong> {form.watch('target_audience')}</p>
                      <p><strong>Subject:</strong> {form.watch('subject_line')}</p>
                      <p><strong>Recipients:</strong> ~{segmentPreview?.total_count || 0} leads</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 1 ? onCancel : prevStep}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {currentStep === 1 ? 'Cancel' : 'Previous'}
            </Button>

            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2"
                disabled={
                  (currentStep === 1 && (!form.watch('campaign_name') || !form.watch('subject_line'))) ||
                  (currentStep === 3 && !selectedTemplate)
                }
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={createCampaignMutation.isPending}
                className="flex items-center gap-2"
              >
                {createCampaignMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating Campaign...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Create Campaign
                  </>
                )}
              </Button>
            )}
          </div>

          {createCampaignMutation.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Error creating campaign</span>
              </div>
              <p className="text-red-700 text-sm mt-1">
                {createCampaignMutation.error.message}
              </p>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}