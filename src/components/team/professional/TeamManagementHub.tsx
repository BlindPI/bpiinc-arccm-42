
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Settings, 
  BarChart3, 
  Shield,
  Crown,
  Workflow,
  Archive,
  Plus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamMemberships } from '@/hooks/useTeamMemberships';
import { useProfile } from '@/hooks/useProfile';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Import the new Professional Team Management Hub
import { ProfessionalTeamManagementHub } from './ProfessionalTeamManagementHub';

// Import existing components that are working
import { SimplifiedMemberTable } from './SimplifiedMemberTable';

export function TeamManagementHub() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: userTeams = [], isLoading } = useTeamMemberships();
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch team members for the selected team
  const { data: teamMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ['team-members-simple', selectedTeam],
    queryFn: async () => {
      if (!selectedTeam) return [];
      
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          profiles!inner(
            id,
            display_name,
            email,
            role
          )
        `)
        .eq('team_id', selectedTeam);

      if (error) throw error;

      return (data || []).map(member => ({
        ...member,
        display_name: member.profiles?.display_name || 'Unknown User',
        profile: member.profiles
      }));
    },
    enabled: !!selectedTeam
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if user has professional access
  const hasProfessionalAccess = ['SA', 'AD', 'AP', 'IP', 'IT'].includes(profile?.role || '');

  if (hasProfessionalAccess) {
    return <ProfessionalTeamManagementHub userRole={profile?.role} />;
  }

  // Fallback to basic team view for standard users
  const currentTeam = selectedTeam 
    ? userTeams.find(t => t.team_id === selectedTeam)
    : userTeams[0];

  if (!currentTeam) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">No Team Membership</h3>
        <p className="text-muted-foreground">
          You are not currently a member of any teams.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Teams</h1>
          <p className="text-muted-foreground">
            View your team memberships and collaboration
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          {profile?.role}
        </Badge>
      </div>

      {/* Team Selection */}
      {userTeams.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Team</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userTeams.map((teamMembership) => (
                <Card 
                  key={teamMembership.team_id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedTeam === teamMembership.team_id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedTeam(teamMembership.team_id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{teamMembership.teams?.name || 'Unknown Team'}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {teamMembership.teams?.description || 'No description'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {teamMembership.role}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Details */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {(currentTeam as any).teams?.name || (currentTeam as any).team_name || 'My Team'}
                  <Badge variant="outline">{currentTeam.role}</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {(currentTeam as any).teams?.description || (currentTeam as any).team_description || 'No description available'}
                </p>
              </div>
            </div>
            
            <TabsList className="w-full justify-start">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="members" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Members
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="p-0">
            <TabsContent value="overview" className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Team Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Team Type</Label>
                    <p className="text-sm text-muted-foreground">
                      {(currentTeam as any).teams?.team_type || (currentTeam as any).team_type || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Your Role</Label>
                    <p className="text-sm text-muted-foreground">
                      {currentTeam.role}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Member Since</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date((currentTeam as any).created_at || (currentTeam as any).assignment_start_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge variant="default">{(currentTeam as any).teams?.status || currentTeam.status || 'active'}</Badge>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="members" className="p-6">
              {membersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                <SimplifiedMemberTable 
                  teamId={currentTeam.team_id}
                  members={teamMembers}
                  onMemberUpdated={() => {
                    // Refresh members data when updated
                    window.location.reload();
                  }}
                />
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
