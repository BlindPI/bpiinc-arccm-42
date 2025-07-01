
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, TrendingUp, Building2 } from 'lucide-react';

interface LocationDistributionMapProps {
  teams: any[];
  locationMetrics: any;
}

export function LocationDistributionMap({ teams, locationMetrics }: LocationDistributionMapProps) {
  // Mock geographic data for visualization
  const locationData = [
    { 
      name: 'New York', 
      teams: 15, 
      members: 87, 
      performance: 92,
      coordinates: { lat: 40.7128, lng: -74.0060 },
      status: 'excellent'
    },
    { 
      name: 'Chicago', 
      teams: 12, 
      members: 65, 
      performance: 88,
      coordinates: { lat: 41.8781, lng: -87.6298 },
      status: 'good'
    },
    { 
      name: 'Los Angeles', 
      teams: 18, 
      members: 102, 
      performance: 94,
      coordinates: { lat: 34.0522, lng: -118.2437 },
      status: 'excellent'
    },
    { 
      name: 'Miami', 
      teams: 8, 
      members: 43, 
      performance: 85,
      coordinates: { lat: 25.7617, lng: -80.1918 },
      status: 'good'
    },
    { 
      name: 'Seattle', 
      teams: 10, 
      members: 58, 
      performance: 90,
      coordinates: { lat: 47.6062, lng: -122.3321 },
      status: 'excellent'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'needs-attention': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Map Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Geographic Team Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Interactive Map Placeholder */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-8 mb-6">
            <div className="text-center">
              <MapPin className="h-16 w-16 mx-auto mb-4 text-blue-500" />
              <h3 className="text-lg font-medium mb-2">Interactive Map View</h3>
              <p className="text-muted-foreground">
                Geographic visualization of team distribution across locations
              </p>
              <div className="mt-4 text-sm text-blue-600">
                Integration with mapping services coming soon
              </div>
            </div>
          </div>

          {/* Location Cards Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {locationData.map((location) => (
              <Card key={location.name} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{location.name}</span>
                    </div>
                    <Badge className={getStatusColor(location.status)}>
                      {location.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-500">Teams:</span>
                      </div>
                      <div className="font-bold text-lg">{location.teams}</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-500">Members:</span>
                      </div>
                      <div className="font-bold text-lg">{location.members}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-500">Performance:</span>
                      </div>
                      <div className="font-bold text-lg text-green-600">{location.performance}%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Distribution Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Distribution Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {locationData.reduce((sum, loc) => sum + loc.teams, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Teams</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {locationData.reduce((sum, loc) => sum + loc.members, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Members</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {Math.round(locationData.reduce((sum, loc) => sum + loc.performance, 0) / locationData.length)}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Performance</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
