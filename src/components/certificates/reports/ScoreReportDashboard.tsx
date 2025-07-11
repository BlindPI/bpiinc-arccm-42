/**
 * Score Report Dashboard Component
 * 
 * Comprehensive reporting interface for score data analysis and insights.
 * Provides pass/fail statistics, score distributions, trend analysis,
 * and actionable insights for certificate review workflows.
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Award, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { type EnhancedCertificateRequest } from '@/types/supabase-schema';

export interface ScoreReportData {
  requests: EnhancedCertificateRequest[];
  historicalData: HistoricalScoreData[];
  dateRange: {
    start: Date;
    end: Date;
  };
  filters: ScoreReportFilters;
}

export interface HistoricalScoreData {
  date: string;
  passCount: number;
  failCount: number;
  totalRequests: number;
  averageScore: number;
  passRate: number;
}

export interface ScoreReportFilters {
  status?: string[];
  scoreRange?: {
    min: number;
    max: number;
  };
  completionDate?: {
    start: Date;
    end: Date;
  };
  courseType?: string[];
}

export interface ScoreStatistics {
  totalRequests: number;
  passCount: number;
  failCount: number;
  pendingCount: number;
  reviewNeededCount: number;
  passRate: number;
  averageScore: number;
  medianScore: number;
  scoreDistribution: ScoreDistributionData[];
  trendData: HistoricalScoreData[];
  performanceByCategory: PerformanceCategoryData[];
}

interface ScoreDistributionData {
  range: string;
  count: number;
  percentage: number;
}

interface PerformanceCategoryData {
  category: string;
  practical: number;
  written: number;
  overall: number;
  totalRequests: number;
}

interface ScoreReportDashboardProps {
  data: ScoreReportData;
  onFiltersChange: (filters: ScoreReportFilters) => void;
  onExport: (format: 'csv' | 'pdf') => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

const COLORS = {
  pass: '#10b981',
  fail: '#ef4444',
  pending: '#6b7280',
  review: '#f59e0b'
};

export const ScoreReportDashboard: React.FC<ScoreReportDashboardProps> = ({
  data,
  onFiltersChange,
  onExport,
  onRefresh,
  isLoading = false
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showFilters, setShowFilters] = useState(false);

  // Calculate statistics from real data
  const statistics = useMemo(() => {
    return calculateScoreStatistics(data.requests, data.historicalData);
  }, [data.requests, data.historicalData]);

  // Status distribution data for pie chart
  const statusDistribution = useMemo(() => [
    { name: 'Passed', value: statistics.passCount, color: COLORS.pass },
    { name: 'Failed', value: statistics.failCount, color: COLORS.fail },
    { name: 'Pending', value: statistics.pendingCount, color: COLORS.pending },
    { name: 'Review Needed', value: statistics.reviewNeededCount, color: COLORS.review }
  ], [statistics]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Score Report Dashboard</h1>
          <p className="text-muted-foreground">
            Analysis of {statistics.totalRequests} certificate requests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport('csv')}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Requests"
          value={statistics.totalRequests}
          icon={<Users className="w-5 h-5" />}
          trend={getTrendForMetric('total', statistics.trendData)}
        />
        <MetricCard
          title="Pass Rate"
          value={`${statistics.passRate.toFixed(1)}%`}
          icon={<Award className="w-5 h-5" />}
          trend={getTrendForMetric('passRate', statistics.trendData)}
          color={statistics.passRate >= 80 ? 'green' : statistics.passRate >= 60 ? 'yellow' : 'red'}
        />
        <MetricCard
          title="Average Score"
          value={`${statistics.averageScore.toFixed(1)}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          trend={getTrendForMetric('averageScore', statistics.trendData)}
        />
        <MetricCard
          title="Needs Review"
          value={statistics.reviewNeededCount}
          icon={<AlertCircle className="w-5 h-5" />}
          color={statistics.reviewNeededCount > 0 ? 'yellow' : 'green'}
        />
      </div>

      {/* Tabs for Different Views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {statusDistribution.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Performance by Assessment Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statistics.performanceByCategory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="practical" fill="#3b82f6" name="Practical" />
                      <Bar dataKey="written" fill="#10b981" name="Written" />
                      <Bar dataKey="overall" fill="#8b5cf6" name="Overall" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Score Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statistics.scoreDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Score Trends Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={statistics.trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="passRate" 
                      stroke="#10b981" 
                      name="Pass Rate %" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="averageScore" 
                      stroke="#3b82f6" 
                      name="Average Score %" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <InsightsPanel statistics={statistics} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  color?: 'green' | 'red' | 'yellow' | 'blue';
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  icon, 
  trend, 
  color = 'blue' 
}) => {
  const colorClasses = {
    green: 'border-green-200 bg-green-50',
    red: 'border-red-200 bg-red-50',
    yellow: 'border-yellow-200 bg-yellow-50',
    blue: 'border-blue-200 bg-blue-50'
  };

  return (
    <Card className={colorClasses[color]}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className="flex items-center gap-2">
            {icon}
            {trend && (
              <div className={`flex items-center ${
                trend === 'up' ? 'text-green-600' : 
                trend === 'down' ? 'text-red-600' : 
                'text-gray-600'
              }`}>
                {trend === 'up' ? <TrendingUp className="w-4 h-4" /> :
                 trend === 'down' ? <TrendingDown className="w-4 h-4" /> :
                 <Clock className="w-4 h-4" />}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface InsightsPanelProps {
  statistics: ScoreStatistics;
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ statistics }) => {
  const insights = generateInsights(statistics);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {insights.map((insight, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {insight.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600" /> :
               insight.type === 'warning' ? <AlertCircle className="w-5 h-5 text-yellow-600" /> :
               <TrendingUp className="w-5 h-5 text-blue-600" />}
              {insight.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
            {insight.recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Recommendations:</h4>
                <ul className="text-sm space-y-1">
                  {insight.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Helper Functions

function calculateScoreStatistics(
  requests: EnhancedCertificateRequest[],
  historicalData: HistoricalScoreData[]
): ScoreStatistics {
  const totalRequests = requests.length;
  const passCount = requests.filter(r => r.calculated_status === 'AUTO_PASS').length;
  const failCount = requests.filter(r => r.calculated_status === 'AUTO_FAIL').length;
  const pendingCount = requests.filter(r => r.calculated_status === 'PENDING_SCORES').length;
  const reviewNeededCount = requests.filter(r => r.calculated_status === 'MANUAL_REVIEW').length;

  const passRate = totalRequests > 0 ? (passCount / totalRequests) * 100 : 0;

  // Calculate scores from actual data
  const validScores = requests
    .filter(r => r.total_score !== null)
    .map(r => r.total_score!);

  const averageScore = validScores.length > 0 
    ? validScores.reduce((sum, score) => sum + score, 0) / validScores.length 
    : 0;

  const sortedScores = [...validScores].sort((a, b) => a - b);
  const medianScore = sortedScores.length > 0 
    ? sortedScores[Math.floor(sortedScores.length / 2)]
    : 0;

  // Real score distribution from actual data
  const scoreDistribution = generateScoreDistribution(validScores);

  // Real performance by category from actual data
  const performanceByCategory = calculatePerformanceByCategory(requests);

  return {
    totalRequests,
    passCount,
    failCount,
    pendingCount,
    reviewNeededCount,
    passRate,
    averageScore,
    medianScore,
    scoreDistribution,
    trendData: historicalData,
    performanceByCategory
  };
}

function generateScoreDistribution(scores: number[]): ScoreDistributionData[] {
  const ranges = [
    { min: 0, max: 50, label: '0-50%' },
    { min: 51, max: 60, label: '51-60%' },
    { min: 61, max: 70, label: '61-70%' },
    { min: 71, max: 80, label: '71-80%' },
    { min: 81, max: 90, label: '81-90%' },
    { min: 91, max: 100, label: '91-100%' }
  ];

  return ranges.map(range => {
    const count = scores.filter(score => score >= range.min && score <= range.max).length;
    const percentage = scores.length > 0 ? (count / scores.length) * 100 : 0;
    return {
      range: range.label,
      count,
      percentage
    };
  });
}

function calculatePerformanceByCategory(requests: EnhancedCertificateRequest[]): PerformanceCategoryData[] {
  // Group requests by course_type or certification_type from actual data
  const categoryGroups = new Map<string, EnhancedCertificateRequest[]>();
  
  requests.forEach(request => {
    // Use course_type or fallback to a generic category
    const category = request.course_name || 'General Certification';
    if (!categoryGroups.has(category)) {
      categoryGroups.set(category, []);
    }
    categoryGroups.get(category)!.push(request);
  });

  const performanceData: PerformanceCategoryData[] = [];

  categoryGroups.forEach((categoryRequests, category) => {
    const practicalScores = categoryRequests
      .filter(r => r.practical_score !== null)
      .map(r => r.practical_score!);
    
    const writtenScores = categoryRequests
      .filter(r => r.written_score !== null)
      .map(r => r.written_score!);
    
    const overallScores = categoryRequests
      .filter(r => r.total_score !== null)
      .map(r => r.total_score!);

    const practical = practicalScores.length > 0 
      ? practicalScores.reduce((sum, score) => sum + score, 0) / practicalScores.length 
      : 0;
    
    const written = writtenScores.length > 0 
      ? writtenScores.reduce((sum, score) => sum + score, 0) / writtenScores.length 
      : 0;
    
    const overall = overallScores.length > 0 
      ? overallScores.reduce((sum, score) => sum + score, 0) / overallScores.length 
      : 0;

    performanceData.push({
      category,
      practical: Math.round(practical * 10) / 10,
      written: Math.round(written * 10) / 10,
      overall: Math.round(overall * 10) / 10,
      totalRequests: categoryRequests.length
    });
  });

  return performanceData;
}

function getTrendForMetric(metric: string, trendData: HistoricalScoreData[]): 'up' | 'down' | 'stable' {
  if (trendData.length < 2) return 'stable';
  
  const recent = trendData[trendData.length - 1];
  const previous = trendData[trendData.length - 2];
  
  let currentValue: number;
  let previousValue: number;
  
  switch (metric) {
    case 'passRate':
      currentValue = recent.passRate;
      previousValue = previous.passRate;
      break;
    case 'averageScore':
      currentValue = recent.averageScore;
      previousValue = previous.averageScore;
      break;
    case 'total':
      currentValue = recent.totalRequests;
      previousValue = previous.totalRequests;
      break;
    default:
      return 'stable';
  }
  
  const difference = currentValue - previousValue;
  if (Math.abs(difference) < 1) return 'stable';
  return difference > 0 ? 'up' : 'down';
}

function generateInsights(statistics: ScoreStatistics) {
  const insights = [];

  // Pass rate insights based on real data
  if (statistics.passRate >= 90) {
    insights.push({
      type: 'success' as const,
      title: 'Excellent Pass Rate',
      description: `Current pass rate of ${statistics.passRate.toFixed(1)}% indicates strong performance across the program.`,
      recommendations: [
        'Continue current training methodologies',
        'Consider this as a benchmark for other programs'
      ]
    });
  } else if (statistics.passRate < 70) {
    insights.push({
      type: 'warning' as const,
      title: 'Low Pass Rate Detected',
      description: `Pass rate of ${statistics.passRate.toFixed(1)}% is below recommended threshold.`,
      recommendations: [
        'Review training materials and methods',
        'Identify common failure patterns',
        'Consider additional support for struggling students'
      ]
    });
  }

  // Score distribution insights from real data
  const lowScoreCount = statistics.scoreDistribution
    .filter(d => d.range.includes('0-50') || d.range.includes('51-60'))
    .reduce((sum, d) => sum + d.count, 0);

  if (lowScoreCount > statistics.totalRequests * 0.2) {
    insights.push({
      type: 'warning' as const,
      title: 'High Number of Low Scores',
      description: `${lowScoreCount} students scored below 60%, indicating potential curriculum gaps.`,
      recommendations: [
        'Analyze specific areas where students struggle',
        'Provide additional practice materials',
        'Consider prerequisite requirements'
      ]
    });
  }

  // Manual review insights
  if (statistics.reviewNeededCount > 0) {
    insights.push({
      type: 'info' as const,
      title: 'Manual Reviews Required',
      description: `${statistics.reviewNeededCount} requests require manual review.`,
      recommendations: [
        'Prioritize review of borderline cases',
        'Update automatic threshold criteria if needed',
        'Ensure consistent review standards'
      ]
    });
  }

  // Trend analysis insights
  if (statistics.trendData.length >= 2) {
    const recentTrend = getTrendForMetric('passRate', statistics.trendData);
    if (recentTrend === 'down') {
      insights.push({
        type: 'warning' as const,
        title: 'Declining Pass Rate Trend',
        description: 'Pass rates have been declining in recent periods.',
        recommendations: [
          'Investigate recent changes in curriculum or assessment',
          'Review student feedback and support resources',
          'Consider additional training for instructors'
        ]
      });
    } else if (recentTrend === 'up') {
      insights.push({
        type: 'success' as const,
        title: 'Improving Pass Rate Trend',
        description: 'Pass rates have been improving in recent periods.',
        recommendations: [
          'Identify and replicate successful practices',
          'Document effective training methods',
          'Share best practices across programs'
        ]
      });
    }
  }

  return insights;
}