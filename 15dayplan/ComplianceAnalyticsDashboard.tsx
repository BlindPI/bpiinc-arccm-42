// File: src/components/compliance/ComplianceAnalyticsDashboard.tsx (From Currentplan3.md)

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useComplianceMetrics, useComplianceActivities, useComplianceProjections } from '@/hooks/useComplianceProgress';
import { useComplianceRequirements } from '@/hooks/useComplianceRequirements';
import { ComplianceReportGenerator } from '@/services/compliance/complianceReportGenerator';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { 
  CheckCircle, ClipboardCheck, Award, CalendarClock, FileText,
  AlertTriangle, Info, TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

// Import Chart components
import { 
  ResponsiveContainer, RadialBarChart, RadialBar, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line,
  PieChart, Pie, Cell
} from 'recharts';

interface ComplianceAnalyticsDashboardProps {
  userId: string;
  role: string;
  tier: string;
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
}

export function ComplianceAnalyticsDashboard({
  userId,
  role,
  tier,
  timeRange = 'month'
}: ComplianceAnalyticsDashboardProps) {
  const [selectedChart, setSelectedChart] = useState<string>('progress');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showPredictions, setShowPredictions] = useState<boolean>(true);
  
  // Load analytics data
  const { data: metrics, isLoading: metricsLoading } = useComplianceMetrics(userId);
  const { data: activities } = useComplianceActivities(userId, timeRange);
  const { data: projections } = useComplianceProjections(userId);
  const { data: requirements } = useComplianceRequirements(userId, role, tier);
  
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['compliance-analytics', userId, timeRange],
    queryFn: () => ComplianceAnalyticsService.getUserAnalytics(userId, timeRange),
    enabled: !!userId && !!timeRange
  });
  
  // Calculate category data
  const categoryData = useMemo(() => {
    if (!requirements) return [];
    
    const categories: Record<string, CategoryData> = {};
    
    requirements.forEach(req => {
      if (!categories[req.category]) {
        categories[req.category] = {
          name: req.category,
          total: 0,
          completed: 0,
          inProgress: 0,
          pending: 0
        };
      }
      
      categories[req.category].total++;
      
      if (req.status === 'approved') {
        categories[req.category].completed++;
      } else if (req.status === 'in_progress' || req.status === 'submitted') {
        categories[req.category].inProgress++;
      } else {
        categories[req.category].pending++;
      }
    });
    
    return Object.values(categories);
  }, [requirements]);
  
  // Calculate time series data
  const timeSeriesData = useMemo(() => {
    if (!activities) return [];
    
    const dates = groupActivitiesByDate(activities);
    return Object.entries(dates).map(([date, value]) => ({
      date,
      completed: value.completed || 0,
      submitted: value.submitted || 0,
      started: value.started || 0
    }));
  }, [activities]);
  
  // Handle report generation
  const handleGenerateReport = async () => {
    try {
      const result = await ComplianceReportGenerator.generateUserComplianceReport(userId, {
        format: 'pdf',
        timeRange,
        includeActivities: true
      });
      
      if (result.success && result.format === 'pdf') {
        // Create download link
        const blob = new Blob([result.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.fileName;
        a.click();
        URL.revokeObjectURL(url);
        
        toast.success('Report generated successfully');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    }
  };
  
  // Render loading state
  if (metricsLoading || analyticsLoading) {
    return <AnalyticsDashboardSkeleton />;
  }
  
  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Compliance Analytics</h2>
          <p className="text-muted-foreground">
            Track your compliance progress and performance
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as any)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            onClick={handleGenerateReport}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Overall Compliance"
          value={metrics?.overall_percentage || 0}
          format="percentage"
          icon={<CheckCircle className="h-6 w-6 text-green-600" />}
          trend={calculateTrend(analyticsData?.trends?.overall_completion)}
          trendValue={analyticsData?.trends?.overall_completion?.change}
        />
        
        <MetricCard
          title="Requirements Complete"
          value={`${metrics?.completed || 0}/${metrics?.total || 0}`}
          format="fraction"
          icon={<ClipboardCheck className="h-6 w-6 text-blue-600" />}
          trend={calculateTrend(analyticsData?.trends?.completed_requirements)}
          trendValue={analyticsData?.trends?.completed_requirements?.change}
        />
        
        <MetricCard
          title="Compliance Points"
          value={metrics?.total_points || 0}
          format="number"
          icon={<Award className="h-6 w-6 text-purple-600" />}
          trend={calculateTrend(analyticsData?.trends?.points_earned)}
          trendValue={analyticsData?.trends?.points_earned?.change}
        />
        
        <MetricCard
          title="Time to Complete"
          value={projections?.estimatedDays || 'N/A'}
          format="text"
          suffix="days"
          icon={<CalendarClock className="h-6 w-6 text-orange-600" />}
          subtext={projections?.projectedDate ? formatDate(projections.projectedDate) : ''}
        />
      </div>
      
      {/* Chart Selection Tabs */}
      <Tabs
        value={selectedChart}
        onValueChange={setSelectedChart}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="completion">Completion</TabsTrigger>
        </TabsList>
        
        <div className="mt-6 bg-white rounded-lg border p-6">
          <TabsContent value="progress" className="h-80">
            <ComplianceProgressChart
              overallPercentage={metrics?.overall_percentage || 0}
              categoryData={categoryData}
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
            />
          </TabsContent>
          
          <TabsContent value="categories" className="h-80">
            <CategoryBreakdownChart
              categories={categoryData}
              onCategorySelect={setSelectedCategory}
            />
          </TabsContent>
          
          <TabsContent value="timeline" className="h-80">
            <TimeSeriesChart
              data={timeSeriesData}
              timeRange={timeRange}
              showPredictions={showPredictions}
              predictions={projections?.dailyProjections}
            />
          </TabsContent>
          
          <TabsContent value="completion" className="h-80">
            <CompletionPredictionChart
              currentCompletion={metrics?.overall_percentage || 0}
              projections={projections?.weeklyProjections}
              targetDate={projections?.targetDate}
              showPredictions={showPredictions}
            />
          </TabsContent>
        </div>
      </Tabs>
      
      {/* Chart Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="show-predictions" className="cursor-pointer">
            Show Predictions
          </Label>
          <Switch
            id="show-predictions"
            checked={showPredictions}
            onCheckedChange={setShowPredictions}
          />
        </div>
        
        {selectedChart === 'categories' && (
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categoryData.map((category) => (
                <SelectItem key={category.name} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      
      {/* Activity Feed */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <ActivityFeed
            activities={activities?.slice(0, 5) || []}
            emptyMessage="No recent activity"
          />
        </CardContent>
      </Card>
      
      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Compliance Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData?.insights?.map((insight, index) => (
              <Alert
                key={index}
                variant={getInsightVariant(insight.type)}
                className="flex items-start"
              >
                <div className="mr-2 mt-0.5">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="space-y-1">
                  <AlertTitle>{insight.title}</AlertTitle>
                  <AlertDescription>{insight.message}</AlertDescription>
                  {insight.action && (
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => handleInsightAction(insight.action)}
                    >
                      {insight.action.label}
                    </Button>
                  )}
                </div>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper components and functions from the original plan
function ComplianceProgressChart({
  overallPercentage,
  categoryData,
  selectedCategory,
  onCategorySelect
}: {
  overallPercentage: number;
  categoryData: any[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}) {
  return (
    <div className="h-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="30%"
          outerRadius="90%"
          data={
            selectedCategory === 'all'
              ? [{ name: 'Overall', value: overallPercentage }]
              : categoryData
                  .filter(c => c.name === selectedCategory)
                  .map(c => ({
                    name: c.name,
                    value: c.total > 0 ? (c.completed / c.total) * 100 : 0
                  }))
          }
          startAngle={180}
          endAngle={0}
        >
          <RadialBar
            background
            clockWise
            dataKey="value"
            cornerRadius={10}
            fill="#3b82f6"
          />
          <Legend
            iconSize={10}
            layout="vertical"
            verticalAlign="middle"
            align="right"
          />
          <Tooltip
            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Completion']}
          />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
}

function CategoryBreakdownChart({ categories, onCategorySelect }: any) {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={categories}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="completed"
          onClick={(data) => onCategorySelect(data.name)}
        >
          {categories.map((entry: any, index: number) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

function TimeSeriesChart({ data, timeRange, showPredictions, predictions }: any) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2} />
        <Line type="monotone" dataKey="submitted" stroke="#3B82F6" strokeWidth={2} />
        <Line type="monotone" dataKey="started" stroke="#F59E0B" strokeWidth={2} />
        {showPredictions && predictions && (
          <Line type="monotone" dataKey="predicted" stroke="#EF4444" strokeDasharray="5 5" />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

function CompletionPredictionChart({ currentCompletion, projections, targetDate, showPredictions }: any) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={projections || []}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="week" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="projected" fill="#8884d8" />
        {showPredictions && <Bar dataKey="target" fill="#82ca9d" />}
      </BarChart>
    </ResponsiveContainer>
  );
}

// Helper functions
function calculateTrend(data: any) {
  if (!data) return null;
  return data.direction;
}

function getInsightVariant(type: string) {
  switch (type) {
    case 'warning': return 'destructive';
    case 'success': return 'default';
    default: return 'default';
  }
}

function getInsightIcon(type: string) {
  switch (type) {
    case 'warning': return <AlertTriangle className="h-4 w-4" />;
    case 'success': return <CheckCircle className="h-4 w-4" />;
    default: return <Info className="h-4 w-4" />;
  }
}

function groupActivitiesByDate(activities: any[]) {
  return activities.reduce((acc, activity) => {
    const date = activity.created_at.split('T')[0];
    if (!acc[date]) {
      acc[date] = { completed: 0, submitted: 0, started: 0 };
    }
    acc[date][activity.action.split('_')[1]] = (acc[date][activity.action.split('_')[1]] || 0) + 1;
    return acc;
  }, {});
}

function AnalyticsDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 bg-gray-200 rounded animate-pulse" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
      <div className="h-96 bg-gray-200 rounded animate-pulse" />
    </div>
  );
}