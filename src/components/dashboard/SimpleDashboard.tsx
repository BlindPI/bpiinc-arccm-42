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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {dashboardData.display_name}
        </h1>
      </div>

      {/* SIMPLE DATA DISPLAY */}
      {dashboardData.teams.length > 0 ? (
        <div className="space-y-4">
          {dashboardData.teams.map(team => (
            <Card key={team.team_id}>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-lg">
                  <div>
                    <div className="font-medium text-gray-600">Team</div>
                    <div className="text-xl font-bold">{team.team_name}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-600">Location</div>
                    <div className="text-xl font-bold">{team.location_name}</div>
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
    </div>
  );
};