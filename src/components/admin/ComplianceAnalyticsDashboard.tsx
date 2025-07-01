import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  RefreshCw,
  Calendar,
  Target
} from 'lucide-react';
import { ComplianceService, type ComplianceSummary, type UserComplianceRecord } from '@/services/compliance/complianceService';
import { ComplianceTierService } from '@/services/compliance/complianceTierService';
import { toast } from 'sonner';

interface AnalyticsData {
  totalUsers: number;
  complianceScore: number;
  pendingReviews: number;
  overdueActions: number;
  categoryBreakdown: Array<{
    category: string;
    compliant: number;
    total: number;
    percentage: number;
  }>;
  roleBreakdown: Array<{
    role: string;
    users: number;
    avgScore: number;
  }>;
  tierBreakdown: {
    basic: { users: number; avgScore: number };
    robust: { users: number; avgScore: number };
  };
  trendData: Array<{
    period: string;
    compliance: number;
    pending: number;
  }>;
}

interface AnalyticsFilters {
  timeRange: string;
  role: string;
  tier: string;
  category: string;
}

export function ComplianceAnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    timeRange: '30d',
    role: 'all',
    tier: 'all',
    category: 'all'
  });

  useEffect(() => {
    loadAnalyticsData();
  }, [filters]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Get all compliance records
      const allRecords = await ComplianceService.getAllComplianceRecords();
      
      // Get tier statistics
      const tierStats = await ComplianceTierService.getComplianceTierStatistics();
      const allUsers = await ComplianceTierService.getAllUsersComplianceTiers();
      
      // Process data
      const processedData = await processAnalyticsData(allRecords, tierStats, allUsers);
      setAnalyticsData(processedData);
      
    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = async (
    records: UserComplianceRecord[], 
    tierStats: any, 
    users: any[]
  ): Promise<AnalyticsData> => {
    
    // Calculate total users
    const totalUsers = users.length;
    
    // Calculate overall compliance score
    let totalCompliant = 0;
    let totalRecords = 0;
    
    records.forEach(record => {
      totalRecords++;
      if (record.compliance_status === 'compliant') {
        totalCompliant++;
      }
    });
    
    const complianceScore = totalRecords > 0 ? Math.round((totalCompliant / totalRecords) * 100) : 0;
    
    // Count pending reviews and overdue actions
    const pendingReviews = records.filter(r => r.compliance_status === 'pending').length;
    const overdueActions = records.filter(r => {
      if (r.compliance_status === 'non_compliant' || r.compliance_status === 'warning') {
        const lastChecked = new Date(r.last_checked_at);
        const now = new Date();
        const daysDiff = (now.getTime() - lastChecked.getTime()) / (1000 * 3600 * 24);
        return daysDiff > 7; // Consider overdue after 7 days
      }
      return false;
    }).length;
    
    // Category breakdown
    const categoryMap = new Map<string, { compliant: number; total: number }>();
    records.forEach(record => {
      const category = record.compliance_metrics?.category || 'Unknown';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { compliant: 0, total: 0 });
      }
      const catData = categoryMap.get(category)!;
      catData.total++;
      if (record.compliance_status === 'compliant') {
        catData.compliant++;
      }
    });
    
    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      compliant: data.compliant,
      total: data.total,
      percentage: data.total > 0 ? Math.round((data.compliant / data.total) * 100) : 0
    }));
    
    // Role breakdown
    const roleMap = new Map<string, { users: Set<string>; scores: number[] }>();
    records.forEach(record => {
      const userProfile = (record as any).profiles;
      if (userProfile) {
        const role = userProfile.role || 'Unknown';
        if (!roleMap.has(role)) {
          roleMap.set(role, { users: new Set(), scores: [] });
        }
        const roleData = roleMap.get(role)!;
        roleData.users.add(record.user_id);
        
        // Calculate score for this record
        const score = record.compliance_status === 'compliant' ? 100 : 
                     record.compliance_status === 'warning' ? 75 : 
                     record.compliance_status === 'non_compliant' ? 0 : 50;
        roleData.scores.push(score);
      }
    });
    
    const roleBreakdown = Array.from(roleMap.entries()).map(([role, data]) => ({
      role,
      users: data.users.size,
      avgScore: data.scores.length > 0 ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length) : 0
    }));
    
    // Tier breakdown
    const tierBreakdown = {
      basic: {
        users: tierStats.basic_tier_users || 0,
        avgScore: tierStats.basic_completion_avg || 0
      },
      robust: {
        users: tierStats.robust_tier_users || 0,
        avgScore: tierStats.robust_completion_avg || 0
      }
    };
    
    // Mock trend data (in real implementation, this would come from historical data)
    const trendData = [
      { period: '30 days ago', compliance: complianceScore - 10, pending: pendingReviews + 5 },
      { period: '21 days ago', compliance: complianceScore - 7, pending: pendingReviews + 3 },
      { period: '14 days ago', compliance: complianceScore - 5, pending: pendingReviews + 2 },
      { period: '7 days ago', compliance: complianceScore - 2, pending: pendingReviews + 1 },
      { period: 'Today', compliance: complianceScore, pending: pendingReviews }
    ];
    
    return {
      totalUsers,
      complianceScore,
      pendingReviews,
      overdueActions,
      categoryBreakdown,
      roleBreakdown,
      tierBreakdown,
      trendData
    };
  };

  const exportAnalytics = async () => {
    try {
      if (!analyticsData) return;
      
      const exportData = {
        generatedAt: new Date().toISOString(),
        filters,
        summary: {
          totalUsers: analyticsData.totalUsers,
          complianceScore: analyticsData.complianceScore,
          pendingReviews: analyticsData.pendingReviews,
          overdueActions: analyticsData.overdueActions
        },
        categoryBreakdown: analyticsData.categoryBreakdown,
        roleBreakdown: analyticsData.roleBreakdown,
        tierBreakdown: analyticsData.tierBreakdown
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance-analytics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Analytics data exported successfully');
    } catch (error) {
      console.error('Error exporting analytics:', error);
      toast.error('Failed to export analytics data');
    }
  };

  if (loading || !analyticsData) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
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
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Compliance Analytics</h1>
          <p className="text-muted-foreground">Comprehensive compliance metrics and insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadAnalyticsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportAnalytics}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Time Range</Label>
              <Select value={filters.timeRange} onValueChange={(value) => setFilters({...filters, timeRange: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                  <SelectItem value="1y">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={filters.role} onValueChange={(value) => setFilters({...filters, role: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {analyticsData.roleBreakdown.map(role => (
                    <SelectItem key={role.role} value={role.role}>{role.role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Compliance Tier</Label>
              <Select value={filters.tier} onValueChange={(value) => setFilters({...filters, tier: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="basic">Basic Tier</SelectItem>
                  <SelectItem value="robust">Robust Tier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {analyticsData.categoryBreakdown.map(cat => (
                    <SelectItem key={cat.category} value={cat.category}>{cat.category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Active compliance users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(analyticsData.complianceScore)}`}>
              {analyticsData.complianceScore}%
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={analyticsData.complianceScore} className="h-1 flex-1" />
              <span className="text-xs text-muted-foreground">Overall</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{analyticsData.pendingReviews}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Actions</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{analyticsData.overdueActions}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Compliance by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.categoryBreakdown.map((category) => (
                <div key={category.category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{category.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {category.compliant}/{category.total}
                      </span>
                      <Badge variant="outline" className={getScoreColor(category.percentage)}>
                        {category.percentage}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={category.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Role Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Compliance by Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.roleBreakdown.map((role) => (
                <div key={role.role} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{role.role}</div>
                    <div className="text-sm text-muted-foreground">{role.users} users</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={role.avgScore} className="h-2 w-20" />
                    <Badge variant="outline" className={getScoreColor(role.avgScore)}>
                      {role.avgScore}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tier Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Tier Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded">
                <div>
                  <div className="font-medium text-blue-900">Basic Tier</div>
                  <div className="text-sm text-blue-700">{analyticsData.tierBreakdown.basic.users} users</div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={analyticsData.tierBreakdown.basic.avgScore} className="h-2 w-20" />
                  <Badge variant="outline" className={getScoreColor(analyticsData.tierBreakdown.basic.avgScore)}>
                    {analyticsData.tierBreakdown.basic.avgScore}%
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded">
                <div>
                  <div className="font-medium text-green-900">Robust Tier</div>
                  <div className="text-sm text-green-700">{analyticsData.tierBreakdown.robust.users} users</div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={analyticsData.tierBreakdown.robust.avgScore} className="h-2 w-20" />
                  <Badge variant="outline" className={getScoreColor(analyticsData.tierBreakdown.robust.avgScore)}>
                    {analyticsData.tierBreakdown.robust.avgScore}%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Compliance Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.trendData.map((trend, index) => (
                <div key={trend.period} className="flex items-center justify-between">
                  <div className="text-sm">{trend.period}</div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span className="text-sm">{trend.compliance}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-blue-600" />
                      <span className="text-sm">{trend.pending}</span>
                    </div>
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