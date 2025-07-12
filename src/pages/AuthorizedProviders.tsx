
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnifiedProviderDashboard } from '@/components/providers/UnifiedProviderDashboard';
import { ProviderAssignmentManager } from '@/components/providers/ProviderAssignmentManager';
import { ProviderSettingsPanel } from '@/components/providers/settings/ProviderSettingsPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Settings, BarChart3 } from 'lucide-react';

export default function AuthorizedProviders() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="border-b pb-4">
          <h1 className="text-3xl font-bold tracking-tight">Authorized Providers</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive management of Authorized Provider users, their assignments, and performance metrics.
          </p>
        </div>

        {/* Tabbed Interface */}
        <Tabs defaultValue="assignments" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Provider Assignments
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard & Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Provider Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assignments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AP Management</CardTitle>
                <CardDescription>
                  This is the comprehensive assignment manager that shows:
                  • All AP Users in one place
                  • Their current location assignments
                  • Their current team assignments
                  • Clear controls to modify both location and team assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProviderAssignmentManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-4">
            <UnifiedProviderDashboard />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <ProviderSettingsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
