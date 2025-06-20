
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  MapPin, 
  Building2, 
  Shield, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  User
} from 'lucide-react';

interface TeamFormData {
  name: string;
  description: string;
  team_type: string;
  location_id: string;
  assigned_ap_user_id: string; // UPDATED: AP user assignment
  permissions: Record<string, boolean>;
}

interface StepReviewProps {
  formData: TeamFormData;
  locationName?: string;
  providerName?: string;
}

const teamTypeLabels = {
  operational: 'Operational Team',
  administrative: 'Administrative Team',
  training: 'Training Team',
  provider_team: 'AP User Team',
  compliance: 'Compliance Team',
  support: 'Support Team'
};

const permissionLabels = {
  can_manage_members: 'Manage Team Members',
  can_manage_courses: 'Manage Courses',
  can_view_analytics: 'View Analytics',
  can_manage_settings: 'Manage Team Settings',
  can_approve_certificates: 'Approve Certificates',
  can_manage_locations: 'Manage Locations'
};

export function StepReview({ formData, locationName, providerName }: StepReviewProps) {
  const enabledPermissions = Object.entries(formData.permissions)
    .filter(([_, enabled]) => enabled)
    .map(([key]) => key);

  const hasHighRiskPermissions = enabledPermissions.some(perm => 
    ['can_manage_settings', 'can_approve_certificates', 'can_manage_locations'].includes(perm)
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Review Team Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Please review all settings before creating your team. You can modify these later if needed.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Team Name</Label>
              <p className="text-sm text-muted-foreground">{formData.name}</p>
            </div>
            {formData.description && (
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm text-muted-foreground">{formData.description}</p>
              </div>
            )}
            <div>
              <Label className="text-sm font-medium">Team Type</Label>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {teamTypeLabels[formData.team_type as keyof typeof teamTypeLabels] || formData.team_type}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location & Provider */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location & AP User
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Primary Location</Label>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{locationName || 'Loading...'}</span>
              </div>
            </div>
            {formData.assigned_ap_user_id && (
              <div>
                <Label className="text-sm font-medium">Assigned AP User</Label>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{providerName || 'Loading...'}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Team Permissions
              {hasHighRiskPermissions && (
                <Badge className="bg-amber-100 text-amber-800">
                  High Risk
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {enabledPermissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No permissions enabled</p>
            ) : (
              <div className="space-y-2">
                {enabledPermissions.map((permission) => (
                  <div key={permission} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">
                      {permissionLabels[permission as keyof typeof permissionLabels] || permission}
                    </span>
                    {['can_manage_settings', 'can_approve_certificates', 'can_manage_locations'].includes(permission) && (
                      <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                        High Risk
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Warnings and Information */}
        {hasHighRiskPermissions && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-amber-800">High-Risk Permissions Enabled</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    This team will have access to sensitive operations. Ensure team members are properly trained 
                    and authorized before granting access to these capabilities.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Next Steps After Creation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-green-700">
              <li className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Add team members and assign roles
              </li>
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Configure additional team settings and preferences
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Set up team workflows and approval processes
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Creation Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Team Type:</span>
                <br />
                <span className="text-muted-foreground">
                  {teamTypeLabels[formData.team_type as keyof typeof teamTypeLabels]}
                </span>
              </div>
              <div>
                <span className="font-medium">Permissions:</span>
                <br />
                <span className="text-muted-foreground">
                  {enabledPermissions.length} enabled
                </span>
              </div>
              <div>
                <span className="font-medium">Location Assignment:</span>
                <br />
                <span className="text-muted-foreground">
                  {locationName ? 'Configured' : 'Pending'}
                </span>
              </div>
              <div>
                <span className="font-medium">AP User Assignment:</span>
                <br />
                <span className="text-muted-foreground">
                  {formData.assigned_ap_user_id ? apUserName || 'Configured' : 'None'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={className}>{children}</div>;
}
