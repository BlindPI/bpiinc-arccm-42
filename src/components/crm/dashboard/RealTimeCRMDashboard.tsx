
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target, 
  Activity,
  Clock,
  AlertCircle,
  CheckCircle,
  Calendar,
  Phone,
  Mail
} from 'lucide-react';
import { CRMStatsCards } from './CRMStatsCards';
import { RealtimeActivityFeed } from './RealtimeActivityFeed';
import { QuickActionPanel } from './QuickActionPanel';
import { PerformanceInsights } from './PerformanceInsights';
import { NotificationCenter } from './NotificationCenter';
import { useQuery } from '@tanstack/react-query';
import { CRMService } from '@/services/crm/crmService';
import { useRealtimeCRMData } from '@/hooks/useRealtimeCRMData';

export function RealTimeCRMDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [notifications, setNotifications] = useState([]);

  // Enable real-time updates
  useRealtimeCRMData();

  const { data: crmStats, isLoading: statsLoading } = useQuery({
    queryKey: ['crm-stats'],
    queryFn: () => CRMService.getCRMStats(),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: recentActivities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: () => CRMService.getActivities(),
    refetchInterval: 15000 // Refresh every 15 seconds
  });

  const { data: upcomingTasks } = useQuery({
    queryKey: ['upcoming-tasks'],
    queryFn: () => CRMService.getUpcomingTasks(),
    refetchInterval: 60000 // Refresh every minute
  });

  // Simulated real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      const mockNotifications = [
        {
          id: Date.now(),
          type: 'lead_qualified',
          title: 'New Qualified Lead',
          message: 'John Doe from Acme Corp has been qualified',
          timestamp: new Date(),
          priority: 'high'
        }
      ];
      setNotifications(prev => [...mockNotifications, ...prev].slice(0, 10));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Real-time Status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">CRM Dashboard</h1>
          <p className="text-muted-foreground">Real-time customer relationship management</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-muted-foreground">Live Data</span>
          </div>
          <NotificationCenter notifications={notifications} />
        </div>
      </div>

      {/* Quick Stats Cards */}
      <CRMStatsCards stats={crmStats} />

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="actions">Quick Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity Feed */}
            <div className="lg:col-span-2">
              <RealtimeActivityFeed activities={recentActivities || []} />
            </div>

            {/* Upcoming Tasks & Priorities */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Upcoming Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingTasks?.slice(0, 5).map((task: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{task.subject || 'Follow up call'}</p>
                          <p className="text-sm text-muted-foreground">
                            Due: {new Date().toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'}>
                          {task.priority || 'medium'}
                        </Badge>
                      </div>
                    )) || (
                      <p className="text-center text-muted-foreground py-4">No upcoming tasks</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Today's Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Calls Made</span>
                      <span className="font-bold">12</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Emails Sent</span>
                      <span className="font-bold">24</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Meetings Scheduled</span>
                      <span className="font-bold">6</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Deals Closed</span>
                      <span className="font-bold text-green-600">3</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activities">
          <RealtimeActivityFeed activities={recentActivities || []} showFilters />
        </TabsContent>

        <TabsContent value="insights">
          <PerformanceInsights />
        </TabsContent>

        <TabsContent value="actions">
          <QuickActionPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
