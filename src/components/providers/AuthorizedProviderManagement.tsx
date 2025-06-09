import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AuthorizedProviderService } from '@/services/providers/authorizedProviderService';
import { toast } from 'sonner';

export function AuthorizedProviderManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['authorized-providers'],
    queryFn: () => AuthorizedProviderService.getProviders()
  });

  const updateProviderMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      AuthorizedProviderService.updateProvider(id, updates),
    onSuccess: () => {
      toast.success('Provider updated successfully');
      queryClient.invalidateQueries({ queryKey: ['authorized-providers'] });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Authorized Providers</h1>
          <p className="text-muted-foreground">
            Manage and monitor authorized service providers
          </p>
        </div>
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
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => updateProviderMutation.mutate({
                      id: provider.id.toString(),
                      updates: { status: 'APPROVED' }
                    })}
                    disabled={provider.status === 'APPROVED'}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => updateProviderMutation.mutate({
                      id: provider.id.toString(),
                      updates: { status: 'REJECTED' }
                    })}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
