import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Users, ExternalLink } from 'lucide-react';
import { SimpleDashboardService, UserDashboardData } from '@/services/dashboard/simpleDashboardService';
import { useNavigate } from 'react-router-dom';

interface LocationsSectionProps {
  teams: UserDashboardData['teams'];
}

export const LocationsSection: React.FC<LocationsSectionProps> = ({ teams }) => {
  const navigate = useNavigate();
  const locations = SimpleDashboardService.getUniqueLocations(teams);

  if (locations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No locations available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Your Locations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {locations.map(location => (
          <div key={location.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">{location.name}</h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {location.teams.length} team{location.teams.length !== 1 ? 's' : ''}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/locations/${location.id}`)}
                  className="text-xs"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View Location
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              {location.teams.map(team => (
                <div key={team.id} className="flex items-center justify-between bg-gray-50 rounded p-2 hover:bg-gray-100 transition-colors">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/teams/${team.id}`)}
                    className="flex-1 justify-start p-2 h-auto"
                  >
                    <span className="font-medium">{team.name}</span>
                  </Button>
                  <Badge variant="secondary" className="text-xs">
                    {team.role}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};