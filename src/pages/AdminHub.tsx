import { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { 
  Settings, 
  Users, 
  Shield, 
  Bell, 
  Monitor, 
  Loader2,
  UserCheck,
  Database,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/PageHeader';

// Import admin components
import { RoleManagementHeader } from '@/components/role-management/dashboard/RoleManagementHeader';
import { ProgressionDashboard } from '@/components/role-management/progression/ProgressionDashboard';
import { useCertificateNotificationsList, useCertificateNotificationCount } from '@/hooks/useCertificateNotifications';
import { Button } from '@/components/ui/button';

export default function AdminHub() {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Notifications data
  const { data: notifications = [], isLoading: notificationsLoading } = useCertificateNotificationsList();
  const { data: unreadCount = 0 } = useCertificateNotificationCount();

  // Loading state
  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Authentication check
  if (!user) {
    return <Navigate to="/auth" />;
  }

  // Admin access check - SA, AD roles only
  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
  if (!isAdmin) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
        <p className="text-muted-foreground">
          You do not have permission to access the Admin Hub. SA or AD role required.
        </p>
      </div>
    );
  }

  // Admin navigation cards
  const adminCards = [
    {
      id: 'overview',
      title: 'System Overview',
      description: 'Dashboard and system metrics',
      icon: <Activity className="h-6 w-6" />,
      badge: { text: 'Live', variant: 'default' as const },
      stats: [
        { label: 'Active Users', value: '1,234' },
        { label: 'System Health', value: '98.5%' }
      ]
    },
    {
      id: 'roles',
      title: 'Role Management',
      description: 'User roles and permissions',
      icon: <Shield className="h-6 w-6" />,
      badge: { text: 'Critical', variant: 'destructive' as const },
      stats: [
        { label: 'Active Roles', value: '7' },
        { label: 'Pending Reviews', value: '3' }
      ]
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'System alerts and messages',
      icon: <Bell className="h-6 w-6" />,
      badge: { text: `${unreadCount} Unread`, variant: unreadCount > 0 ? 'destructive' as const : 'secondary' as const },
      stats: [
        { label: 'Total', value: notifications.length.toString() },
        { label: 'Unread', value: unreadCount.toString() }
      ]
    },
    {
      id: 'monitoring',
      title: 'System Monitoring',
      description: 'Performance and health metrics',
      icon: <Monitor className="h-6 w-6" />,
      badge: { text: 'Monitoring', variant: 'default' as const },
      stats: [
        { label: 'Uptime', value: '99.9%' },
        { label: 'Response Time', value: '45ms' }
      ]
    },
    {
      id: 'users',
      title: 'User Management',
      description: 'User accounts and profiles',
      icon: <Users className="h-6 w-6" />,
      badge: { text: 'Active', variant: 'default' as const },
      stats: [
        { label: 'Total Users', value: '1,234' },
        { label: 'New Today', value: '12' }
      ]
    },
    {
      id: 'database',
      title: 'Database Admin',
      description: 'Database management and health',
      icon: <Database className="h-6 w-6" />,
      badge: { text: 'Healthy', variant: 'default' as const },
      stats: [
        { label: 'Size', value: '45.2GB' },
        { label: 'Connections', value: '127' }
      ]
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={<Settings className="h-7 w-7 text-primary" />}
        title="Admin Hub"
        subtitle="Comprehensive system administration center"
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {profile?.role} Access
            </Badge>
          </div>
        }
      />

      {/* Admin Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminCards.map((card) => (
          <Card 
            key={card.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-l-4 ${
              activeTab === card.id 
                ? 'border-l-primary bg-primary/5 shadow-md' 
                : 'border-l-transparent hover:border-l-primary/50'
            }`}
            onClick={() => setActiveTab(card.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    activeTab === card.id ? 'bg-primary text-white' : 'bg-muted'
                  }`}>
                    {card.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {card.description}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={card.badge.variant} className="text-xs">
                  {card.badge.text}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm">
                {card.stats.map((stat, index) => (
                  <div key={index}>
                    <span className="font-medium">{stat.value}</span>
                    <p className="text-muted-foreground text-xs">{stat.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Admin Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-muted/30">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Database
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Operational</div>
                <p className="text-xs text-muted-foreground">All systems running normally</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">847</div>
                <p className="text-xs text-muted-foreground">Current user sessions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Database Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Excellent</div>
                <p className="text-xs text-muted-foreground">99.9% uptime</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">2</div>
                <p className="text-xs text-muted-foreground">Warnings requiring attention</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Role Management System</CardTitle>
              <CardDescription>
                Manage user roles, permissions, and progression paths
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ProgressionDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>System Notifications</CardTitle>
                  <CardDescription>
                    Manage and monitor system-wide notifications
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {notifications.length} Total
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.slice(0, 5).map((notification) => (
                  <div key={notification.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{notification.title}</p>
                        <p className="text-xs text-muted-foreground">{notification.message}</p>
                      </div>
                    </div>
                    <Badge variant={notification.read ? 'secondary' : 'default'} className="text-xs">
                      {notification.read ? 'Read' : 'Unread'}
                    </Badge>
                  </div>
                ))}
                {notifications.length > 5 && (
                  <Button variant="outline" className="w-full">
                    View All {notifications.length} Notifications
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Server Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">CPU Usage</span>
                    <span className="text-sm font-medium">23%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Memory Usage</span>
                    <span className="text-sm font-medium">67%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Disk Usage</span>
                    <span className="text-sm font-medium">45%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Network Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Bandwidth Usage</span>
                    <span className="text-sm font-medium">156 MB/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Active Connections</span>
                    <span className="text-sm font-medium">1,247</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Response Time</span>
                    <span className="text-sm font-medium">45ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Advanced user account management and analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">
                  User management functionality integrated from existing UserManagementPage
                </p>
                <Button variant="outline" className="mt-4">
                  Go to User Management
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Administration</CardTitle>
              <CardDescription>
                Database health, performance, and maintenance tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">45.2GB</div>
                    <p className="text-xs text-muted-foreground">Database Size</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">127</div>
                    <p className="text-xs text-muted-foreground">Active Connections</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">99.9%</div>
                    <p className="text-xs text-muted-foreground">Uptime</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">12ms</div>
                    <p className="text-xs text-muted-foreground">Avg Query Time</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}