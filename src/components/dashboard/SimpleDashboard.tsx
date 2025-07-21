import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, UserCheck, MapPin, AlertCircle, User, GraduationCap, Settings, BarChart3, Eye, ChevronDown } from 'lucide-react';
import { SimpleDashboardService, UserDashboardData } from '@/services/dashboard/simpleDashboardService';
import { LoadingDashboard } from './LoadingDashboard';

interface SimpleDashboardProps {
  userId: string;
}

export const SimpleDashboard: React.FC<SimpleDashboardProps> = ({ userId }) => {
  const [dashboardData, setDashboardData] = useState<UserDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [locationCertificates, setLocationCertificates] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await SimpleDashboardService.getUserDashboardData(userId);
        setDashboardData(data);
      } catch (error) {
        console.error('Dashboard load failed:', error);
        setError(error instanceof Error ? error.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadDashboard();
    }
  }, [userId]);

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
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {dashboardData.display_name}
        </h1>
      </div>

      {/* SIMPLE DATA DISPLAY WITH INTERACTIVE MODALS */}
      {dashboardData.teams.length > 0 ? (
        <div className="space-y-4">
          {dashboardData.teams.map(team => (
            <Card key={team.team_id}>
              <CardContent className="p-6">
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
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="text-gray-500">No teams assigned</div>
          </CardContent>
        </Card>
      )}

      {/* TEAM MEMBERS MODAL */}
      <Dialog open={teamModalOpen} onOpenChange={setTeamModalOpen}>
        <DialogContent className="max-w-md">
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
              <div className="space-y-2">
                {teamMembers.map(member => (
                  <div key={member.user_id} className="p-3 border rounded-lg">
                    <div className="font-medium">{member.display_name}</div>
                    <div className="text-sm text-gray-600">{member.email}</div>
                    <Badge variant="outline" className="mt-1">{member.role}</Badge>
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
                    <div className="font-medium">{cert.student_name}</div>
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