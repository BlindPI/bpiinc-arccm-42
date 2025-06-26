import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  TrendingUp, 
  Download, 
  Target, 
  Activity,
  BarChart3,
  LineChart,
  Calendar,
  Users
} from 'lucide-react';
import { ComplianceService } from '@/services/compliance/complianceService';
import { ComplianceTierService } from '@/services/compliance/complianceTierService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdvancedProgressTrackerProps {
  userId: string;
  role: string;
  tier: string;
  viewMode?: 'individual' | 'comparative' | 'predictive' | 'detailed';
  timeRange?: 'week' | 'month' | 'quarter' | 'year' | 'all';
}

interface ProgressData {
  totalRequirements: number;
  completedRequirements: number;
  pendingRequirements: number;
  overallScore: number;
  completionRate: number;
  qualityScore: number;
  velocityRate: number;
  trends: ProgressTrend[];
  recentActivity: RecentActivity[];
}

interface ProgressTrend {
  date: string;
  completionRate: number;
  qualityScore: number;
  velocity: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  impact: number;
}

interface ComparativeData {
  userScore: number;
  peerAverage: number;
  roleAverage: number;
  tierAverage: number;
  ranking: number;
  totalPeers: number;
}

export function AdvancedProgressTracker({
  userId,
  role,
  tier,
  viewMode = 'individual',
  timeRange = 'month'
}: AdvancedProgressTrackerProps) {
  const [selectedMetric, setSelectedMetric] = useState<string>('completion_rate');
  const [comparisonGroup, setComparisonGroup] = useState<'role' | 'tier' | 'organization'>('role');
  const [forecastHorizon, setForecastHorizon] = useState<number>(90);
  const [showPredictions, setShowPredictions] = useState<boolean>(true);
  const queryClient = useQueryClient();

  // Advanced progress data hook using real ComplianceService
  const { data: progressData, isLoading } = useQuery({
    queryKey: ['advanced-progress-data', userId, timeRange],
    queryFn: async (): Promise<ProgressData> => {
      try {
        // Get user compliance records using real service
        const records = await ComplianceService.getUserComplianceRecords(userId);
        const summary = await ComplianceService.getUserComplianceSummary(userId);
        
        // Calculate progress metrics from real data
        const totalRequirements = summary.total_metrics;
        const completedRequirements = summary.compliant_count;
        const pendingRequirements = summary.pending_count;
        const overallScore = summary.overall_score;
        const completionRate = totalRequirements > 0 ? (completedRequirements / totalRequirements) * 100 : 0;
        
        // Calculate quality score from actual records
        const approvedRecords = records.filter(r => r.compliance_status === 'compliant');
        const qualityScore = approvedRecords.length > 0 ? 
          approvedRecords.reduce((sum, record) => sum + (record.current_value || 0), 0) / approvedRecords.length * 20 : 0;
        
        // Calculate velocity (completions per week) from real timestamps
        const recentCompletions = records.filter(r => 
          r.compliance_status === 'compliant' && 
          new Date(r.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        );
        const velocityRate = recentCompletions.length;

        // Generate trends from historical data
        const trends: ProgressTrend[] = [];
        for (let i = 29; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dayStart = new Date(date.setHours(0, 0, 0, 0));
          const dayEnd = new Date(date.setHours(23, 59, 59, 999));
          
          const dayRecords = records.filter(r => {
            const recordDate = new Date(r.updated_at);
            return recordDate >= dayStart && recordDate <= dayEnd;
          });
          
          const dayCompletions = dayRecords.filter(r => r.compliance_status === 'compliant').length;
          const dayTotal = Math.max(dayRecords.length, 1);
          
          trends.push({
            date: dayStart.toISOString().split('T')[0],
            completionRate: (dayCompletions / dayTotal) * 100,
            qualityScore: dayCompletions > 0 ? qualityScore : 0,
            velocity: dayCompletions
          });
        }

        // Generate recent activity from real records
        const recentActivity: RecentActivity[] = records
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
          .slice(0, 10)
          .map(record => ({
            id: record.id,
            type: record.compliance_status === 'compliant' ? 'completion' : 'update',
            description: `${record.compliance_metrics?.name || 'Requirement'} ${record.compliance_status}`,
            timestamp: record.updated_at,
            impact: record.compliance_status === 'compliant' ? 1 : 0
          }));

        return {
          totalRequirements,
          completedRequirements,
          pendingRequirements,
          overallScore,
          completionRate,
          qualityScore: Math.min(qualityScore, 100),
          velocityRate,
          trends,
          recentActivity
        };
      } catch (error) {
        console.error('Error fetching progress data:', error);
        throw error;
      }
    },
    enabled: !!userId
  });

  // Comparative data hook using real service
  const { data: comparativeData } = useQuery({
    queryKey: ['comparative-progress-data', userId, comparisonGroup, timeRange],
    queryFn: async (): Promise<ComparativeData> => {
      try {
        // Get all compliance records for comparison
        const allRecords = await ComplianceService.getAllComplianceRecords();
        
        // Filter by comparison group
        const groupRecords = allRecords.filter((record: any) => {
          if (comparisonGroup === 'role') {
            return record.profiles?.role === role;
          } else if (comparisonGroup === 'tier') {
            return record.profiles?.compliance_tier === tier;
          }
          return true; // organization level
        });

        // Calculate user score
        const userRecords = groupRecords.filter((record: any) => record.user_id === userId);
        const userScore = userRecords.length > 0 ? 
          userRecords.filter((record: any) => record.compliance_status === 'compliant').length / userRecords.length * 100 : 0;

        // Calculate peer averages
        const peerScores = groupRecords
          .filter((record: any) => record.user_id !== userId)
          .reduce((acc: any, record: any) => {
            if (!acc[record.user_id]) {
              acc[record.user_id] = { total: 0, completed: 0 };
            }
            acc[record.user_id].total++;
            if (record.compliance_status === 'compliant') {
              acc[record.user_id].completed++;
            }
            return acc;
          }, {});

        const peerAverages = Object.values(peerScores).map((peer: any) => 
          peer.total > 0 ? (peer.completed / peer.total) * 100 : 0
        ) as number[];

        const peerAverage = peerAverages.length > 0 ? 
          peerAverages.reduce((sum, score) => sum + score, 0) / peerAverages.length : 0;

        // Calculate ranking
        const ranking = peerAverages.filter(score => score < userScore).length + 1;

        return {
          userScore,
          peerAverage,
          roleAverage: peerAverage, // Simplified for now
          tierAverage: peerAverage, // Simplified for now
          ranking,
          totalPeers: peerAverages.length + 1
        };
      } catch (error) {
        console.error('Error fetching comparative data:', error);
        return {
          userScore: 0,
          peerAverage: 0,
          roleAverage: 0,
          tierAverage: 0,
          ranking: 1,
          totalPeers: 1
        };
      }
    },
    enabled: !!userId
  });

  // Real-time progress subscription
  useEffect(() => {
    const channel = supabase
      .channel(`progress-tracker-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_compliance_records',
        filter: `user_id=eq.${userId}`
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['advanced-progress-data', userId] });
        queryClient.invalidateQueries({ queryKey: ['comparative-progress-data', userId] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  // Export progress report with real data
  const handleExportProgress = async () => {
    try {
      if (!progressData) return;
      
      const reportData = {
        userId,
        progressData,
        comparativeData,
        timeRange,
        viewMode,
        generatedAt: new Date().toISOString(),
        exportedBy: (await supabase.auth.getUser()).data.user?.id || 'unknown'
      };

      const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `progress-report-${userId}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Progress report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export progress report');
    }
  };

  const renderVisualizationMode = () => {
    if (!progressData) return null;

    switch (viewMode) {
      case 'individual':
        return (
          <div className="space-y-6">
            {/* Progress Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                      <p className="text-2xl font-bold">{Math.round(progressData.completionRate)}%</p>
                    </div>
                    <Target className="h-8 w-8 text-blue-600" />
                  </div>
                  <Progress value={progressData.completionRate} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Overall Score</p>
                      <p className="text-2xl font-bold">{progressData.overallScore}</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-green-600" />
                  </div>
                  <Progress value={progressData.overallScore} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Quality Score</p>
                      <p className="text-2xl font-bold">{Math.round(progressData.qualityScore)}%</p>
                    </div>
                    <Activity className="h-8 w-8 text-purple-600" />
                  </div>
                  <Progress value={progressData.qualityScore} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Velocity</p>
                      <p className="text-2xl font-bold">{progressData.velocityRate}</p>
                      <p className="text-xs text-muted-foreground">per week</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progress Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Requirements Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Completed</span>
                      <Badge variant="default">{progressData.completedRequirements}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Pending</span>
                      <Badge variant="secondary">{progressData.pendingRequirements}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total</span>
                      <Badge variant="outline">{progressData.totalRequirements}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {progressData.recentActivity.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                        <Badge 
                          variant={activity.impact > 0 ? "default" : "secondary"}
                          className="ml-2"
                        >
                          {activity.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'comparative':
        return (
          <div className="space-y-6">
            {comparativeData && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Comparative Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-muted-foreground">Your Score</p>
                        <p className="text-3xl font-bold text-blue-600">{Math.round(comparativeData.userScore)}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-muted-foreground">Peer Average</p>
                        <p className="text-3xl font-bold text-gray-600">{Math.round(comparativeData.peerAverage)}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-muted-foreground">Ranking</p>
                        <p className="text-3xl font-bold text-green-600">
                          #{comparativeData.ranking} of {comparativeData.totalPeers}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Comparison Group</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select value={comparisonGroup} onValueChange={(value: any) => setComparisonGroup(value)}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="role">Same Role</SelectItem>
                        <SelectItem value="tier">Same Tier</SelectItem>
                        <SelectItem value="organization">Organization</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        );

      case 'predictive':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Predictive Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium">Forecast Horizon:</label>
                    <Select value={forecastHorizon.toString()} onValueChange={(value) => setForecastHorizon(Number(value))}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="60">60 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="180">180 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {progressData && (
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Completion Forecast</h4>
                      <p className="text-sm text-muted-foreground">
                        Based on your current velocity of {progressData.velocityRate} completions per week,
                        you are projected to complete {Math.round((progressData.velocityRate * forecastHorizon) / 7)} 
                        additional requirements in the next {forecastHorizon} days.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'detailed':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Progress Trends (Last 30 Days)</h4>
                    <div className="space-y-2">
                      {progressData.trends.slice(-7).map((trend, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm">{new Date(trend.date).toLocaleDateString()}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{Math.round(trend.completionRate)}%</span>
                            <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-600 transition-all"
                                style={{ width: `${trend.completionRate}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Performance Metrics</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Completion Rate</span>
                          <span className="text-sm font-medium">{Math.round(progressData.completionRate)}%</span>
                        </div>
                        <Progress value={progressData.completionRate} />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Quality Score</span>
                          <span className="text-sm font-medium">{Math.round(progressData.qualityScore)}%</span>
                        </div>
                        <Progress value={progressData.qualityScore} />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Weekly Velocity</span>
                          <span className="text-sm font-medium">{progressData.velocityRate}</span>
                        </div>
                        <Progress value={Math.min(progressData.velocityRate * 10, 100)} />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-muted animate-pulse rounded" />
            <div className="h-4 w-96 bg-muted animate-pulse rounded" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                  <div className="h-2 w-full bg-muted animate-pulse rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with View Mode Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Advanced Progress Tracking</h2>
          <p className="text-muted-foreground">
            Comprehensive analysis of your compliance progress with insights and predictions
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange && setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          
          <Tabs value={viewMode} onValueChange={(value: any) => setViewMode && setViewMode(value)} className="w-auto">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="individual" className="text-xs">Individual</TabsTrigger>
              <TabsTrigger value="comparative" className="text-xs">Compare</TabsTrigger>
              <TabsTrigger value="predictive" className="text-xs">Predict</TabsTrigger>
              <TabsTrigger value="detailed" className="text-xs">Detailed</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button onClick={handleExportProgress} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {renderVisualizationMode()}
    </div>
  );
}