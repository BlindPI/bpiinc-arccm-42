
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { Profile } from "@/types/profiles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PreferencesPanelProps {
  profile: Profile | null;
  onUpdateSuccess: () => Promise<void>;
}

export function PreferencesPanel({ profile, onUpdateSuccess }: PreferencesPanelProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Extract preferences from profile or use defaults
  const preferences = profile?.preferences || {};
  
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailNotifications: preferences.emailNotifications !== false,
    smsNotifications: !!preferences.smsNotifications,
    inAppNotifications: preferences.inAppNotifications !== false,
  });
  
  const [displayPrefs, setDisplayPrefs] = useState({
    darkMode: !!preferences.darkMode,
    compactView: !!preferences.compactView,
    highContrast: !!preferences.highContrast,
  });
  
  const handlePreferenceChange = async (category: string, setting: string, value: boolean) => {
    if (!user?.id) return;
    
    try {
      setIsSubmitting(true);
      
      const updatedPrefs = {
        ...preferences,
        [setting]: value
      };
      
      const { error } = await supabase
        .from('profiles')
        .update({
          preferences: updatedPrefs
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast.success("Preferences updated");
      await onUpdateSuccess();
      
      // Update local state
      if (category === 'notification') {
        setNotificationPrefs(prev => ({ ...prev, [setting]: value }));
      } else if (category === 'display') {
        setDisplayPrefs(prev => ({ ...prev, [setting]: value }));
      }
      
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast.error("Failed to update preferences");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const saveNotificationPreferences = async () => {
    if (!user?.id) return;
    
    try {
      setIsSubmitting(true);
      
      const updatedPrefs = {
        ...preferences,
        emailNotifications: notificationPrefs.emailNotifications,
        smsNotifications: notificationPrefs.smsNotifications,
        inAppNotifications: notificationPrefs.inAppNotifications,
      };
      
      const { error } = await supabase
        .from('profiles')
        .update({
          preferences: updatedPrefs
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast.success("Notification preferences saved");
      await onUpdateSuccess();
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      toast.error("Failed to update notification preferences");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const saveDisplayPreferences = async () => {
    if (!user?.id) return;
    
    try {
      setIsSubmitting(true);
      
      const updatedPrefs = {
        ...preferences,
        darkMode: displayPrefs.darkMode,
        compactView: displayPrefs.compactView,
        highContrast: displayPrefs.highContrast,
      };
      
      const { error } = await supabase
        .from('profiles')
        .update({
          preferences: updatedPrefs
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast.success("Display preferences saved");
      await onUpdateSuccess();
    } catch (error) {
      console.error("Error updating display preferences:", error);
      toast.error("Failed to update display preferences");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Tabs defaultValue="notifications" className="space-y-4">
      <TabsList>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="display">Display</TabsTrigger>
      </TabsList>
      
      <TabsContent value="notifications">
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Choose how you want to receive notifications from the system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={notificationPrefs.emailNotifications}
                onCheckedChange={(checked) => {
                  setNotificationPrefs(prev => ({
                    ...prev,
                    emailNotifications: checked
                  }));
                }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sms-notifications">SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via text message
                </p>
              </div>
              <Switch
                id="sms-notifications"
                checked={notificationPrefs.smsNotifications}
                onCheckedChange={(checked) => {
                  setNotificationPrefs(prev => ({
                    ...prev,
                    smsNotifications: checked
                  }));
                }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="in-app-notifications">In-App Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications within the application
                </p>
              </div>
              <Switch
                id="in-app-notifications"
                checked={notificationPrefs.inAppNotifications}
                onCheckedChange={(checked) => {
                  setNotificationPrefs(prev => ({
                    ...prev,
                    inAppNotifications: checked
                  }));
                }}
              />
            </div>
            
            <div className="flex justify-end pt-4">
              <Button 
                onClick={saveNotificationPreferences}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Notification Preferences"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="display">
        <Card>
          <CardHeader>
            <CardTitle>Display Preferences</CardTitle>
            <CardDescription>
              Customize how the application looks for you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Use dark theme across the application
                </p>
              </div>
              <Switch
                id="dark-mode"
                checked={displayPrefs.darkMode}
                onCheckedChange={(checked) => {
                  setDisplayPrefs(prev => ({
                    ...prev,
                    darkMode: checked
                  }));
                }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="compact-view">Compact View</Label>
                <p className="text-sm text-muted-foreground">
                  Display more content with less spacing
                </p>
              </div>
              <Switch
                id="compact-view"
                checked={displayPrefs.compactView}
                onCheckedChange={(checked) => {
                  setDisplayPrefs(prev => ({
                    ...prev,
                    compactView: checked
                  }));
                }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="high-contrast">High Contrast</Label>
                <p className="text-sm text-muted-foreground">
                  Increase contrast for better visibility
                </p>
              </div>
              <Switch
                id="high-contrast"
                checked={displayPrefs.highContrast}
                onCheckedChange={(checked) => {
                  setDisplayPrefs(prev => ({
                    ...prev,
                    highContrast: checked
                  }));
                }}
              />
            </div>
            
            <div className="flex justify-end pt-4">
              <Button 
                onClick={saveDisplayPreferences}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Display Preferences"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
