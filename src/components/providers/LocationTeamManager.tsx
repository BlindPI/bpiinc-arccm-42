
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from '@tanstack/react-query';
import { TeamManagementService } from '@/services/team/teamManagementService';
import { MapPin, Users, Building2, Plus, Settings } from 'lucide-react';

interface LocationTeamManagerProps {
  locationId: string;
  providerId: string;
}

export function LocationTeamManager({ locationId, providerId }: LocationTeamManagerProps) {
  const { data: locationTeams = [] } = useQuery({
    queryKey: ['location-teams', locationId],
    queryFn: () => TeamManagementService.getTeamsByLocation(locationId)
  });

  // Filter teams by provider ID (both are strings now)
  const providerTeams = locationTeams.filter(team => 
    team.provider_id === providerId || team.provider_id === Number(providerId)
  );
  const otherTeams = locationTeams.filter(team => 
    team.provider_id !== providerId && team.provider_id !== Number(providerId)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Team Management
          </h3>
          <p className="text-muted-foreground">Manage teams at your assigned location</p>
        </div>
        
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Location Team
        </Button>
      </div>

      {/* Your Provider Teams at Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Your Provider Teams
          </CardTitle>
        </CardHeader>
        <CardContent>
          {providerTeams.length > 0 ? (
            <div className="space-y-3">
              {providerTeams.map((team) => (
                <div key={team.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{team.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {team.member_count || 0} members • Performance: {team.performance_score || 0}/100
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={team.status === 'active' ? 'default' : 'secondary'}>
                      {team.status}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No provider teams at this location</p>
              <p className="text-sm">Create a team to start operations</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Other Teams at Location */}
      {otherTeams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Other Teams at Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {otherTeams.map((team) => (
                <div key={team.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{team.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {team.provider?.name || 'No provider'} • {team.member_count || 0} members
                      </p>
                    </div>
                  </div>
                  
                  <Badge variant="outline">View Only</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Teams</p>
                <p className="text-2xl font-bold">{locationTeams.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Your Teams</p>
                <p className="text-2xl font-bold">{providerTeams.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Members</p>
                <p className="text-2xl font-bold">
                  {providerTeams.reduce((sum, team) => sum + (team.member_count || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
