
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface StepBasicInfoProps {
  formData: {
    name: string;
    description: string;
    team_type: string;
  };
  onUpdateFormData: (data: Partial<typeof formData>) => void;
  errors: Record<string, string>;
}

export function StepBasicInfo({ formData, onUpdateFormData, errors }: StepBasicInfoProps) {
  const teamTypes = [
    { value: 'operational', label: 'Operational Team' },
    { value: 'administrative', label: 'Administrative Team' },
    { value: 'training', label: 'Training Team' },
    { value: 'provider_team', label: 'Provider Team' },
    { value: 'compliance', label: 'Compliance Team' },
    { value: 'support', label: 'Support Team' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Basic Team Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="team-name">Team Name *</Label>
          <Input
            id="team-name"
            value={formData.name}
            onChange={(e) => onUpdateFormData({ name: e.target.value })}
            placeholder="Enter team name"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="team-description">Description</Label>
          <Textarea
            id="team-description"
            value={formData.description}
            onChange={(e) => onUpdateFormData({ description: e.target.value })}
            placeholder="Describe the team's purpose and responsibilities"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="team-type">Team Type *</Label>
          <Select 
            value={formData.team_type} 
            onValueChange={(value) => onUpdateFormData({ team_type: value })}
          >
            <SelectTrigger className={errors.team_type ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select team type" />
            </SelectTrigger>
            <SelectContent>
              {teamTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.team_type && (
            <p className="text-sm text-red-600">{errors.team_type}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
