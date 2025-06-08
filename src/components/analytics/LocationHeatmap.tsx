
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MapPin, TrendingUp, TrendingDown } from 'lucide-react';
import type { LocationHeatmapData } from '@/types/analytics';

interface LocationHeatmapProps {
  data: LocationHeatmapData[];
  loading: boolean;
}

export const LocationHeatmap: React.FC<LocationHeatmapProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-2 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No location data available</p>
        </CardContent>
      </Card>
    );
  }

  const getHeatColor = (intensity: number) => {
    if (intensity >= 0.8) return 'bg-red-500';
    if (intensity >= 0.6) return 'bg-orange-500';
    if (intensity >= 0.4) return 'bg-yellow-500';
    if (intensity >= 0.2) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getHeatBorderColor = (intensity: number) => {
    if (intensity >= 0.8) return 'border-red-200';
    if (intensity >= 0.6) return 'border-orange-200';
    if (intensity >= 0.4) return 'border-yellow-200';
    if (intensity >= 0.2) return 'border-blue-200';
    return 'border-green-200';
  };

  return (
    <div className="space-y-4">
      {/* Heatmap Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Performance Intensity Scale</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-xs">High Performance</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-xs">Good</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-xs">Average</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span className="text-xs">Below Average</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-xs">Needs Attention</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data.map((location) => (
          <Card 
            key={location.id} 
            className={`${getHeatBorderColor(location.heat_intensity)} border-2 transition-all hover:scale-105`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium truncate">
                  {location.location_name}
                </CardTitle>
                <div className={`w-3 h-3 rounded-full ${getHeatColor(location.heat_intensity)}`}></div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Performance Score */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>Performance</span>
                  <span className="font-medium">{Math.round(location.performance_score)}%</span>
                </div>
                <Progress value={location.performance_score} className="h-2" />
              </div>

              {/* Compliance Rating */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>Compliance</span>
                  <span className="font-medium">{Math.round(location.compliance_rating)}%</span>
                </div>
                <Progress value={location.compliance_rating} className="h-2" />
              </div>

              {/* Activity Density */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Teams Active</span>
                <Badge variant="secondary">
                  {location.activity_density}
                </Badge>
              </div>

              {/* Risk Factors */}
              {location.risk_factors && location.risk_factors.length > 0 && (
                <div className="pt-2 border-t">
                  <span className="text-xs text-red-600 font-medium">Risk Factors:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {location.risk_factors.slice(0, 2).map((factor, index) => (
                      <Badge key={index} variant="destructive" className="text-xs">
                        {factor}
                      </Badge>
                    ))}
                    {location.risk_factors.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{location.risk_factors.length - 2} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Trend Indicator */}
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-xs text-gray-600">Trend</span>
                <div className="flex items-center">
                  {location.performance_score > 75 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className="text-xs ml-1">
                    {location.performance_score > 75 ? 'Improving' : 'Declining'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
