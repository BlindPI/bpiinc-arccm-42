
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationPreferencesPanel } from './NotificationPreferencesPanel';
import { NotificationTester } from './NotificationTester';
import { NotificationProcessor } from './NotificationProcessor';
import { EmailDiagnosticTool } from './EmailDiagnosticTool';

export function NotificationSettings() {
  const [activeTab, setActiveTab] = useState('preferences');
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>
          Configure how you receive notifications and test the notification system.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
            <TabsTrigger value="admin">Admin Tools</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preferences">
            <NotificationPreferencesPanel />
          </TabsContent>
          
          <TabsContent value="testing">
            <NotificationTester />
          </TabsContent>
          
          <TabsContent value="admin">
            <div className="space-y-6">
              <NotificationProcessor />
              <EmailDiagnosticTool />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
