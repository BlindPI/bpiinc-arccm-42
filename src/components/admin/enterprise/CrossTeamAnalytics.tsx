
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Target, 
  Award,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

interface CrossTeamAnalyticsProps {
  teams: any[];
}

export function CrossTeamAnalytics({ teams }: CrossTeamAnalyticsProps) {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('performance');

  // Mock data for analytics
  const performanceData = teams.map(team => ({
    name: team.name,
    performance: team.performance_score || Math.floor(Math.random() * 40) + 60,
    members: team.member_count || 0,
    location: team.location?.name || 'No Location'
  }));

  const trendData = [
    { month: 'Jan', teamA: 85, teamB: 82, teamC: 88 },
    { month: 'Feb', teamA: 87, teamB: 85, teamC: 90 },
    { month: 'Mar', teamA: 89, teamB: 83, teamC: 92 },
    { month: 'Apr', teamA: 91, teamB: 86, teamC: 89 },
    { month: 'May', teamA: 88, teamB: 88, teamC: 94 },
    { month: 'Jun', teamA: 93, teamB: 90, teamC: 96 }
  ];

  const distributionData = [
    { name: 'High Performers', value: 35, color: '#10b981' },
    { name: 'Average', value: 45, color: '#f59e0b' },
    { name: 'Needs Improvement', value: 20, color: '#ef4444' }
  ];

  const systemMetrics = {
    totalTeams: teams.length,
    activeTeams: teams.filter(t => t.status === 'active').length,
    totalMembers: teams.reduce((sum, team) => sum + (team.member_count || 0), 0),
    avgPerformance: Math.round(
      teams.reduce((sum, team) => sum + (team.performance_score || 0), 0) / teams.length
    ) || 0
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Cross-Team Analytics</h3>
          <p className="text-sm text-muted-foreground">
            System-wide team performance and insights
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
              <SelectItem value="1y">1 year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.totalTeams}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {systemMetrics.activeTeams} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Total Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.totalMembers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all teams
            </p>
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
            <div className="text-2xl font-bold">{systemMetrics.avgPerformance}%</div>
            <p className="text-xs text-green-600 mt-1">
              ↗ +2.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Award className="h-4 w-4" />
              Top Performer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {performanceData.sort((a, b) => b.performance - a.performance)[0]?.name || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {performanceData.sort((a, b) => b.performance - a.performance)[0]?.performance || 0}% score
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="performance" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="teamA" stroke="#3b82f6" name="Team Alpha" />
                  <Line type="monotone" dataKey="teamB" stroke="#10b981" name="Team Beta" />
                  <Line type="monotone" dataKey="teamC" stroke="#f59e0b" name="Team Gamma" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Performance Categories</h4>
                  {distributionData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <Badge variant="outline">{item.value}%</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Comparison Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Team</th>
                      <th className="text-center p-2">Members</th>
                      <th className="text-center p-2">Performance</th>
                      <th className="text-center p-2">Location</th>
                      <th className="text-center p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceData.map((team, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{team.name}</td>
                        <td className="p-2 text-center">{team.members}</td>
                        <td className="p-2 text-center">
                          <Badge variant={team.performance >= 85 ? 'default' : 'secondary'}>
                            {team.performance}%
                          </Badge>
                        </td>
                        <td className="p-2 text-center text-muted-foreground">{team.location}</td>
                        <td className="p-2 text-center">
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
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
