import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Users,
  FileText,
  Loader2,
  Download,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ComplianceService } from '@/services/compliance/complianceService';
import { ComplianceTierService } from '@/services/compliance/complianceTierService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ComplianceHealthCheckSystemProps {
  userId: string;
  role: string;
  tier: string;
  autoRun?: boolean;
}

interface HealthReport {
  userId: string;
  overallScore: number;
  generatedAt: string;
  categories: HealthCategory[];
  issues: HealthIssue[];
  recommendations: HealthRecommendation[];
  trends: HealthTrend[];
  summary: HealthSummary;
}

interface HealthCategory {
  name: string;
  score: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  description: string;
  metrics: CategoryMetric[];
}

interface CategoryMetric {
  name: string;
  value: number;
  target: number;
  status: 'pass' | 'warning' | 'fail';
}

interface HealthIssue {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  description: string;
  impact: string;
  resolution: string;
  estimatedTime: number;
}

interface HealthRecommendation {
  id: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  title: string;
  description: string;
  actions: string[];
  expectedImpact: string;
  timeframe: string;
}

interface HealthTrend {
  date: string;
  overallScore: number;
  categoryScores: Record<string, number>;
}

interface HealthSummary {
  totalRequirements: number;
  completedRequirements: number;
  overdue: number;
  atRisk: number;
  avgCompletionTime: number;
  qualityScore: number;
}

interface HealthCategoryCardProps {
  category: HealthCategory;
  onClick: () => void;
  isSelected: boolean;
}

function HealthCategoryCard({ category, onClick, isSelected }: HealthCategoryCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'fair': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'good': return <TrendingUp className="h-5 w-5 text-blue-600" />;
      case 'fair': return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'poor': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md",
        isSelected && "ring-2 ring-blue-500",
        getStatusColor(category.status)
      )}
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {getStatusIcon(category.status)}
            <h3 className="font-semibold text-lg">{category.name}</h3>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{category.score}</div>
            <div className="text-xs text-muted-foreground">score</div>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-3">{category.description}</p>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Health Score</span>
            <span className="font-medium">{category.score}/100</span>
          </div>
          <Progress
            value={category.score}
            className={cn(
              "h-2",
              category.score >= 90 ? "[&>div]:bg-green-600" :
              category.score >= 70 ? "[&>div]:bg-blue-600" :
              category.score >= 50 ? "[&>div]:bg-yellow-600" : "[&>div]:bg-red-600"
            )}
          />
        </div>
        
        <div className="flex items-center justify-between mt-3">
          <Badge 
            variant="outline" 
            className={cn("text-xs", getStatusColor(category.status))}
          >
            {category.status}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {category.metrics.length} metrics
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

interface IssueCardProps {
  issue: HealthIssue;
  onResolve: () => void;
}

