
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CampaignManagementService } from '@/services/crm/campaignManagementService';
import type { EnhancedCampaignWizardData } from '@/types/type-fixes';
import { toast } from 'sonner';

interface CampaignWizardProps {
  onComplete: (campaign: any) => void;
  onCancel: () => void;
}

export const CampaignWizard: React.FC<CampaignWizardProps> = ({ onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<EnhancedCampaignWizardData>({
    name: '',
    type: '',
    target_audience: '',
    settings: {},
    step1: {
      name: '',
      type: '',
      description: ''
    },
    step2: {
      target_audience: '',
      template_id: ''
    },
    step3: {
      schedule_date: '',
      settings: {}
    }
  });

  const createCampaignMutation = useMutation({
    mutationFn: CampaignManagementService.createCampaignWizard,
    onSuccess: (data) => {
      toast.success('Campaign created successfully!');
      onComplete(data);
    },
    onError: () => {
      toast.error('Failed to create campaign');
    }
  });

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
    const campaignData = {
      name: formData.step1?.name || formData.name,
      type: formData.step1?.type || formData.type,
      target_audience: formData.step2?.target_audience || formData.target_audience,
      template_id: formData.step2?.template_id || formData.template_id,
      schedule_date: formData.step3?.schedule_date || formData.schedule_date,
      settings: formData.step3?.settings || formData.settings
    };
    
    createCampaignMutation.mutate(campaignData);
  };

  const updateStepData = (step: keyof EnhancedCampaignWizardData, data: any) => {
    setFormData(prev => ({
      ...prev,
      [step]: { ...prev[step], ...data }
    }));
  };

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Campaign Basic Information</CardTitle>
        <CardDescription>Set up the basic details for your campaign</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="campaign_name">Campaign Name</Label>
          <Input
            id="campaign_name"
            value={formData.step1?.name || ''}
            onChange={(e) => updateStepData('step1', { name: e.target.value })}
            placeholder="Enter campaign name"
          />
        </div>
        <div>
          <Label htmlFor="campaign_type">Campaign Type</Label>
          <Select
            value={formData.step1?.type || ''}
            onValueChange={(value) => updateStepData('step1', { type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select campaign type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email Campaign</SelectItem>
              <SelectItem value="nurturing">Lead Nurturing</SelectItem>
              <SelectItem value="promotional">Promotional</SelectItem>
              <SelectItem value="newsletter">Newsletter</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={formData.step1?.description || ''}
            onChange={(e) => updateStepData('step1', { description: e.target.value })}
            placeholder="Brief description of the campaign"
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Target Audience & Template</CardTitle>
        <CardDescription>Define who will receive this campaign</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="target_audience">Target Audience</Label>
          <Select
            value={formData.step2?.target_audience || ''}
            onValueChange={(value) => updateStepData('step2', { target_audience: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select target audience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_leads">All Leads</SelectItem>
              <SelectItem value="qualified_leads">Qualified Leads</SelectItem>
              <SelectItem value="new_leads">New Leads</SelectItem>
              <SelectItem value="converted_leads">Converted Leads</SelectItem>
              <SelectItem value="custom">Custom Segment</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="template">Email Template</Label>
          <Select
            value={formData.step2?.template_id || ''}
            onValueChange={(value) => updateStepData('step2', { template_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select email template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="welcome">Welcome Email</SelectItem>
              <SelectItem value="follow_up">Follow-up Email</SelectItem>
              <SelectItem value="newsletter">Newsletter Template</SelectItem>
              <SelectItem value="promotional">Promotional Email</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Schedule & Settings</CardTitle>
        <CardDescription>Configure when and how the campaign will run</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="schedule_date">Send Date</Label>
          <Input
            id="schedule_date"
            type="datetime-local"
            value={formData.step3?.schedule_date || ''}
            onChange={(e) => updateStepData('step3', { schedule_date: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="send_immediately">
            <input
              type="checkbox"
              id="send_immediately"
              className="mr-2"
              onChange={(e) => updateStepData('step3', { 
                settings: { 
                  ...formData.step3?.settings, 
                  send_immediately: e.target.checked 
                }
              })}
            />
            Send Immediately
          </Label>
        </div>
      </CardContent>
    </Card>
  );

  const progress = (currentStep / 3) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Campaign Wizard</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Step {currentStep} of 3</span>
          <Progress value={progress} className="w-24" />
        </div>
      </div>

      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}

      <div className="flex justify-between">
        <div>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
        <div className="space-x-2">
          {currentStep > 1 && (
            <Button variant="outline" onClick={handlePrevious}>
              Previous
            </Button>
          )}
          {currentStep < 3 ? (
            <Button onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button 
              onClick={handleFinish}
              disabled={createCampaignMutation.isPending}
            >
              {createCampaignMutation.isPending ? 'Creating...' : 'Create Campaign'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
