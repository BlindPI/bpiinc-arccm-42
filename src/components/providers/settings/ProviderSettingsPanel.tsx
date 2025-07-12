import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ProviderProfileSettings } from './ProviderProfileSettings';
import { SystemPreferencesSettings } from './SystemPreferencesSettings';
import { SecurityAccessSettings } from './SecurityAccessSettings';
import { Building, Settings, Shield, Loader2 } from 'lucide-react';
import { useProviderSettings } from '@/hooks/useProviderSettings';

export function ProviderSettingsPanel() {
  const { isLoading, error } = useProviderSettings();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading provider settings...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-destructive">
            <p className="font-medium">Failed to load settings</p>
            <p className="text-sm">Please refresh the page and try again</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Provider Settings</h2>
        <p className="text-muted-foreground">
          Configure your provider profile, system preferences, and security settings.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Profile & Branding
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            System Preferences
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security & Access
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProviderProfileSettings />
        </TabsContent>

        <TabsContent value="preferences">
          <SystemPreferencesSettings />
        </TabsContent>

        <TabsContent value="security">
          <SecurityAccessSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}