import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Settings, Save, RotateCcw, Briefcase } from 'lucide-react';
import { useNavigationVisibility } from '@/hooks/useNavigationVisibility';
import { toast } from 'sonner';

export const CRMNavigationSettings: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<string>('SA');
  const { 
    getNavigationConfigForRole, 
    updateNavigationConfig, 
    isLoading 
  } = useNavigationVisibility();

  const roles = [
    { value: 'SA', label: 'System Admin', color: 'bg-red-100 text-red-800' },
    { value: 'AD', label: 'Admin', color: 'bg-orange-100 text-orange-800' },
    { value: 'AP', label: 'Authorized Provider', color: 'bg-blue-100 text-blue-800' },
    { value: 'IC', label: 'Instructor Certified', color: 'bg-green-100 text-green-800' },
    { value: 'IP', label: 'Instructor Provisional', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'IT', label: 'Instructor Trainee', color: 'bg-purple-100 text-purple-800' },
    { value: 'IN', label: 'Instructor New', color: 'bg-gray-100 text-gray-800' }
  ];

  const crmItems = [
    { name: 'CRM Dashboard', key: 'CRM Dashboard', description: 'Main CRM overview and dashboard' },
    { name: 'Lead Management', key: 'Lead Management', description: 'Manage leads and prospects' },
    { name: 'Opportunities', key: 'Opportunities', description: 'Track sales opportunities' },
    { name: 'Activities', key: 'Activities', description: 'Manage CRM activities and tasks' },
    { name: 'Revenue Analytics', key: 'Revenue Analytics', description: 'Revenue reporting and analytics' }
  ];

  // Get current navigation config for selected role
  const currentConfig = getNavigationConfigForRole(selectedRole);
  const crmGroupConfig = currentConfig?.['CRM'];

  const handleCRMGroupToggle = (enabled: boolean) => {
    if (!currentConfig) {
      toast.error('Unable to load navigation configuration');
      return;
    }

    const newConfig = {
      ...currentConfig,
      'CRM': {
        ...crmGroupConfig,
        enabled: enabled,
        items: crmGroupConfig?.items || {
          'CRM Dashboard': enabled,
          'Lead Management': enabled,
          'Opportunities': enabled,
          'Activities': enabled,
          'Revenue Analytics': enabled
        }
      }
    };

    updateNavigationConfig.mutate({
      role: selectedRole,
      newConfig
    });
  };

  const handleCRMItemToggle = (itemName: string, enabled: boolean) => {
    if (!currentConfig || !crmGroupConfig) {
      toast.error('Unable to load CRM configuration');
      return;
    }

    const newConfig = {
      ...currentConfig,
      'CRM': {
        ...crmGroupConfig,
        items: {
          ...crmGroupConfig.items,
          [itemName]: enabled
        }
      }
    };

    updateNavigationConfig.mutate({
      role: selectedRole,
      newConfig
    });
  };

  const handleRestoreDefaults = () => {
    if (!currentConfig) {
      toast.error('Unable to load navigation configuration');
      return;
    }

    // Default CRM settings based on role
    const getDefaultCRMConfig = (role: string) => {
      switch (role) {
        case 'SA':
        case 'AD':
          return {
            enabled: true,
            items: {
              'CRM Dashboard': true,
              'Lead Management': true,
              'Opportunities': true,
              'Activities': true,
              'Revenue Analytics': true
            }
          };
        case 'AP':
        case 'IC':
          return {
            enabled: true,
            items: {
              'CRM Dashboard': true,
              'Lead Management': true,
              'Opportunities': true,
              'Activities': true,
              'Revenue Analytics': false
            }
          };
        case 'IP':
        case 'IT':
          return {
            enabled: true,
            items: {
              'CRM Dashboard': false,
              'Lead Management': false,
              'Opportunities': false,
              'Activities': true,
              'Revenue Analytics': false
            }
          };
        default:
          return {
            enabled: false,
            items: {
              'CRM Dashboard': false,
              'Lead Management': false,
              'Opportunities': false,
              'Activities': false,
              'Revenue Analytics': false
            }
          };
      }
    };

    const newConfig = {
      ...currentConfig,
      'CRM': getDefaultCRMConfig(selectedRole)
    };

    updateNavigationConfig.mutate({
      role: selectedRole,
      newConfig
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
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
          <Briefcase className="h-5 w-5" />
          CRM Navigation Settings
        </CardTitle>
        <CardDescription>
          Configure CRM module access and navigation visibility for different user roles
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

        {/* CRM Master Control */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">CRM Module Control</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRestoreDefaults}
              disabled={updateNavigationConfig.isPending}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore Defaults
            </Button>
          </div>

          {/* Master CRM Toggle */}
          <div className="p-4 border-2 border-dashed border-primary/20 rounded-lg bg-primary/5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-primary">Enable CRM Module</span>
                  <Badge variant={crmGroupConfig?.enabled ? "default" : "secondary"}>
                    {crmGroupConfig?.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Master control for CRM module access for <strong>{selectedRole}</strong> role
                </p>
              </div>
              <Switch
                checked={crmGroupConfig?.enabled || false}
                onCheckedChange={handleCRMGroupToggle}
                disabled={updateNavigationConfig.isPending}
              />
            </div>
          </div>

          {/* CRM Items Control */}
          {crmGroupConfig?.enabled ? (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">CRM Features Access</h4>
              {crmItems.map((item) => {
                const isVisible = crmGroupConfig?.items?.[item.key] || false;
                
                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {item.key}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <Switch
                      checked={isVisible}
                      onCheckedChange={(checked) => handleCRMItemToggle(item.key, checked)}
                      disabled={updateNavigationConfig.isPending}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <span className="text-amber-800">
                CRM module is disabled for the <strong>{selectedRole}</strong> role. Enable the CRM module above to configure individual features.
              </span>
            </div>
          )}
        </div>

        {/* Information Panel */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Role-Based CRM Access Guidelines</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>SA/AD:</strong> Full CRM access including revenue analytics and system controls</li>
            <li>• <strong>AP/IC:</strong> Lead management and opportunities access for business development</li>
            <li>• <strong>IP/IT:</strong> Limited to activities and basic CRM functions for training coordination</li>
            <li>• <strong>IN:</strong> No CRM access by default - focus on learning and development</li>
          </ul>
        </div>

        {/* Current Status */}
        <div className="p-4 bg-gray-50 border rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Current CRM Status for {selectedRole}</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Module Status:</span>
              <Badge className={crmGroupConfig?.enabled ? "bg-green-100 text-green-800 ml-2" : "bg-red-100 text-red-800 ml-2"}>
                {crmGroupConfig?.enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div>
              <span className="text-gray-600">Active Features:</span>
              <span className="ml-2 font-medium">
                {crmGroupConfig?.enabled 
                  ? Object.values(crmGroupConfig.items || {}).filter(Boolean).length 
                  : 0} / {crmItems.length}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
