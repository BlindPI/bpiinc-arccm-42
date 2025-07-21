import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users } from 'lucide-react';
import { SimpleDashboardService, UserDashboardData } from '@/services/dashboard/simpleDashboardService';

interface LocationsSectionProps {
  teams: UserDashboardData['teams'];
}

export const LocationsSection: React.FC<LocationsSectionProps> = ({ teams }) => {
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
          Location Data ({locations.length} locations)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {locations.map(location => (
          <div key={location.id} className="border rounded-lg p-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-lg">{location.name}</h3>
                <Badge variant="outline" className="flex items-center gap-1 mt-1 w-fit">
                  <Users className="h-3 w-3" />
                  {location.teams.length} team{location.teams.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600 mb-2">Teams at this location:</div>
                <div className="space-y-1">
                  {location.teams.map(team => (
                    <div key={team.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{team.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {team.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};