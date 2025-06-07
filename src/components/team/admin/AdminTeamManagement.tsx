
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from '@tanstack/react-query';
import { teamManagementService } from '@/services/team/teamManagementService';
import { Users, Plus, Settings, Eye, TrendingUp } from 'lucide-react';
import { AdminTeamCreationWizard } from './AdminTeamCreationWizard';
import EnhancedTeamManagement from '../EnhancedTeamManagement';

export function AdminTeamManagement() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['enhanced-teams'],
    queryFn: () => teamManagementService.getEnhancedTeams()
  });

  const teamStats = {
    total: teams.length,
    active: teams.filter(t => t.status === 'active').length,
    provider_teams: teams.filter(t => t.team_type === 'provider_team').length,
    location_teams: teams.filter(t => t.team_type === 'location_team').length
  };

  const handleTeamCreated = () => {
    setShowCreateDialog(false);
    // Optionally refresh the teams list here
  };

  const handleCancel = () => {
    setShowCreateDialog(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Team Administration</h2>
          <p className="text-muted-foreground mt-1">
            Comprehensive team management for system administrators
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Team
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Management
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Team Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Teams</p>
                    <p className="text-2xl font-bold">{teamStats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 bg-green-500 rounded-full" />
                  <div>
                    <p className="text-sm text-muted-foreground">Active Teams</p>
                    <p className="text-2xl font-bold">{teamStats.active}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 bg-purple-500 rounded-full" />
                  <div>
                    <p className="text-sm text-muted-foreground">Provider Teams</p>
                    <p className="text-2xl font-bold">{teamStats.provider_teams}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 bg-orange-500 rounded-full" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location Teams</p>
                    <p className="text-2xl font-bold">{teamStats.location_teams}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Teams */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Teams</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teams.slice(0, 5).map((team) => (
                  <div key={team.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="font-medium">{team.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {team.location?.name || 'No location'} • {team.team_type}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={team.status === 'active' ? 'default' : 'secondary'}>
                        {team.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {team.members?.length || 0} members
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="management">
          <EnhancedTeamManagement />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Analytics Dashboard</h3>
                <p>Comprehensive team performance metrics and insights</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Team Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
          </DialogHeader>
          <AdminTeamCreationWizard
            onTeamCreated={handleTeamCreated}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
