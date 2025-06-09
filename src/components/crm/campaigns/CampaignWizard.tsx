
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CampaignManagementService, type CampaignWizardData } from '@/services/crm/campaignManagementService';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Send, Save } from 'lucide-react';

interface CampaignWizardProps {
  onComplete: (campaign: any) => void;
  onCancel: () => void;
}

export function CampaignWizard({ onComplete, onCancel }: CampaignWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<CampaignWizardData>({
    step1: {
      campaignName: '',
      campaignType: 'email',
      targetAudience: '',
      description: ''
    },
    step2: {
      subjectLine: '',
      emailContent: '',
      personalizationFields: {}
    },
    step3: {
      geographicTargeting: [],
      industryTargeting: [],
      leadScoreThreshold: 50
    }
  });

  const queryClient = useQueryClient();

  const { data: templates } = useQuery({
    queryKey: ['email-templates'],
    queryFn: () => CampaignManagementService.getEmailTemplates()
  });

  const { mutate: createCampaign, isPending } = useMutation({
    mutationFn: (data: CampaignWizardData) => CampaignManagementService.createCampaignWizard(data),
    onSuccess: (campaign) => {
      toast.success('Campaign created successfully!');
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      onComplete(campaign);
    },
    onError: (error) => {
      toast.error('Failed to create campaign');
      console.error('Campaign creation error:', error);
    }
  });

  const steps = [
    { number: 1, title: 'Campaign Details', description: 'Basic campaign information' },
    { number: 2, title: 'Content & Template', description: 'Email content and design' },
    { number: 3, title: 'Targeting & Schedule', description: 'Audience targeting and timing' }
  ];

  const updateStepData = (step: keyof CampaignWizardData, data: any) => {
    setWizardData(prev => ({
      ...prev,
      [step]: { ...prev[step], ...data }
    }));
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    createCampaign(wizardData);
  };

  const getStepValidation = (step: number) => {
    switch (step) {
      case 1:
        return wizardData.step1.campaignName && wizardData.step1.targetAudience;
      case 2:
        return wizardData.step2.subjectLine && wizardData.step2.emailContent;
      case 3:
        return true; // Optional step
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="campaignName">Campaign Name</Label>
              <Input
                id="campaignName"
                value={wizardData.step1.campaignName}
                onChange={(e) => updateStepData('step1', { campaignName: e.target.value })}
                placeholder="Enter campaign name"
                required
              />
            </div>

            <div>
              <Label htmlFor="campaignType">Campaign Type</Label>
              <Select
                value={wizardData.step1.campaignType}
                onValueChange={(value) => updateStepData('step1', { campaignType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email Campaign</SelectItem>
                  <SelectItem value="lead_nurturing">Lead Nurturing</SelectItem>
                  <SelectItem value="promotional">Promotional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Input
                id="targetAudience"
                value={wizardData.step1.targetAudience}
                onChange={(e) => updateStepData('step1', { targetAudience: e.target.value })}
                placeholder="e.g., Qualified leads, New prospects"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={wizardData.step1.description}
                onChange={(e) => updateStepData('step1', { description: e.target.value })}
                placeholder="Campaign description"
                rows={3}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="template">Email Template (Optional)</Label>
              <Select onValueChange={(value) => {
                const template = templates?.find(t => t.id === value);
                if (template) {
                  updateStepData('step2', {
                    subjectLine: template.subject_line,
                    emailContent: template.email_content,
                    templateId: template.id
                  });
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates?.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.template_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subjectLine">Subject Line</Label>
              <Input
                id="subjectLine"
                value={wizardData.step2.subjectLine}
                onChange={(e) => updateStepData('step2', { subjectLine: e.target.value })}
                placeholder="Enter email subject line"
                required
              />
            </div>

            <div>
              <Label htmlFor="emailContent">Email Content</Label>
              <Textarea
                id="emailContent"
                value={wizardData.step2.emailContent}
                onChange={(e) => updateStepData('step2', { emailContent: e.target.value })}
                placeholder="Enter email content (HTML supported)"
                rows={8}
                required
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label>Geographic Targeting</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['North America', 'Europe', 'Asia Pacific', 'Latin America'].map((region) => (
                  <Badge
                    key={region}
                    variant={wizardData.step3.geographicTargeting?.includes(region) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      const current = wizardData.step3.geographicTargeting || [];
                      const updated = current.includes(region)
                        ? current.filter(r => r !== region)
                        : [...current, region];
                      updateStepData('step3', { geographicTargeting: updated });
                    }}
                  >
                    {region}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Industry Targeting</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['Healthcare', 'Technology', 'Manufacturing', 'Education', 'Finance'].map((industry) => (
                  <Badge
                    key={industry}
                    variant={wizardData.step3.industryTargeting?.includes(industry) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      const current = wizardData.step3.industryTargeting || [];
                      const updated = current.includes(industry)
                        ? current.filter(i => i !== industry)
                        : [...current, industry];
                      updateStepData('step3', { industryTargeting: updated });
                    }}
                  >
                    {industry}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="leadScore">Minimum Lead Score</Label>
              <Input
                id="leadScore"
                type="number"
                value={wizardData.step3.leadScoreThreshold}
                onChange={(e) => updateStepData('step3', { leadScoreThreshold: parseInt(e.target.value) })}
                placeholder="50"
                min="0"
                max="100"
              />
            </div>

            <div>
              <Label htmlFor="scheduledDate">Scheduled Send Date (Optional)</Label>
              <Input
                id="scheduledDate"
                type="datetime-local"
                value={wizardData.step3.scheduledDate}
                onChange={(e) => updateStepData('step3', { scheduledDate: e.target.value })}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const progressPercentage = (currentStep / 3) * 100;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Create New Campaign</CardTitle>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            {steps.map((step) => (
              <div
                key={step.number}
                className={`flex flex-col items-center ${
                  currentStep === step.number ? 'text-primary font-medium' : ''
                }`}
              >
                <span className="font-medium">Step {step.number}</span>
                <span className="text-xs">{step.title}</span>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Step Content */}
          <div className="min-h-[400px]">
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-2">
              {currentStep === 3 ? (
                <Button
                  onClick={handleFinish}
                  disabled={isPending || !getStepValidation(currentStep)}
                >
                  {isPending ? (
                    <>Creating...</>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Create Campaign
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!getStepValidation(currentStep)}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
