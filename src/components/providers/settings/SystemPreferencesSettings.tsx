import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Settings, Monitor, Bell, Globe, FileText } from 'lucide-react';
import { useProviderSettings } from '@/hooks/useProviderSettings';

export function SystemPreferencesSettings() {
  const { settings, updateSystemPreferences, isUpdating } = useProviderSettings();
  const [preferences, setPreferences] = React.useState({
    language_preference: 'en',
    timezone: 'UTC',
    export_format: 'pdf',
    theme_mode: 'system',
    compact_view: false,
    email_notifications: true,
    in_app_notifications: true,
    notification_frequency: 'immediate',
    refresh_interval: 300,
  });

  React.useEffect(() => {
    if (settings) {
      const themePrefs = settings.theme_preferences as any || {};
      const notificationPrefs = settings.notification_preferences as any || {};
      const dashboardLayout = settings.dashboard_layout as any || {};
      
      setPreferences({
        language_preference: settings.language_preference || 'en',
        timezone: settings.timezone || 'UTC',
        export_format: settings.export_format || 'pdf',
        theme_mode: themePrefs.mode || 'system',
        compact_view: themePrefs.compact_view || false,
        email_notifications: notificationPrefs.email !== false,
        in_app_notifications: notificationPrefs.in_app !== false,
        notification_frequency: notificationPrefs.frequency || 'immediate',
        refresh_interval: dashboardLayout.refresh_interval || 300,
      });
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateSystemPreferences({
      language_preference: preferences.language_preference,
      timezone: preferences.timezone,
      export_format: preferences.export_format,
      theme_preferences: {
        mode: preferences.theme_mode,
        compact_view: preferences.compact_view,
      },
      notification_preferences: {
        email: preferences.email_notifications,
        in_app: preferences.in_app_notifications,
        frequency: preferences.notification_frequency,
      },
      dashboard_layout: {
        widgets: ["performance", "assignments", "compliance"],
        refresh_interval: preferences.refresh_interval,
      },
    });
  };

  const updatePreference = (field: string, value: any) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Interface Settings
            </CardTitle>
            <CardDescription>
              Configure your dashboard appearance and behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="theme_mode">Theme Mode</Label>
                <Select 
                  value={preferences.theme_mode} 
                  onValueChange={(value) => updatePreference('theme_mode', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="refresh_interval">Dashboard Refresh (seconds)</Label>
                <Select 
                  value={preferences.refresh_interval.toString()} 
                  onValueChange={(value) => updatePreference('refresh_interval', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="300">5 minutes</SelectItem>
                    <SelectItem value="600">10 minutes</SelectItem>
                    <SelectItem value="1800">30 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Compact View</Label>
                <div className="text-sm text-muted-foreground">
                  Use a more compact layout to show more information
                </div>
              </div>
              <Switch
                checked={preferences.compact_view}
                onCheckedChange={(checked) => updatePreference('compact_view', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Control how and when you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <div className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </div>
                </div>
                <Switch
                  checked={preferences.email_notifications}
                  onCheckedChange={(checked) => updatePreference('email_notifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>In-App Notifications</Label>
                  <div className="text-sm text-muted-foreground">
                    Show notifications within the application
                  </div>
                </div>
                <Switch
                  checked={preferences.in_app_notifications}
                  onCheckedChange={(checked) => updatePreference('in_app_notifications', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label>Notification Frequency</Label>
                <Select 
                  value={preferences.notification_frequency} 
                  onValueChange={(value) => updatePreference('notification_frequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="hourly">Hourly Summary</SelectItem>
                    <SelectItem value="daily">Daily Summary</SelectItem>
                    <SelectItem value="weekly">Weekly Summary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Localization
            </CardTitle>
            <CardDescription>
              Set your language and regional preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Language</Label>
                <Select 
                  value={preferences.language_preference} 
                  onValueChange={(value) => updatePreference('language_preference', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select 
                  value={preferences.timezone} 
                  onValueChange={(value) => updatePreference('timezone', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    <SelectItem value="Europe/London">London</SelectItem>
                    <SelectItem value="Europe/Paris">Paris</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Export Settings
            </CardTitle>
            <CardDescription>
              Configure default export formats and options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Default Export Format</Label>
              <Select 
                value={preferences.export_format} 
                onValueChange={(value) => updatePreference('export_format', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isUpdating} className="w-full">
          {isUpdating ? 'Saving Preferences...' : 'Save All Preferences'}
        </Button>
      </form>
    </div>
  );
}