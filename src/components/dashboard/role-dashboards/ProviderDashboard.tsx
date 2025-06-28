
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, MapPin, Award, TrendingUp } from 'lucide-react';

export interface ProviderDashboardProps {
  config?: {
    showMetrics?: boolean;
    showTeamOverview?: boolean;
  };
  profile?: {
    id: string;
    role: string;
    display_name?: string;
  };
  teamContext?: {
    teamId: string;
    teamName: string;
    locationName: string;
    locationCity?: string;
    locationState?: string;
    locationAddress?: string;
    apUserName?: string;
    apUserEmail?: string;
    apUserPhone?: string;
  };
}

export function ProviderDashboard({ config, profile, teamContext }: ProviderDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Provider Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.display_name || 'Provider'}
          </p>
        </div>
        {teamContext && (
          <Badge variant="outline">
            {teamContext.teamName} - {teamContext.locationName}
          </Badge>
        )}
      </div>

      {config?.showMetrics !== false && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Teams</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">+2 from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Locations</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">Across 3 cities</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Certificates</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94%</div>
              <p className="text-xs text-muted-foreground">Compliance rate</p>
            </CardContent>
          </Card>
        </div>
      )}

      {config?.showTeamOverview !== false && teamContext && (
        <Card>
          <CardHeader>
            <CardTitle>Team Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Team: {teamContext.teamName}</h4>
                <p className="text-sm text-muted-foreground">
                  Location: {teamContext.locationName}
                </p>
              </div>
              {teamContext.apUserName && (
                <div>
                  <h4 className="font-medium">Contact</h4>
                  <p className="text-sm text-muted-foreground">
                    {teamContext.apUserName} - {teamContext.apUserEmail}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ProviderDashboard;
