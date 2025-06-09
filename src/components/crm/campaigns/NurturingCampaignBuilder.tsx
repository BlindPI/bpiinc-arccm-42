
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CampaignManagementService } from '@/services/crm/campaignManagementService';
import { toast } from 'sonner';
import { Plus, Trash2, Mail, Clock, Target } from 'lucide-react';

interface NurturingStep {
  id: string;
  stepNumber: number;
  stepType: 'email' | 'wait' | 'condition';
  title: string;
  content?: string;
  waitDays?: number;
  condition?: string;
}

interface NurturingCampaignBuilderProps {
  onComplete: (campaign: any) => void;
  onCancel: () => void;
}

export function NurturingCampaignBuilder({ onComplete, onCancel }: NurturingCampaignBuilderProps) {
  const [campaignName, setCampaignName] = useState('');
  const [description, setDescription] = useState('');
  const [enrollmentCriteria, setEnrollmentCriteria] = useState({
    leadStatus: '',
    minScore: 50,
    leadSource: ''
  });
  const [steps, setSteps] = useState<NurturingStep[]>([
    {
      id: '1',
      stepNumber: 1,
      stepType: 'email',
      title: 'Welcome Email',
      content: 'Welcome to our training programs...'
    }
  ]);

  const queryClient = useQueryClient();

  const { mutate: createCampaign, isPending } = useMutation({
    mutationFn: (data: any) => CampaignManagementService.createNurturingCampaign(data),
    onSuccess: (campaign) => {
      toast.success('Nurturing campaign created successfully!');
      queryClient.invalidateQueries({ queryKey: ['nurturing-campaigns'] });
      onComplete(campaign);
    },
    onError: (error) => {
      toast.error('Failed to create nurturing campaign');
      console.error('Campaign creation error:', error);
    }
  });

  const addStep = () => {
    const newStep: NurturingStep = {
      id: Date.now().toString(),
      stepNumber: steps.length + 1,
      stepType: 'email',
      title: `Step ${steps.length + 1}`,
      content: ''
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (stepId: string) => {
    setSteps(steps.filter(step => step.id !== stepId));
  };

  const updateStep = (stepId: string, updates: Partial<NurturingStep>) => {
    setSteps(steps.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  };

  const handleSubmit = () => {
    const campaignData = {
      campaign_name: campaignName,
      campaign_description: description,
      sequence_config: steps.map(step => ({
        step_number: step.stepNumber,
        step_type: step.stepType,
        title: step.title,
        content: step.content,
        wait_days: step.waitDays,
        condition: step.condition
      })),
      enrollment_criteria: enrollmentCriteria
    };

    createCampaign(campaignData);
  };

  const renderStepContent = (step: NurturingStep) => {
    switch (step.stepType) {
      case 'email':
        return (
          <div className="space-y-3">
            <div>
              <Label>Email Content</Label>
              <Textarea
                value={step.content || ''}
                onChange={(e) => updateStep(step.id, { content: e.target.value })}
                placeholder="Enter email content..."
                rows={4}
              />
            </div>
          </div>
        );

      case 'wait':
        return (
          <div className="space-y-3">
            <div>
              <Label>Wait Duration (Days)</Label>
              <Input
                type="number"
                value={step.waitDays || 1}
                onChange={(e) => updateStep(step.id, { waitDays: parseInt(e.target.value) })}
                min="1"
                max="365"
              />
            </div>
          </div>
        );

      case 'condition':
        return (
          <div className="space-y-3">
            <div>
              <Label>Condition</Label>
              <Select
                value={step.condition || ''}
                onValueChange={(value) => updateStep(step.id, { condition: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="opened_email">Opened Email</SelectItem>
                  <SelectItem value="clicked_link">Clicked Link</SelectItem>
                  <SelectItem value="visited_website">Visited Website</SelectItem>
                  <SelectItem value="score_increased">Score Increased</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepIcon = (stepType: string) => {
    switch (stepType) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'wait':
        return <Clock className="h-4 w-4" />;
      case 'condition':
        return <Target className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Create Lead Nurturing Campaign</CardTitle>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Campaign Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="campaignName">Campaign Name</Label>
              <Input
                id="campaignName"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Enter campaign name"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Campaign description"
              />
            </div>
          </div>

          {/* Enrollment Criteria */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Enrollment Criteria</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Lead Status</Label>
                <Select
                  value={enrollmentCriteria.leadStatus}
                  onValueChange={(value) => setEnrollmentCriteria({
                    ...enrollmentCriteria,
                    leadStatus: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Minimum Score</Label>
                <Input
                  type="number"
                  value={enrollmentCriteria.minScore}
                  onChange={(e) => setEnrollmentCriteria({
                    ...enrollmentCriteria,
                    minScore: parseInt(e.target.value)
                  })}
                  min="0"
                  max="100"
                />
              </div>
              
              <div>
                <Label>Lead Source</Label>
                <Select
                  value={enrollmentCriteria.leadSource}
                  onValueChange={(value) => setEnrollmentCriteria({
                    ...enrollmentCriteria,
                    leadSource: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sequence Builder */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Campaign Sequence</CardTitle>
            <Button onClick={addStep} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <Card key={step.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getStepIcon(step.stepType)}
                        Step {index + 1}
                      </Badge>
                      <Input
                        value={step.title}
                        onChange={(e) => updateStep(step.id, { title: e.target.value })}
                        className="w-auto"
                        placeholder="Step title"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Select
                        value={step.stepType}
                        onValueChange={(value: any) => updateStep(step.id, { stepType: value })}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="wait">Wait</SelectItem>
                          <SelectItem value="condition">Condition</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {steps.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStep(step.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {renderStepContent(step)}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isPending || !campaignName}
        >
          {isPending ? 'Creating...' : 'Create Campaign'}
        </Button>
      </div>
    </div>
  );
}
