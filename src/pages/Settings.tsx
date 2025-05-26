
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
import { SystemConfigurationPanel } from "@/components/settings/SystemConfigurationPanel";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Monitor, Moon, Sun } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { theme, setTheme } = useTheme();
  const [testDataEnabled, setTestDataEnabled] = useState(false);
  
  useEffect(() => {
    const fetchTestDataSetting = async () => {
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
    };
    
    fetchTestDataSetting();
  }, [profile?.role]);

  const handleTestDataToggle = async (checked: boolean) => {
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
      console.error('Error updating test data setting:', error);
      toast.error('Failed to update test data setting');
      return;
    }

    setTestDataEnabled(checked);
    toast.success(`Test data ${checked ? 'enabled' : 'disabled'}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Configure your system preferences and organization settings.
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList 
          className="w-full justify-start"
          gradient="bg-gradient-to-r from-gray-500 to-slate-700"
        >
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="display">Display</TabsTrigger>
          {profile?.role === 'SA' && (
            <>
              <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger value="configuration">Configuration</TabsTrigger>
            </>
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
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Theme</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Choose your preferred theme for the application
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      className="h-20 flex-col gap-2"
                      onClick={() => setTheme("light")}
                    >
                      <Sun className="h-6 w-6" />
                      <span>Light</span>
                    </Button>
                    <Button
                      variant={theme === "dark" ? "default" : "outline"}
                      className="h-20 flex-col gap-2"
                      onClick={() => setTheme("dark")}
                    >
                      <Moon className="h-6 w-6" />
                      <span>Dark</span>
                    </Button>
                    <Button
                      variant={theme === "system" ? "default" : "outline"}
                      className="h-20 flex-col gap-2"
                      onClick={() => setTheme("system")}
                    >
                      <Monitor className="h-6 w-6" />
                      <span>System</span>
                    </Button>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <Label className="text-base font-medium">Current Theme</Label>
                  <p className="text-sm text-muted-foreground">
                    Currently using: <span className="font-medium capitalize">{theme}</span> theme
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {profile?.role === 'SA' && (
          <>
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
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="configuration" className="space-y-4">
              <SystemConfigurationPanel />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
