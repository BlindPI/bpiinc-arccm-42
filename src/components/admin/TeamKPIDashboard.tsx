import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award, 
  Users, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Download,
  RefreshCw,
  Calendar,
  Filter
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { TeamAnalyticsService, type TeamAnalyticsSummary, type TeamGoal, type GlobalAnalytics } from '@/services/team/teamAnalyticsService';
import { useAdminTeamData } from '@/hooks/useAdminTeamContext';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  target?: number;
  icon: React.ReactNode;
  color: string;
  format?: 'number' | 'percentage' | 'decimal';
}

function KPICard({ title, value, change, target, icon, color, format = 'number' }: KPICardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'percentage':
        return `${Math.round(val)}%`;
      case 'decimal':
        return val.toFixed(1);
      default:
        return val.toString();
    }
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-3 w-3" />;
    if (change < 0) return <TrendingDown className="h-3 w-3" />;
    return null;
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{formatValue(value)}</p>
            
            {change !== undefined && (
              <div className={`flex items-center gap-1 mt-1 ${getChangeColor(change)}`}>
                {getChangeIcon(change)}
                <span className="text-sm font-medium">
                  {Math.abs(change).toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">vs last period</span>
              </div>
            )}
            
            {target !== undefined && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress to target</span>
                  <span>{formatValue(target)}</span>
                </div>
                <Progress 
                  value={typeof value === 'number' ? (value / target) * 100 : 0} 
                  className="h-2"
                />
              </div>
            )}
          </div>
          
          <div className={`p-3 rounded-lg ${color}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface TeamPerformanceCardProps {
  team: {
    id: string;
    name: string;
    performance_score: number;
  };
  analytics?: TeamAnalyticsSummary;
  onViewDetails: (teamId: string) => void;
}

function TeamPerformanceCard({ team, analytics, onViewDetails }: TeamPerformanceCardProps) {
  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (score >= 50) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getPerformanceIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="h-4 w-4" />;
    if (score >= 70) return <Target className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold">{team.name}</h3>
            <Badge className={`${getPerformanceColor(team.performance_score)} flex items-center gap-1 mt-1`}>
              {getPerformanceIcon(team.performance_score)}
              {team.performance_score}% Performance
            </Badge>
          </div>
        </div>
        
        {analytics && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Certificates:</span>
                <span className="ml-1 font-medium">{analytics.current_period.certificates_issued}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Courses:</span>
                <span className="ml-1 font-medium">{analytics.current_period.courses_conducted}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Satisfaction:</span>
                <span className="ml-1 font-medium">{analytics.current_period.average_satisfaction_score.toFixed(1)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Compliance:</span>
                <span className="ml-1 font-medium">{analytics.current_period.compliance_score}%</span>
              </div>
            </div>
            
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(team.id)}
                className="w-full"
              >
                View Details
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface GoalProgressCardProps {
  goal: TeamGoal;
  onUpdateProgress: (goalId: string, newValue: number) => void;
}

function GoalProgressCard({ goal, onUpdateProgress }: GoalProgressCardProps) {
  const progressPercentage = (goal.current_value / goal.target_value) * 100;
  const isOverdue = new Date(goal.target_date) < new Date() && goal.status !== 'completed';
  
  const getStatusColor = (status: string, isOverdue: boolean) => {
    if (isOverdue) return 'bg-red-100 text-red-800 border-red-200';
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-medium">{goal.title}</h4>
            {goal.description && (
              <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
            )}
          </div>
          <Badge className={getStatusColor(goal.status, isOverdue)}>
            {isOverdue ? 'Overdue' : goal.status}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progress</span>
            <span className="font-medium">
              {goal.current_value} / {goal.target_value}
            </span>
          </div>
          
          <Progress value={Math.min(progressPercentage, 100)} className="h-2" />
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{Math.round(progressPercentage)}% complete</span>
            <span>Due: {new Date(goal.target_date).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TeamKPIDashboard() {
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [refreshing, setRefreshing] = useState(false);

  const { data: teams = [] } = useAdminTeamData();
  
  const { data: globalAnalytics, isLoading: globalLoading } = useQuery({
    queryKey: ['global-analytics', timeRange],
    queryFn: () => TeamAnalyticsService.getGlobalAnalytics(),
    staleTime: 300000, // 5 minutes
  });

  const { data: teamAnalytics, isLoading: teamLoading } = useQuery({
    queryKey: ['team-analytics', selectedTeam],
    queryFn: () => selectedTeam !== 'all' 
      ? TeamAnalyticsService.getTeamAnalyticsSummary(selectedTeam)
      : null,
    enabled: selectedTeam !== 'all',
    staleTime: 300000,
  });

  const { data: teamGoals } = useQuery({
    queryKey: ['team-goals', selectedTeam],
    queryFn: () => selectedTeam !== 'all' 
      ? TeamAnalyticsService.getTeamGoals(selectedTeam)
      : [],
    enabled: selectedTeam !== 'all',
    staleTime: 300000,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleExportReport = () => {
    if (selectedTeam !== 'all') {
      TeamAnalyticsService.generateTeamReport(selectedTeam, 'monthly', 'json')
        .then(report => {
          const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `team-report-${selectedTeam}-${new Date().toISOString().split('T')[0]}.json`;
          a.click();
        });
    }
  };

  const handleViewTeamDetails = (teamId: string) => {
    setSelectedTeam(teamId);
  };

  const handleUpdateGoalProgress = (goalId: string, newValue: number) => {
    TeamAnalyticsService.updateTeamGoalProgress(goalId, newValue);
  };

  if (globalLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-purple-600" />
            Team Performance Analytics
          </h1>
          <p className="text-muted-foreground">
            Real-time KPI tracking and performance monitoring
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {selectedTeam !== 'all' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportReport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams Overview</SelectItem>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Global Overview */}
      {selectedTeam === 'all' && globalAnalytics && (
        <div className="space-y-6">
          {/* Global KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title="Total Teams"
              value={globalAnalytics.total_teams}
              icon={<Users className="h-6 w-6 text-white" />}
              color="bg-blue-500"
            />
            
            <KPICard
              title="Total Members"
              value={globalAnalytics.total_members}
              icon={<Users className="h-6 w-6 text-white" />}
              color="bg-green-500"
            />
            
            <KPICard
              title="Avg Performance"
              value={globalAnalytics.average_performance}
              format="percentage"
              icon={<BarChart3 className="h-6 w-6 text-white" />}
              color="bg-purple-500"
            />
            
            <KPICard
              title="Top Performers"
              value={globalAnalytics.top_performing_teams.length}
              icon={<Award className="h-6 w-6 text-white" />}
              color="bg-yellow-500"
            />
          </div>

          {/* Team Performance Grid */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Team Performance Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.slice(0, 9).map(team => (
                <TeamPerformanceCard
                  key={team.id}
                  team={team}
                  onViewDetails={handleViewTeamDetails}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Individual Team Analytics */}
      {selectedTeam !== 'all' && teamAnalytics && (
        <div className="space-y-6">
          {/* Team KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title="Certificates Issued"
              value={teamAnalytics.current_period.certificates_issued}
              change={teamAnalytics.trend_analysis.certificates_trend}
              target={100}
              icon={<Award className="h-6 w-6 text-white" />}
              color="bg-blue-500"
            />
            
            <KPICard
              title="Courses Conducted"
              value={teamAnalytics.current_period.courses_conducted}
              change={teamAnalytics.trend_analysis.courses_trend}
              target={15}
              icon={<BarChart3 className="h-6 w-6 text-white" />}
              color="bg-green-500"
            />
            
            <KPICard
              title="Satisfaction Score"
              value={teamAnalytics.current_period.average_satisfaction_score}
              change={teamAnalytics.trend_analysis.satisfaction_trend}
              target={4.5}
              format="decimal"
              icon={<CheckCircle className="h-6 w-6 text-white" />}
              color="bg-purple-500"
            />
            
            <KPICard
              title="Compliance Score"
              value={teamAnalytics.current_period.compliance_score}
              change={teamAnalytics.trend_analysis.compliance_trend}
              target={90}
              format="percentage"
              icon={<Target className="h-6 w-6 text-white" />}
              color="bg-orange-500"
            />
          </div>

          {/* Goals Progress */}
          {teamGoals && teamGoals.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Team Goals Progress</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teamGoals.map(goal => (
                  <GoalProgressCard
                    key={goal.id}
                    goal={goal}
                    onUpdateProgress={handleUpdateGoalProgress}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}