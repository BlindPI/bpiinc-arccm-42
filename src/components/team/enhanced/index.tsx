
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import Team from '../index';
import { TeamHierarchy } from '../TeamHierarchy';
import { TeamPermissions } from '../TeamPermissions';
import { SupervisionManagement } from '../../SupervisionManagement';

export default function EnhancedTeamManagement() {
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage teams, hierarchies, permissions, and supervision relationships.
          </p>
        </div>
      </header>

      <Card>
        <Tabs defaultValue="teams" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none px-4">
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="hierarchy">Team Hierarchy</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="supervision">Supervision</TabsTrigger>
          </TabsList>
          
          <div className="p-4">
            <TabsContent value="teams">
              <Team />
            </TabsContent>
            
            <TabsContent value="hierarchy">
              <TeamHierarchy />
            </TabsContent>
            
            <TabsContent value="permissions">
              {selectedTeamId ? (
                <TeamPermissions teamId={selectedTeamId} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Select a team from the Teams tab to manage permissions.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="supervision">
              <SupervisionManagement />
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}