function IssueCard({ issue, onResolve }: IssueCardProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="border-l-4 border-l-orange-500">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={cn("text-xs", getSeverityColor(issue.severity))}>
                {issue.severity}
              </Badge>
              <span className="text-sm text-muted-foreground">{issue.category}</span>
            </div>
            
            <h4 className="font-semibold mb-1">{issue.title}</h4>
            <p className="text-sm text-muted-foreground mb-2">{issue.description}</p>
            
            <div className="space-y-1">
              <div className="text-sm">
                <span className="font-medium">Impact:</span> {issue.impact}
              </div>
              <div className="text-sm">
                <span className="font-medium">Resolution:</span> {issue.resolution}
              </div>
              <div className="text-sm">
                <span className="font-medium">Est. Time:</span> {issue.estimatedTime} minutes
              </div>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={onResolve}
            className="ml-4"
          >
            Resolve
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface RecommendationCardProps {
  recommendation: HealthRecommendation;
  onImplement: () => void;
}

function RecommendationCard({ recommendation, onImplement }: RecommendationCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={cn("text-xs", getPriorityColor(recommendation.priority))}>
                {recommendation.priority} priority
              </Badge>
              <span className="text-sm text-muted-foreground">{recommendation.category}</span>
            </div>
            
            <h4 className="font-semibold mb-1">{recommendation.title}</h4>
            <p className="text-sm text-muted-foreground mb-3">{recommendation.description}</p>
            
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium">Actions:</span>
                <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                  {recommendation.actions.map((action, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="flex justify-between text-sm">
                <span><strong>Impact:</strong> {recommendation.expectedImpact}</span>
                <span><strong>Timeframe:</strong> {recommendation.timeframe}</span>
              </div>
            </div>
          </div>
          
          <Button 
            variant="default" 
            size="sm"
            onClick={onImplement}
            className="ml-4"
          >
            Implement
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ComplianceHealthCheckSystem({
  userId,
  role,
  tier,
  autoRun = false
}: ComplianceHealthCheckSystemProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [healthReport, setHealthReport] = useState<HealthReport | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('overall');

  // Run comprehensive health check
  const runHealthCheck = async () => {
    setIsRunning(true);
    try {
      // Get user compliance data using real services
      const records = await ComplianceService.getUserComplianceRecords(userId);
      const summary = await ComplianceService.getUserComplianceSummary(userId);
      const actions = await ComplianceService.getUserComplianceActions(userId);

      // Calculate health metrics from real data
      const now = new Date();
      const overdue = records.filter(record => {
        const nextCheck = new Date(record.next_check_due);
        return nextCheck < now && record.compliance_status !== 'compliant';
      }).length;

      const atRisk = records.filter(record => {
        const nextCheck = new Date(record.next_check_due);
        const daysUntilDue = Math.ceil((nextCheck.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilDue <= 7 && record.compliance_status !== 'compliant';
      }).length;

      // Calculate quality score
      const completedRecords = records.filter(r => r.compliance_status === 'compliant');
      const qualityScore = completedRecords.length > 0 ? 
        completedRecords.reduce((sum, record) => sum + (record.current_value || 0), 0) / completedRecords.length * 20 : 0;

      // Calculate average completion time (simplified)
      const avgCompletionTime = completedRecords.length > 0 ? 
        completedRecords.reduce((sum, record) => {
          const created = new Date(record.created_at);
          const updated = new Date(record.updated_at);
          return sum + (updated.getTime() - created.getTime());
        }, 0) / completedRecords.length / (1000 * 60 * 60 * 24) : 0;

      // Generate health categories
      const categories: HealthCategory[] = [
        {
          name: 'Completion Rate',
          score: Math.round(summary.overall_score),
          status: summary.overall_score >= 90 ? 'excellent' : 
                  summary.overall_score >= 70 ? 'good' :
                  summary.overall_score >= 50 ? 'fair' : 'poor',
          description: 'Overall compliance completion status',
          metrics: [
            {
              name: 'Completed Requirements',
              value: summary.compliant_count,
              target: summary.total_metrics,
              status: summary.compliant_count >= summary.total_metrics * 0.9 ? 'pass' : 
                      summary.compliant_count >= summary.total_metrics * 0.7 ? 'warning' : 'fail'
            }
          ]
        },
        {
          name: 'Quality',
          score: Math.min(Math.round(qualityScore), 100),
          status: qualityScore >= 90 ? 'excellent' : 
                  qualityScore >= 70 ? 'good' :
                  qualityScore >= 50 ? 'fair' : 'poor',
          description: 'Quality of compliance submissions',
          metrics: [
            {
              name: 'Average Quality Score',
              value: qualityScore,
              target: 90,
              status: qualityScore >= 90 ? 'pass' : qualityScore >= 70 ? 'warning' : 'fail'
            }
          ]
        },
        {
          name: 'Timeliness',
          score: Math.round(Math.max(0, 100 - (overdue * 10))),
          status: overdue === 0 ? 'excellent' : 
                  overdue <= 2 ? 'good' :
                  overdue <= 5 ? 'fair' : 'poor',
          description: 'On-time completion of requirements',
          metrics: [
            {
              name: 'Overdue Items',
              value: overdue,
              target: 0,
              status: overdue === 0 ? 'pass' : overdue <= 2 ? 'warning' : 'fail'
            }
          ]
        },
        {
          name: 'Risk Management',
          score: Math.round(Math.max(0, 100 - (atRisk * 15))),
          status: atRisk === 0 ? 'excellent' : 
                  atRisk <= 1 ? 'good' :
                  atRisk <= 3 ? 'fair' : 'poor',
          description: 'Proactive risk identification and mitigation',
          metrics: [
            {
              name: 'At-Risk Items',
              value: atRisk,
              target: 0,
              status: atRisk === 0 ? 'pass' : atRisk <= 1 ? 'warning' : 'fail'
            }
          ]
        }
      ];

      // Calculate overall score
      const overallScore = Math.round(
        categories.reduce((sum, cat) => sum + cat.score, 0) / categories.length
      );

      // Generate issues
      const issues: HealthIssue[] = [];
      
      if (overdue > 0) {
        issues.push({
          id: 'overdue-items',
          severity: overdue > 5 ? 'critical' : overdue > 2 ? 'high' : 'medium',
          category: 'Timeliness',
          title: `${overdue} Overdue Requirements`,
          description: `You have ${overdue} requirements that are past their due date`,
          impact: 'May result in compliance violations and potential penalties',
          resolution: 'Complete overdue requirements immediately and review scheduling',
          estimatedTime: overdue * 30
        });
      }

      if (atRisk > 0) {
        issues.push({
          id: 'at-risk-items',
          severity: atRisk > 3 ? 'high' : 'medium',
          category: 'Risk Management',
          title: `${atRisk} Requirements At Risk`,
          description: `You have ${atRisk} requirements due within 7 days`,
          impact: 'Risk of missing deadlines and falling behind schedule',
          resolution: 'Prioritize at-risk items and allocate additional time',
          estimatedTime: atRisk * 45
        });
      }

      if (qualityScore < 70) {
        issues.push({
          id: 'quality-concerns',
          severity: qualityScore < 50 ? 'high' : 'medium',
          category: 'Quality',
          title: 'Quality Score Below Target',
          description: 'Submission quality is below recommended standards',
          impact: 'May require additional review cycles and delays',
          resolution: 'Use templates and review guidelines before submission',
          estimatedTime: 60
        });
      }

      // Generate recommendations
      const recommendations: HealthRecommendation[] = [];

      if (summary.overall_score < 80) {
        recommendations.push({
          id: 'improve-completion',
          priority: 'high',
          category: 'Completion Rate',
          title: 'Boost Completion Rate',
          description: 'Focus on completing pending requirements to improve overall score',
          actions: [
            'Review all pending requirements',
            'Create a completion schedule',
            'Allocate dedicated time blocks',
            'Track progress weekly'
          ],
          expectedImpact: 'Increase completion rate by 20-30%',
          timeframe: '2-4 weeks'
        });
      }

      if (avgCompletionTime > 7) {
        recommendations.push({
          id: 'optimize-workflow',
          priority: 'medium',
          category: 'Efficiency',
          title: 'Optimize Workflow',
          description: 'Reduce time to complete requirements through process improvements',
          actions: [
            'Use requirement templates',
            'Batch similar tasks',
            'Implement time-blocking',
            'Eliminate distractions'
          ],
          expectedImpact: 'Reduce completion time by 40%',
          timeframe: '1-2 weeks'
        });
      }

      // Generate trends (simplified - would use historical data in production)
      const trends: HealthTrend[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        trends.push({
          date: date.toISOString().split('T')[0],
          overallScore: overallScore + (Math.random() * 20 - 10), // Simulated variance
          categoryScores: categories.reduce((acc, cat) => ({
            ...acc,
            [cat.name]: cat.score + (Math.random() * 10 - 5)
          }), {})
        });
      }

      const report: HealthReport = {
        userId,
        overallScore,
        generatedAt: new Date().toISOString(),
        categories,
        issues,
        recommendations,
        trends,
        summary: {
          totalRequirements: summary.total_metrics,
          completedRequirements: summary.compliant_count,
          overdue,
          atRisk,
          avgCompletionTime: Math.round(avgCompletionTime),
          qualityScore: Math.round(qualityScore)
        }
      };

      setHealthReport(report);

      // Log health check execution
      await supabase.from('compliance_audit_log').insert({
        user_id: userId,
        audit_type: 'health_check_completed',
        notes: `Health check completed with overall score: ${overallScore}`,
        new_value: {
          overallScore,
          categories: categories.length,
          issues: issues.length,
          recommendations: recommendations.length
        },
        performed_by: userId
      });

      toast.success('Health check completed successfully');
      
    } catch (error) {
      console.error('Health check error:', error);
      toast.error('Health check failed. Please try again.');
    } finally {
      setIsRunning(false);
    }
  };

  // Auto-run on mount if enabled
  useEffect(() => {
    if (autoRun) {
      runHealthCheck();
    }
  }, [autoRun]);

  const handleResolveIssue = async (issue: HealthIssue) => {
    try {
      // In a real implementation, this would create a compliance action
      await ComplianceService.createComplianceAction({
        user_id: userId,
        metric_id: 'health-check-issue',
        action_type: 'issue_resolution',
        title: issue.title,
        description: issue.resolution,
        priority: issue.severity === 'critical' ? 'critical' : 
                  issue.severity === 'high' ? 'high' : 'medium',
        due_date: new Date(Date.now() + issue.estimatedTime * 60 * 1000).toISOString()
      });
      
      toast.success('Resolution action created successfully');
    } catch (error) {
      console.error('Error creating resolution action:', error);
      toast.error('Failed to create resolution action');
    }
  };

  const handleImplementRecommendation = async (recommendation: HealthRecommendation) => {
    try {
      // Create action for implementing recommendation
      await ComplianceService.createComplianceAction({
        user_id: userId,
        metric_id: 'health-check-recommendation',
        action_type: 'recommendation_implementation',
        title: recommendation.title,
        description: recommendation.description + '\n\nActions:\n' + recommendation.actions.join('\n'),
        priority: recommendation.priority,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week from now
      });
      
      toast.success('Implementation action created successfully');
    } catch (error) {
      console.error('Error creating implementation action:', error);
      toast.error('Failed to create implementation action');
    }
  };

  const handleExportReport = () => {
    if (!healthReport) return;
    
    const reportData = {
      ...healthReport,
      exportedAt: new Date().toISOString(),
      exportedBy: userId
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health-report-${userId}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Health report exported successfully');
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthStatus = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Needs Attention';
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Compliance Health Check</h2>
          <p className="text-muted-foreground">
            Comprehensive analysis of your compliance status and health
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {healthReport && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportReport}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          )}
          
          <Button
            onClick={runHealthCheck}
            disabled={isRunning}
            className="gap-2"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running Check...
              </>
            ) : (
              <>
                <Activity className="h-4 w-4" />
                Run Health Check
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Health Report */}
      {healthReport && (
        <div className="space-y-6">
          {/* Overall Score */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Overall Health Score</h3>
                  <p className="text-muted-foreground">
                    Generated {formatDistanceToNow(new Date(healthReport.generatedAt), { addSuffix: true })}
                  </p>
                </div>
                
                <div className="text-center">
                  <div className={cn("text-4xl font-bold", getHealthScoreColor(healthReport.overallScore))}>
                    {healthReport.overallScore}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {getHealthStatus(healthReport.overallScore)}
                  </div>
                </div>
              </div>
              
              <Progress
                value={healthReport.overallScore}
                className={cn(
                  "mt-4 h-3",
                  healthReport.overallScore >= 90 ? "[&>div]:bg-green-600" :
                  healthReport.overallScore >= 70 ? "[&>div]:bg-blue-600" :
                  healthReport.overallScore >= 50 ? "[&>div]:bg-yellow-600" : "[&>div]:bg-red-600"
                )}
              />
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{healthReport.summary.completedRequirements}</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">{healthReport.summary.overdue}</div>
                  <div className="text-xs text-muted-foreground">Overdue</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-600">{healthReport.summary.atRisk}</div>
                  <div className="text-xs text-muted-foreground">At Risk</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">{healthReport.summary.qualityScore}%</div>
                  <div className="text-xs text-muted-foreground">Quality</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Health Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {healthReport.categories.map(category => (
                  <HealthCategoryCard
                    key={category.name}
                    category={category}
                    onClick={() => setSelectedCategory(category.name)}
                    isSelected={selectedCategory === category.name}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Issues and Recommendations */}
          {healthReport.issues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Issues Identified ({healthReport.issues.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {healthReport.issues.map((issue) => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      onResolve={() => handleResolveIssue(issue)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {healthReport.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-blue-600" />
                  Recommendations ({healthReport.recommendations.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {healthReport.recommendations.map((recommendation) => (
                    <RecommendationCard
                      key={recommendation.id}
                      recommendation={recommendation}
                      onImplement={() => handleImplementRecommendation(recommendation)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Initial State */}
      {!healthReport && !isRunning && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Activity className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ready for Health Check</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Run a comprehensive health check to analyze your compliance status,
                identify potential issues, and get personalized recommendations.
              </p>
              <Button onClick={runHealthCheck} size="lg">
                Start Health Check
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}