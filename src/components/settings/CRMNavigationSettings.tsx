
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Settings, Save, RotateCcw } from 'lucide-react';
import { CRMNavigationService } from '@/services/navigation/crmNavigationService';
import { useToast } from '@/hooks/use-toast';

export const CRMNavigationSettings: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<string>('SA');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const roles = [
    { value: 'SA', label: 'System Admin', color: 'bg-red-100 text-red-800' },
    { value: 'AD', label: 'Admin', color: 'bg-orange-100 text-orange-800' },
    { value: 'AP', label: 'Authorized Provider', color: 'bg-blue-100 text-blue-800' },
    { value: 'IC', label: 'Instructor Certified', color: 'bg-green-100 text-green-800' },
    { value: 'IP', label: 'Instructor Provisional', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'IT', label: 'Instructor Trainee', color: 'bg-purple-100 text-purple-800' },
    { value: 'IN', label: 'Instructor New', color: 'bg-gray-100 text-gray-800' }
  ];

  const { data: crmConfig, isLoading } = useQuery({
    queryKey: ['crm-navigation-config', selectedRole],
    queryFn: () => CRMNavigationService.getCRMNavigationConfig(selectedRole)
  });

  const updateVisibilityMutation = useMutation({
    mutationFn: ({ itemName, isVisible }: { itemName: string; isVisible: boolean }) =>
      CRMNavigationService.updateCRMNavigationVisibility(selectedRole, itemName, isVisible),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-navigation-config'] });
      toast({
        title: 'Settings Updated',
        description: 'CRM navigation visibility has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: 'Failed to update CRM navigation settings. Please try again.',
        variant: 'destructive',
      });
      console.error('Error updating CRM navigation:', error);
    }
  });

  const initializeDefaultsMutation = useMutation({
    mutationFn: CRMNavigationService.initializeCRMNavigationDefaults,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-navigation-config'] });
      toast({
        title: 'Defaults Restored',
        description: 'CRM navigation defaults have been restored for all roles.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Restore Failed',
        description: 'Failed to restore CRM navigation defaults. Please try again.',
        variant: 'destructive',
      });
      console.error('Error restoring defaults:', error);
    }
  });

  const handleVisibilityChange = (itemName: string, isVisible: boolean) => {
    updateVisibilityMutation.mutate({ itemName, isVisible });
  };

  const handleRestoreDefaults = () => {
    initializeDefaultsMutation.mutate();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            CRM Navigation Settings
          </CardTitle>
          <CardDescription>Loading CRM navigation configuration...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-32"></div>
                  <div className="h-3 bg-muted rounded w-48"></div>
                </div>
                <div className="h-6 w-10 bg-muted rounded-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          CRM Navigation Settings
        </CardTitle>
        <CardDescription>
          Configure CRM navigation visibility for different user roles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Role Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Role to Configure</label>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  <div className="flex items-center gap-2">
                    <Badge className={role.color}>{role.value}</Badge>
                    <span>{role.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* CRM Navigation Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">CRM Navigation Items</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRestoreDefaults}
              disabled={initializeDefaultsMutation.isPending}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore Defaults
            </Button>
          </div>

          {!crmConfig?.isEnabled ? (
            <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <span className="text-amber-800">
                CRM navigation is not enabled for the <strong>{selectedRole}</strong> role.
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              {CRMNavigationService.getAllCRMItems().map((item) => {
                const isVisible = crmConfig?.visibleItems.some(visibleItem => visibleItem.name === item.name) || false;
                const hasRoleAccess = item.requiredRoles.includes(selectedRole);
                
                return (
                  <div
                    key={item.name}
                    className={`flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                      !hasRoleAccess ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {item.path}
                        </Badge>
                        {!hasRoleAccess && (
                          <Badge variant="destructive" className="text-xs">
                            No Role Access
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Required roles: {item.requiredRoles.join(', ')}
                      </p>
                    </div>
                    <Switch
                      checked={isVisible && hasRoleAccess}
                      onCheckedChange={(checked) => handleVisibilityChange(item.name, checked)}
                      disabled={updateVisibilityMutation.isPending || !hasRoleAccess}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Information Panel */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Role-Based Access Information</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>SA/AD:</strong> Full CRM access including revenue analytics</li>
            <li>• <strong>AP/IC:</strong> Lead management and opportunities access</li>
            <li>• <strong>IP/IT:</strong> Limited to activities and basic CRM functions</li>
            <li>• <strong>IN:</strong> No CRM access by default</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
