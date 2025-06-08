
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from '@tanstack/react-query';
import { ProviderLocationService } from '@/services/provider/providerLocationService';
import { Building2, Users, Award, TrendingUp, MapPin, Briefcase } from 'lucide-react';
import { InlineLoader } from '@/components/ui/LoadingStates';
import type { AuthorizedProvider } from '@/services/provider/authorizedProviderService';

interface ProviderLocationDashboardProps {
  provider: AuthorizedProvider;
}

export const ProviderLocationDashboard: React.FC<ProviderLocationDashboardProps> = ({ 
  provider 
}) => {
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['provider-location-kpis', provider.id],
    queryFn: () => ProviderLocationService.getProviderLocationKPIs(provider.id.toString())
  });

  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ['provider-location-teams', provider.id],
    queryFn: () => ProviderLocationService.getProviderLocationTeams(provider.id.toString())
  });

  if (kpisLoading) {
    return <InlineLoader message="Loading provider dashboard..." />;
  }

  // Get location name - this would need to be fetched or passed as part of provider data
  const locationName = provider.primary_location_id ? 'Assigned Location' : 'No location assigned';

  return (
    <div className="space-y-6">
      {/* Provider & Location Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">{provider.name}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{locationName}</span>
                </div>
              </div>
            </div>
            <Badge variant={provider.status === 'APPROVED' ? 'default' : 'secondary'}>
              {provider.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Provider Type:</span>
              <span className="text-sm">{provider.provider_type}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Performance:</span>
              <span className="text-sm">{provider.performance_rating.toFixed(1)}/5.0</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Compliance:</span>
              <span className="text-sm">{provider.compliance_score.toFixed(1)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Instructors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{kpis?.totalInstructors || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {kpis?.activeInstructors || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Courses Offered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{kpis?.totalCourses || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              At this location
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Certificates Issued</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{kpis?.certificatesIssued || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              All time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Provider Teams */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Provider Teams
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teamsLoading ? (
            <InlineLoader message="Loading teams..." />
          ) : teams && teams.length > 0 ? (
            <div className="space-y-3">
              {teams.map((team) => (
                <div key={team.teamId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{team.teamName}</h4>
                    <p className="text-sm text-muted-foreground">{team.teamDescription}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{team.memberCount} members</span>
                      <span>Performance: {team.performanceScore}/100</span>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {team.locationName}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No teams found</p>
              <p className="text-sm">Teams will be automatically created when location is assigned</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
