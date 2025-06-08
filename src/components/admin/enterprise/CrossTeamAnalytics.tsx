
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Target, 
  Award,
  MapPin,
  BarChart3,
  Download,
  Filter
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { teamAnalyticsService } from '@/services/team/teamAnalyticsService';
import { teamManagementService } from '@/services/team/teamManagementService';

const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function CrossTeamAnalytics() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'30d' | '90d' | '1y'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'performance' | 'satisfaction' | 'compliance'>('performance');

  const { data: systemAnalytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['system-analytics'],
    queryFn: () => teamAnalyticsService.getSystemWideAnalytics()
  });

  const { data: allTeams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['all-teams-analytics'],
    queryFn: () => teamManagementService.getAllEnhancedTeams()
  });

  const { data: performanceTrends, isLoading: trendsLoading } = useQuery({
    queryKey: ['performance-trends', selectedTimeframe],
    queryFn: async () => {
      if (!allTeams.length) return [];
      
      const trendPromises = allTeams.slice(0, 10).map(team =>
        teamAnalyticsService.getTeamTrendData(team.id, selectedTimeframe === '30d' ? 30 : selectedTimeframe === '90d' ? 90 : 365)
      );
      
      const trends = await Promise.all(trendPromises);
      
      // Aggregate trends by date
      const aggregatedTrends = new Map<string, { date: string; avgPerformance: number; totalCertificates: number; totalCourses: number; count: number }>();
      
      trends.forEach((teamTrends, teamIndex) => {
        teamTrends.forEach(trend => {
          const key = trend.date;
          const existing = aggregatedTrends.get(key) || { 
            date: key, 
            avgPerformance: 0, 
            totalCertificates: 0, 
            totalCourses: 0, 
            count: 0 
          };
          
          existing.avgPerformance += trend.performance;
          existing.totalCertificates += trend.certificates;
          existing.totalCourses += trend.courses;
          existing.count += 1;
          
          aggregatedTrends.set(key, existing);
        });
      });
      
      return Array.from(aggregatedTrends.values())
        .map(item => ({
          ...item,
          avgPerformance: item.count > 0 ? item.avgPerformance / item.count : 0
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-20); // Last 20 data points
    },
    enabled: allTeams.length > 0
  });

  const isLoading = analyticsLoading || teamsLoading || trendsLoading;

  // Prepare chart data
  const teamPerformanceData = allTeams
    .filter(team => team.performance_score > 0)
    .map(team => ({
      name: team.name.length > 15 ? team.name.substring(0, 15) + '...' : team.name,
      performance: team.performance_score,
      members: team.members?.length || 0,
      location: team.location?.name || 'No Location'
    }))
    .sort((a, b) => b.performance - a.performance)
    .slice(0, 10);

  const locationDistributionData = Object.entries(systemAnalytics?.teamsByLocation || {})
    .map(([location, count]) => ({
      name: location,
      value: count,
      teams: count
    }));

  const teamTypePerformanceData = Object.entries(systemAnalytics?.performanceByTeamType || {})
    .map(([type, performance]) => ({
      type: type.replace('_', ' ').toUpperCase(),
      performance: Math.round(performance),
      teams: allTeams.filter(t => t.team_type === type).length
    }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Cross-Team Analytics</h2>
          <p className="text-muted-foreground">System-wide team performance and insights</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <select 
              value={selectedTimeframe} 
              onChange={(e) => setSelectedTimeframe(e.target.value as any)}
              className="border rounded px-3 py-1 text-sm"
            >
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>
          </div>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemAnalytics?.totalTeams || 0}</div>
            <p className="text-xs text-green-600 mt-1">
              +{allTeams.filter(t => t.status === 'active').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemAnalytics?.totalMembers || 0}</div>
            <p className="text-xs text-blue-600 mt-1">Across all teams</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(systemAnalytics?.averagePerformance || 0)}%
            </div>
            <p className="text-xs text-purple-600 mt-1">System-wide average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Award className="h-4 w-4" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allTeams.filter(t => t.performance_score >= 90).length}
            </div>
            <p className="text-xs text-amber-600 mt-1">Teams above 90%</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Team Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Teams</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={teamPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        `${value}%`, 
                        name === 'performance' ? 'Performance Score' : name
                      ]}
                      labelFormatter={(label) => `Team: ${label}`}
                    />
                    <Bar dataKey="performance" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Team Type Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Performance by Team Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={teamTypePerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="performance" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends Over Time</CardTitle>
              <div className="flex gap-2">
                {['performance', 'satisfaction', 'compliance'].map((metric) => (
                  <Button
                    key={metric}
                    variant={selectedMetric === metric ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedMetric(metric as any)}
                  >
                    {metric.charAt(0).toUpperCase() + metric.slice(1)}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={performanceTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: any) => [
                      selectedMetric === 'performance' ? `${value.toFixed(1)}%` : value,
                      selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avgPerformance" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={{ fill: '#8884d8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Location Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Teams by Location</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={locationDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {locationDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Score Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { range: '90-100%', count: allTeams.filter(t => t.performance_score >= 90).length, color: 'bg-green-500' },
                    { range: '80-89%', count: allTeams.filter(t => t.performance_score >= 80 && t.performance_score < 90).length, color: 'bg-blue-500' },
                    { range: '70-79%', count: allTeams.filter(t => t.performance_score >= 70 && t.performance_score < 80).length, color: 'bg-yellow-500' },
                    { range: '60-69%', count: allTeams.filter(t => t.performance_score >= 60 && t.performance_score < 70).length, color: 'bg-orange-500' },
                    { range: '<60%', count: allTeams.filter(t => t.performance_score < 60).length, color: 'bg-red-500' }
                  ].map((item) => (
                    <div key={item.range} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${item.color}`}></div>
                        <span className="text-sm">{item.range}</span>
                      </div>
                      <Badge variant="outline">{item.count} teams</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Comparison Matrix</CardTitle>
              <p className="text-sm text-muted-foreground">
                Compare teams across multiple performance dimensions
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Team</th>
                      <th className="text-left p-2">Location</th>
                      <th className="text-left p-2">Members</th>
                      <th className="text-left p-2">Performance</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allTeams.slice(0, 15).map((team) => (
                      <tr key={team.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{team.name}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {team.location?.name || 'No Location'}
                          </div>
                        </td>
                        <td className="p-2">{team.members?.length || 0}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <div className="w-12 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${team.performance_score}%` }}
                              ></div>
                            </div>
                            <span className="text-xs">{team.performance_score}%</span>
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge variant="outline">{team.team_type}</Badge>
                        </td>
                        <td className="p-2">
                          <Badge variant={team.status === 'active' ? 'default' : 'secondary'}>
                            {team.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
