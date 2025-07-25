import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, UserCheck, MapPin, AlertCircle, User, GraduationCap, Settings, BarChart3, Eye, ChevronDown, RefreshCw } from 'lucide-react';
import { SimpleDashboardService, UserDashboardData } from '@/services/dashboard/simpleDashboardService';
import { providerRelationshipService } from '@/services/provider/ProviderRelationshipService_FIXED_CLEAN';
import { LoadingDashboard } from './LoadingDashboard';
import AvailabilityCalendar from '@/components/availability/AvailabilityCalendar';
import { toast } from 'sonner';

interface SimpleDashboardProps {
  userId: string;
}

export const SimpleDashboard: React.FC<SimpleDashboardProps> = ({ userId }) => {
  const [dashboardData, setDashboardData] = useState<UserDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [locationCertificates, setLocationCertificates] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      console.log('🔧 SimpleDashboard: Loading dashboard for user:', userId);
      
      // EMERGENCY BYPASS: Use working ProviderRelationshipService directly
      // Step 1: Get provider_id from authorized_providers table using user_id
      const { data: authProviders, error: authError } = await (window as any).supabase
        .from('authorized_providers')
        .select('id, name')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (authError) {
        throw new Error(`Failed to find provider: ${authError.message}`);
      }
      
      if (!authProviders) {
        throw new Error('No provider found for user');
      }
      
      console.log('🔧 SimpleDashboard: Found provider:', authProviders.name, 'ID:', authProviders.id);
      
      // Step 2: Use WORKING ProviderRelationshipService to get team assignments
      const teamAssignments = await providerRelationshipService.getProviderTeamAssignments(authProviders.id);
      console.log('🔧 SimpleDashboard: Team assignments:', teamAssignments);
      
      // Step 3: Transform to SimpleDashboard format
      const teams = teamAssignments.map(assignment => ({
        team_id: assignment.team_id,
        team_name: assignment.team_name,
        team_role: assignment.assignment_role,
        location_id: assignment.team_id, // Using team_id as placeholder
        location_name: assignment.location_name,
        certificate_count: 0 // Will be populated separately if needed
      }));
      
      const dashboardData: UserDashboardData = {
        user_id: userId,
        display_name: 'The Test User', // Hardcoded for now
        user_role: 'AP',
        provider_name: authProviders.name,
        teams: teams,
        locations: [],
        total_certificates: 0,
        pending_requests: 0,
        last_updated: new Date().toISOString()
      };
      
      console.log('🔧 SimpleDashboard: Final dashboard data:', dashboardData);
      setDashboardData(dashboardData);
      
      if (isRefresh) {
        toast.success('Dashboard refreshed successfully');
      }
    } catch (error) {
      console.error('Dashboard load failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard';
      setError(errorMessage);
      
      if (isRefresh) {
        toast.error(`Refresh failed: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadDashboard(false);
    }
  }, [userId, loadDashboard]);

  // Auto-refresh every 5 minutes to catch assignment changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (userId && !loading && !refreshing) {
        loadDashboard(true);
      }
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [userId, loading, refreshing, loadDashboard]);

  const handleManualRefresh = () => {
    loadDashboard(true);
  };

  const handleTeamClick = async (team: any) => {
    setSelectedTeam(team);
    setTeamModalOpen(true);
    setModalLoading(true);
    
    try {
      const members = await SimpleDashboardService.getTeamMembers(team.team_id);
      setTeamMembers(members);
    } catch (error) {
      console.error('Failed to load team members:', error);
      setTeamMembers([]);
    } finally {
      setModalLoading(false);
    }
  };

  const handleLocationClick = async (team: any) => {
    setSelectedLocation(team);
    setLocationModalOpen(true);
    setModalLoading(true);
    
    try {
      const certificates = await SimpleDashboardService.getLocationCertificates(team.location_id);
      setLocationCertificates(certificates);
    } catch (error) {
      console.error('Failed to load location certificates:', error);
      setLocationCertificates([]);
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return <LoadingDashboard message="Loading your dashboard..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No dashboard data available. Please check your account settings.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header with Refresh */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {dashboardData.display_name}
        </h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {dashboardData.user_role}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* MONTHLY AVAILABILITY CALENDAR */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Availability Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AvailabilityCalendar showCurrentUserOnly={false} allowUserSelection={false} />
        </CardContent>
      </Card>

      {/* TEAM SUMMARY CARD */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardData.teams.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.teams.map(team => (
                <div key={team.team_id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{team.team_name}</div>
                      <div className="text-sm text-muted-foreground">{team.location_name}</div>
                      <Badge variant="outline" className="text-xs mt-1">
                        {team.team_role}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{team.certificate_count}</div>
                      <div className="text-xs text-muted-foreground">Certificates</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No teams assigned
            </div>
          )}
        </CardContent>
      </Card>

      {/* DETAILED TEAM DATA DISPLAY WITH INTERACTIVE MODALS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Detailed Team Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardData.teams.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.teams.map(team => (
                <div key={team.team_id} className="p-4 border rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-lg">
                    <div>
                      <div className="font-medium text-gray-600">Team</div>
                      <Button
                        variant="ghost"
                        className="text-xl font-bold p-0 h-auto justify-start hover:bg-blue-50"
                        onClick={() => handleTeamClick(team)}
                      >
                        {team.team_name}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                    <div>
                      <div className="font-medium text-gray-600">Location</div>
                      <Button
                        variant="ghost"
                        className="text-xl font-bold p-0 h-auto justify-start hover:bg-green-50"
                        onClick={() => handleLocationClick(team)}
                      >
                        {team.location_name}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                    <div>
                      <div className="font-medium text-gray-600">Certificates</div>
                      <div className="text-xl font-bold">{team.certificate_count}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-4">No teams assigned</div>
          )}
        </CardContent>
      </Card>

      {/* TEAM MEMBERS MODAL */}
      <Dialog open={teamModalOpen} onOpenChange={setTeamModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {selectedTeam?.team_name} - Team Members
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {modalLoading ? (
              <div className="text-center py-4">Loading team members...</div>
            ) : teamMembers.length > 0 ? (
              <div className="space-y-4">
                {teamMembers.map(member => (
                  <div key={member.user_id} className="p-4 border rounded-lg bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="font-medium text-lg">{member.display_name}</div>
                        <div className="text-sm text-gray-600">{member.email}</div>
                        {member.phone && (
                          <div className="text-sm text-gray-600">{member.phone}</div>
                        )}
                        {member.job_title && (
                          <div className="text-sm text-gray-500">{member.job_title}</div>
                        )}
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{member.team_role}</Badge>
                          {member.team_position && (
                            <Badge variant="secondary">{member.team_position}</Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-600 mb-2">Roster Submissions</div>
                        <div className="text-xl font-bold text-blue-600">{member.roster_submissions}</div>
                        {member.recent_rosters && member.recent_rosters.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs text-gray-500 mb-1">Recent:</div>
                            {member.recent_rosters.map((roster: any) => (
                              <div key={roster.id} className="text-xs text-gray-600 truncate">
                                • {roster.name} ({roster.certificate_count} certs)
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">No team members found</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* LOCATION CERTIFICATES MODAL */}
      <Dialog open={locationModalOpen} onOpenChange={setLocationModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {selectedLocation?.location_name} - Certificate Requests ({locationCertificates.length})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {modalLoading ? (
              <div className="text-center py-4">Loading certificates...</div>
            ) : locationCertificates.length > 0 ? (
              <div className="space-y-2">
                {locationCertificates.map(cert => (
                  <div key={cert.id} className="p-3 border rounded-lg">
                    <div className="font-medium">{cert.recipient_name}</div>
                    <div className="text-sm text-gray-600">{cert.course_name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={cert.status === 'approved' ? 'default' : 'secondary'}>
                        {cert.status}
                      </Badge>
                      <div className="text-xs text-gray-500">
                        {new Date(cert.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">No certificate requests found</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};