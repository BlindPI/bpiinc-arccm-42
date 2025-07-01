import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  BarChart3,
  RefreshCw,
  Download,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface ComplianceMetrics {
  totalUsers: number;
  compliantUsers: number;
  overallComplianceRate: number;
  pendingReviews: number;
  expiringSoon: number;
  recentUpdates: number;
  avgCompletionTime: number;
  criticalIssues: number;
}

interface TierMetrics {
  [key: string]: {
    name: string;
    userCount: number;
    complianceRate: number;
    avgScore: number;
    color: string;
  };
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  user_name: string;
  timestamp: string;
  status: string;
  severity?: string;
}

interface ComplianceAlert {
  id: string;
  type: 'expiring' | 'overdue' | 'critical' | 'warning';
  title: string;
  description: string;
  count: number;
  priority: 'high' | 'medium' | 'low';
  timestamp: string;
}

interface DashboardFilters {
  dateRange: string;
  tier: string;
  status: string;
}

export function RealtimeComplianceDashboard() {
  const [metrics, setMetrics] = useState<ComplianceMetrics>({
    totalUsers: 0,
    compliantUsers: 0,
    overallComplianceRate: 0,
    pendingReviews: 0,
    expiringSoon: 0,
    recentUpdates: 0,
    avgCompletionTime: 0,
    criticalIssues: 0
  });
  
  const [tierMetrics, setTierMetrics] = useState<TierMetrics>({});
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: '7d',
    tier: 'all',
    status: 'all'
  });
  
  const refreshInterval = useRef<NodeJS.Timeout>();
  const realtimeSubscription = useRef<any>();
  
  const getDateFilter = () => {
    const end = endOfDay(new Date());
    let start: Date;
    
    switch (filters.dateRange) {
      case '1d':
        start = startOfDay(new Date());
        break;
      case '7d':
        start = startOfDay(subDays(new Date(), 7));
        break;
      case '30d':
        start = startOfDay(subDays(new Date(), 30));
        break;
      case '90d':
        start = startOfDay(subDays(new Date(), 90));
        break;
      default:
        start = startOfDay(subDays(new Date(), 7));
    }
    
    return { start: start.toISOString(), end: end.toISOString() };
  };
  
  const loadComplianceMetrics = async (): Promise<ComplianceMetrics> => {
    const dateFilter = getDateFilter();
    
    try {
      // Get total users count
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id')
        .eq('active', true);
      
      if (usersError) {
        console.error('Error fetching users:', usersError);
      }
      
      const totalUsers = usersData?.length || 0;
      
      // Get compliance records
      const { data: complianceData, error: complianceError } = await supabase
        .from('user_compliance_records')
        .select('user_id, compliance_status, updated_at, created_at')
        .gte('updated_at', dateFilter.start)
        .lte('updated_at', dateFilter.end);
      
      if (complianceError) {
        console.error('Error fetching compliance data:', complianceError);
      }
      
      // Calculate metrics
      const compliantUsers = complianceData?.filter(r => r.compliance_status === 'compliant').length || 0;
      const overallComplianceRate = totalUsers ? Math.round((compliantUsers / totalUsers) * 100) : 0;
      
      // Get pending reviews count
      const { data: pendingData, error: pendingError } = await supabase
        .from('user_compliance_records')
        .select('id')
        .eq('compliance_status', 'pending');
      
      if (pendingError) {
        console.error('Error fetching pending reviews:', pendingError);
      }
      
      const pendingReviews = pendingData?.length || 0;
      
      // Get expiring soon (within 30 days)
      const expiringDate = new Date();
      expiringDate.setDate(expiringDate.getDate() + 30);
      
      const { data: expiringData, error: expiringError } = await supabase
        .from('user_compliance_records')
        .select('id')
        .eq('compliance_status', 'compliant')
        .lt('expires_at', expiringDate.toISOString());
      
      if (expiringError) {
        console.error('Error fetching expiring records:', expiringError);
      }
      
      const expiringSoon = expiringData?.length || 0;
      
      // Get recent updates (last 24h)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { data: recentData, error: recentError } = await supabase
        .from('user_compliance_records')
        .select('id')
        .gte('updated_at', yesterday.toISOString());
      
      if (recentError) {
        console.error('Error fetching recent updates:', recentError);
      }
      
      const recentUpdates = recentData?.length || 0;
      
      // Calculate average completion time
      const completedRecords = complianceData?.filter(r => 
        r.compliance_status === 'compliant' && r.created_at && r.updated_at
      );
      
      let avgCompletionTime = 0;
      if (completedRecords && completedRecords.length > 0) {
        const totalTime = completedRecords.reduce((sum, record) => {
          const created = new Date(record.created_at);
          const updated = new Date(record.updated_at);
          return sum + (updated.getTime() - created.getTime());
        }, 0);
        avgCompletionTime = Math.round(totalTime / completedRecords.length / (1000 * 60 * 60 * 24)); // days
      }
      
      // Get critical issues count
      const { data: criticalData, error: criticalError } = await supabase
        .from('user_compliance_records')
        .select('id')
        .eq('compliance_status', 'non_compliant')
        .lt('expires_at', new Date().toISOString());
      
      if (criticalError) {
        console.error('Error fetching critical issues:', criticalError);
      }
      
      const criticalIssues = criticalData?.length || 0;
      
      return {
        totalUsers,
        compliantUsers,
        overallComplianceRate,
        pendingReviews,
        expiringSoon,
        recentUpdates,
        avgCompletionTime,
        criticalIssues
      };
      
    } catch (error) {
      console.error('Error in loadComplianceMetrics:', error);
      return {
        totalUsers: 0,
        compliantUsers: 0,
        overallComplianceRate: 0,
        pendingReviews: 0,
        expiringSoon: 0,
        recentUpdates: 0,
        avgCompletionTime: 0,
        criticalIssues: 0
      };
    }
  };
  
  const loadTierMetrics = async (): Promise<TierMetrics> => {
    try {
      // Get users with their compliance records grouped by role
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, role');
      
      if (userError) {
        console.error('Error fetching user data:', userError);
        return {};
      }
      
      const { data: complianceData, error: complianceError } = await supabase
        .from('user_compliance_records')
        .select('user_id, compliance_status');
      
      if (complianceError) {
        console.error('Error fetching compliance data:', complianceError);
        return {};
      }
      
      const tierMetrics: TierMetrics = {};
      
      // Group by role as tier
      const roleGroups = userData?.reduce((acc, user) => {
        const role = user.role || 'standard';
        if (!acc[role]) {
          acc[role] = [];
        }
        acc[role].push(user);
        return acc;
      }, {} as Record<string, any[]>) || {};
      
      Object.entries(roleGroups).forEach(([role, users]) => {
        const userIds = users.map(u => u.id);
        const roleRecords = complianceData?.filter(r => userIds.includes(r.user_id)) || [];
        const compliantRecords = roleRecords.filter(r => r.compliance_status === 'compliant');
        
        tierMetrics[role] = {
          name: role.charAt(0).toUpperCase() + role.slice(1),
          userCount: users.length,
          complianceRate: roleRecords.length > 0 ? Math.round((compliantRecords.length / roleRecords.length) * 100) : 0,
          avgScore: 85, // Mock average score
          color: role === 'admin' ? '#ef4444' : role === 'manager' ? '#f59e0b' : '#3b82f6'
        };
      });
      
      return tierMetrics;
      
    } catch (error) {
      console.error('Error in loadTierMetrics:', error);
      return {};
    }
  };
  
  const loadRecentActivity = async (): Promise<RecentActivity[]> => {
    const dateFilter = getDateFilter();
    
    try {
      const { data: activityData, error: activityError } = await supabase
        .from('compliance_audit_log')
        .select(`
          id,
          audit_type,
          notes,
          created_at,
          new_value,
          performed_by
        `)
        .gte('created_at', dateFilter.start)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (activityError) {
        console.error('Error fetching activity data:', activityError);
        return [];
      }
      
      // Get user display names
      const userIds = activityData?.map(a => a.performed_by).filter(Boolean) || [];
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds);
      
      if (profileError) {
        console.error('Error fetching profile data:', profileError);
      }
      
      const profileMap = profileData?.reduce((acc, profile) => {
        acc[profile.id] = profile.display_name;
        return acc;
      }, {} as Record<string, string>) || {};
      
      return activityData?.map(activity => ({
        id: activity.id,
        type: activity.audit_type,
        description: activity.notes || 'Activity performed',
        user_name: profileMap[activity.performed_by] || 'System User',
        timestamp: activity.created_at,
        status: getActivityStatus(activity.audit_type),
        severity: getActivitySeverity(activity.audit_type)
      })) || [];
      
    } catch (error) {
      console.error('Error in loadRecentActivity:', error);
      return [];
    }
  };
  
  const loadComplianceAlerts = async (): Promise<ComplianceAlert[]> => {
    const alerts: ComplianceAlert[] = [];
    
    try {
      // Expiring certifications (next 30 days)
      const expiringDate = new Date();
      expiringDate.setDate(expiringDate.getDate() + 30);
      
      const { data: expiringData, error: expiringError } = await supabase
        .from('user_compliance_records')
        .select('id')
        .eq('compliance_status', 'compliant')
        .lt('expires_at', expiringDate.toISOString())
        .gt('expires_at', new Date().toISOString());
      
      if (expiringError) {
        console.error('Error fetching expiring data:', expiringError);
      } else if (expiringData && expiringData.length > 0) {
        alerts.push({
          id: 'expiring',
          type: 'expiring',
          title: 'Certifications Expiring Soon',
          description: `${expiringData.length} certifications expire within 30 days`,
          count: expiringData.length,
          priority: expiringData.length > 10 ? 'high' : 'medium',
          timestamp: new Date().toISOString()
        });
      }
      
      // Overdue certifications
      const { data: overdueData, error: overdueError } = await supabase
        .from('user_compliance_records')
        .select('id')
        .in('compliance_status', ['compliant', 'non_compliant'])
        .lt('expires_at', new Date().toISOString());
      
      if (overdueError) {
        console.error('Error fetching overdue data:', overdueError);
      } else if (overdueData && overdueData.length > 0) {
        alerts.push({
          id: 'overdue',
          type: 'overdue',
          title: 'Overdue Certifications',
          description: `${overdueData.length} certifications are overdue`,
          count: overdueData.length,
          priority: 'high',
          timestamp: new Date().toISOString()
        });
      }
      
      // Pending reviews backlog
      const { data: pendingData, error: pendingError } = await supabase
        .from('user_compliance_records')
        .select('id')
        .eq('compliance_status', 'pending')
        .lt('created_at', subDays(new Date(), 7).toISOString());
      
      if (pendingError) {
        console.error('Error fetching pending data:', pendingError);
      } else if (pendingData && pendingData.length > 0) {
        alerts.push({
          id: 'backlog',
          type: 'warning',
          title: 'Review Backlog',
          description: `${pendingData.length} submissions pending review for over 7 days`,
          count: pendingData.length,
          priority: pendingData.length > 5 ? 'high' : 'medium',
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.error('Error in loadComplianceAlerts:', error);
    }
    
    return alerts;
  };
  
  const setupRealtimeSubscriptions = () => {
    // Subscribe to compliance record changes
    realtimeSubscription.current = supabase
      .channel('compliance_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_compliance_records'
        },
        (payload) => {
          console.log('Real-time update:', payload);
          // Refresh data when changes occur
          loadDashboardData();
          
          // Show notification for important changes
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New Submission",
              description: "A new compliance submission has been received"
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'compliance_audit_log'
        },
        () => {
          // Refresh activity feed
          loadRecentActivity().then(setRecentActivity);
        }
      )
      .subscribe();
  };
  
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load all data concurrently
      const [
        metricsData,
        tierData,
        activityData,
        alertsData
      ] = await Promise.all([
        loadComplianceMetrics(),
        loadTierMetrics(),
        loadRecentActivity(), 
        loadComplianceAlerts()
      ]);
      
      setMetrics(metricsData);
      setTierMetrics(tierData);
      setRecentActivity(activityData);
      setAlerts(alertsData);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initialize dashboard and set up real-time subscriptions
  useEffect(() => {
    loadDashboardData();
    setupRealtimeSubscriptions();
    
    // Set up auto-refresh every 30 seconds
    refreshInterval.current = setInterval(() => {
      loadDashboardData();
    }, 30000);
    
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
      if (realtimeSubscription.current) {
        realtimeSubscription.current.unsubscribe();
      }
    };
  }, [filters]);
  
  const getActivityStatus = (activityType: string): string => {
    switch (activityType) {
      case 'requirement_submitted':
        return 'submitted';
      case 'requirement_approved':
        return 'approved';
      case 'requirement_rejected':
        return 'rejected';
      case 'tier_changed':
        return 'updated';
      default:
        return 'processed';
    }
  };
  
  const getActivitySeverity = (activityType: string): string => {
    switch (activityType) {
      case 'requirement_rejected':
      case 'compliance_expired':
        return 'high';
      case 'requirement_approved':
      case 'tier_changed':
        return 'medium';
      default:
        return 'low';
    }
  };
  
  const exportDashboardData = async () => {
    try {
      const dashboardData = {
        metrics,
        tierMetrics,
        recentActivity,
        alerts,
        exportedAt: new Date().toISOString(),
        filters
      };
      
      const dataStr = JSON.stringify(dashboardData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `compliance-dashboard-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      toast({
        title: "Export Successful",
        description: "Dashboard data has been exported"
      });
      
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export dashboard data",
        variant: "destructive"
      });
    }
  };
  
  const MetricCard = ({ title, value, change, icon: Icon, trend }: {
    title: string;
    value: string | number;
    change?: number;
    icon: React.ComponentType<{ className?: string }>;
    trend?: 'up' | 'down';
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium">{title}</p>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-2xl font-bold">{value}</div>
          {change !== undefined && (
            <div className={`flex items-center text-xs ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
              {trend === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
              {trend === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
              {change}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Real-time Compliance Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Last updated: {format(lastUpdated, 'PPp')}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Filters */}
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="1d">Today</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            
            <Button variant="outline" size="sm" onClick={exportDashboardData}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            
            <Button variant="outline" size="sm" onClick={loadDashboardData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        
        {/* Alerts Banner */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.filter(alert => alert.priority === 'high').map(alert => (
              <Alert key={alert.id} variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{alert.title}:</strong> {alert.description}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Overall Compliance Rate"
            value={`${metrics.overallComplianceRate}%`}
            change={5.2}
            trend="up"
            icon={CheckCircle}
          />
          
          <MetricCard
            title="Total Users"
            value={metrics.totalUsers.toLocaleString()}
            change={2.1}
            trend="up"
            icon={Users}
          />
          
          <MetricCard
            title="Pending Reviews"
            value={metrics.pendingReviews}
            change={-12.5}
            trend="down"
            icon={Clock}
          />
          
          <MetricCard
            title="Critical Issues"
            value={metrics.criticalIssues}
            change={metrics.criticalIssues > 0 ? 8.3 : undefined}
            trend={metrics.criticalIssues > 0 ? "up" : undefined}
            icon={AlertTriangle}
          />
        </div>
        
        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tiers">Tier Analysis</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="alerts">Alerts & Issues</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Compliance Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Compliance Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Compliant Users</span>
                      <span>{metrics.compliantUsers}/{metrics.totalUsers}</span>
                    </div>
                    <Progress value={metrics.overallComplianceRate} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{metrics.compliantUsers}</p>
                      <p className="text-xs text-muted-foreground">Compliant</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{metrics.totalUsers - metrics.compliantUsers}</p>
                      <p className="text-xs text-muted-foreground">Non-Compliant</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{metrics.avgCompletionTime}</p>
                      <p className="text-xs text-muted-foreground">Avg. Days to Complete</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{metrics.recentUpdates}</p>
                      <p className="text-xs text-muted-foreground">Recent Updates (24h)</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Expiring Soon (30 days)</span>
                      <Badge variant={metrics.expiringSoon > 10 ? "destructive" : "secondary"}>
                        {metrics.expiringSoon}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="tiers" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(tierMetrics).map(([tierId, tier]) => (
                <Card key={tierId}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{tier.name}</span>
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: tier.color }}
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold">{tier.userCount}</p>
                        <p className="text-xs text-muted-foreground">Users</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{tier.complianceRate}%</p>
                        <p className="text-xs text-muted-foreground">Compliance</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Compliance Rate</span>
                        <span>{tier.complianceRate}%</span>
                      </div>
                      <Progress value={tier.complianceRate} className="h-2" />
                    </div>
                    
                    {tier.avgScore > 0 && (
                      <div className="pt-2 border-t">
                        <div className="flex justify-between text-sm">
                          <span>Average Score</span>
                          <Badge variant="outline">{tier.avgScore}%</Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity Feed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map(activity => (
                    <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.severity === 'high' ? 'bg-red-500' :
                        activity.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          by {activity.user_name} • {format(new Date(activity.timestamp), 'PPp')}
                        </p>
                      </div>
                      
                      <Badge variant={
                        activity.status === 'approved' ? 'default' :
                        activity.status === 'rejected' ? 'destructive' : 'secondary'
                      }>
                        {activity.status}
                      </Badge>
                    </div>
                  ))}
                  
                  {recentActivity.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No recent activity</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="alerts" className="space-y-6">
            <div className="space-y-4">
              {alerts.map(alert => (
                <Alert key={alert.id} variant={alert.priority === 'high' ? 'destructive' : 'default'}>
                  <AlertTriangle className="h-4 w-4" />
                  <div className="flex items-center justify-between">
                    <div>
                      <AlertDescription>
                        <strong>{alert.title}</strong>
                        <br />
                        {alert.description}
                      </AlertDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={alert.priority === 'high' ? 'destructive' : 'secondary'}>
                        {alert.priority}
                      </Badge>
                      <Badge variant="outline">
                        {alert.count}
                      </Badge>
                    </div>
                  </div>
                </Alert>
              ))}
              
              {alerts.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p className="text-muted-foreground">No active alerts</p>
                    <p className="text-sm text-muted-foreground">All systems operating normally</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}