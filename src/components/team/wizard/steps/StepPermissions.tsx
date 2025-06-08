
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  BookOpen, 
  BarChart3, 
  Settings, 
  Award, 
  MapPin,
  Shield,
  AlertTriangle
} from 'lucide-react';

interface TeamFormData {
  name: string;
  description: string;
  team_type: string;
  location_id: string;
  provider_id: string;
  permissions: {
    can_manage_members: boolean;
    can_manage_courses: boolean;
    can_view_analytics: boolean;
    can_manage_settings: boolean;
    can_approve_certificates: boolean;
    can_manage_locations: boolean;
  };
}

interface StepPermissionsProps {
  formData: TeamFormData;
  onUpdateFormData: (updates: Partial<TeamFormData>) => void;
  userRole?: string;
}

const permissionConfigs = {
  can_manage_members: {
    icon: Users,
    label: 'Manage Team Members',
    description: 'Add, remove, and modify team member roles and permissions',
    category: 'Team Management',
    risk: 'medium'
  },
  can_manage_courses: {
    icon: BookOpen,
    label: 'Manage Courses',
    description: 'Create, edit, and schedule training courses and programs',
    category: 'Training',
    risk: 'medium'
  },
  can_view_analytics: {
    icon: BarChart3,
    label: 'View Analytics',
    description: 'Access performance reports, metrics, and team analytics',
    category: 'Analytics',
    risk: 'low'
  },
  can_manage_settings: {
    icon: Settings,
    label: 'Manage Team Settings',
    description: 'Configure team preferences, notifications, and operational settings',
    category: 'Administration',
    risk: 'high'
  },
  can_approve_certificates: {
    icon: Award,
    label: 'Approve Certificates',
    description: 'Review and approve certificate issuance and verification requests',
    category: 'Certification',
    risk: 'high'
  },
  can_manage_locations: {
    icon: MapPin,
    label: 'Manage Locations',
    description: 'Add, modify, and assign team members to different locations',
    category: 'Location Management',
    risk: 'high'
  }
};

const getRecommendedPermissions = (teamType: string, userRole: string) => {
  const basePermissions = {
    can_manage_members: true,
    can_view_analytics: true,
    can_manage_courses: false,
    can_manage_settings: false,
    can_approve_certificates: false,
    can_manage_locations: false
  };

  switch (teamType) {
    case 'operational':
      return {
        ...basePermissions,
        can_manage_courses: true
      };
    case 'administrative':
      return {
        ...basePermissions,
        can_manage_settings: ['SA', 'AD'].includes(userRole),
        can_approve_certificates: true
      };
    case 'training':
      return {
        ...basePermissions,
        can_manage_courses: true,
        can_approve_certificates: true
      };
    case 'provider_team':
      return {
        ...basePermissions,
        can_manage_courses: true,
        can_approve_certificates: false
      };
    case 'compliance':
      return {
        ...basePermissions,
        can_approve_certificates: true,
        can_manage_settings: ['SA', 'AD'].includes(userRole)
      };
    case 'support':
      return {
        ...basePermissions,
        can_manage_settings: false
      };
    default:
      return basePermissions;
  }
};

export function StepPermissions({ formData, onUpdateFormData, userRole = 'IT' }: StepPermissionsProps) {
  const recommendedPermissions = getRecommendedPermissions(formData.team_type, userRole);
  
  const handlePermissionChange = (permission: string, enabled: boolean) => {
    onUpdateFormData({
      permissions: {
        ...formData.permissions,
        [permission]: enabled
      }
    });
  };

  const applyRecommended = () => {
    onUpdateFormData({
      permissions: { ...formData.permissions, ...recommendedPermissions }
    });
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const groupedPermissions = Object.entries(permissionConfigs).reduce((acc, [key, config]) => {
    if (!acc[config.category]) acc[config.category] = [];
    acc[config.category].push({ key, config });
    return acc;
  }, {} as Record<string, Array<{ key: string; config: any }>>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-2">Team Permissions</h3>
          <p className="text-sm text-muted-foreground">
            Configure what this team can do within the system.
          </p>
        </div>
        <button
          type="button"
          onClick={applyRecommended}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
        >
          Apply Recommended
        </button>
      </div>

      {/* Recommended Settings Card */}
      {formData.team_type && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Recommended for {formData.team_type.replace('_', ' ')} Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(recommendedPermissions)
                .filter(([_, enabled]) => enabled)
                .map(([permission]) => {
                  const config = permissionConfigs[permission as keyof typeof permissionConfigs];
                  return (
                    <Badge key={permission} variant="outline" className="text-xs">
                      {config.label}
                    </Badge>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Permission Categories */}
      <div className="space-y-6">
        {Object.entries(groupedPermissions).map(([category, permissions]) => (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{category}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {permissions.map(({ key, config }) => {
                const IconComponent = config.icon;
                const isEnabled = formData.permissions[key as keyof typeof formData.permissions];
                const isRecommended = recommendedPermissions[key as keyof typeof recommendedPermissions];
                
                return (
                  <div key={key} className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="flex items-start gap-3 flex-1">
                      <IconComponent className="h-5 w-5 mt-0.5 text-gray-600" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Label className="font-medium">{config.label}</Label>
                          <Badge className={getRiskColor(config.risk)}>
                            {config.risk} risk
                          </Badge>
                          {isRecommended && (
                            <Badge variant="outline" className="text-xs">
                              recommended
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {config.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => handlePermissionChange(key, checked)}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Role-specific Warnings */}
      {userRole && !['SA', 'AD'].includes(userRole) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-amber-800">Permission Limitations</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Some high-risk permissions may require administrator approval or may be restricted based on your role.
                  High-risk permissions include team settings management and location management.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Permission Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            <strong>Enabled Permissions:</strong> {' '}
            {Object.entries(formData.permissions).filter(([_, enabled]) => enabled).length} of {Object.keys(formData.permissions).length}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.entries(formData.permissions)
              .filter(([_, enabled]) => enabled)
              .map(([permission]) => {
                const config = permissionConfigs[permission as keyof typeof permissionConfigs];
                return (
                  <Badge key={permission} variant="secondary" className="text-xs">
                    {config.label}
                  </Badge>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
