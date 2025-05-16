
import React from 'react';
import { useNotificationPreferences, useUpdateNotificationPreferences } from '@/hooks/useNotifications';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export function NotificationPreferencesPanel() {
  const { data: preferences = [], isLoading } = useNotificationPreferences();
  const updatePreference = useUpdateNotificationPreferences();
  
  const handleToggleChange = (
    category: string, 
    field: 'email_enabled' | 'in_app_enabled' | 'browser_enabled', 
    checked: boolean
  ) => {
    updatePreference.mutate({
      category,
      updates: { [field]: checked }
    });
  };
  
  const getCategoryName = (category: string) => {
    switch (category) {
      case 'GENERAL': return 'General Notifications';
      case 'SYSTEM': return 'System Updates';
      case 'CERTIFICATE': return 'Certificate Notifications';
      case 'COURSE': return 'Course Updates';
      case 'ACCOUNT': return 'Account Notifications';
      case 'SUPERVISION': return 'Supervision';
      case 'ROLE_MANAGEMENT': return 'Role Management';
      default: return category;
    }
  };
  
  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'GENERAL': return 'General notifications about your account and activity';
      case 'SYSTEM': return 'Maintenance updates and important system changes';
      case 'CERTIFICATE': return 'Certificate approvals, rejections, and expirations';
      case 'COURSE': return 'Course assignments, updates and reminders';
      case 'ACCOUNT': return 'Profile updates, password changes, and security alerts';
      case 'SUPERVISION': return 'Supervision requests, evaluations, and feedback';
      case 'ROLE_MANAGEMENT': return 'Role transition requests and approvals';
      default: return '';
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Notification Preferences</h2>
      <p className="text-sm text-muted-foreground">
        Choose how you want to receive notifications for different categories.
      </p>
      
      <div className="space-y-6">
        {preferences.map((pref) => (
          <Card key={pref.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{getCategoryName(pref.category)}</CardTitle>
              <CardDescription>{getCategoryDescription(pref.category)}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`${pref.category}-email`} className="flex items-center gap-2">
                    Email Notifications
                  </Label>
                  <Switch
                    id={`${pref.category}-email`}
                    checked={pref.email_enabled}
                    onCheckedChange={(checked) => 
                      handleToggleChange(pref.category, 'email_enabled', checked)
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <Label htmlFor={`${pref.category}-inapp`} className="flex items-center gap-2">
                    In-App Notifications
                  </Label>
                  <Switch
                    id={`${pref.category}-inapp`}
                    checked={pref.in_app_enabled}
                    onCheckedChange={(checked) => 
                      handleToggleChange(pref.category, 'in_app_enabled', checked)
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <Label htmlFor={`${pref.category}-browser`} className="flex items-center gap-2">
                    Browser Notifications
                  </Label>
                  <Switch
                    id={`${pref.category}-browser`}
                    checked={pref.browser_enabled}
                    onCheckedChange={(checked) => 
                      handleToggleChange(pref.category, 'browser_enabled', checked)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
