
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { NotificationSettings } from "@/components/notifications/NotificationSettings";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useSystemSettings } from "@/hooks/useSystemSettings";

interface SettingsProps {
  embedded?: boolean;
}

export default function Settings({ embedded = false }: SettingsProps) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: systemSettings, isLoading: loadingSettings } = useSystemSettings();
  const [testDataEnabled, setTestDataEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    const fetchSettings = async () => {
      if (profile?.role === 'SA') {
        const { data, error } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'test_data_enabled')
          .single();
        
        if (!error && data) {
          setTestDataEnabled(data.value === true);
        }
      }
      
      // Get user preferences
      if (profile?.preferences) {
        try {
          const prefs = typeof profile.preferences === 'string' 
            ? JSON.parse(profile.preferences)
            : profile.preferences;
            
          setDarkModeEnabled(prefs.darkMode || false);
          setEmailNotificationsEnabled(prefs.emailNotifications !== false); // Default to true
        } catch (e) {
          console.error("Error parsing preferences:", e);
        }
      }
    };
    
    fetchSettings();
  }, [profile?.role, profile?.preferences]);

  const handleTestDataToggle = async (checked: boolean) => {
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('system_settings')
        .upsert(
          { 
            key: 'test_data_enabled',
            value: checked
          },
          {
            onConflict: 'key',
            ignoreDuplicates: false
          }
        );

      if (error) {
        throw error;
      }

      setTestDataEnabled(checked);
      toast.success(`Test data ${checked ? 'enabled' : 'disabled'}`);
    } catch (error: any) {
      console.error('Error updating test data setting:', error);
      toast.error(`Failed to update: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handlePreferenceToggle = async (key: string, value: boolean) => {
    try {
      setIsSaving(true);
      
      // Update local state based on the preference key
      if (key === 'darkMode') setDarkModeEnabled(value);
      if (key === 'emailNotifications') setEmailNotificationsEnabled(value);
      
      // Get current preferences or initialize empty object
      const currentPrefs = profile?.preferences 
        ? (typeof profile.preferences === 'string' 
          ? JSON.parse(profile.preferences) 
          : profile.preferences)
        : {};
      
      // Update the specific preference
      const updatedPrefs = {
        ...currentPrefs,
        [key]: value
      };
      
      // Save to database
      const { error } = await supabase
        .from('profiles')
        .update({ 
          preferences: updatedPrefs
        })
        .eq('id', user?.id);

      if (error) throw error;
      
      toast.success(`Preference updated`);
    } catch (error: any) {
      console.error('Error updating preference:', error);
      toast.error(`Failed to update preference: ${error.message}`);
      
      // Revert local state on error
      if (key === 'darkMode') setDarkModeEnabled(!value);
      if (key === 'emailNotifications') setEmailNotificationsEnabled(!value);
    } finally {
      setIsSaving(false);
    }
  };

  const content = (
    <div className="space-y-6">
      {!embedded && (
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Configure your system preferences and organization settings.
          </p>
        </div>
      )}

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList 
          className="w-full justify-start"
          gradient="bg-gradient-to-r from-gray-500 to-slate-700"
        >
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="display">Display</TabsTrigger>
          {profile?.role === 'SA' && (
            <TabsTrigger value="system">System</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    defaultValue="UTC"
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Input
                    id="language"
                    defaultValue="English (US)"
                    disabled
                  />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
                    <span>Email Notifications</span>
                    <span className="font-normal text-sm text-muted-foreground">
                      Receive email notifications about important updates.
                    </span>
                  </Label>
                  <Switch
                    id="email-notifications"
                    checked={emailNotificationsEnabled}
                    onCheckedChange={(value) => handlePreferenceToggle('emailNotifications', value)}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Organization ID</Label>
                  <Input
                    value="ORG-123456"
                    disabled
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <Label>Instance</Label>
                  <Input
                    value="Production"
                    disabled
                    readOnly
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="display" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Display Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="dark-mode" className="flex flex-col space-y-1">
                  <span>Dark Mode</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Enable dark mode theme for the application.
                  </span>
                </Label>
                <Switch
                  id="dark-mode"
                  checked={darkModeEnabled}
                  onCheckedChange={(value) => handlePreferenceToggle('darkMode', value)}
                  disabled={isSaving}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {profile?.role === 'SA' && (
          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="test-data" className="flex flex-col space-y-1">
                    <span>Test Data</span>
                    <span className="font-normal text-sm text-muted-foreground">
                      Enable test users and sample data for testing purposes.
                    </span>
                  </Label>
                  <Switch
                    id="test-data"
                    checked={testDataEnabled}
                    onCheckedChange={handleTestDataToggle}
                    disabled={isSaving}
                  />
                </div>
                
                {loadingSettings ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="mt-4">
                    <h3 className="font-medium mb-2">System Configuration</h3>
                    <div className="text-sm space-y-1">
                      {systemSettings?.map(setting => (
                        <div key={setting.key} className="flex justify-between">
                          <span className="font-medium">{setting.key}:</span>
                          <span className="text-muted-foreground">
                            {typeof setting.value === 'object' 
                              ? JSON.stringify(setting.value)
                              : String(setting.value)
                            }
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <DashboardLayout>
      {content}
    </DashboardLayout>
  );
}
