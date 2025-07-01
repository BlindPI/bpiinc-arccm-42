
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/user-management';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Download,
  AlertTriangle,
  CheckCircle,
  UserX,
  Settings
} from 'lucide-react';

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  complianceIssues: number;
}

export function UserManagementDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0,
    complianceIssues: 0
  });

  // Fetch users with proper typing
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['admin-users', searchTerm, filterRole],
    queryFn: async (): Promise<UserProfile[]> => {
      let query = supabase
        .from('profiles')
        .select(`
          id,
          email,
          display_name,
          role,
          phone,
          location,
          department,
          job_title,
          manager_id,
          team_id,
          status,
          compliance_tier,
          compliance_status,
          compliance_score,
          pending_actions,
          team_count,
          certifications_count,
          created_at,
          updated_at,
          user_id
        `);

      if (searchTerm) {
        query = query.or(`display_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      if (filterRole !== 'all') {
        query = query.eq('role', filterRole);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to ensure all required properties are present
      return (data || []).map(user => ({
        ...user,
        last_login: user.updated_at || null,
        is_active: user.status === 'ACTIVE'
      })) as UserProfile[];
    }
  });

  // Calculate user statistics
  useEffect(() => {
    if (users) {
      const stats = {
        totalUsers: users.length,
        activeUsers: users.filter(user => user.status === 'ACTIVE').length,
        pendingUsers: users.filter(user => user.status === 'PENDING').length,
        complianceIssues: users.filter(user => !user.compliance_status).length
      };
      setUserStats(stats);
    }
  }, [users]);

  const handleCreateUser = () => {
    // Mock function - implement user creation logic
    console.log('Create new user');
  };

  const handleBulkAction = (action: string) => {
    // Mock function - implement bulk actions
    console.log('Bulk action:', action);
  };

  const handleUserAction = (userId: string, action: string) => {
    // Mock function - implement individual user actions
    console.log('User action:', action, 'for user:', userId);
  };

  const mockUsers: UserProfile[] = [
    {
      id: '1',
      email: 'john.doe@example.com',
      display_name: 'John Doe',
      role: 'IC',
      status: 'ACTIVE',
      compliance_status: true,
      compliance_tier: 'basic',
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
      is_active: true
    },
    {
      id: '2', 
      email: 'jane.smith@example.com',
      display_name: 'Jane Smith',
      role: 'AP',
      status: 'ACTIVE',
      compliance_status: false,
      compliance_tier: 'robust',
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
      is_active: true
    },
    {
      id: '3',
      email: 'bob.wilson@example.com', 
      display_name: 'Bob Wilson',
      role: 'IT',
      status: 'PENDING',
      compliance_status: true,
      compliance_tier: 'basic',
      created_at: new Date().toISOString(),
      last_login: null,
      is_active: false
    }
  ];

  const displayUsers = users.length > 0 ? users : mockUsers;

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
          <Button onClick={handleCreateUser}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">All registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{userStats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{userStats.pendingUsers}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Issues</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{userStats.complianceIssues}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">User Directory</TabsTrigger>
          <TabsTrigger value="roles">Role Management</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Search and Filter */}
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
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="all">All Roles</option>
              <option value="IT">Instructor Trainee</option>
              <option value="IP">Instructor Provisional</option>
              <option value="IC">Instructor Certified</option>
              <option value="AP">Authorized Provider</option>
              <option value="AD">Administrator</option>
            </select>
            <Button variant="outline" onClick={() => handleBulkAction('export')}>
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* User List */}
          <Card>
            <CardHeader>
              <CardTitle>User Directory</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading users...</div>
              ) : error ? (
                <Alert className="border-red-200">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Error loading users. Please try again.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {displayUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold">
                          {user.display_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="font-medium">{user.display_name || 'Unnamed User'}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={user.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {user.status}
                        </Badge>
                        <Badge variant="outline">{user.role}</Badge>
                        {user.compliance_status ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Compliant
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            Non-Compliant
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUserAction(user.id, 'edit')}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Role Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Role and permission management</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>User compliance monitoring</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
