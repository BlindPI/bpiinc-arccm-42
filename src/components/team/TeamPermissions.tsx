
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Shield, Users, Settings, Eye, Edit, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
}

interface TeamPermissionsProps {
  teamId: string;
}

export function TeamPermissions({ teamId }: TeamPermissionsProps) {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ['team-permissions', teamId],
    queryFn: async () => {
      // Mock permissions data - in a real app, this would come from the database
      return [
        {
          id: '1',
          name: 'View Team Members',
          description: 'Can view all team members and their profiles',
          category: 'members',
          enabled: true
        },
        {
          id: '2',
          name: 'Manage Team Members',
          description: 'Can add, remove, and modify team member roles',
          category: 'members',
          enabled: false
        },
        {
          id: '3',
          name: 'View Team Settings',
          description: 'Can view team configuration and settings',
          category: 'settings',
          enabled: true
        },
        {
          id: '4',
          name: 'Modify Team Settings',
          description: 'Can change team name, description, and configuration',
          category: 'settings',
          enabled: false
        },
        {
          id: '5',
          name: 'View Supervision Relationships',
          description: 'Can view team supervision hierarchies',
          category: 'supervision',
          enabled: true
        },
        {
          id: '6',
          name: 'Manage Supervision',
          description: 'Can create and modify supervision relationships',
          category: 'supervision',
          enabled: false
        }
      ] as Permission[];
    }
  });

  const updatePermission = useMutation({
    mutationFn: async ({ permissionId, enabled }: { permissionId: string, enabled: boolean }) => {
      // Mock update - in a real app, this would update the database
      await new Promise(resolve => setTimeout(resolve, 500));
      return { permissionId, enabled };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['team-permissions', teamId]);
      toast.success('Permission updated successfully');
    },
    onError: () => {
      toast.error('Failed to update permission');
    }
  });

  const categories = [
    { id: 'all', name: 'All Permissions', icon: Shield },
    { id: 'members', name: 'Member Management', icon: Users },
    { id: 'settings', name: 'Team Settings', icon: Settings },
    { id: 'supervision', name: 'Supervision', icon: Eye }
  ];

  const filteredPermissions = selectedCategory === 'all' 
    ? permissions 
    : permissions.filter(p => p.category === selectedCategory);

  const getPermissionIcon = (category: string) => {
    switch (category) {
      case 'members': return Users;
      case 'settings': return Settings;
      case 'supervision': return Eye;
      default: return Shield;
    }
  };

  const handlePermissionToggle = (permissionId: string, enabled: boolean) => {
    updatePermission.mutate({ permissionId, enabled });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading permissions...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Team Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map(category => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {category.name}
                </Button>
              );
            })}
          </div>

          {/* Permissions List */}
          <div className="space-y-4">
            {filteredPermissions.map(permission => {
              const Icon = getPermissionIcon(permission.category);
              return (
                <div
                  key={permission.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                >
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 text-blue-500 mt-1" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{permission.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {permission.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {permission.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label htmlFor={`permission-${permission.id}`} className="text-sm">
                      {permission.enabled ? 'Enabled' : 'Disabled'}
                    </Label>
                    <Switch
                      id={`permission-${permission.id}`}
                      checked={permission.enabled}
                      onCheckedChange={(checked) => handlePermissionToggle(permission.id, checked)}
                      disabled={updatePermission.isPending}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {filteredPermissions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No permissions found for this category.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
