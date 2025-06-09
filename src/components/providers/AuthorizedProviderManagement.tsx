
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthorizedProviderService } from '@/services/provider/authorizedProviderService';

export function AuthorizedProviderManagement() {
  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['authorized-providers'],
    queryFn: () => AuthorizedProviderService.getProviders()
  });

  if (isLoading) {
    return <div className="p-6">Loading providers...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authorized Providers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {providers.map((provider) => (
            <div key={provider.id} className="p-4 border rounded-lg">
              <h3 className="font-medium">{provider.name}</h3>
              <p className="text-sm text-gray-600">{provider.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default AuthorizedProviderManagement;
