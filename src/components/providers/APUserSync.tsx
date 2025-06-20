
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  UserCheck, 
  Building2, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

export function APUserSync() {
  const queryClient = useQueryClient();

  // Get all AP users
  const { data: apUsers = [] } = useQuery({
    queryKey: ['ap-users-detailed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'AP')
        .order('display_name');
      
      if (error) throw error;
      return data;
    }
  });

  // Get all authorized providers
  const { data: authorizedProviders = [] } = useQuery({
    queryKey: ['authorized-providers-sync'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('authorized_providers')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Sync all AP users
  const syncAllAPUsersMutation = useMutation({
    mutationFn: async () => {
      const syncResults = [];
      
      for (const apUser of apUsers) {
        const existingProvider = authorizedProviders.find(p => p.id === apUser.id);
        
        if (!existingProvider) {
          const { data: provider, error } = await supabase
            .from('authorized_providers')
            .upsert({
              id: apUser.id,
              name: apUser.display_name || `Provider ${apUser.email}`,
              provider_type: 'authorized_partner',
              status: 'active',
              contact_email: apUser.email,
              description: `Authorized Provider for ${apUser.display_name || apUser.email}`,
              performance_rating: 4.5,
              compliance_score: 95.0
            }, {
              onConflict: 'id'
            })
            .select()
            .single();

          if (error) {
            console.error(`Failed to sync ${apUser.email}:`, error);
            syncResults.push({ user: apUser, success: false, error: error.message });
          } else {
            syncResults.push({ user: apUser, success: true, provider });
          }
        } else {
          syncResults.push({ user: apUser, success: true, provider: existingProvider, alreadySynced: true });
        }
      }
      
      return syncResults;
    },
    onSuccess: (results) => {
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      toast.success(`Sync completed: ${successful} successful, ${failed} failed`);
      queryClient.invalidateQueries({ queryKey: ['authorized-providers-sync'] });
      queryClient.invalidateQueries({ queryKey: ['ap-users-detailed'] });
    },
    onError: (error: any) => {
      toast.error(`Sync failed: ${error.message}`);
    }
  });

  // Sync individual AP user
  const syncSingleUserMutation = useMutation({
    mutationFn: async (apUser: any) => {
      const { data: provider, error } = await supabase
        .from('authorized_providers')
        .upsert({
          id: apUser.id,
          name: apUser.display_name || `Provider ${apUser.email}`,
          provider_type: 'authorized_partner',
          status: 'active',
          contact_email: apUser.email,
          description: `Authorized Provider for ${apUser.display_name || apUser.email}`,
          performance_rating: 4.5,
          compliance_score: 95.0
        }, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (error) throw error;
      return provider;
    },
    onSuccess: () => {
      toast.success('AP User synced successfully');
      queryClient.invalidateQueries({ queryKey: ['authorized-providers-sync'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to sync AP User: ${error.message}`);
    }
  });

  // Get sync status for each AP user
  const getSyncStatus = (apUser: any) => {
    const provider = authorizedProviders.find(p => p.id === apUser.id);
    return {
      isSynced: !!provider,
      provider
    };
  };

  const unsyncedUsers = apUsers.filter(user => !getSyncStatus(user).isSynced);
  const syncedUsers = apUsers.filter(user => getSyncStatus(user).isSynced);

  return (
    <div className="space-y-6">
      {/* Sync Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Total AP Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{apUsers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Synced Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{syncedUsers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Unsynced Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{unsyncedUsers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Sync Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Sync Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => syncAllAPUsersMutation.mutate()}
              disabled={syncAllAPUsersMutation.isPending || unsyncedUsers.length === 0}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${syncAllAPUsersMutation.isPending ? 'animate-spin' : ''}`} />
              {syncAllAPUsersMutation.isPending ? 'Syncing All...' : `Sync All AP Users (${unsyncedUsers.length})`}
            </Button>
            
            <div className="text-sm text-muted-foreground">
              This will create authorized provider records for all AP users
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unsynced Users */}
      {unsyncedUsers.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Unsynced AP Users ({unsyncedUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unsyncedUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                      <UserCheck className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="font-medium">{user.display_name || 'No Name'}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      <Badge variant="outline">AP Role</Badge>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={() => syncSingleUserMutation.mutate(user)}
                    disabled={syncSingleUserMutation.isPending}
                  >
                    {syncSingleUserMutation.isPending ? 'Syncing...' : 'Sync Now'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Synced Users */}
      {syncedUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-700 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Synced AP Users ({syncedUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {syncedUsers.map((user) => {
                const { provider } = getSyncStatus(user);
                return (
                  <div key={user.id} className="flex items-center justify-between p-3 border border-green-200 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">{user.display_name || 'No Name'}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <div className="text-sm text-green-700">
                          Provider: {provider?.name}
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">AP Role</Badge>
                          <Badge variant="default">Synced</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-green-600 font-medium">✓ Synced</div>
                      <div className="text-xs text-gray-500">
                        Rating: {provider?.performance_rating}/5.0
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>System Health Check</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded">
              <span>AP Users with Provider Records</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{syncedUsers.length}/{apUsers.length}</span>
                {syncedUsers.length === apUsers.length ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded">
              <span>Data Consistency Status</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {unsyncedUsers.length === 0 ? 'Healthy' : 'Needs Attention'}
                </span>
                {unsyncedUsers.length === 0 ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
