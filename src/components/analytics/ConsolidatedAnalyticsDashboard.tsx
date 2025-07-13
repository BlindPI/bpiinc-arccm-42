/**
 * CONSOLIDATED ANALYTICS DASHBOARD - PHASE 3 CLEAN FOUNDATION
 * 
 * Replaces multiple redundant analytics dashboards with a single, optimized component
 * Uses the consolidated analytics service for consistent data patterns
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { ConsolidatedAnalyticsService, type ConsolidatedAnalytics } from '@/services/analytics/consolidatedAnalyticsService';
import { 
  TrendingUp, 
  Users, 
  Award, 
  Building2, 
  BarChart3,
  RefreshCw,
  Download,
  Target
} from 'lucide-react';
import { toast } from 'sonner';

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

function AnalyticsCard({ title, value, change, icon: Icon, color }: AnalyticsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && (
              <div className={`flex items-center gap-1 text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <TrendingUp className={`h-3 w-3 ${change < 0 ? 'rotate-180' : ''}`} />
                <span>{Math.abs(change)}% vs last period</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ConsolidatedAnalyticsDashboardProps {
  userRole?: string;
  className?: string;
}

export function ConsolidatedAnalyticsDashboard({ userRole, className }: ConsolidatedAnalyticsDashboardProps) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [refreshing, setRefreshing] = useState(false);

  // Main analytics query
  const { data: analytics, isLoading, refetch } = useQuery({
    queryKey: ['consolidated-analytics'],
    queryFn: () => ConsolidatedAnalyticsService.getSystemAnalytics(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Provider-specific analytics for AP users
  const { data: providerAnalytics } = useQuery({
    queryKey: ['provider-analytics', user?.id],
    queryFn: () => user?.id ? ConsolidatedAnalyticsService.getProviderAnalytics(user.id) : null,
    enabled: !!user?.id && profile?.role === 'AP',
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      ConsolidatedAnalyticsService.clearCache();
      await refetch();
      toast.success('Analytics refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh analytics');
    } finally {
      setRefreshing(false);
    }
  };

  const handleExport = () => {
    // Export functionality would be implemented here
    toast.success('Export functionality coming soon');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 className="h-8 w-8 animate-pulse text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // AP users get specialized view
  if (profile?.role === 'AP' && providerAnalytics) {
    return (
      <div className={className}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Provider Analytics</h2>
              <p className="text-muted-foreground">Performance metrics for {providerAnalytics.providerName}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Provider Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <AnalyticsCard
              title="Assigned Teams"
              value={providerAnalytics.assignedTeams}
              icon={Building2}
              color="bg-blue-500"
            />
            <AnalyticsCard
              title="Avg Team Performance"
              value={`${providerAnalytics.averageTeamPerformance}%`}
              icon={BarChart3}
              color="bg-green-500"
            />
            <AnalyticsCard
              title="Compliance Score"
              value={`${providerAnalytics.complianceScore}%`}
              icon={Award}
              color="bg-purple-500"
            />
            <AnalyticsCard
              title="Performance Rating"
              value={`${providerAnalytics.performanceRating}%`}
              icon={Target}
              color="bg-orange-500"
            />
          </div>
        </div>
      </div>
    );
  }

  // Regular analytics view
  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">System Analytics</h2>
            <p className="text-muted-foreground">Comprehensive training management analytics</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* System Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <AnalyticsCard
            title="Total Teams"
            value={analytics?.systemMetrics.totalTeams || 0}
            icon={Building2}
            color="bg-blue-500"
          />
          <AnalyticsCard
            title="Total Members"
            value={analytics?.systemMetrics.totalMembers || 0}
            icon={Users}
            color="bg-green-500"
          />
          <AnalyticsCard
            title="Avg Performance"
            value={`${analytics?.systemMetrics.averagePerformance || 0}%`}
            icon={BarChart3}
            color="bg-purple-500"
          />
          <AnalyticsCard
            title="Avg Compliance"
            value={`${analytics?.systemMetrics.averageCompliance || 0}%`}
            icon={Award}
            color="bg-orange-500"
          />
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(analytics?.performanceMetrics.performanceDistribution || {}).map(([level, count]) => (
                      <div key={level} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={level === 'excellent' ? 'default' : level === 'good' ? 'secondary' : 'outline'}>
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </Badge>
                        </div>
                        <span className="font-medium">{count} teams</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Teams by Location */}
              <Card>
                <CardHeader>
                  <CardTitle>Teams by Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(analytics?.teamAnalytics.teamsByLocation || {}).map(([location, count]) => (
                      <div key={location} className="flex items-center justify-between">
                        <span className="text-sm">{location}</span>
                        <Badge variant="outline">{count} teams</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Teams</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.performanceMetrics.topPerformingTeams.map((team, index) => (
                    <div key={team.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{team.name}</h4>
                          <p className="text-sm text-muted-foreground">{team.member_count} members</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        {team.performance_score}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teams" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analytics?.teamAnalytics.teamsByType || {}).map(([type, performance]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{type}</span>
                      <Badge variant="outline">{Math.round(Number(performance))}% avg performance</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}