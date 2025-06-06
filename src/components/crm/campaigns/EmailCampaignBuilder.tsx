import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Mail,
  Users,
  Calendar,
  Send,
  Save,
  Eye,
  Settings,
  Target,
  MapPin,
  Building,
  Star,
  Clock,
  Plus,
  X,
  ChevronRight,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EmailCampaignService, EmailCampaign } from '@/services/crm/emailCampaignService';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const campaignSchema = z.object({
  campaign_name: z.string().min(1, 'Campaign name is required'),
  campaign_type: z.string().min(1, 'Campaign type is required'),
  subject_line: z.string().min(1, 'Subject line is required'),
  target_audience: z.string().min(1, 'Target audience is required'),
  scheduled_date: z.string().optional(),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

interface EmailCampaignBuilderProps {
  campaignId?: string;
  onSave?: (campaign: EmailCampaign) => void;
  onCancel?: () => void;
  className?: string;
}

export function EmailCampaignBuilder({ 
  campaignId, 
  onSave, 
  onCancel, 
  className 
}: EmailCampaignBuilderProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [audienceCriteria, setAudienceCriteria] = useState({
    lead_source: [] as string[],
    industry: [] as string[],
    company_size: [] as string[],
    lead_score_min: 0,
    geographic_location: [] as string[],
    lead_status: [] as string[]
  });
  const [estimatedReach, setEstimatedReach] = useState(0);

  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      campaign_name: '',
      campaign_type: '',
      subject_line: '',
      target_audience: '',
      scheduled_date: ''
    }
  });

  // Get target audience count
  const { data: targetAudience } = useQuery({
    queryKey: ['target-audience', audienceCriteria],
    queryFn: () => EmailCampaignService.getTargetAudience(audienceCriteria),
    enabled: Object.values(audienceCriteria).some(val => 
      Array.isArray(val) ? val.length > 0 : val > 0
    )
  });

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: (data: Omit<EmailCampaign, 'id' | 'created_at' | 'updated_at'>) => 
      EmailCampaignService.createEmailCampaign(data),
    onSuccess: (campaign) => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      if (campaign && onSave) {
        onSave(campaign);
      }
    },
  });

  const steps = [
    { id: 1, title: 'Campaign Details', icon: Settings },
    { id: 2, title: 'Target Audience', icon: Users },
    { id: 3, title: 'Email Content', icon: Mail },
    { id: 4, title: 'Schedule & Send', icon: Send }
  ];

  const campaignTypes = [
    { value: 'welcome', label: 'Welcome Series' },
    { value: 'nurture', label: 'Lead Nurturing' },
    { value: 'promotional', label: 'Promotional' },
    { value: 'follow_up', label: 'Follow-up' },
    { value: 'newsletter', label: 'Newsletter' }
  ];

  const leadSources = [
    'Website Form', 'Trade Show', 'Referral', 'Cold Outreach', 'Social Media', 'Partner'
  ];

  const industries = [
    'Construction', 'Manufacturing', 'Healthcare', 'Oil & Gas', 'Mining', 'Transportation'
  ];

  const companySizes = [
    'Small (1-50)', 'Medium (51-200)', 'Large (201-1000)', 'Enterprise (1000+)'
  ];

  const provinces = [
    'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
    'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island',
    'Quebec', 'Saskatchewan', 'Yukon'
  ];

  const leadStatuses = [
    'new', 'contacted', 'qualified', 'proposal', 'negotiation'
  ];

  const defaultTemplates = EmailCampaignService.getDefaultEmailTemplates();

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = (data: CampaignFormData) => {
    const campaignData: Omit<EmailCampaign, 'id' | 'created_at' | 'updated_at'> = {
      campaign_name: data.campaign_name,
      campaign_type: data.campaign_type,
      subject_line: data.subject_line,
      target_audience: data.target_audience,
      target_segments: audienceCriteria,
      email_template_id: selectedTemplate,
      status: 'draft',
      scheduled_date: data.scheduled_date || undefined,
      geographic_targeting: audienceCriteria.geographic_location,
      industry_targeting: audienceCriteria.industry,
    };

    createCampaignMutation.mutate(campaignData);
  };

  const updateAudienceCriteria = (key: keyof typeof audienceCriteria, value: any) => {
    const newCriteria = { ...audienceCriteria, [key]: value };
    setAudienceCriteria(newCriteria);
    
    // Update estimated reach
    if (targetAudience) {
      setEstimatedReach(targetAudience.count);
    }
  };

  const addCriteriaItem = (key: keyof typeof audienceCriteria, item: string) => {
    if (Array.isArray(audienceCriteria[key])) {
      const currentArray = audienceCriteria[key] as string[];
      if (!currentArray.includes(item)) {
        updateAudienceCriteria(key, [...currentArray, item]);
      }
    }
  };

  const removeCriteriaItem = (key: keyof typeof audienceCriteria, item: string) => {
    if (Array.isArray(audienceCriteria[key])) {
      const currentArray = audienceCriteria[key] as string[];
      updateAudienceCriteria(key, currentArray.filter(i => i !== item));
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {campaignId ? 'Edit Campaign' : 'Create Email Campaign'}
          </h1>
          <p className="text-muted-foreground">
            Build and configure your email marketing campaign
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit(onSubmit)}
            disabled={!isValid || createCampaignMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Campaign
          </Button>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.id 
                    ? 'bg-primary border-primary text-primary-foreground' 
                    : 'border-muted-foreground text-muted-foreground'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className="h-5 w-5 mx-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <form onSubmit={handleSubmit(onSubmit)}>
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
              <CardDescription>
                Set up the basic information for your email campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="campaign_name">Campaign Name</Label>
                  <Input
                    id="campaign_name"
                    {...register('campaign_name')}
                    placeholder="Enter campaign name"
                  />
                  {errors.campaign_name && (
                    <p className="text-sm text-red-500">{errors.campaign_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaign_type">Campaign Type</Label>
                  <Select onValueChange={(value) => setValue('campaign_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select campaign type" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaignTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.campaign_type && (
                    <p className="text-sm text-red-500">{errors.campaign_type.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject_line">Subject Line</Label>
                <Input
                  id="subject_line"
                  {...register('subject_line')}
                  placeholder="Enter email subject line"
                />
                {errors.subject_line && (
                  <p className="text-sm text-red-500">{errors.subject_line.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_audience">Target Audience Description</Label>
                <Textarea
                  id="target_audience"
                  {...register('target_audience')}
                  placeholder="Describe your target audience"
                  rows={3}
                />
                {errors.target_audience && (
                  <p className="text-sm text-red-500">{errors.target_audience.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Target Audience</CardTitle>
              <CardDescription>
                Define who will receive this campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Estimated Reach */}
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-primary" />
                  <span className="font-medium">Estimated Reach</span>
                </div>
                <p className="text-2xl font-bold text-primary">
                  {targetAudience?.count?.toLocaleString() || '0'} recipients
                </p>
              </div>

              <Tabs defaultValue="lead_source" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="lead_source">Lead Source</TabsTrigger>
                  <TabsTrigger value="industry">Industry</TabsTrigger>
                  <TabsTrigger value="company_size">Company Size</TabsTrigger>
                  <TabsTrigger value="location">Location</TabsTrigger>
                </TabsList>

                <TabsContent value="lead_source" className="space-y-4">
                  <div>
                    <Label>Lead Sources</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {leadSources.map((source) => (
                        <Button
                          key={source}
                          type="button"
                          variant={audienceCriteria.lead_source.includes(source) ? "default" : "outline"}
                          size="sm"
                          onClick={() => 
                            audienceCriteria.lead_source.includes(source)
                              ? removeCriteriaItem('lead_source', source)
                              : addCriteriaItem('lead_source', source)
                          }
                        >
                          {source}
                        </Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="industry" className="space-y-4">
                  <div>
                    <Label>Industries</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {industries.map((industry) => (
                        <Button
                          key={industry}
                          type="button"
                          variant={audienceCriteria.industry.includes(industry) ? "default" : "outline"}
                          size="sm"
                          onClick={() => 
                            audienceCriteria.industry.includes(industry)
                              ? removeCriteriaItem('industry', industry)
                              : addCriteriaItem('industry', industry)
                          }
                        >
                          {industry}
                        </Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="company_size" className="space-y-4">
                  <div>
                    <Label>Company Sizes</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {companySizes.map((size) => (
                        <Button
                          key={size}
                          type="button"
                          variant={audienceCriteria.company_size.includes(size) ? "default" : "outline"}
                          size="sm"
                          onClick={() => 
                            audienceCriteria.company_size.includes(size)
                              ? removeCriteriaItem('company_size', size)
                              : addCriteriaItem('company_size', size)
                          }
                        >
                          {size}
                        </Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="location" className="space-y-4">
                  <div>
                    <Label>Geographic Locations</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {provinces.map((province) => (
                        <Button
                          key={province}
                          type="button"
                          variant={audienceCriteria.geographic_location.includes(province) ? "default" : "outline"}
                          size="sm"
                          onClick={() => 
                            audienceCriteria.geographic_location.includes(province)
                              ? removeCriteriaItem('geographic_location', province)
                              : addCriteriaItem('geographic_location', province)
                          }
                        >
                          {province}
                        </Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Selected Criteria Summary */}
              <div className="space-y-3">
                <Label>Selected Criteria</Label>
                <div className="space-y-2">
                  {Object.entries(audienceCriteria).map(([key, values]) => {
                    if (Array.isArray(values) && values.length > 0) {
                      return (
                        <div key={key} className="flex flex-wrap gap-2">
                          <span className="text-sm font-medium capitalize">
                            {key.replace('_', ' ')}:
                          </span>
                          {values.map((value) => (
                            <Badge key={value} variant="secondary" className="gap-1">
                              {value}
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => removeCriteriaItem(key as keyof typeof audienceCriteria, value)}
                              />
                            </Badge>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Email Content</CardTitle>
              <CardDescription>
                Choose a template and customize your email content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Email Templates</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {defaultTemplates.map((template, index) => (
                    <Card 
                      key={index}
                      className={`cursor-pointer transition-colors ${
                        selectedTemplate === template.name ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedTemplate(template.name)}
                    >
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2">{template.name}</h4>
                        <p className="text-sm text-muted-foreground mb-3">{template.subject}</p>
                        <Badge variant="outline">{template.template_type}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {selectedTemplate && (
                <div className="space-y-4">
                  <Separator />
                  <div>
                    <Label>Template Preview</Label>
                    <div className="mt-2 p-4 border rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">
                        Template: {selectedTemplate}
                      </p>
                      <p className="text-sm mt-2">
                        This template includes personalization fields and will be customized for each recipient.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Schedule & Send</CardTitle>
              <CardDescription>
                Choose when to send your campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduled_date">Schedule Date (Optional)</Label>
                  <Input
                    id="scheduled_date"
                    type="datetime-local"
                    {...register('scheduled_date')}
                  />
                  <p className="text-sm text-muted-foreground">
                    Leave empty to save as draft
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Campaign Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Campaign Name:</span>
                      <span className="ml-2 font-medium">{watch('campaign_name')}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <span className="ml-2 font-medium">{watch('campaign_type')}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Subject:</span>
                      <span className="ml-2 font-medium">{watch('subject_line')}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Estimated Recipients:</span>
                      <span className="ml-2 font-medium">{targetAudience?.count?.toLocaleString() || '0'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </form>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          Previous
        </Button>
        
        <Button 
          onClick={currentStep === steps.length ? handleSubmit(onSubmit) : handleNext}
          disabled={currentStep === steps.length && (!isValid || createCampaignMutation.isPending)}
        >
          {currentStep === steps.length ? (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Campaign
            </>
          ) : (
            'Next'
          )}
        </Button>
      </div>
    </div>
  );
}