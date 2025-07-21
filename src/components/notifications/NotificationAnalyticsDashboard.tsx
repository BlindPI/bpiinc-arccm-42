import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  MousePointer, 
  Clock,
  Bell,
  Users,
  Target,
  Zap,
  BarChart3
} from 'lucide-react';
import { useNotificationMetrics, useNotificationCategoryPerformance } from '@/hooks/useNotificationAnalytics';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface NotificationAnalyticsDashboardProps {
  daysPeriod?: number;
  showSystemMetrics?: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function NotificationAnalyticsDashboard({ 
  daysPeriod = 30, 
  showSystemMetrics = false 
}: NotificationAnalyticsDashboardProps) {
  const { data: metrics, isLoading: metricsLoading } = useNotificationMetrics(daysPeriod);
  const { data: performance, isLoading: performanceLoading } = useNotificationCategoryPerformance();
  const pushNotifications = usePushNotifications();

  if (metricsLoading || performanceLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics || !performance) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No notification data available for the selected period.
          </div>
        </CardContent>
      </Card>
    );
  }

  const readRateChange = metrics.readRate - 75; // Assuming 75% baseline
  const avgReadTimeHours = Math.round(metrics.averageReadTime / 60 * 100) / 100;

  return (
    <div className="space-y-6">
      {/* Push Notification Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Browser Notifications
          </CardTitle>
          <CardDescription>
            Enable browser notifications to receive real-time alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Status: <Badge variant={pushNotifications.permission === 'granted' ? 'default' : 'secondary'}>
                  {pushNotifications.permission === 'granted' ? 'Enabled' : 'Disabled'}
                </Badge>
              </p>
              <p className="text-xs text-muted-foreground">
                {pushNotifications.permission === 'granted' 
                  ? 'You will receive browser notifications for new alerts'
                  : 'Enable to receive instant notifications'
                }
              </p>
            </div>
            <div className="flex gap-2">
              {pushNotifications.permission !== 'granted' && (
                <Button 
                  onClick={pushNotifications.requestPermission}
                  disabled={pushNotifications.isLoading}
                  size="sm"
                >
                  Enable Notifications
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={pushNotifications.testNotification}
                disabled={pushNotifications.permission !== 'granted'}
                size="sm"
              >
                Test Notification
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalNotifications}</div>
            <p className="text-xs text-muted-foreground">
              Last {daysPeriod} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Read Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.readRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground flex items-center">
              {readRateChange > 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  +{readRateChange.toFixed(1)}% from baseline
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  {readRateChange.toFixed(1)}% from baseline
                </>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Count</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.unreadNotifications}</div>
            <p className="text-xs text-muted-foreground">
              {((metrics.unreadNotifications / metrics.totalNotifications) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Read Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgReadTimeHours < 1 
                ? `${Math.round(metrics.averageReadTime)}m`
                : `${avgReadTimeHours}h`
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Time to read notifications
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Category Distribution
            </CardTitle>
            <CardDescription>Notifications by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(metrics.categoryDistribution).map(([category, count]) => ({
                    name: category,
                    value: count
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(metrics.categoryDistribution).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Daily Trends
            </CardTitle>
            <CardDescription>Notifications created and read over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.dailyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="created" 
                  stroke="#8884d8" 
                  name="Created"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="read" 
                  stroke="#82ca9d" 
                  name="Read"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Category Performance
          </CardTitle>
          <CardDescription>Performance metrics by notification category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performance.map((category) => (
              <div key={category.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{category.category}</span>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>{category.totalSent} sent</span>
                    <span>{category.totalRead} read</span>
                    <Badge variant="outline">
                      {category.readRate.toFixed(1)}% read rate
                    </Badge>
                  </div>
                </div>
                <Progress value={category.readRate} className="w-full" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Avg. read time: {category.averageReadTime.toFixed(1)} min</span>
                  <span>Engagement: {category.engagementRate.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Most Active Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Most Active Categories
          </CardTitle>
          <CardDescription>Categories with highest notification volume</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {metrics.mostActiveCategories.slice(0, 5).map((category, index) => (
              <div key={category.category} className="flex items-center justify-between p-2 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <span className="font-medium">{category.category}</span>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-muted-foreground">{category.count} notifications</span>
                  <Badge variant={category.readRate > 80 ? 'default' : category.readRate > 60 ? 'secondary' : 'destructive'}>
                    {category.readRate.toFixed(1)}% read
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}