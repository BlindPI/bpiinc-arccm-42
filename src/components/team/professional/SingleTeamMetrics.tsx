
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, MapPin, Activity } from 'lucide-react';
import type { EnhancedTeam } from '@/types/team-management';

interface SingleTeamMetricsProps {
  team: EnhancedTeam;
}

export function SingleTeamMetrics({ team }: SingleTeamMetricsProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'provider_team': return 'bg-blue-100 text-blue-800';
      case 'training_team': return 'bg-purple-100 text-purple-800';
      case 'operations': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Team Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Team Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(team.status)}>
              {team.status}
            </Badge>
          </CardContent>
        </Card>

        {/* Team Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getTypeColor(team.team_type || 'standard')}>
              {team.team_type?.replace('_', ' ') || 'Standard'}
            </Badge>
          </CardContent>
        </Card>

        {/* Performance Score */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {team.performance_score?.toFixed(1) || 0}%
              </div>
              <p className="text-sm text-gray-600">Performance Score</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Team Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Location</div>
                <div className="text-base">{team.location?.name || 'No location assigned'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Members</div>
                <div className="text-base">{team.members?.length || 0}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Created</div>
                <div className="text-base">{new Date(team.created_at).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Last Updated</div>
                <div className="text-base">{new Date(team.updated_at).toLocaleDateString()}</div>
              </div>
            </div>
            
            {team.description && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Description</div>
                <div className="text-base">{team.description}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
