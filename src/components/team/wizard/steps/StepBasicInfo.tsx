
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, AlertCircle, CheckCircle } from 'lucide-react';

interface TeamFormData {
  name: string;
  description: string;
  team_type: string;
}

interface StepBasicInfoProps {
  formData: TeamFormData;
  onUpdateFormData: (data: Partial<TeamFormData>) => void;
  errors: Record<string, string>;
}

export function StepBasicInfo({ formData, onUpdateFormData, errors }: StepBasicInfoProps) {
  const teamTypes = [
    { value: 'operational', label: 'Operational Team', description: 'Day-to-day operations and service delivery' },
    { value: 'administrative', label: 'Administrative Team', description: 'Administrative oversight and management' },
    { value: 'training', label: 'Training Team', description: 'Training delivery and course management' },
    { value: 'provider_team', label: 'Provider Team', description: 'Authorized provider organization team' },
    { value: 'compliance', label: 'Compliance Team', description: 'Compliance monitoring and enforcement' },
    { value: 'support', label: 'Support Team', description: 'Technical and operational support' }
  ];

  const getFieldStatus = (fieldName: string) => {
    if (errors[fieldName]) return 'error';
    if (formData[fieldName as keyof TeamFormData]) return 'success';
    return 'default';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Basic Team Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Team Name */}
        <div className="space-y-2">
          <Label htmlFor="team-name" className="flex items-center gap-2">
            Team Name *
            {getFieldStatus('name') === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
            {getFieldStatus('name') === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
          </Label>
          <Input
            id="team-name"
            value={formData.name}
            onChange={(e) => onUpdateFormData({ name: e.target.value })}
            placeholder="Enter a descriptive team name"
            className={errors.name ? 'border-red-500 focus:border-red-500' : ''}
            maxLength={100}
          />
          {errors.name && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.name}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Choose a clear, descriptive name (3-100 characters)
          </p>
        </div>

        {/* Team Type */}
        <div className="space-y-2">
          <Label htmlFor="team-type" className="flex items-center gap-2">
            Team Type *
            {getFieldStatus('team_type') === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
            {getFieldStatus('team_type') === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
          </Label>
          <Select 
            value={formData.team_type} 
            onValueChange={(value) => onUpdateFormData({ team_type: value })}
          >
            <SelectTrigger className={errors.team_type ? 'border-red-500 focus:border-red-500' : ''}>
              <SelectValue placeholder="Select team type" />
            </SelectTrigger>
            <SelectContent>
              {teamTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-xs text-muted-foreground">{type.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.team_type && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.team_type}
            </p>
          )}
          {formData.team_type && (
            <p className="text-xs text-blue-600">
              {teamTypes.find(t => t.value === formData.team_type)?.description}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="team-description">
            Description (Optional)
          </Label>
          <Textarea
            id="team-description"
            value={formData.description}
            onChange={(e) => onUpdateFormData({ description: e.target.value })}
            placeholder="Describe the team's purpose, responsibilities, and objectives"
            rows={4}
            maxLength={500}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Provide additional context about the team's role and objectives</span>
            <span>{formData.description.length}/500</span>
          </div>
        </div>

        {/* Team Type Specific Notes */}
        {formData.team_type === 'provider_team' && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <strong>Provider Team:</strong> You'll need to associate this team with an authorized provider in the next step.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
