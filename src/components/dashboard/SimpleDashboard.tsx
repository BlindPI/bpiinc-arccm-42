import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Users, UserCheck, MapPin, AlertCircle, User, GraduationCap, Settings, BarChart3 } from 'lucide-react';
import { SimpleDashboardService, UserDashboardData } from '@/services/dashboard/simpleDashboardService';
import { LocationsSection } from './sections/LocationsSection';
import { ReportsSection } from './sections/ReportsSection';
import { LoadingDashboard } from './LoadingDashboard';
import { useNavigate } from 'react-router-dom';

interface SimpleDashboardProps {
  userId: string;
}

export const SimpleDashboard: React.FC<SimpleDashboardProps> = ({ userId }) => {
  const [dashboardData, setDashboardData] = useState<UserDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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

  const config = SimpleDashboardService.getDashboardConfig(dashboardData.user_role);
  const roleDisplayName = SimpleDashboardService.getRoleDisplayName(dashboardData.user_role);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {dashboardData.display_name}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <UserCheck className="h-3 w-3" />
              {roleDisplayName}
            </Badge>
            {dashboardData.teams.length > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {dashboardData.teams.length} team{dashboardData.teams.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Role Context Banner */}
      <Alert className="bg-blue-50 border-blue-200">
        <UserCheck className="h-4 w-4" />
        <AlertDescription className="text-blue-800">
          As a <strong>{roleDisplayName}</strong>, you have access to{' '}
          {config.showTeams && 'team management, '}
          {config.showLocations && 'location oversight, '}
          {config.showReports && 'reports & analytics, '}
          {config.showAllUsers && 'user management, '}
          and basic dashboard features.
        </AlertDescription>
      </Alert>

      {/* Teams Section - Always show if user has teams */}
      {config.showTeams && dashboardData.teams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Your Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {dashboardData.teams.map(team => (
                <Button
                  key={team.team_id}
                  variant="outline"
                  className="h-auto p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
                  onClick={() => navigate(`/teams/${team.team_id}`)}
                >
                  <div className="space-y-2 w-full">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{team.team_name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {team.team_role}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="h-3 w-3" />
                      <span>{team.location_name}</span>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty Teams State */}
      {config.showTeams && dashboardData.teams.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Your Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                You are not currently assigned to any teams. Contact your administrator for team assignment.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Locations Section */}
      {config.showLocations && dashboardData.teams.length > 0 && (
        <LocationsSection teams={dashboardData.teams} />
      )}

      {/* Reports Section */}
      {config.showReports && (
        <ReportsSection userRole={dashboardData.user_role} />
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start text-left"
              onClick={() => navigate('/profile')}
            >
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">View Profile</span>
              </div>
              <div className="text-xs text-gray-500">Update your information</div>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start text-left"
              onClick={() => navigate('/certifications')}
            >
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap className="h-4 w-4" />
                <span className="text-sm font-medium">Certifications</span>
              </div>
              <div className="text-xs text-gray-500">View your certificates</div>
            </Button>
            
            {config.showTeams && (
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-start text-left"
                onClick={() => navigate('/teams')}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">Team Management</span>
                </div>
                <div className="text-xs text-gray-500">Manage your teams</div>
              </Button>
            )}
            
            {config.showReports && (
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-start text-left"
                onClick={() => navigate('/reports')}
              >
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-sm font-medium">All Reports</span>
                </div>
                <div className="text-xs text-gray-500">View detailed reports</div>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};