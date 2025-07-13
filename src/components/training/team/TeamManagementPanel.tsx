import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserCheck, Calendar, Users, Clock, Target, Activity, ExternalLink } from 'lucide-react';
import { TeamAvailabilityDashboard } from '@/components/team/TeamAvailabilityDashboard';
import { BulkSchedulingPanel } from '@/components/team/BulkSchedulingPanel';
import { CalendarSyncSetup } from '@/components/integration/CalendarSyncSetup';
import { NotificationCenter } from '@/components/integration/NotificationCenter';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TeamManagementPanelProps {
  onNavigateToAvailability?: () => void;
}

export const TeamManagementPanel: React.FC<TeamManagementPanelProps> = ({
  onNavigateToAvailability
}) => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [activeSubTab, setActiveSubTab] = useState('dashboard');

  // Fetch team metrics and members
  const { data: teamMetrics } = useQuery({
    queryKey: ['team-metrics'],
    queryFn: async () => {
      const { data: teamMembers, error: teamError } = await supabase
        .from('profiles')
        .select('id, display_name, role')
        .in('role', ['IC', 'IP', 'IT', 'AP'])
        .eq('status', 'ACTIVE');

      if (teamError) throw teamError;

      const { data: bulkOps, error: bulkError } = await supabase
        .from('bulk_operation_queue')
        .select('id, status')
        .in('status', ['pending', 'processing']);

      if (bulkError) throw bulkError;

      const { data: availabilityBookings, error: availError } = await supabase
        .from('availability_bookings')
        .select('id, status')
        .gte('booking_date', new Date().toISOString().split('T')[0]);

      if (availError) throw availError;

      return {
        totalMembers: teamMembers?.length || 0,
        activeBulkOps: bulkOps?.length || 0,
        upcomingBookings: availabilityBookings?.length || 0,
        teamMembers: teamMembers || [],
        teamRoles: teamMembers?.reduce((acc, member) => {
          acc[member.role] = (acc[member.role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {}
      };
    },
    enabled: !!user
  });

  // Get user's team ID (for now, using a default team concept)
  const teamId = 'default-team';
  const teamMembersFormatted = teamMetrics?.teamMembers?.map(member => ({
    userId: member.id,
    userName: member.display_name || 'Unknown',
    userRole: member.role
  })) || [];

  const isManager = profile?.role && ['SA', 'AD', 'AP'].includes(profile.role);

  const getRoleColor = (role: string) => {
    const colors = {
      'IC': 'bg-blue-100 text-blue-800',
      'IP': 'bg-yellow-100 text-yellow-800', 
      'IT': 'bg-green-100 text-green-800',
      'AP': 'bg-purple-100 text-purple-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      'IC': 'Instructor Candidate',
      'IP': 'Instructor Provisional',
      'IT': 'Instructor Trainer', 
      'AP': 'Authorized Provider'
    };
    return labels[role] || role;
  };

  return (
    <div className="space-y-6">
      {/* Team Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">{teamMetrics?.totalMembers || 0}</div>
                <div className="text-sm text-muted-foreground">Team Members</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{teamMetrics?.activeBulkOps || 0}</div>
                <div className="text-sm text-muted-foreground">Active Operations</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{teamMetrics?.upcomingBookings || 0}</div>
                <div className="text-sm text-muted-foreground">Upcoming Bookings</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">
                  {Object.keys(teamMetrics?.teamRoles || {}).length}
                </div>
                <div className="text-sm text-muted-foreground">Role Types</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Role Distribution */}
      {teamMetrics?.teamRoles && Object.keys(teamMetrics.teamRoles).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Team Role Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(teamMetrics.teamRoles).map(([role, count]) => (
                <Badge key={role} className={getRoleColor(role)}>
                  {getRoleLabel(role)}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Availability Link */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserCheck className="h-8 w-8 text-primary" />
              <div>
                <h3 className="text-lg font-semibold">Full Availability Management</h3>
                <p className="text-sm text-muted-foreground">
                  Access the complete availability management system with personal scheduling, team coordination, and approval workflows
                </p>
              </div>
            </div>
            <Button 
              onClick={onNavigateToAvailability}
              className="gap-2"
            >
              Open Availability Manager
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Team Management Tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Team Dashboard</TabsTrigger>
          <TabsTrigger value="bulk-scheduling">Bulk Scheduling</TabsTrigger>
          <TabsTrigger value="integrations">Calendar Sync</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Team Availability Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TeamAvailabilityDashboard teamId={teamId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk-scheduling" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Bulk Scheduling Operations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isManager ? (
                <BulkSchedulingPanel teamId={teamId} teamMembers={teamMembersFormatted} />
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Manager Access Required</h3>
                  <p className="text-muted-foreground">
                    Bulk scheduling operations are available to managers and administrators only.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                External Calendar Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CalendarSyncSetup />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Notification Center
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NotificationCenter />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};