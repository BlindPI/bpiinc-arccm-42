
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Plus,
  Settings,
  BarChart3
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { enhancedSupervisionService } from '@/services/supervision/enhancedSupervisionService';
import { locationAnalyticsService } from '@/services/analytics/locationAnalyticsService';

export function ProviderIntegrationHub() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: providerMetrics, isLoading: loadingProviders } = useQuery({
    queryKey: ['provider-supervision-metrics'],
    queryFn: () => enhancedSupervisionService.getProviderSupervisionMetrics()
  });

  const { data: locationMetrics, isLoading: loadingLocations } = useQuery({
    queryKey: ['location-analytics'],
    queryFn: () => locationAnalyticsService.getLocationAnalytics()
  });

  const { data: crossLocationComparison } = useQuery({
    queryKey: ['cross-location-comparison'],
    queryFn: () => locationAnalyticsService.getCrossLocationComparison()
  });

  if (loadingProviders || loadingLocations) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalProviders = providerMetrics?.length || 0;
  const activeProviders = providerMetrics?.filter(p => p.current_supervisees > 0).length || 0;
  const totalLocations = locationMetrics?.length || 0;
  const avgComplianceScore = locationMetrics?.reduce((sum, l) => sum + l.compliance_score, 0) / (locationMetrics?.length || 1) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            Provider Integration Hub
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive provider and location management with advanced analytics
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Provider
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Integration Settings
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Total Providers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalProviders}</div>
            <p className="text-xs text-gray-500 mt-1">{activeProviders} active</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalLocations}</div>
            <p className="text-xs text-gray-500 mt-1">Across all providers</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{Math.round(avgComplianceScore)}%</div>
            <p className="text-xs text-gray-500 mt-1">Across all locations</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Integration Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">98%</div>
            <p className="text-xs text-gray-500 mt-1">System health</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Provider Performance Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Provider Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {providerMetrics?.slice(0, 6).map((provider) => (
                  <Card key={provider.provider_id} className="border-l-4 border-l-primary">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{provider.provider_name}</span>
                        <Badge variant={provider.compliance_score >= 80 ? "default" : "destructive"}>
                          {Math.round(provider.compliance_score)}%
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Supervisees:</span>
                          <span>{provider.current_supervisees}/{provider.supervision_capacity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Performance:</span>
                          <span>{Math.round(provider.performance_rating * 10) / 10}/5.0</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Location Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Location Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {locationMetrics?.slice(0, 5).map((location) => (
                  <div key={location.location_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{location.location_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {location.total_teams} teams • {location.total_members} members
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm">
                        <div className="font-medium">{location.compliance_score}%</div>
                        <div className="text-muted-foreground">Compliance</div>
                      </div>
                      <Badge variant={location.compliance_score >= 80 ? "default" : "destructive"}>
                        {location.compliance_score >= 80 ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <AlertCircle className="h-3 w-3 mr-1" />
                        )}
                        {location.compliance_score >= 80 ? 'Compliant' : 'Action Needed'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-6">
          {/* Provider Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Provider Management</CardTitle>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search providers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Providers</SelectItem>
                      <SelectItem value="training">Training Providers</SelectItem>
                      <SelectItem value="assessment">Assessment Centers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {providerMetrics?.map((provider) => (
                  <Card key={provider.provider_id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{provider.provider_name}</h3>
                          <Badge variant="outline">ID: {provider.provider_id}</Badge>
                        </div>
                        
                        <div className="grid md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Capacity:</span>
                            <div className="font-medium">{provider.current_supervisees}/{provider.supervision_capacity}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Compliance Score:</span>
                            <div className="font-medium">{Math.round(provider.compliance_score)}%</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Performance Rating:</span>
                            <div className="font-medium">{Math.round(provider.performance_rating * 10) / 10}/5.0</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Utilization:</span>
                            <div className="font-medium">
                              {Math.round((provider.current_supervisees / provider.supervision_capacity) * 100)}%
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
                        <Button variant="outline" size="sm">
                          <BarChart3 className="h-4 w-4 mr-1" />
                          Analytics
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="space-y-6">
          {/* Location Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Location Performance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {locationMetrics?.map((location) => (
                  <Card key={location.location_id} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{location.location_name}</span>
                        <Badge variant={location.trends.performance_change >= 0 ? "default" : "destructive"}>
                          {location.trends.performance_change >= 0 ? '+' : ''}{Math.round(location.trends.performance_change)}%
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Teams:</span>
                            <div className="font-medium">{location.total_teams}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Members:</span>
                            <div className="font-medium">{location.total_members}</div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Compliance Score:</span>
                            <span className="font-medium">{location.compliance_score}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Active Certs:</span>
                            <span className="font-medium">{location.active_certificates}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Expiring Soon:</span>
                            <span className="font-medium text-orange-600">{location.expiring_certificates}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Cross-Location Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Cross-Location Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {crossLocationComparison?.map((comparison) => (
                  <div key={comparison.metric}>
                    <h4 className="font-medium mb-3">{comparison.metric}</h4>
                    <div className="space-y-2">
                      {comparison.locations.slice(0, 5).map((location) => (
                        <div key={location.location_id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">#{location.rank}</Badge>
                            <span className="font-medium">{location.location_name}</span>
                          </div>
                          <div className="font-semibold">{location.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
