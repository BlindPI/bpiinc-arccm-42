
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserPlus, Search, Filter, Download } from 'lucide-react';
import { UserProfile } from '@/types/auth';

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  complianceRate: number;
}

export function UserManagementDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  // Fetch user statistics
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ['user-stats'],
    queryFn: async (): Promise<UserStats> => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, status, compliance_status');

      if (error) throw error;

      const totalUsers = profiles?.length || 0;
      const activeUsers = profiles?.filter(p => p.status === 'ACTIVE').length || 0;
      const pendingUsers = profiles?.filter(p => p.status === 'PENDING').length || 0;
      const compliantUsers = profiles?.filter(p => p.compliance_status === true).length || 0;
      const complianceRate = totalUsers > 0 ? (compliantUsers / totalUsers) * 100 : 0;

      return {
        totalUsers,
        activeUsers,
        pendingUsers,
        complianceRate: Math.round(complianceRate)
      };
    }
  });

  // Fetch users list
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users-list', searchTerm],
    queryFn: async (): Promise<UserProfile[]> => {
      let query = supabase
        .from('profiles')
        .select('id, display_name, email, role, status, compliance_status, created_at');

      if (searchTerm) {
        query = query.or(`display_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(profile => ({
        id: profile.id,
        display_name: profile.display_name || 'Unnamed User',
        email: profile.email || '',
        role: profile.role || 'IT',
        status: profile.status || 'INACTIVE',
        compliance_status: profile.compliance_status || false,
        created_at: profile.created_at || new Date().toISOString()
      })) || [];
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions across the platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.activeUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Users</CardTitle>
            <Users className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.pendingUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.complianceRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Users compliant</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No users found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.slice(0, 10).map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium">{user.display_name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{user.role}</Badge>
                    <Badge variant={user.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {user.status}
                    </Badge>
                    <Badge variant={user.compliance_status ? 'default' : 'destructive'}>
                      {user.compliance_status ? 'Compliant' : 'Non-compliant'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
