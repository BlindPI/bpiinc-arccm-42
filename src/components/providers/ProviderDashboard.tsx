import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AuthorizedProviderService } from '@/services/provider/authorizedProviderService';

export interface AuthorizedProvider {
  id: string | number;
  name: string;
  provider_name?: string;
  provider_type: string;
  status: 'APPROVED' | 'REJECTED' | 'PENDING' | 'SUSPENDED';
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  website?: string;
  description?: string;
  logo_url?: string;
  compliance_score: number;
  performance_rating: number;
  contract_start_date?: string;
  contract_end_date?: string;
  specializations?: string[];
  certification_levels?: string[];
  primary_location_id?: string;
  metadata?: Record<string, any>;
  approved_by?: string;
  approval_date?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export function ProviderDashboard() {
  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['authorized-providers'],
    queryFn: () => AuthorizedProviderService.getProviders()
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const activeProviders = providers.filter(p => p.status === 'APPROVED');
  const pendingProviders = providers.filter(p => p.status === 'PENDING');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Authorized Providers</h1>
          <p className="text-muted-foreground">
            Manage and monitor authorized training providers
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <CardHeader>
              <CardTitle>Total Providers</CardTitle>
            </CardHeader>
            <div className="text-2xl font-bold">{providers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <CardHeader>
              <CardTitle>Active Providers</CardTitle>
            </CardHeader>
            <div className="text-2xl font-bold">{activeProviders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
            </CardHeader>
            <div className="text-2xl font-bold">{pendingProviders.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        {providers.map((provider) => (
          <Card key={provider.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{provider.name}</h3>
                  <p className="text-muted-foreground">{provider.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{provider.provider_type}</Badge>
                    <Badge 
                      variant={provider.status === 'APPROVED' ? 'default' : 
                              provider.status === 'PENDING' ? 'secondary' : 'destructive'}
                    >
                      {provider.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
