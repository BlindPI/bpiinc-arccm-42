
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Shield, Wrench, BookOpen, AlertTriangle } from 'lucide-react';

interface TeamFormData {
  name: string;
  description: string;
  team_type: string;
  location_id: string;
  provider_id: string;
  permissions: Record<string, boolean>;
}

interface StepBasicInfoProps {
  formData: TeamFormData;
  onUpdateFormData: (updates: Partial<TeamFormData>) => void;
  errors: Record<string, string>;
}

const teamTypes = [
  {
    value: 'operational',
    label: 'Operational Team',
    description: 'Day-to-day operations and service delivery',
    icon: Building2,
    color: 'bg-blue-50 text-blue-700'
  },
  {
    value: 'administrative',
    label: 'Administrative Team',
    description: 'Management and administrative functions',
    icon: Shield,
    color: 'bg-green-50 text-green-700'
  },
  {
    value: 'training',
    label: 'Training Team',
    description: 'Training delivery and curriculum management',
    icon: BookOpen,
    color: 'bg-purple-50 text-purple-700'
  },
  {
    value: 'provider_team',
    label: 'Provider Team',
    description: 'Authorized provider organization team',
    icon: Users,
    color: 'bg-orange-50 text-orange-700'
  },
  {
    value: 'compliance',
    label: 'Compliance Team',
    description: 'Quality assurance and compliance monitoring',
    icon: AlertTriangle,
    color: 'bg-red-50 text-red-700'
  },
  {
    value: 'support',
    label: 'Support Team',
    description: 'Technical and customer support functions',
    icon: Wrench,
    color: 'bg-gray-50 text-gray-700'
  }
];

export function StepBasicInfo({ formData, onUpdateFormData, errors }: StepBasicInfoProps) {
  const selectedTeamType = teamTypes.find(type => type.value === formData.team_type);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Basic Team Information</h3>
        <p className="text-sm text-muted-foreground">
          Start by defining the fundamental details about your team.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Team Name */}
        <div className="space-y-2">
          <Label htmlFor="team-name">
            Team Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="team-name"
            value={formData.name}
            onChange={(e) => onUpdateFormData({ name: e.target.value })}
            placeholder="Enter team name..."
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Choose a descriptive name that clearly identifies the team's purpose
          </p>
        </div>

        {/* Team Description */}
        <div className="space-y-2">
          <Label htmlFor="team-description">Description</Label>
          <Textarea
            id="team-description"
            value={formData.description}
            onChange={(e) => onUpdateFormData({ description: e.target.value })}
            placeholder="Describe the team's purpose and responsibilities..."
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Optional: Provide additional context about the team's role and objectives
          </p>
        </div>

        {/* Team Type Selection */}
        <div className="space-y-2">
          <Label>
            Team Type <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.team_type}
            onValueChange={(value) => onUpdateFormData({ team_type: value })}
          >
            <SelectTrigger className={errors.team_type ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select team type..." />
            </SelectTrigger>
            <SelectContent>
              {teamTypes.map((type) => {
                const IconComponent = type.icon;
                return (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {type.description}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {errors.team_type && (
            <p className="text-sm text-red-500">{errors.team_type}</p>
          )}
        </div>

        {/* Selected Team Type Preview */}
        {selectedTeamType && (
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <selectedTeamType.icon className="h-5 w-5" />
                {selectedTeamType.label}
                <Badge className={selectedTeamType.color}>
                  Selected
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {selectedTeamType.description}
              </p>
              
              {/* Team Type Specific Information */}
              {formData.team_type === 'provider_team' && (
                <div className="mt-3 p-3 bg-orange-50 rounded-md">
                  <p className="text-sm text-orange-800">
                    <strong>Note:</strong> Provider teams require association with an authorized provider organization.
                    You'll configure this in the next step.
                  </p>
                </div>
              )}
              
              {formData.team_type === 'compliance' && (
                <div className="mt-3 p-3 bg-red-50 rounded-md">
                  <p className="text-sm text-red-800">
                    <strong>Note:</strong> Compliance teams have special governance and audit trail requirements.
                    Additional permissions will be configured automatically.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
