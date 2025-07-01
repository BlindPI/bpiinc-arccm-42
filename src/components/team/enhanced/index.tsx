
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnhancedMemberManagement } from './EnhancedMemberManagement';
import { WorkflowManagement } from './WorkflowManagement';
import { TeamLocationAssignments } from '../TeamLocationAssignments';
import { TeamPerformanceDashboard } from '../TeamPerformanceDashboard';
import { Users, Workflow, MapPin, TrendingUp } from 'lucide-react';

interface EnhancedTeamManagementTabsProps {
  teamId: string;
}

export function EnhancedTeamManagementTabs({ teamId }: EnhancedTeamManagementTabsProps) {
  return (
    <Tabs defaultValue="members" className="w-full">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="members" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Enhanced Members
        </TabsTrigger>
        <TabsTrigger value="workflows" className="flex items-center gap-2">
          <Workflow className="h-4 w-4" />
          Workflows
        </TabsTrigger>
        <TabsTrigger value="locations" className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Locations
        </TabsTrigger>
        <TabsTrigger value="performance" className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Performance
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="members" className="mt-6">
        <EnhancedMemberManagement teamId={teamId} />
      </TabsContent>
      
      <TabsContent value="workflows" className="mt-6">
        <WorkflowManagement teamId={teamId} />
      </TabsContent>
      
      <TabsContent value="locations" className="mt-6">
        <TeamLocationAssignments teamId={teamId} />
      </TabsContent>
      
      <TabsContent value="performance" className="mt-6">
        <TeamPerformanceDashboard teamId={teamId} />
      </TabsContent>
    </Tabs>
  );
}
