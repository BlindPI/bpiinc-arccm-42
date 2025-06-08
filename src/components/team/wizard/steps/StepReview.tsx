
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Users, MapPin, Building2, Shield } from 'lucide-react';

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Review Team Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <Users className="h-4 w-4" />
                Basic Information
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <span className="ml-2 font-medium">{formData.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <Badge variant="outline" className="ml-2">
                    {teamTypeLabels[formData.team_type] || formData.team_type}
                  </Badge>
                </div>
                {formData.description && (
                  <div>
                    <span className="text-muted-foreground">Description:</span>
                    <p className="ml-2 text-sm">{formData.description}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4" />
                Location & Provider
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Location:</span>
                  <span className="ml-2 font-medium">{locationName || 'Not assigned'}</span>
                </div>
                {formData.provider_id && (
                  <div>
                    <span className="text-muted-foreground">Provider:</span>
                    <span className="ml-2 font-medium flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {providerName || 'Unknown Provider'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium flex items-center gap-2 mb-2">
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
        </CardContent>
      </Card>
    </div>
  );
}
