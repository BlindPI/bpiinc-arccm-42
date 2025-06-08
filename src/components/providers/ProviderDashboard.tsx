import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { teamManagementService } from '@/services/team/teamManagementService';
import { authorizedProviderService } from '@/services/provider/authorizedProviderService';
import { ProviderTeamList } from './ProviderTeamList';
import { LocationTeamManager } from './LocationTeamManager';
import { CreateProviderTeamWizard } from './CreateProviderTeamWizard';
import { ProviderPerformanceView } from './ProviderPerformanceView';
import { 
  Building2, 
  Users, 
  MapPin, 
  TrendingUp, 
  Star,
  Activity
} from 'lucide-react';

interface ProviderDashboardProps {
  providerId: string;
}

export function ProviderDashboard({ providerId }: ProviderDashboardProps) {
  const { data: provider } = useQuery({
    queryKey: ['provider-details', providerId],
    queryFn: () => authorizedProviderService.getProviderById(parseInt(providerId, 10))
  });

  const { data: providerTeams = [] } = useQuery({
    queryKey: ['provider-teams', providerId],
    queryFn: () => teamManagementService.getProviderTeams(providerId)
  });

  if (!provider) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  

  return (
    <div className="space-y-6">
      {/* Provider Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            {provider.name}
          </h1>
          <p className="text-muted-foreground mt-2">
            Provider Dashboard - Manage teams, locations, and performance
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant={provider.status === 'active' ? 'default' : 'secondary'}>
            {provider.status}
          </Badge>
          <Badge variant="outline">{provider.provider_type}</Badge>
        </div>
      </div>

      {/* Provider Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{providerTeams.length}</div>
            <p className="text-xs text-gray-500 mt-1">Operational units</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {new Set(providerTeams.map(team => team.location_id).filter(Boolean)).size}
            </div>
            <p className="text-xs text-gray-500 mt-1">Service areas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Star className="h-4 w-4" />
              Performance Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{provider.performance_rating.toFixed(1)}</div>
            <p className="text-xs text-gray-500 mt-1">Out of 5.0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Compliance Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{provider.compliance_score.toFixed(1)}%</div>
            <p className="text-xs text-gray-500 mt-1">Compliance rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="teams" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="create">Create Team</TabsTrigger>
        </TabsList>

        <TabsContent value="teams" className="space-y-6">
          <ProviderTeamList providerId={providerId} />
        </TabsContent>

        <TabsContent value="locations" className="space-y-6">
          {provider.primary_location_id ? (
            <LocationTeamManager 
              locationId={provider.primary_location_id} 
              providerId={providerId} 
            />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Primary Location Set</h3>
                <p className="text-muted-foreground">
                  Configure a primary location to manage location-based teams
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <ProviderPerformanceView providerId={providerId} />
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <CreateProviderTeamWizard 
            providerId={providerId}
            locationId={provider.primary_location_id || undefined}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
