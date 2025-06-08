
import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, Settings, FileText } from 'lucide-react';

interface PermissionsFormData {
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
  formData: PermissionsFormData;
  onUpdateFormData: (data: Partial<PermissionsFormData>) => void;
  userRole: string;
}

export function StepPermissions({ formData, onUpdateFormData, userRole }: StepPermissionsProps) {
  const updatePermission = (key: string, value: boolean) => {
    onUpdateFormData({
      permissions: {
        ...formData.permissions,
        [key]: value
      }
    });
  };

  const permissionGroups = [
    {
      title: 'Member Management',
      icon: Users,
      permissions: [
        { key: 'can_manage_members', label: 'Manage team members', description: 'Add, remove, and modify team member roles' }
      ]
    },
    {
      title: 'Course & Training',
      icon: FileText,
      permissions: [
        { key: 'can_manage_courses', label: 'Manage courses', description: 'Create and modify training courses' },
        { key: 'can_approve_certificates', label: 'Approve certificates', description: 'Review and approve certificate requests' }
      ]
    },
    {
      title: 'Analytics & Reporting',
      icon: Settings,
      permissions: [
        { key: 'can_view_analytics', label: 'View analytics', description: 'Access team performance and analytics data' }
      ]
    },
    {
      title: 'Administrative',
      icon: Shield,
      permissions: [
        { key: 'can_manage_settings', label: 'Manage settings', description: 'Modify team configuration and settings' },
        ...(userRole === 'SA' ? [{ key: 'can_manage_locations', label: 'Manage locations', description: 'Add and modify location assignments' }] : [])
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {permissionGroups.map((group) => {
        const IconComponent = group.icon;
        return (
          <Card key={group.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconComponent className="h-5 w-5" />
                {group.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {group.permissions.map((permission) => (
                <div key={permission.key} className="flex items-center justify-between space-x-2">
                  <div className="flex-1">
                    <Label htmlFor={permission.key} className="text-sm font-medium">
                      {permission.label}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {permission.description}
                    </p>
                  </div>
                  <Switch
                    id={permission.key}
                    checked={formData.permissions[permission.key as keyof typeof formData.permissions]}
                    onCheckedChange={(checked) => updatePermission(permission.key, checked)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
