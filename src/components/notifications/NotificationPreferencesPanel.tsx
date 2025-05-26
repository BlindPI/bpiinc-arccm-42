
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
  Clock,
  Save
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

  // Initialize local preferences when data loads
  React.useEffect(() => {
    if (preferences.length > 0) {
      const prefMap = preferences.reduce((acc, pref) => {
        acc[pref.notification_type_id || pref.category] = {
          in_app_enabled: pref.in_app_enabled,
          email_enabled: pref.email_enabled,
          browser_enabled: pref.browser_enabled,
        };
        return acc;
      }, {} as Record<string, any>);
      setLocalPreferences(prefMap);
    }
  }, [preferences]);

  const handlePreferenceChange = (typeId: string, field: string, value: boolean) => {
    setLocalPreferences(prev => ({
      ...prev,
      [typeId]: {
        ...prev[typeId],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      for (const [typeId, prefs] of Object.entries(localPreferences)) {
        await updatePreferences.mutateAsync({
          userId: '', // Will be set by the hook
          notificationTypeId: typeId,
          updates: prefs
        });
      }
      toast.success('Notification preferences updated successfully');
    } catch (error) {
      toast.error('Failed to update preferences');
    }
  };

  if (preferencesLoading || typesLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  // Group notification types by category
  const groupedTypes = notificationTypes.reduce((acc, type) => {
    if (!acc[type.category]) {
      acc[type.category] = [];
    }
    acc[type.category].push(type);
    return acc;
  }, {} as Record<string, typeof notificationTypes>);

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
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

      {/* Notification Type Preferences */}
      {Object.entries(groupedTypes).map(([category, types]) => (
        <Card key={category}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg capitalize">
              {category.toLowerCase()} Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {types.map((type) => {
              const prefs = localPreferences[type.id] || {
                in_app_enabled: true,
                email_enabled: true,
                browser_enabled: true
              };

              return (
                <div key={type.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium">{type.display_name}</Label>
                        <Badge variant="outline" className="text-xs">
                          {type.default_priority}
                        </Badge>
                      </div>
                      {type.description && (
                        <div className="text-xs text-gray-500">{type.description}</div>
                      )}
                    </div>
                  </div>

                  {/* Notification Channel Toggles */}
                  <div className="grid grid-cols-3 gap-4 ml-4">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-4 w-4 text-blue-500" />
                      <Label htmlFor={`${type.id}-in-app`} className="text-xs">In-App</Label>
                      <Switch
                        id={`${type.id}-in-app`}
                        checked={prefs.in_app_enabled}
                        onCheckedChange={(checked) => 
                          handlePreferenceChange(type.id, 'in_app_enabled', checked)
                        }
                        size="sm"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-green-500" />
                      <Label htmlFor={`${type.id}-email`} className="text-xs">Email</Label>
                      <Switch
                        id={`${type.id}-email`}
                        checked={prefs.email_enabled}
                        onCheckedChange={(checked) => 
                          handlePreferenceChange(type.id, 'email_enabled', checked)
                        }
                        size="sm"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-purple-500" />
                      <Label htmlFor={`${type.id}-browser`} className="text-xs">Browser</Label>
                      <Switch
                        id={`${type.id}-browser`}
                        checked={prefs.browser_enabled}
                        onCheckedChange={(checked) => 
                          handlePreferenceChange(type.id, 'browser_enabled', checked)
                        }
                        size="sm"
                      />
                    </div>
                  </div>

                  <Separator />
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={updatePreferences.isPending}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {updatePreferences.isPending ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
}
