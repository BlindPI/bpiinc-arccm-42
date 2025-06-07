import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target,
  Download,
  Calendar,
  PieChart,
  LineChart
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, LineChart as RechartsLineChart, Line, Pie } from 'recharts';

interface CrossTeamAnalyticsProps {
  teams: any[];
}

export function CrossTeamAnalytics({ teams }: CrossTeamAnalyticsProps) {
  const [timeRange, setTimeRange] = useState('monthly');
  const [metricType, setMetricType] = useState('performance');

  // Mock analytics data
  const performanceData = teams.map(team => ({
    name: team.name.substring(0, 15) + (team.name.length > 15 ? '...' : ''),
    performance: team.performance_score || Math.floor(Math.random() * 40) + 60,
    members: team.members?.length || 0,
    location: team.location?.name || 'Unknown'
  }));

  const teamTypeData = [
    { name: 'Provider Teams', value: teams.filter(t => t.team_type === 'provider_team').length, color: '#8884d8' },
    { name: 'Location Teams', value: teams.filter(t => t.team_type === 'location_team').length, color: '#82ca9d' },
    { name: 'Project Teams', value: teams.filter(t => t.team_type === 'project_team').length, color: '#ffc658' },
    { name: 'Other', value: teams.filter(t => !['provider_team', 'location_team', 'project_team'].includes(t.team_type)).length, color: '#ff7300' }
  ];

  const trendData = [
    { month: 'Jan', teams: 45, members: 234, performance: 82 },
    { month: 'Feb', teams: 48, members: 267, performance: 84 },
    { month: 'Mar', teams: 52, members: 289, performance: 86 },
    { month: 'Apr', teams: 55, members: 312, performance: 85 },
    { month: 'May', teams: 58, members: 334, performance: 87 },
    { month: 'Jun', teams: teams.length, members: teams.reduce((sum, t) => sum + (t.members?.length || 0), 0), performance: 88 }
  ];

  const topPerformers = [...teams]
    .sort((a, b) => (b.performance_score || 0) - (a.performance_score || 0))
    .slice(0, 5);

  const lowPerformers = [...teams]
    .sort((a, b) => (a.performance_score || 0) - (b.performance_score || 0))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Analytics Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Cross-Team Analytics</h2>
          <p className="text-muted-foreground">Comprehensive analytics across all teams</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={metricType} onValueChange={setMetricType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="productivity">Productivity</SelectItem>
              <SelectItem value="engagement">Engagement</SelectItem>
              <SelectItem value="compliance">Compliance</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(teams.reduce((sum, team) => sum + (team.performance_score || 0), 0) / teams.length) || 0}%
            </div>
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">+3.2% vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Member Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teams.reduce((sum, team) => sum + (team.members?.length || 0), 0)}
            </div>
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">+12 this month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teams.filter(t => t.status === 'active').length}
            </div>
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">98% uptime</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Compliance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <div className="flex items-center mt-2 text-sm">
              <Target className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-blue-500">Target: 90%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Team Performance Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="performance" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Team Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Team Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={teamTypeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {teamTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Growth Trends */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Growth Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsLineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="teams" stroke="#8884d8" name="Teams" />
                <Line type="monotone" dataKey="members" stroke="#82ca9d" name="Members" />
                <Line type="monotone" dataKey="performance" stroke="#ffc658" name="Performance" />
              </RechartsLineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Rankings */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.map((team, index) => (
                <div key={team.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{team.name}</div>
                      <div className="text-sm text-muted-foreground">{team.location?.name || 'No location'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">{team.performance_score || 0}%</div>
                    <div className="text-sm text-muted-foreground">{team.members?.length || 0} members</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Teams Needing Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowPerformers.map((team, index) => (
                <div key={team.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 text-red-800 rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{team.name}</div>
                      <div className="text-sm text-muted-foreground">{team.location?.name || 'No location'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-red-600">{team.performance_score || 0}%</div>
                    <div className="text-sm text-muted-foreground">{team.members?.length || 0} members</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
