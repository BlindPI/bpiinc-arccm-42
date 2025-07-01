
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  MapPin, 
  Building2, 
  TrendingUp,
  UserCheck,
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { enhancedSupervisionService } from '@/services/supervision/enhancedSupervisionService';

export function EnhancedSupervisionDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');

  const { data: locationMetrics, isLoading: loadingLocations } = useQuery({
    queryKey: ['location-supervision-metrics', selectedLocation],
    queryFn: () => enhancedSupervisionService.getLocationSupervisionMetrics(
      selectedLocation === 'all' ? undefined : selectedLocation
    )
  });

  const { data: providerMetrics, isLoading: loadingProviders } = useQuery({
    queryKey: ['provider-supervision-metrics'],
    queryFn: () => enhancedSupervisionService.getProviderSupervisionMetrics()
  });

  const { data: supervisionHierarchy } = useQuery({
    queryKey: ['supervision-hierarchy', selectedLocation],
    queryFn: () => enhancedSupervisionService.getSupervisionHierarchy(
      selectedLocation === 'all' ? undefined : selectedLocation
    )
  });

  if (loadingLocations || loadingProviders) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalSupervisors = locationMetrics?.reduce((sum, l) => sum + l.total_supervisors, 0) || 0;
  const totalSupervisees = locationMetrics?.reduce((sum, l) => sum + l.total_supervisees, 0) || 0;
  const totalRelationships = locationMetrics?.reduce((sum, l) => sum + l.active_relationships, 0) || 0;
  const avgComplianceRate = locationMetrics?.reduce((sum, l) => sum + l.compliance_rate, 0) / (locationMetrics?.length || 1) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <UserCheck className="h-8 w-8 text-primary" />
            Enhanced Supervision Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Location-based supervision analytics with provider integration
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locationMetrics?.map((location) => (
                <SelectItem key={location.location_id} value={location.location_id}>
                  {location.location_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Supervisors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalSupervisors}</div>
            <p className="text-xs text-gray-500 mt-1">Across all locations</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Total Supervisees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalSupervisees}</div>
            <p className="text-xs text-gray-500 mt-1">Active supervision</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Active Relationships
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{totalRelationships}</div>
            <p className="text-xs text-gray-500 mt-1">Supervision pairs</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Compliance Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{Math.round(avgComplianceRate)}%</div>
            <p className="text-xs text-gray-500 mt-1">System average</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="locations">By Location</TabsTrigger>
          <TabsTrigger value="providers">By Provider</TabsTrigger>
          <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Location Supervision Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Supervision by Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {locationMetrics?.map((location) => (
                  <Card key={location.location_id} className="border-l-4 border-l-primary">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="font-medium">{location.location_name}</span>
                        </div>
                        <Badge variant={location.compliance_rate >= 80 ? "default" : "destructive"}>
                          {location.compliance_rate}%
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Supervisors:</span>
                          <span className="font-medium">{location.total_supervisors}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Supervisees:</span>
                          <span className="font-medium">{location.total_supervisees}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Relationships:</span>
                          <span className="font-medium">{location.active_relationships}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Hours Logged:</span>
                          <span className="font-medium">{location.supervision_hours_logged}h</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Provider Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Provider Supervision Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {providerMetrics?.slice(0, 5).map((provider) => (
                  <div key={provider.provider_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{provider.provider_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {provider.current_supervisees}/{provider.supervision_capacity} capacity
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-center">
                        <div className="font-medium">{Math.round(provider.compliance_score)}%</div>
                        <div className="text-muted-foreground">Compliance</div>
                      </div>
                      <div className="text-sm text-center">
                        <div className="font-medium">{Math.round(provider.performance_rating * 10) / 10}</div>
                        <div className="text-muted-foreground">Rating</div>
                      </div>
                      <Badge variant={provider.compliance_score >= 80 ? "default" : "destructive"}>
                        {provider.compliance_score >= 80 ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <AlertTriangle className="h-3 w-3 mr-1" />
                        )}
                        {provider.compliance_score >= 80 ? 'Compliant' : 'Review Needed'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="space-y-6">
          {/* Detailed Location Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Location-Specific Supervision Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {locationMetrics?.map((location) => (
                  <Card key={location.location_id} className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-primary" />
                          {location.location_name}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Location ID: {location.location_id}
                        </p>
                      </div>
                      <Badge variant={location.compliance_rate >= 80 ? "default" : "destructive"}>
                        {location.compliance_rate}% Compliance
                      </Badge>
                    </div>
                    
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{location.total_supervisors}</div>
                        <div className="text-sm text-blue-700">Supervisors</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{location.total_supervisees}</div>
                        <div className="text-sm text-green-700">Supervisees</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{location.active_relationships}</div>
                        <div className="text-sm text-purple-700">Relationships</div>
                      </div>
                      <div className="text-center p-3 bg-amber-50 rounded-lg">
                        <div className="text-2xl font-bold text-amber-600">{location.supervision_hours_logged}</div>
                        <div className="text-sm text-amber-700">Hours Logged</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-6">
          {/* Provider Details */}
          <Card>
            <CardHeader>
              <CardTitle>Provider Supervision Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {providerMetrics?.map((provider) => (
                  <Card key={provider.provider_id} className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-primary" />
                          {provider.provider_name}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Provider ID: {provider.provider_id}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {Math.round((provider.current_supervisees / provider.supervision_capacity) * 100)}% Utilized
                        </Badge>
                        <Badge variant={provider.compliance_score >= 80 ? "default" : "destructive"}>
                          {Math.round(provider.compliance_score)}% Compliance
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{provider.supervision_capacity}</div>
                        <div className="text-sm text-blue-700">Max Capacity</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{provider.current_supervisees}</div>
                        <div className="text-sm text-green-700">Current Load</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{Math.round(provider.compliance_score)}</div>
                        <div className="text-sm text-purple-700">Compliance %</div>
                      </div>
                      <div className="text-center p-3 bg-amber-50 rounded-lg">
                        <div className="text-2xl font-bold text-amber-600">{Math.round(provider.performance_rating * 10) / 10}</div>
                        <div className="text-sm text-amber-700">Performance</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hierarchy" className="space-y-6">
          {/* Supervision Hierarchy */}
          <Card>
            <CardHeader>
              <CardTitle>Supervision Hierarchy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {supervisionHierarchy?.map((supervisor, index) => (
                  <Card key={supervisor.id} className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{supervisor.name}</h3>
                        <p className="text-sm text-muted-foreground">{supervisor.role}</p>
                      </div>
                      <Badge variant="outline" className="ml-auto">
                        {supervisor.supervisees?.length || 0} supervisees
                      </Badge>
                    </div>
                    
                    {supervisor.supervisees && supervisor.supervisees.length > 0 && (
                      <div className="ml-8 space-y-2">
                        {supervisor.supervisees.map((supervisee: any) => (
                          <div key={supervisee.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                            <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                            </div>
                            <div className="flex-1">
                              <span className="font-medium">{supervisee.name}</span>
                              <span className="text-sm text-muted-foreground ml-2">({supervisee.role})</span>
                            </div>
                            <Badge variant={supervisee.status === 'active' ? "default" : "secondary"}>
                              {supervisee.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
