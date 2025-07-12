
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Mail, 
  Globe, 
  Settings, 
  Save,
  Loader2
} from "lucide-react";
import { 
  useNotificationPreferences, 
  useNotificationTypes,
  useUpdateNotificationPreferences 
} from '@/hooks/useNotifications';
import { toast } from 'sonner';

export function NotificationPreferencesPanel() {
  const { data: preferences = [], isLoading: preferencesLoading } = useNotificationPreferences();
  const { data: notificationTypes = [], isLoading: typesLoading } = useNotificationTypes();
  const updatePreferences = useUpdateNotificationPreferences();
  
  const [localPreferences, setLocalPreferences] = useState<Record<string, {
    in_app_enabled: boolean;
    email_enabled: boolean;
    browser_enabled: boolean;
  }>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize local preferences when data loads - group by category
  React.useEffect(() => {
    if (preferences.length > 0) {
      const prefMap = preferences.reduce((acc, pref) => {
        const category = (pref as any).category || 'general';
        acc[category] = {
          in_app_enabled: (pref as any).in_app_enabled || false,
          email_enabled: (pref as any).email_enabled || false,
          browser_enabled: (pref as any).browser_enabled || false,
        };
        return acc;
      }, {} as Record<string, any>);
      setLocalPreferences(prefMap);
      setHasChanges(false);
    }
  }, [preferences]);

  const handlePreferenceChange = (category: string, field: string, value: boolean) => {
    setLocalPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      console.log('🔍 Saving notification preferences by category:', localPreferences);
      
      const savePromises = Object.entries(localPreferences).map(([category, prefs]) => {
        console.log('🔍 Updating preferences for category:', category, prefs);
        return updatePreferences.mutateAsync({
          category: category,
          updates: prefs
        });
      });

      await Promise.all(savePromises);
      setHasChanges(false);
      toast.success('Notification preferences updated successfully');
    } catch (error: any) {
      console.error('🔍 Failed to save notification preferences:', error);
      toast.error(`Failed to update preferences: ${error.message}`);
    }
  };

  const handleReset = () => {
    // Reset to original preferences
    if (preferences.length > 0) {
      const prefMap = preferences.reduce((acc, pref) => {
        const category = (pref as any).category || 'general';
        acc[category] = {
          in_app_enabled: (pref as any).in_app_enabled || false,
          email_enabled: (pref as any).email_enabled || false,
          browser_enabled: (pref as any).browser_enabled || false,
        };
        return acc;
      }, {} as Record<string, any>);
      setLocalPreferences(prefMap);
      setHasChanges(false);
      toast.info('Changes reset to saved preferences');
    }
  };

  if (preferencesLoading || typesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Group notification types by category
  const groupedTypes = notificationTypes.reduce((acc, type) => {
    const category = (type as any).category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(type);
    return acc;
  }, {} as Record<string, typeof notificationTypes>);

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      {/* Save/Reset Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Notification Preferences</h3>
          <p className="text-sm text-muted-foreground">
            Control how you receive notifications across different channels
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {hasChanges && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              Unsaved Changes
            </Badge>
          )}
          <Button 
            variant="outline" 
            onClick={handleReset} 
            disabled={!hasChanges || updatePreferences.isPending}
          >
            Reset
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!hasChanges || updatePreferences.isPending}
            className="gap-2"
          >
            {updatePreferences.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {updatePreferences.isPending ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </div>

      {/* Global Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5" />
            Global Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Browser Notifications</Label>
              <div className="text-sm text-gray-500">
                Enable desktop notifications in your browser
              </div>
            </div>
            <Switch
              checked={true}
              onCheckedChange={() => {
                if (window.Notification) {
                  window.Notification.requestPermission();
                }
              }}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Email Digest</Label>
              <div className="text-sm text-gray-500">
                Receive daily summary of notifications
              </div>
            </div>
            <Switch defaultChecked={true} />
          </div>
        </CardContent>
      </Card>

      {/* Notification Category Preferences */}
      {Object.entries(groupedTypes).map(([category, types]) => {
        const categoryPrefs = localPreferences[category] || {
          in_app_enabled: true,
          email_enabled: true,
          browser_enabled: true
        };

        return (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg capitalize">
                {category.toLowerCase()} Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">{category} Category Settings</Label>
                      <Badge variant="outline" className="text-xs">
                        {types.length} notification{types.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      Configure how you receive all {category.toLowerCase()} notifications
                    </div>
                  </div>
                </div>

                {/* Notification Channel Toggles */}
                <div className="grid grid-cols-3 gap-4 ml-4">
                  <div className="flex items-center space-x-2">
                    <Bell className="h-4 w-4 text-blue-500" />
                    <Label htmlFor={`${category}-in-app`} className="text-xs">In-App</Label>
                    <Switch
                      id={`${category}-in-app`}
                      checked={categoryPrefs.in_app_enabled}
                      onCheckedChange={(checked) => 
                        handlePreferenceChange(category, 'in_app_enabled', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-green-500" />
                    <Label htmlFor={`${category}-email`} className="text-xs">Email</Label>
                    <Switch
                      id={`${category}-email`}
                      checked={categoryPrefs.email_enabled}
                      onCheckedChange={(checked) => 
                        handlePreferenceChange(category, 'email_enabled', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-purple-500" />
                    <Label htmlFor={`${category}-browser`} className="text-xs">Browser</Label>
                    <Switch
                      id={`${category}-browser`}
                      checked={categoryPrefs.browser_enabled}
                      onCheckedChange={(checked) => 
                        handlePreferenceChange(category, 'browser_enabled', checked)
                      }
                    />
                  </div>
                </div>

                {/* Show notification types in this category */}
                <div className="ml-4 pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-500 mb-2">Includes these notification types:</div>
                  <div className="flex flex-wrap gap-1">
                    {types.map((type) => (
                      <Badge key={(type as any).id} variant="outline" className="text-xs">
                        {(type as any).display_name || 'Notification'}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
