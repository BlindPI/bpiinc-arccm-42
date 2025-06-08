
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { authorizedProviderService } from '@/services/provider/authorizedProviderService';
import { teamManagementService } from '@/services/team/teamManagementService';
import { ProviderDashboard } from './ProviderDashboard';
import { CreateProviderDialog } from './CreateProviderDialog';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Star,
  Search,
  Filter,
  Plus,
  Eye
} from 'lucide-react';

export function ProviderManagementHub() {
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['authorized-providers'],
    queryFn: () => authorizedProviderService.getAllProviders()
  });

  const { data: systemAnalytics } = useQuery({
    queryKey: ['provider-analytics'],
    queryFn: async () => {
      const analytics = await teamManagementService.getSystemWideAnalytics();
      
      // Get team counts by provider
      const teamsByProvider: Record<string, number> = {};
      for (const provider of providers) {
        const teams = await teamManagementService.getProviderTeams(provider.id.toString());
        teamsByProvider[provider.name] = teams.length;
      }
      
      return {
        ...analytics,
        teamsByProvider
      };
    },
    enabled: providers.length > 0
  });

  const filteredProviders = providers.filter(provider =>
    provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.provider_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedProviderId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => setSelectedProviderId('')}
          >
            ← Back to Provider List
          </Button>
        </div>
        
        <ProviderDashboard providerId={selectedProviderId} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            Provider Management Hub
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive provider oversight, team management, and performance monitoring
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Provider
          </Button>
        </div>
      </div>

      {/* Provider Analytics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Active Providers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {providers.filter(p => p.status === 'active').length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Operational providers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {systemAnalytics?.totalTeams || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Across all providers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {providers.length > 0 
                ? (providers.reduce((sum, p) => sum + p.performance_rating, 0) / providers.length).toFixed(1)
                : '0.0'
              }
            </div>
            <p className="text-xs text-gray-500 mt-1">Provider rating</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Star className="h-4 w-4" />
              Avg Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {providers.length > 0 
                ? (providers.reduce((sum, p) => sum + p.compliance_score, 0) / providers.length).toFixed(1)
                : '0.0'
              }%
            </div>
            <p className="text-xs text-gray-500 mt-1">Compliance score</p>
          </CardContent>
        </Card>
      </div>

      {/* Provider Management */}
      <Tabs defaultValue="list" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">Provider List</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Provider Directory</CardTitle>
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
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredProviders.map((provider) => (
                  <Card key={provider.id} className="border-l-4 border-l-primary">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          <span className="font-medium">{provider.name}</span>
                        </div>
                        <Badge variant={provider.status === 'active' ? 'default' : 'secondary'}>
                          {provider.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span>Type:</span>
                          <Badge variant="outline">{provider.provider_type}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Performance:</span>
                          <span className="font-medium">{provider.performance_rating.toFixed(1)}/5.0</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Compliance:</span>
                          <span className="font-medium">{provider.compliance_score.toFixed(1)}%</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => setSelectedProviderId(provider.id.toString())}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Dashboard
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {filteredProviders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No providers found</p>
                  <p className="text-sm">Try adjusting your search criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardContent className="p-8 text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Provider Analytics</h3>
              <p className="text-muted-foreground">Detailed analytics and reporting dashboard</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardContent className="p-8 text-center">
              <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Compliance Monitoring</h3>
              <p className="text-muted-foreground">Track compliance scores and requirements</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Provider Dialog */}
      {showCreateDialog && (
        <CreateProviderDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      )}
    </div>
  );
}
