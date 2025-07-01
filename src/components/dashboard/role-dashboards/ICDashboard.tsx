// File: src/components/dashboard/role-dashboards/ICDashboard.tsx

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useUIRequirements } from '@/hooks/useComplianceRequirements';
import { useDashboardUI } from '@/hooks/useDashboardUI';

// Import UI components
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// Import Lucide icons
import {
  CheckCircle,
  AlertTriangle,
  Info,
  Users,
  ClipboardCheck,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';

// Import chart components
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line,
} from 'recharts';

// Import hooks for real data
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Performance data hook - real data, no mocks
function usePerformanceMetrics(userId: string) {
  return useQuery({
    queryKey: ['instructor-performance', userId],
    queryFn: async () => {
      // Fetch real performance data from Supabase
      const { data: classes, error: classesError } = await supabase
        .from('teaching_records')
        .select(`
          id,
          class_date,
          student_count,
          pass_rate,
          satisfaction_score,
          engagement_score,
          attendance_rate,
          improvement_rate
        `)
        .eq('instructor_id', userId)
        .order('class_date', { ascending: false })
        .limit(10);
      
      if (classesError) throw classesError;
      
      // Calculate metrics from actual class data
      const metrics = {
        studentSatisfaction: 0,
        passRate: 0,
        attendance: 0,
        engagement: 0,
        improvement: 0
      };
      
      if (classes && classes.length > 0) {
        metrics.studentSatisfaction = classes.reduce((sum, cls) => sum + (cls.satisfaction_score || 0), 0) / classes.length;
        metrics.passRate = classes.reduce((sum, cls) => sum + (cls.pass_rate || 0), 0) / classes.length;
        metrics.attendance = classes.reduce((sum, cls) => sum + (cls.attendance_rate || 0), 0) / classes.length;
        metrics.engagement = classes.reduce((sum, cls) => sum + (cls.engagement_score || 0), 0) / classes.length;
        metrics.improvement = classes.reduce((sum, cls) => sum + (cls.improvement_rate || 0), 0) / classes.length;
      }
      
      // Fetch student outcomes
      const { data: outcomes, error: outcomesError } = await supabase
        .from('student_achievements')
        .select(`
          id,
          achievement_date,
          achievement_type,
          student_name,
          score,
          metadata
        `)
        .eq('instructor_id', userId)
        .order('achievement_date', { ascending: false })
        .limit(20);
      
      if (outcomesError) throw outcomesError;
      
      // Fetch insights from analyzed data
      const { data: insights, error: insightsError } = await supabase
        .from('instructor_insights')
        .select('*')
        .eq('instructor_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (insightsError) throw insightsError;
      
      return {
        metrics,
        outcomes: {
          achievements: outcomes || []
        },
        insights: insights?.map(insight => ({
          type: insight.insight_type,
          message: insight.message,
          action: insight.action_label ? {
            label: insight.action_label,
            handler: () => console.log('Action for insight:', insight.id)
          } : undefined
        })) || []
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Instructor schedule hook - real data
function useInstructorSchedule(userId: string) {
  return useQuery({
    queryKey: ['instructor-schedule', userId],
    queryFn: async () => {
      // Fetch evaluations
      const { data: evaluations, error: evalError } = await supabase
        .from('instructor_evaluations')
        .select('*')
        .eq('instructor_id', userId)
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(5);
      
      if (evalError) throw evalError;
      
      // Fetch upcoming classes
      const { data: classes, error: classError } = await supabase
        .from('scheduled_classes')
        .select('*')
        .eq('instructor_id', userId)
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(5);
      
      if (classError) throw classError;
      
      // Fetch certification renewals
      const { data: renewals, error: renewalError } = await supabase
        .from('certification_renewals')
        .select('*')
        .eq('instructor_id', userId)
        .gte('due_date', new Date().toISOString())
        .order('due_date', { ascending: true })
        .limit(3);
      
      if (renewalError) throw renewalError;
      
      return {
        evaluations: evaluations || [],
        classes: classes || [],
        renewals: renewals || []
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Existing component implementations from file
function PerformanceRadarChart({
  data,
  maxValue,
  accentColor
}: {
  data: {
    studentSatisfaction: number;
    passRate: number;
    attendance: number;
    engagement: number;
    improvement: number;
  };
  maxValue: number;
  accentColor: string;
}) {
  // Chart implementation with recharts
  return (
    <div className="h-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={[
          { subject: 'Student Satisfaction', A: data.studentSatisfaction, fullMark: maxValue },
          { subject: 'Pass Rate', A: data.passRate, fullMark: maxValue },
          { subject: 'Attendance', A: data.attendance, fullMark: maxValue },
          { subject: 'Engagement', A: data.engagement, fullMark: maxValue },
          { subject: 'Improvement', A: data.improvement, fullMark: maxValue },
        ]}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" />
          <PolarRadiusAxis angle={90} domain={[0, maxValue]} />
          <Radar
            name="Performance"
            dataKey="A"
            stroke={accentColor}
            fill={accentColor}
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function StudentOutcomesChart({
  outcomes,
  timeRange,
  groupBy,
  showTrend
}: {
  outcomes: any;
  timeRange: string;
  groupBy: string;
  showTrend: boolean;
}) {
  const chartData = useMemo(() => {
    if (!outcomes) return [];
    
    // Process outcomes data for chart using real data
    const achievementsByMonth: Record<string, { date: string; certifications: number; skills: number; attendance: number; total: number }> = {};
    
    outcomes.achievements?.forEach((achievement: any) => {
      const date = format(new Date(achievement.achievement_date), 'MMM');
      
      if (!achievementsByMonth[date]) {
        achievementsByMonth[date] = {
          date,
          certifications: 0,
          skills: 0,
          attendance: 0,
          total: 0
        };
      }
      
      // Increment based on achievement type
      if (achievement.achievement_type === 'certification') {
        achievementsByMonth[date].certifications += 1;
      } else if (achievement.achievement_type === 'advanced_skill') {
        achievementsByMonth[date].skills += 1;
      } else if (achievement.achievement_type === 'perfect_attendance') {
        achievementsByMonth[date].attendance += 1;
      }
      
      achievementsByMonth[date].total += 1;
    });
    
    return Object.values(achievementsByMonth);
  }, [outcomes]);
  
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="certifications" stackId="a" fill="#10B981" name="Certifications" />
        <Bar dataKey="skills" stackId="a" fill="#3B82F6" name="Skills" />
        <Bar dataKey="attendance" stackId="a" fill="#8B5CF6" name="Attendance" />
        {showTrend && <Line type="monotone" dataKey="total" stroke="#EF4444" name="Total" />}
      </BarChart>
    </ResponsiveContainer>
  );
}

function InsightCard({
  type,
  message,
  action,
  onAction
}: {
  type: 'success' | 'warning' | 'info';
  message: string;
  action?: { label: string; handler: () => void };
  onAction: () => void;
}) {
  const getInsightVariant = (type: string) => {
    switch (type) {
      case 'success': return 'default';
      case 'warning': return 'destructive';
      case 'info': return 'default';
      default: return 'default';
    }
  };
  
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'info': return <Info className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };
  
  return (
    <Alert variant={getInsightVariant(type)} className="flex items-start">
      <div className="mr-2 mt-0.5">
        {getInsightIcon(type)}
      </div>
      <div className="space-y-1">
        <AlertDescription>{message}</AlertDescription>
        {action && (
          <Button
            variant="link"
            className="p-0 h-auto"
            onClick={onAction}
          >
            {action.label}
          </Button>
        )}
      </div>
    </Alert>
  );
}

function AchievementBadge({
  studentName,
  achievement,
  date,
  icon
}: {
  studentName: string;
  achievement: string;
  date: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
      <div className="p-1 bg-green-100 rounded-full text-green-600">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{studentName}</p>
        <p className="text-xs text-muted-foreground capitalize">{achievement}</p>
      </div>
      <span className="text-xs text-muted-foreground">
        {format(new Date(date), 'MMM d')}
      </span>
    </div>
  );
}

function UpcomingSchedule({
  evaluations,
  classes,
  renewals,
  onItemClick
}: {
  evaluations: any[];
  classes: any[];
  renewals: any[];
  onItemClick: (item: any) => void;
}) {
  const allItems = [
    ...evaluations.map(e => ({ ...e, type: 'evaluation' })),
    ...classes.map(c => ({ ...c, type: 'class' })),
    ...renewals.map(r => ({ ...r, type: 'renewal' }))
  ].sort((a, b) => new Date(a.date || a.start_date || a.due_date).getTime() - new Date(b.date || b.start_date || b.due_date).getTime());
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Upcoming Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {allItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
              onClick={() => onItemClick(item)}
            >
              <div className="flex items-center gap-3">
                <div className={`
                  p-2 rounded-full
                  ${item.type === 'evaluation' ? "bg-blue-100 text-blue-600" : ""}
                  ${item.type === 'class' ? "bg-green-100 text-green-600" : ""}
                  ${item.type === 'renewal' ? "bg-orange-100 text-orange-600" : ""}
                `}>
                  {item.type === 'evaluation' && <ClipboardCheck className="h-4 w-4" />}
                  {item.type === 'class' && <Users className="h-4 w-4" />}
                  {item.type === 'renewal' && <RefreshCw className="h-4 w-4" />}
                </div>
                <div>
                  <p className="font-medium">
                    {item.name || (item.type === 'evaluation' ? 'Evaluation' : 'Certification Renewal')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(item.date || item.start_date || item.due_date), 'PPP')}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          ))}
          
          {allItems.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              No upcoming scheduled items
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// New components required for Day 3 implementation

function ComplianceOverviewCard({
  requirements,
  tier,
  completionPercentage
}: {
  requirements: any[];
  tier: string;
  completionPercentage: number;
}) {
  const stats = useMemo(() => {
    if (!requirements) return { completed: 0, inProgress: 0, pending: 0, total: 0 };
    
    return {
      completed: requirements.filter(r => r.status === 'approved').length,
      inProgress: requirements.filter(r => ['in_progress', 'submitted'].includes(r.status)).length,
      pending: requirements.filter(r => r.status === 'pending').length,
      total: requirements.length
    };
  }, [requirements]);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>Instructor Compliance Overview</span>
          <Badge variant={tier === 'robust' ? 'default' : 'outline'}>
            {tier === 'robust' ? 'Robust' : 'Basic'} Tier
          </Badge>
        </CardTitle>
        <CardDescription>Track your compliance requirements completion</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <p className="text-sm font-medium">Overall Completion</p>
              <div className="text-2xl font-bold">{completionPercentage}%</div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-lg font-medium text-green-600">{stats.completed}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-lg font-medium text-amber-600">{stats.inProgress}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-lg font-medium text-gray-600">{stats.pending}</p>
              </div>
            </div>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}

function TabbedRequirementsView({
  requirements,
  role,
  tier
}: {
  requirements: any[];
  role: string;
  tier: string;
}) {
  const [activeTab, setActiveTab] = useState('all');
  
  const groupedRequirements = useMemo(() => {
    if (!requirements) return { all: [] };
    
    return {
      all: requirements,
      pending: requirements.filter(r => r.status === 'pending'),
      inProgress: requirements.filter(r => ['in_progress', 'submitted'].includes(r.status)),
      completed: requirements.filter(r => r.status === 'approved')
    };
  }, [requirements]);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Compliance Requirements</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="all">All ({groupedRequirements.all.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({groupedRequirements.pending.length})</TabsTrigger>
            <TabsTrigger value="inProgress">In Progress ({groupedRequirements.inProgress.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({groupedRequirements.completed.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-0">
            <RequirementsList requirements={groupedRequirements.all} />
          </TabsContent>
          <TabsContent value="pending" className="mt-0">
            <RequirementsList requirements={groupedRequirements.pending} />
          </TabsContent>
          <TabsContent value="inProgress" className="mt-0">
            <RequirementsList requirements={groupedRequirements.inProgress} />
          </TabsContent>
          <TabsContent value="completed" className="mt-0">
            <RequirementsList requirements={groupedRequirements.completed} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function RequirementsList({ requirements }: { requirements: any[] }) {
  if (!requirements || requirements.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">No requirements found</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {requirements.map(req => (
        <div
          key={req.id}
          className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{req.name}</h3>
              <p className="text-sm text-muted-foreground">{req.description}</p>
            </div>
            <Badge variant={
              req.status === 'approved' ? 'success' :
              req.status === 'submitted' ? 'info' :
              req.status === 'in_progress' ? 'warning' :
              'outline'
            }>
              {req.status === 'approved' ? 'Approved' :
               req.status === 'submitted' ? 'Submitted' :
               req.status === 'in_progress' ? 'In Progress' :
               'Pending'}
            </Badge>
          </div>
          <div className="mt-2">
            <Progress value={req.progress} className="h-1" />
          </div>
          {req.due_date && (
            <p className="mt-2 text-xs text-muted-foreground">
              Due: {format(new Date(req.due_date), 'MMM d, yyyy')}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// Main ICDashboard component implementation
export function ICDashboard({ tierInfo, uiConfig, dashboardView, onViewChange }: any) {
  const { user } = useAuth();
  const { data: requirements } = useUIRequirements(user?.id, 'IC', tierInfo.tier);
  const { data: performanceData } = usePerformanceMetrics(user?.id);
  const { data: scheduleData } = useInstructorSchedule(user?.id);
  
  // Use the DashboardUIContext for tier-specific styling
  const { getThemeColor } = useDashboardUI();
  const accentColor = getThemeColor('accent');
  
  return (
    <div className="space-y-6">
      {/* Tier-specific compliance overview */}
      <ComplianceOverviewCard 
        requirements={requirements}
        tier={tierInfo.tier}
        completionPercentage={tierInfo.completion_percentage}
      />
      
      {/* Performance metrics section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <PerformanceRadarChart 
              data={performanceData?.metrics || {
                studentSatisfaction: 0,
                passRate: 0,
                attendance: 0,
                engagement: 0,
                improvement: 0
              }}
              maxValue={100}
              accentColor={accentColor}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Student Outcomes</CardTitle>
            <div className="flex items-center gap-2">
              <Select defaultValue="month">
                <SelectTrigger className="h-8 w-[100px]">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="quarter">Quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <StudentOutcomesChart 
              outcomes={performanceData?.outcomes}
              timeRange="month"
              groupBy="week"
              showTrend={true}
            />
          </CardContent>
        </Card>
      </div>
      
      {/* Requirement sections */}
      <TabbedRequirementsView 
        requirements={requirements}
        role="IC"
        tier={tierInfo.tier}
      />
      
      {/* Upcoming schedule and insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <UpcomingSchedule
            evaluations={scheduleData?.evaluations || []}
            classes={scheduleData?.classes || []}
            renewals={scheduleData?.renewals || []}
            onItemClick={(item) => console.log('Schedule item clicked:', item)}
          />
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Instructor Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {performanceData?.insights?.map((insight: any, i: number) => (
                <InsightCard
                  key={i}
                  type={insight.type}
                  message={insight.message}
                  action={insight.action}
                  onAction={() => console.log('Insight action:', insight)}
                />
              ))}
              {(!performanceData?.insights || performanceData.insights.length === 0) && (
                <p className="text-center text-muted-foreground py-4">
                  No insights available
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ICDashboard;