import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users,
  Target,
  TrendingUp,
  TrendingDown,
  Award,
  Calendar,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  Star,
  Trophy,
  Clock,
  DollarSign
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AdvancedAnalyticsService } from '@/services/crm/advancedAnalyticsService';

interface SalesRep {
  id: string;
  name: string;
  email: string;
  revenue: number;
  deals_closed: number;
  deals_in_progress: number;
  conversion_rate: number;
  avg_deal_size: number;
  target_achievement: number;
  rank: number;
  badge: string;
}

interface TeamMetric {
  title: string;
  value: string;
  change: number;
  changeType: 'increase' | 'decrease';
  target?: string;
  icon: React.ComponentType<any>;
}

interface SalesPerformanceDashboardProps {
  className?: string;
}

export function SalesPerformanceDashboard({ className }: SalesPerformanceDashboardProps) {
  const [timeRange, setTimeRange] = useState('30d');
  const [teamFilter, setTeamFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - would be replaced with actual API calls
  const salesReps: SalesRep[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@company.com',
      revenue: 125000,
      deals_closed: 12,
      deals_in_progress: 8,
      conversion_rate: 68.5,
      avg_deal_size: 10417,
      target_achievement: 112.5,
      rank: 1,
      badge: 'Top Performer'
    },
    {
      id: '2',
      name: 'Mike Chen',
      email: 'mike.chen@company.com',
      revenue: 98000,
      deals_closed: 10,
      deals_in_progress: 6,
      conversion_rate: 62.3,
      avg_deal_size: 9800,
      target_achievement: 98.0,
      rank: 2,
      badge: 'Rising Star'
    },
    {
      id: '3',
      name: 'Emily Davis',
      email: 'emily.davis@company.com',
      revenue: 87500,
      deals_closed: 9,
      deals_in_progress: 7,
      conversion_rate: 58.1,
      avg_deal_size: 9722,
      target_achievement: 87.5,
      rank: 3,
      badge: 'Consistent'
    },
    {
      id: '4',
      name: 'David Wilson',
      email: 'david.wilson@company.com',
      revenue: 76000,
      deals_closed: 8,
      deals_in_progress: 5,
      conversion_rate: 55.2,
      avg_deal_size: 9500,
      target_achievement: 76.0,
      rank: 4,
      badge: 'Improving'
    }
  ];

  const teamMetrics: TeamMetric[] = [
    {
      title: 'Team Revenue',
      value: `$${(salesReps.reduce((sum, rep) => sum + rep.revenue, 0) / 1000).toFixed(0)}K`,
      change: 15.2,
      changeType: 'increase',
      target: '$450K',
      icon: DollarSign
    },
    {
      title: 'Total Deals Closed',
      value: salesReps.reduce((sum, rep) => sum + rep.deals_closed, 0).toString(),
      change: 8.7,
      changeType: 'increase',
      target: '50',
      icon: Target
    },
    {
      title: 'Average Conversion Rate',
      value: `${(salesReps.reduce((sum, rep) => sum + rep.conversion_rate, 0) / salesReps.length).toFixed(1)}%`,
      change: 3.4,
      changeType: 'increase',
      target: '65%',
      icon: TrendingUp
    },
    {
      title: 'Team Target Achievement',
      value: `${(salesReps.reduce((sum, rep) => sum + rep.target_achievement, 0) / salesReps.length).toFixed(1)}%`,
      change: 5.8,
      changeType: 'increase',
      target: '100%',
      icon: Award
    }
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'Top Performer':
        return 'bg-gold text-gold-foreground';
      case 'Rising Star':
        return 'bg-blue-500 text-white';
      case 'Consistent':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 2:
        return <Award className="h-4 w-4 text-gray-400" />;
      case 3:
        return <Star className="h-4 w-4 text-orange-500" />;
      default:
        return <span className="text-sm font-medium">#{rank}</span>;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Performance</h1>
          <p className="text-muted-foreground">
            Team and individual sales performance metrics
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={teamFilter} onValueChange={setTeamFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
              <SelectItem value="smb">SMB</SelectItem>
              <SelectItem value="inbound">Inbound</SelectItem>
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Team Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {teamMetrics.map((metric, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              {metric.target && (
                <div className="text-sm text-muted-foreground">
                  Target: {metric.target}
                </div>
              )}
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                {metric.changeType === 'increase' ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={metric.changeType === 'increase' ? 'text-green-500' : 'text-red-500'}>
                  {Math.abs(metric.change).toFixed(1)}%
                </span>
                <span className="ml-1">vs last period</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Tabs */}
      <Tabs defaultValue="leaderboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="individual">Individual</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Sales Leaderboard
              </CardTitle>
              <CardDescription>
                Top performers for the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {salesReps.map((rep, index) => (
                  <div key={rep.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                        {getRankIcon(rep.rank)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{rep.name}</p>
                        <p className="text-xs text-muted-foreground">{rep.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm font-medium">${(rep.revenue / 1000).toFixed(0)}K</p>
                        <p className="text-xs text-muted-foreground">{rep.deals_closed} deals</p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm font-medium">{rep.conversion_rate}%</p>
                        <p className="text-xs text-muted-foreground">conversion</p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm font-medium">{rep.target_achievement}%</p>
                        <p className="text-xs text-muted-foreground">of target</p>
                      </div>
                      
                      <Badge className={getBadgeColor(rep.badge)}>
                        {rep.badge}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="individual" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {salesReps.slice(0, 4).map((rep) => (
              <Card key={rep.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{rep.name}</span>
                    <Badge className={getBadgeColor(rep.badge)}>
                      {rep.badge}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{rep.email}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                      <p className="text-lg font-semibold">${(rep.revenue / 1000).toFixed(0)}K</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Deals Closed</p>
                      <p className="text-lg font-semibold">{rep.deals_closed}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Conversion Rate</p>
                      <p className="text-lg font-semibold">{rep.conversion_rate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Deal Size</p>
                      <p className="text-lg font-semibold">${rep.avg_deal_size.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Target Achievement</span>
                      <span className="font-medium">{rep.target_achievement}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min(rep.target_achievement, 100)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Trends
                </CardTitle>
                <CardDescription>
                  Team performance over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Performance trend chart</p>
                    <p className="text-sm">Chart integration needed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Activity Distribution
                </CardTitle>
                <CardDescription>
                  Time allocation across activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { activity: 'Prospecting', percentage: 35, color: 'bg-blue-500' },
                    { activity: 'Meetings', percentage: 25, color: 'bg-green-500' },
                    { activity: 'Follow-ups', percentage: 20, color: 'bg-yellow-500' },
                    { activity: 'Admin', percentage: 20, color: 'bg-gray-500' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                        <span className="text-sm font-medium">{item.activity}</span>
                      </div>
                      <span className="text-sm font-medium">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Goal Tracking
              </CardTitle>
              <CardDescription>
                Individual and team goal progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-12">
                <Target className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Goal Tracking Dashboard</h3>
                <p>Individual goals, team targets, and progress tracking</p>
                <p className="text-sm mt-2">Goal management features coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}