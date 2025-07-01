
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Settings, Database, FileText, Eye, Edit, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ROLE_LABELS } from '@/lib/roles';

interface Permission {
  id: string;
  resource: string;
  action: string;
  description: string;
}

interface RolePermission {
  role: string;
  permissions: string[];
}

const AVAILABLE_PERMISSIONS: Permission[] = [
  { id: 'users.view', resource: 'users', action: 'view', description: 'View user profiles and information' },
  { id: 'users.create', resource: 'users', action: 'create', description: 'Create new user accounts' },
  { id: 'users.edit', resource: 'users', action: 'edit', description: 'Edit user profiles and settings' },
  { id: 'users.delete', resource: 'users', action: 'delete', description: 'Delete user accounts' },
  
  { id: 'certificates.view', resource: 'certificates', action: 'view', description: 'View certificates and requests' },
  { id: 'certificates.create', resource: 'certificates', action: 'create', description: 'Generate new certificates' },
  { id: 'certificates.approve', resource: 'certificates', action: 'approve', description: 'Approve certificate requests' },
  { id: 'certificates.revoke', resource: 'certificates', action: 'revoke', description: 'Revoke certificates' },
  
  { id: 'courses.view', resource: 'courses', action: 'view', description: 'View courses and schedules' },
  { id: 'courses.create', resource: 'courses', action: 'create', description: 'Create new courses' },
  { id: 'courses.edit', resource: 'courses', action: 'edit', description: 'Edit course details' },
  { id: 'courses.delete', resource: 'courses', action: 'delete', description: 'Delete courses' },
  
  { id: 'reports.view', resource: 'reports', action: 'view', description: 'View reports and analytics' },
  { id: 'reports.export', resource: 'reports', action: 'export', description: 'Export report data' },
  
  { id: 'system.config', resource: 'system', action: 'config', description: 'Manage system configuration' },
  { id: 'system.backup', resource: 'system', action: 'backup', description: 'Perform system backups' },
  { id: 'system.audit', resource: 'system', action: 'audit', description: 'View audit logs' },
];

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  SA: AVAILABLE_PERMISSIONS.map(p => p.id), // System Admin has all permissions
  AD: [
    'users.view', 'users.create', 'users.edit',
    'certificates.view', 'certificates.create', 'certificates.approve', 'certificates.revoke',
    'courses.view', 'courses.create', 'courses.edit',
    'reports.view', 'reports.export',
    'system.config', 'system.audit'
  ],
  AP: [
    'users.view',
    'certificates.view', 'certificates.create', 'certificates.approve',
    'courses.view', 'courses.create', 'courses.edit',
    'reports.view'
  ],
  IC: [
    'certificates.view',
    'courses.view',
    'reports.view'
  ],
  IP: [
    'certificates.view',
    'courses.view'
  ],
  IT: [
    'courses.view'
  ],
  IN: [
    'courses.view'
  ]
};

export const RolePermissionManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('permissions');
  const queryClient = useQueryClient();

  const { data: rolePermissions, isLoading } = useQuery({
    queryKey: ['role-permissions'],
    queryFn: async () => {
      // Since we don't have a role_permissions table yet, return default permissions
      return Object.entries(DEFAULT_ROLE_PERMISSIONS).map(([role, permissions]) => ({
        role,
        permissions
      }));
    }
  });

  const updateRolePermissions = useMutation({
    mutationFn: async ({ role, permissions }: { role: string; permissions: string[] }) => {
      // This would typically update a role_permissions table
      // For now, we'll simulate the update
      console.log(`Updating permissions for role ${role}:`, permissions);
      return { role, permissions };
    },
    onSuccess: (data) => {
      toast.success(`Permissions updated for ${ROLE_LABELS[data.role as keyof typeof ROLE_LABELS]}`);
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
    }
  });

  const getPermissionsByResource = () => {
    const resources = [...new Set(AVAILABLE_PERMISSIONS.map(p => p.resource))];
    return resources.reduce((acc, resource) => {
      acc[resource] = AVAILABLE_PERMISSIONS.filter(p => p.resource === resource);
      return acc;
    }, {} as Record<string, Permission[]>);
  };

  const hasPermission = (role: string, permissionId: string) => {
    const rolePermission = rolePermissions?.find(rp => rp.role === role);
    return rolePermission?.permissions.includes(permissionId) || false;
  };

  const togglePermission = (role: string, permissionId: string) => {
    const rolePermission = rolePermissions?.find(rp => rp.role === role);
    if (!rolePermission) return;

    const newPermissions = hasPermission(role, permissionId)
      ? rolePermission.permissions.filter(p => p !== permissionId)
      : [...rolePermission.permissions, permissionId];

    updateRolePermissions.mutate({ role, permissions: newPermissions });
  };

  const resourceIcons = {
    users: Users,
    certificates: FileText,
    courses: Database,
    reports: Eye,
    system: Settings
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading permissions...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Role & Permission Manager</h2>
        <p className="text-muted-foreground">Configure role-based access controls and permissions</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="permissions">Permissions Matrix</TabsTrigger>
          <TabsTrigger value="roles">Role Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="permissions" className="space-y-6">
          {Object.entries(getPermissionsByResource()).map(([resource, permissions]) => {
            const IconComponent = resourceIcons[resource as keyof typeof resourceIcons] || Shield;
            
            return (
              <Card key={resource}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconComponent className="h-5 w-5" />
                    {resource.charAt(0).toUpperCase() + resource.slice(1)} Permissions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="text-left p-2 border-b">Permission</th>
                          {Object.keys(ROLE_LABELS).map(role => (
                            <th key={role} className="text-center p-2 border-b min-w-20">
                              <Badge variant="outline">{role}</Badge>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {permissions.map(permission => (
                          <tr key={permission.id} className="hover:bg-muted/50">
                            <td className="p-2 border-b">
                              <div>
                                <div className="font-medium">{permission.action}</div>
                                <div className="text-sm text-muted-foreground">{permission.description}</div>
                              </div>
                            </td>
                            {Object.keys(ROLE_LABELS).map(role => (
                              <td key={role} className="text-center p-2 border-b">
                                <Switch
                                  checked={hasPermission(role, permission.id)}
                                  onCheckedChange={() => togglePermission(role, permission.id)}
                                  disabled={updateRolePermissions.isPending}
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(ROLE_LABELS).map(([roleKey, roleLabel]) => {
              const rolePermission = rolePermissions?.find(rp => rp.role === roleKey);
              const permissionCount = rolePermission?.permissions.length || 0;
              
              return (
                <Card key={roleKey}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        {roleLabel}
                      </div>
                      <Badge variant="secondary">{roleKey}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total Permissions</span>
                        <Badge>{permissionCount}</Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Assigned Permissions</Label>
                        <div className="flex flex-wrap gap-1">
                          {rolePermission?.permissions.slice(0, 6).map(permissionId => {
                            const permission = AVAILABLE_PERMISSIONS.find(p => p.id === permissionId);
                            return (
                              <Badge key={permissionId} variant="outline" className="text-xs">
                                {permission?.action}
                              </Badge>
                            );
                          })}
                          {(rolePermission?.permissions.length || 0) > 6 && (
                            <Badge variant="outline" className="text-xs">
                              +{(rolePermission?.permissions.length || 0) - 6} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
