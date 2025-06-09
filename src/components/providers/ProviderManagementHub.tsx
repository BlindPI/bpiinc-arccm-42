
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { AuthorizedProviderService } from '@/services/providers/authorizedProviderService';
import { TeamManagementService } from '@/services/team/teamManagementService';
import { Building2, Users, TrendingUp, Search, Plus, Eye, Edit, Trash2 } from 'lucide-react';

export function ProviderManagementHub() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: providers = [], isLoading: providersLoading } = useQuery({
    queryKey: ['authorized-providers'],
    queryFn: () => AuthorizedProviderService.getProviders()
  });

  const { data: systemAnalytics } = useQuery({
    queryKey: ['system-analytics'],
    queryFn: () => TeamManagementService.getSystemWideAnalytics()
  });

  const { data: allProviderTeams = [] } = useQuery({
    queryKey: ['all-provider-teams'],
    queryFn: async () => {
      const teams = await Promise.all(
        providers.map(provider => TeamManagementService.getProviderTeams(provider.id.toString()))
      );
      return teams.flat();
    },
    enabled: providers.length > 0
  });

  const filteredProviders = providers.filter(provider => {
    const matchesSearch = searchTerm === '' || 
      provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.provider_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || provider.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'SUSPENDED': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProviderTeamCount = (providerId: string | number) => {
    return allProviderTeams.filter(team => 
      String(team.provider_id) === String(providerId)
    ).length;
  };

  if (providersLoading) {
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
          <h1 className="text-3xl font-bold tracking-tight">Provider Management Hub</h1>
          <p className="text-muted-foreground mt-2">
            Manage authorized training providers and their operations
          </p>
        </div>
        
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add New Provider
        </Button>
      </div>

      {/* System Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Total Providers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{providers.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              {providers.filter(p => p.status === 'APPROVED').length} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Provider Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allProviderTeams.length}</div>
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
            <div className="text-2xl font-bold">
              {Math.round(providers.reduce((sum, p) => sum + (p.performance_rating || 0), 0) / providers.length) || 0}%
            </div>
            <p className="text-xs text-gray-500 mt-1">System average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Compliance Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(providers.reduce((sum, p) => sum + (p.compliance_score || 0), 0) / providers.length) || 0}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Average compliance</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Provider Directory</CardTitle>
            <div className="flex items-center gap-4">
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
          <div className="space-y-4">
            {filteredProviders.map((provider) => (
              <div key={provider.id} className="border rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold">{provider.name}</h3>
                      <Badge className={getStatusColor(provider.status)}>
                        {provider.status}
                      </Badge>
                      <Badge variant="outline">
                        {provider.provider_type}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Teams:</span>
                        <div className="font-medium">{getProviderTeamCount(provider.id)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Performance:</span>
                        <div className="font-medium">{provider.performance_rating || 0}%</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Compliance:</span>
                        <div className="font-medium">{provider.compliance_score || 0}%</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Contact:</span>
                        <div className="font-medium">{provider.contact_email || 'Not provided'}</div>
                      </div>
                    </div>

                    {provider.description && (
                      <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                        {provider.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-6">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredProviders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No providers found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
