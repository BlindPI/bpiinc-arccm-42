import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, Settings, BarChart3 } from 'lucide-react';
import { TeamTable } from './TeamTable';
import { TeamMetrics } from './TeamMetrics';
import { CreateTeamDialog } from './CreateTeamDialog';
import { TeamQuickActions } from './TeamQuickActions';
import { ExportDialog } from './ExportDialog';
import { BulkActionsPanel } from './BulkActionsPanel';

export function ProfessionalTeamManagementHub() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Management</h1>
          <p className="text-muted-foreground">Manage your teams and members</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
        </div>
      </div>

      <TeamMetrics />
      
      {selectedTeams.length > 0 && (
        <BulkActionsPanel selectedTeams={selectedTeams} />
      )}
      
      <TeamQuickActions />
      
      <TeamTable 
        selectedTeams={selectedTeams}
        onSelectionChange={setSelectedTeams}
      />

      <CreateTeamDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog} 
      />
    </div>
  );
}
