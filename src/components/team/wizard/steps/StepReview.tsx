
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Users, MapPin, Building2, Shield, AlertCircle } from 'lucide-react';

interface StepReviewProps {
  formData: {
    name: string;
    description: string;
    team_type: string;
    location_id: string;
    provider_id: string;
    permissions: Record<string, boolean>;
  };
  locationName?: string;
  providerName?: string;
}

export function StepReview({ formData, locationName, providerName }: StepReviewProps) {
  const enabledPermissions = Object.entries(formData.permissions)
    .filter(([_, enabled]) => enabled)
    .map(([key]) => key.replace('can_', '').replace(/_/g, ' '));

  const teamTypeLabels: Record<string, string> = {
    operational: 'Operational Team',
    administrative: 'Administrative Team',
    training: 'Training Team',
    provider_team: 'Provider Team',
    compliance: 'Compliance Team',
    support: 'Support Team'
  };

  const hasRequiredFields = formData.name && formData.team_type && formData.location_id;

  return (
    <div className="space-y-6">
      {/* Validation Summary */}
      {!hasRequiredFields && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Please complete all required fields before creating the team
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Review Team Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div>
              <h4 className="font-medium flex items-center gap-2 mb-3">
                <Users className="h-4 w-4" />
                Basic Information
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{formData.name || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge variant="outline">
                    {teamTypeLabels[formData.team_type] || formData.team_type || 'Not selected'}
                  </Badge>
                </div>
                {formData.description && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Description:</span>
                    <p className="text-sm bg-gray-50 p-2 rounded">{formData.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Location & Provider */}
            <div>
              <h4 className="font-medium flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4" />
                Location & Provider
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium">{locationName || 'Not assigned'}</span>
                </div>
                {formData.provider_id && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Provider:</span>
                    <span className="font-medium flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {providerName || 'Unknown Provider'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Team Permissions */}
          <div>
            <h4 className="font-medium flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4" />
              Team Permissions
            </h4>
            <div className="flex flex-wrap gap-2">
              {enabledPermissions.length > 0 ? (
                enabledPermissions.map((permission) => (
                  <Badge key={permission} variant="secondary" className="text-xs">
                    {permission.charAt(0).toUpperCase() + permission.slice(1)}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No special permissions assigned</span>
              )}
            </div>
          </div>

          {/* Creation Summary */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Team will be created with the specified configuration</li>
              <li>• You will be added as the team administrator</li>
              <li>• Team lifecycle events will be logged for audit purposes</li>
              {formData.permissions.can_manage_members && (
                <li>• You can immediately start adding team members</li>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
