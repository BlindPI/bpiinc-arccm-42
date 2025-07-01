
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, TrendingUp, Building2 } from 'lucide-react';

interface LocationHeatmapProps {
  data: any[];
  loading: boolean;
}

export function LocationHeatmap({ data, loading }: LocationHeatmapProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Mock location data with performance scores
  const locationData = data.length > 0 ? data : [
    { 
      location_name: 'New York', 
      performance_score: 92, 
      activity_density: 85,
      compliance_rating: 94,
      heat_intensity: 88
    },
    { 
      location_name: 'Chicago', 
      performance_score: 88, 
      activity_density: 78,
      compliance_rating: 90,
      heat_intensity: 82
    },
    { 
      location_name: 'Los Angeles', 
      performance_score: 94, 
      activity_density: 92,
      compliance_rating: 96,
      heat_intensity: 91
    }
  ];

  const getHeatColor = (intensity: number) => {
    if (intensity >= 90) return 'bg-green-500';
    if (intensity >= 80) return 'bg-yellow-500';
    if (intensity >= 70) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getPerformanceStatus = (score: number) => {
    if (score >= 90) return { status: 'excellent', color: 'bg-green-100 text-green-800' };
    if (score >= 80) return { status: 'good', color: 'bg-blue-100 text-blue-800' };
    if (score >= 70) return { status: 'fair', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'needs attention', color: 'bg-red-100 text-red-800' };
  };

  return (
    <div className="space-y-6">
      {/* Heatmap Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Performance Heatmap by Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Visual Heatmap */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-8 mb-6">
            <div className="text-center">
              <MapPin className="h-16 w-16 mx-auto mb-4 text-blue-500" />
              <h3 className="text-lg font-medium mb-2">Interactive Geographic Heatmap</h3>
              <p className="text-muted-foreground mb-4">
                Visual representation of performance intensity across locations
              </p>
              <div className="flex items-center justify-center gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>High Performance</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span>Medium Performance</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>Low Performance</span>
                </div>
              </div>
            </div>
          </div>

          {/* Location Performance Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {locationData.map((location, index) => {
              const status = getPerformanceStatus(location.performance_score);
              return (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{location.location_name}</span>
                      </div>
                      <Badge className={status.color}>
                        {status.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Performance</span>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getHeatColor(location.performance_score)}`}></div>
                          <span className="font-bold">{location.performance_score}%</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Activity</span>
                        <span className="font-medium">{location.activity_density}%</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Compliance</span>
                        <span className="font-medium">{location.compliance_rating}%</span>
                      </div>
                      
                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Heat Index</span>
                          <div className="flex items-center gap-1">
                            <span className="text-lg font-bold">{location.heat_intensity}</span>
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Heatmap Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Location Analytics Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {locationData.length}
              </div>
              <div className="text-sm text-muted-foreground">Active Locations</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {Math.round(locationData.reduce((sum, loc) => sum + loc.performance_score, 0) / locationData.length)}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Performance</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {locationData.filter(loc => loc.performance_score >= 90).length}
              </div>
              <div className="text-sm text-muted-foreground">High Performers</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
