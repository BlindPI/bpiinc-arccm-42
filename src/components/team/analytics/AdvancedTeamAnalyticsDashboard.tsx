import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingUp, TrendingDown, Users, Target, Award, Shield, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { AdvancedTeamAnalyticsService, AdvancedTeamAnalytics, MemberProductivityMetrics } from '@/services/team/advancedTeamAnalyticsService';

interface AdvancedTeamAnalyticsDashboardProps {
  teamId: string;
  teamName: string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000'];

export function AdvancedTeamAnalyticsDashboard({ teamId, teamName }: AdvancedTeamAnalyticsDashboardProps) {
  const [reportFormat, setReportFormat] = useState<'json' | 'csv' | 'pdf'>('json');
  
  const { data: analytics, isLoading, refetch } = useQuery({
    queryKey: ['advanced-team-analytics', teamId],
    queryFn: () => AdvancedTeamAnalyticsService.getAdvancedTeamAnalytics(teamId),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: memberMetrics, isLoading: memberLoading } = useQuery({
    queryKey: ['member-productivity', teamId],
    queryFn: () => AdvancedTeamAnalyticsService.getMemberProductivityMetrics(teamId),
    refetchInterval: 60000 // Refresh every minute
  });

  const handleGenerateReport = async () => {
    try {
      const report = await AdvancedTeamAnalyticsService.generatePerformanceReport(teamId, reportFormat);
      
      if (reportFormat === 'json') {
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `team-${teamId}-report.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (reportFormat === 'csv') {
        const blob = new Blob([report], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `team-${teamId}-report.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No analytics data available for this team.
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <div className="w-4 h-4" />;
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advanced Analytics</h1>
          <p className="text-muted-foreground">{teamName} - Real-time Performance Insights</p>
        </div>
        <div className="flex gap-2">
          <select 
            value={reportFormat} 
            onChange={(e) => setReportFormat(e.target.value as any)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="json">JSON Report</option>
            <option value="csv">CSV Export</option>
            <option value="pdf">PDF Report</option>
          </select>
          <Button onClick={handleGenerateReport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={() => refetch()} variant="outline">
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Performance Score</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(analytics.performance_metrics.efficiency_score)}`}>
                  {analytics.performance_metrics.efficiency_score.toFixed(1)}%
                </p>
              </div>
              <div className="flex items-center">
                {getTrendIcon(analytics.performance_metrics.productivity_trend)}
                <Target className="w-8 h-8 text-muted-foreground ml-2" />
              </div>
            </div>
            <Progress value={analytics.performance_metrics.efficiency_score} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Team Members</p>
                <p className="text-2xl font-bold">{analytics.totalMembers}</p>
              </div>
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {analytics.totalMembers > 0 ? 'Active team' : 'No active members'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Compliance Score</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(analytics.compliance_scoring.overall_score)}`}>
                  {analytics.compliance_scoring.overall_score.toFixed(1)}%
                </p>
              </div>
              <Shield className="w-8 h-8 text-muted-foreground" />
            </div>
            <Progress value={analytics.compliance_scoring.overall_score} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Certificates Issued</p>
                <p className="text-2xl font-bold">{analytics.performance_metrics.certificates_issued}</p>
              </div>
              <Award className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="productivity">Productivity</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Current month performance breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Efficiency Score</span>
                    <span className="font-semibold">{analytics.performance_metrics.efficiency_score.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Goal Completion Rate</span>
                    <span className="font-semibold">{analytics.performance_metrics.goal_completion_rate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Member Satisfaction</span>
                    <span className="font-semibold">{analytics.performance_metrics.member_satisfaction.toFixed(1)}/5.0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Training Hours Delivered</span>
                    <span className="font-semibold">{analytics.performance_metrics.training_hours_delivered}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Training & Certification</CardTitle>
                <CardDescription>Training delivery and certification metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Certificates Issued</span>
                    <Badge variant="secondary">{analytics.performance_metrics.certificates_issued}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Courses Completed</span>
                    <Badge variant="secondary">{analytics.performance_metrics.courses_completed}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Compliance Adherence</span>
                    <Badge variant={analytics.performance_metrics.compliance_adherence >= 90 ? "default" : "destructive"}>
                      {analytics.performance_metrics.compliance_adherence.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Productivity Tab */}
        <TabsContent value="productivity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Member Productivity</CardTitle>
              <CardDescription>Individual member performance and productivity metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {memberLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {memberMetrics?.map((member: MemberProductivityMetrics) => (
                    <div key={member.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold">{member.display_name}</h4>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-sm font-medium">{member.productivity_score}%</p>
                          <p className="text-xs text-muted-foreground">Productivity</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium">{member.tasks_completed}</p>
                          <p className="text-xs text-muted-foreground">Tasks</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium">{member.training_hours}h</p>
                          <p className="text-xs text-muted-foreground">Training</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium">{member.certificates_earned}</p>
                          <p className="text-xs text-muted-foreground">Certificates</p>
                        </div>
                        {getTrendIcon(member.performance_trend)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Breakdown</CardTitle>
                <CardDescription>Detailed compliance scoring across categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Policy Adherence', value: analytics.compliance_scoring.policy_adherence },
                    { label: 'Training Compliance', value: analytics.compliance_scoring.training_compliance },
                    { label: 'Certification Status', value: analytics.compliance_scoring.certification_status },
                    { label: 'Safety Record', value: analytics.compliance_scoring.safety_record },
                    { label: 'Audit Results', value: analytics.compliance_scoring.audit_results }
                  ].map((item) => (
                    <div key={item.label} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{item.label}</span>
                        <span className="text-sm">{item.value.toFixed(1)}%</span>
                      </div>
                      <Progress value={item.value} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Improvement Areas</CardTitle>
                <CardDescription>Focus areas for compliance enhancement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.compliance_scoring.improvement_areas.map((area, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">{area}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historical Performance Trends</CardTitle>
              <CardDescription>12-month performance and compliance tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analytics.historical_trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="performance_score" stroke="#8884d8" name="Performance" />
                  <Line type="monotone" dataKey="compliance_score" stroke="#82ca9d" name="Compliance" />
                  <Line type="monotone" dataKey="certificates_issued" stroke="#ffc658" name="Certificates" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Predictive Insights</CardTitle>
                <CardDescription>AI-powered performance predictions and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Projected Performance</h4>
                    <p className="text-2xl font-bold text-green-600">
                      {analytics.predictive_insights.projected_performance.toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Next month estimate</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Risk Factors</h4>
                    <div className="space-y-2">
                      {analytics.predictive_insights.risk_factors.map((risk, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <span className="text-sm">{risk}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Growth Opportunities</h4>
                    <div className="space-y-2">
                      {analytics.predictive_insights.growth_opportunities.map((opportunity, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span className="text-sm">{opportunity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommended Actions</CardTitle>
                <CardDescription>Data-driven recommendations for improvement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.predictive_insights.recommended_actions.map((action, index) => (
                    <div key={index} className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">{action}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}