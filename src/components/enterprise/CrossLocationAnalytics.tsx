
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  Globe, 
  Download,
  Calendar,
  LineChart as LineChartIcon
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface CrossLocationAnalyticsProps {
  teams: any[];
  locationMetrics: any;
}

export function CrossLocationAnalytics({ teams, locationMetrics }: CrossLocationAnalyticsProps) {
  const [timeRange, setTimeRange] = useState('monthly');
  const [metricType, setMetricType] = useState('performance');

  // Mock analytics data
  const performanceByLocation = [
    { location: 'New York', performance: 92, efficiency: 88, satisfaction: 95 },
    { location: 'Chicago', performance: 88, efficiency: 85, satisfaction: 90 },
    { location: 'Los Angeles', performance: 94, efficiency: 92, satisfaction: 97 },
    { location: 'Miami', performance: 85, efficiency: 82, satisfaction: 88 },
    { location: 'Seattle', performance: 90, efficiency: 89, satisfaction: 93 }
  ];

  const collaborationData = [
    { month: 'Jan', crossLocation: 45, withinLocation: 234, total: 279 },
    { month: 'Feb', crossLocation: 52, withinLocation: 267, total: 319 },
    { month: 'Mar', crossLocation: 48, withinLocation: 289, total: 337 },
    { month: 'Apr', crossLocation: 63, withinLocation: 312, total: 375 },
    { month: 'May', crossLocation: 71, withinLocation: 334, total: 405 },
    { month: 'Jun', crossLocation: 68, withinLocation: 356, total: 424 }
  ];

  const resourceUtilization = [
    { name: 'High Utilization', value: 65, color: '#10B981' },
    { name: 'Optimal', value: 25, color: '#3B82F6' },
    { name: 'Under-utilized', value: 10, color: '#F59E0B' }
  ];

  const predictiveMetrics = [
    { location: 'New York', projected: 96, current: 92, trend: 'up' },
    { location: 'Chicago', projected: 91, current: 88, trend: 'up' },
    { location: 'Los Angeles', projected: 97, current: 94, trend: 'up' },
    { location: 'Miami', projected: 89, current: 85, trend: 'up' },
    { location: 'Seattle', projected: 93, current: 90, trend: 'up' }
  ];

  return (
    <div className="space-y-6">
      {/* Analytics Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Cross-Location Analytics</h2>
          <p className="text-muted-foreground">Advanced analytics across geographic locations</p>
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
              <SelectItem value="collaboration">Collaboration</SelectItem>
              <SelectItem value="efficiency">Efficiency</SelectItem>
              <SelectItem value="predictive">Predictive</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Performance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance by Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceByLocation}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="location" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="performance" fill="#3B82F6" name="Performance" />
              <Bar dataKey="efficiency" fill="#10B981" name="Efficiency" />
              <Bar dataKey="satisfaction" fill="#8B5CF6" name="Satisfaction" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Collaboration Trends */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChartIcon className="h-5 w-5" />
              Cross-Location Collaboration Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={collaborationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="crossLocation" stroke="#3B82F6" name="Cross-Location" />
                <Line type="monotone" dataKey="withinLocation" stroke="#10B981" name="Within Location" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Resource Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={resourceUtilization}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {resourceUtilization.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Predictive Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Predictive Performance Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {predictiveMetrics.map((metric) => (
              <div key={metric.location} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="font-medium">{metric.location}</div>
                    <div className="text-sm text-muted-foreground">Current: {metric.current}%</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">{metric.projected}%</div>
                    <div className="text-sm text-muted-foreground">Projected (30 days)</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className={`h-4 w-4 ${metric.trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
                    <span className={`text-sm ${metric.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                      +{metric.projected - metric.current}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Cross-Location Collaboration</h4>
              <p className="text-sm text-blue-700">
                Teams are showing 45% increase in cross-location collaboration, indicating strong 
                remote work culture and effective communication tools.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Performance Trends</h4>
              <p className="text-sm text-green-700">
                Los Angeles location shows highest performance at 94%, followed by New York at 92%. 
                Consider sharing best practices across locations.
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Resource Optimization</h4>
              <p className="text-sm text-purple-700">
                65% of locations show high resource utilization. Consider load balancing and 
                capacity planning for continued growth.
              </p>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg">
              <h4 className="font-medium text-amber-900 mb-2">Growth Opportunities</h4>
              <p className="text-sm text-amber-700">
                Miami location has potential for 15% performance improvement based on 
                predictive modeling and historical trends.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
