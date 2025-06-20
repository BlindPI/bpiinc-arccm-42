
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Settings, FileCheck, MapPin, AlertTriangle } from 'lucide-react';

interface TeamFormData {
  name: string;
  description: string;
  team_type: string;
  location_id: string;
  assigned_ap_user_id: string; // UPDATED: AP user assignment
  permissions: Record<string, boolean>;
}

interface StepPermissionsProps {
  formData: TeamFormData;
  onUpdateFormData: (updates: Partial<TeamFormData>) => void;
  userRole?: string;
}

const permissionGroups = [
  {
    id: 'member_management',
    title: 'Member Management',
    icon: Users,
    permissions: [
      {
        key: 'can_manage_members',
        label: 'Manage Team Members',
        description: 'Add, remove, and update team member roles',
        riskLevel: 'medium'
      },
      {
        key: 'can_invite_members',
        label: 'Invite New Members',
        description: 'Send invitations to new team members',
        riskLevel: 'low'
      }
    ]
  },
  {
    id: 'course_management',
    title: 'Course Management',
    icon: FileCheck,
    permissions: [
      {
        key: 'can_manage_courses',
        label: 'Manage Courses',
        description: 'Create, edit, and schedule courses',
        riskLevel: 'medium'
      },
      {
        key: 'can_approve_certificates',
        label: 'Approve Certificates',
        description: 'Review and approve certificate requests',
        riskLevel: 'high'
      }
    ]
  },
  {
    id: 'analytics',
    title: 'Analytics & Reporting',
    icon: Shield,
    permissions: [
      {
        key: 'can_view_analytics',
        label: 'View Analytics',
        description: 'Access team performance and analytics data',
        riskLevel: 'low'
      },
      {
        key: 'can_export_data',
        label: 'Export Data',
        description: 'Export team and performance data',
        riskLevel: 'medium'
      }
    ]
  },
  {
    id: 'administration',
    title: 'Team Administration',
    icon: Settings,
    permissions: [
      {
        key: 'can_manage_settings',
        label: 'Manage Team Settings',
        description: 'Configure team settings and preferences',
        riskLevel: 'high'
      },
      {
        key: 'can_manage_locations',
        label: 'Manage Locations',
        description: 'Assign and manage team locations',
        riskLevel: 'high'
      }
    ]
  }
];

export function StepPermissions({ formData, onUpdateFormData, userRole }: StepPermissionsProps) {
  const updatePermission = (key: string, enabled: boolean) => {
    onUpdateFormData({
      permissions: {
        ...formData.permissions,
        [key]: enabled
      }
    });
  };

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'outline';
      case 'medium': return 'secondary';
      case 'high': return 'destructive';
      default: return 'outline';
    }
  };

  const canGrantHighRiskPermissions = ['SA', 'AD'].includes(userRole || '');
  const enabledPermissions = Object.entries(formData.permissions).filter(([_, enabled]) => enabled);
  const highRiskPermissions = enabledPermissions.filter(([key]) => {
    const permission = permissionGroups
      .flatMap(group => group.permissions)
      .find(p => p.key === key);
    return permission?.riskLevel === 'high';
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Team Permissions</h3>
        <p className="text-sm text-muted-foreground">
          Configure the capabilities and permissions for this team. Higher-risk permissions may require additional approval.
        </p>
      </div>

      <div className="grid gap-6">
        {permissionGroups.map((group) => {
          const IconComponent = group.icon;
          return (
            <Card key={group.id}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <IconComponent className="h-5 w-5" />
                  {group.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {group.permissions.map((permission) => {
                  const isEnabled = formData.permissions[permission.key] || false;
                  const isHighRisk = permission.riskLevel === 'high';
                  const canToggle = !isHighRisk || canGrantHighRiskPermissions;

                  return (
                    <div key={permission.key} className="flex items-start justify-between space-x-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={permission.key} className="text-sm font-medium">
                            {permission.label}
                          </Label>
                          <Badge variant={getRiskBadgeVariant(permission.riskLevel)}>
                            {permission.riskLevel} risk
                          </Badge>
                          {isHighRisk && !canGrantHighRiskPermissions && (
                            <Badge variant="outline" className="text-xs">
                              Admin Only
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {permission.description}
                        </p>
                      </div>
                      <Switch
                        id={permission.key}
                        checked={isEnabled}
                        onCheckedChange={(checked) => updatePermission(permission.key, checked)}
                        disabled={!canToggle}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}

        {/* Permission Summary */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">Permission Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Permissions:</span>
                <span>{enabledPermissions.length}</span>
              </div>
              <div className="flex justify-between">
                <span>High-Risk Permissions:</span>
                <span className={highRiskPermissions.length > 0 ? 'text-red-600' : 'text-green-600'}>
                  {highRiskPermissions.length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* High-Risk Warning */}
        {highRiskPermissions.length > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-amber-800">High-Risk Permissions Enabled</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    This team will have {highRiskPermissions.length} high-risk permission(s). 
                    Ensure team members are properly trained and authorized.
                  </p>
                  <ul className="mt-2 text-xs text-amber-600">
                    {highRiskPermissions.map(([key]) => {
                      const permission = permissionGroups
                        .flatMap(group => group.permissions)
                        .find(p => p.key === key);
                      return (
                        <li key={key}>• {permission?.label}</li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Role-based Information */}
        {!canGrantHighRiskPermissions && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800">Permission Restrictions</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Some high-risk permissions are restricted to System Administrators and Admins. 
                    Contact your administrator if you need these permissions enabled.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
