
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamManagementService, type EnhancedTeam } from '@/services/team/teamManagementService';
import { authorizedProviderService } from '@/services/provider/authorizedProviderService';
import { Users, MapPin, Building2, TrendingUp, Plus, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { TeamLocationAssignments } from './TeamLocationAssignments';
import { TeamPerformanceDashboard } from './TeamPerformanceDashboard';
import { CreateEnhancedTeamDialog } from './CreateEnhancedTeamDialog';
import { ProviderTeamAssignments } from './ProviderTeamAssignments';

export default function EnhancedTeamManagement() {
  const queryClient = useQueryClient();
  const [selectedTeam, setSelectedTeam] = useState<EnhancedTeam | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['enhanced-teams'],
    queryFn: () => teamManagementService.getEnhancedTeams()
  });

  const { data: providers = [] } = useQuery({
    queryKey: ['authorized-providers'],
    queryFn: () => authorizedProviderService.getAllProviders()
  });

  if (teamsLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Loading enhanced team management...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enhanced Team Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage teams, locations, providers, and performance analytics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <CreateEnhancedTeamDialog 
            onTeamCreated={() => queryClient.invalidateQueries({ queryKey: ['enhanced-teams'] })} 
          />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Teams List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Teams ({teams.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {teams.map((team) => (
              <div
                key={team.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedTeam?.id === team.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                }`}
                onClick={() => setSelectedTeam(team)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium truncate">{team.name}</h4>
                  <Badge variant={team.status === 'active' ? 'default' : 'secondary'}>
                    {team.status}
                  </Badge>
                </div>
                
                <div className="space-y-1 text-xs text-muted-foreground">
                  {team.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{team.location.name}</span>
                    </div>
                  )}
                  
                  {team.provider && (
                    <div className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      <span className="truncate">{team.provider.name}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{team.members?.length || 0} members</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>Score: {team.performance_score}/100</span>
                  </div>
                </div>
              </div>
            ))}
            
            {teams.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No teams found</p>
                <p className="text-sm">Create your first team to get started</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Details */}
        <Card className="lg:col-span-3">
          {selectedTeam ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {selectedTeam.name}
                      <Badge variant={selectedTeam.status === 'active' ? 'default' : 'secondary'}>
                        {selectedTeam.status}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedTeam.description || 'No description provided'}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </div>
                
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="locations">Locations</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="providers">Providers</TabsTrigger>
                </TabsList>
              </CardHeader>
              
              <CardContent className="p-6">
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="text-sm text-muted-foreground">Team Members</p>
                            <p className="text-2xl font-bold">{selectedTeam.members?.length || 0}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="text-sm text-muted-foreground">Performance Score</p>
                            <p className="text-2xl font-bold">{selectedTeam.performance_score}/100</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-purple-500" />
                          <div>
                            <p className="text-sm text-muted-foreground">Primary Location</p>
                            <p className="text-sm font-medium">
                              {selectedTeam.location?.name || 'Not assigned'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Team Members List */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Team Members</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedTeam.members?.map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <Users className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-medium">{member.profile?.display_name || 'Unknown'}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span>{member.profile?.role}</span>
                                  {member.team_position && (
                                    <>
                                      <span>•</span>
                                      <span>{member.team_position}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Badge variant={member.role === 'ADMIN' ? 'default' : 'secondary'}>
                              {member.role}
                            </Badge>
                          </div>
                        ))}
                        
                        {(!selectedTeam.members || selectedTeam.members.length === 0) && (
                          <div className="text-center py-8 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No team members found</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="locations">
                  <TeamLocationAssignments teamId={selectedTeam.id} />
                </TabsContent>
                
                <TabsContent value="performance">
                  <TeamPerformanceDashboard teamId={selectedTeam.id} />
                </TabsContent>
                
                <TabsContent value="providers">
                  <ProviderTeamAssignments teamId={selectedTeam.id} />
                </TabsContent>
              </CardContent>
            </Tabs>
          ) : (
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Select a Team</h3>
              <p className="text-muted-foreground">
                Choose a team from the list to view its details and manage locations, performance, and provider assignments.
              </p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
