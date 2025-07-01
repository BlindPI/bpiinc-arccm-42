
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, Users, Filter, UserCheck } from 'lucide-react';

interface UserProfile {
  id: string;
  display_name: string;
  email: string;
  role: string;
  compliance_tier: 'basic' | 'robust' | null;
  created_at: string;
}

export function AdminUserTierManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users', searchTerm, roleFilter, tierFilter],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('id, display_name, email, role, compliance_tier, created_at')
        .order('display_name', { ascending: true });

      if (searchTerm) {
        query = query.or(`display_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      if (tierFilter !== 'all') {
        if (tierFilter === 'unassigned') {
          query = query.is('compliance_tier', null);
        } else {
          query = query.eq('compliance_tier', tierFilter);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as UserProfile[];
    }
  });

  const { mutate: updateUserTier } = useMutation({
    mutationFn: async ({ userId, tier }: { userId: string; tier: 'basic' | 'robust' | null }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ compliance_tier: tier })
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('User tier updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-admin-stats'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to update user tier: ${error.message}`);
    }
  });

  const { mutate: bulkUpdateTiers } = useMutation({
    mutationFn: async ({ userIds, tier }: { userIds: string[]; tier: 'basic' | 'robust' | null }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ compliance_tier: tier })
        .in('id', userIds);
      
      if (error) throw error;
    },
    onSuccess: (_, { userIds }) => {
      toast.success(`Updated ${userIds.length} users successfully`);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-admin-stats'] });
      setSelectedUsers([]);
    },
    onError: (error: any) => {
      toast.error(`Failed to bulk update users: ${error.message}`);
    }
  });

  const handleUserSelection = (userId: string, selected: boolean) => {
    if (selected) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleBulkTierUpdate = (tier: 'basic' | 'robust' | null) => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users first');
      return;
    }
    bulkUpdateTiers({ userIds: selectedUsers, tier });
  };

  const getTierBadgeVariant = (tier: string | null) => {
    switch (tier) {
      case 'basic': return 'default';
      case 'robust': return 'secondary';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            User Tier Management
          </h2>
          <p className="text-muted-foreground">
            Manage compliance tiers for all system users
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="SA">SA</SelectItem>
                <SelectItem value="AD">AD</SelectItem>
                <SelectItem value="AP">AP</SelectItem>
                <SelectItem value="IC">IC</SelectItem>
                <SelectItem value="IP">IP</SelectItem>
                <SelectItem value="IT">IT</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="robust">Robust</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">
                {selectedUsers.length} users selected
              </span>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  onClick={() => handleBulkTierUpdate('basic')}
                >
                  Set to Basic
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => handleBulkTierUpdate('robust')}
                >
                  Set to Robust
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleBulkTierUpdate(null)}
                >
                  Remove Tier
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setSelectedUsers([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={(e) => handleUserSelection(user.id, e.target.checked)}
                    className="rounded"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.display_name || user.email}</span>
                      <Badge variant="outline">{user.role}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getTierBadgeVariant(user.compliance_tier)}>
                    {user.compliance_tier || 'Unassigned'}
                  </Badge>
                  <Select
                    value={user.compliance_tier || 'unassigned'}
                    onValueChange={(value) => {
                      const tier = value === 'unassigned' ? null : value as 'basic' | 'robust';
                      updateUserTier({ userId: user.id, tier });
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="robust">Robust</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
