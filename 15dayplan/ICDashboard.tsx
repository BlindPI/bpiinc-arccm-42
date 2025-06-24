// File: src/components/dashboard/role-dashboards/ICDashboard.tsx

import React, { useState } from 'react';
// ... imports from previous sections

// Extract the actual PerformanceRadarChart from Currentplan3.md
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

// Extract actual StudentOutcomesChart from Currentplan3.md
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
    
    // Process outcomes data for chart
    return outcomes.achievements?.map((achievement: any) => ({
      date: format(new Date(achievement.date), 'MMM'),
      certifications: 1,
      skills: achievement.type === 'advanced_skill' ? 1 : 0,
      attendance: achievement.type === 'perfect_attendance' ? 1 : 0
    })) || [];
  }, [outcomes]);
  
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="certifications" stackId="a" fill="#10B981" />
        <Bar dataKey="skills" stackId="a" fill="#3B82F6" />
        <Bar dataKey="attendance" stackId="a" fill="#8B5CF6" />
        {showTrend && <Line type="monotone" dataKey="total" stroke="#EF4444" />}
      </BarChart>
    </ResponsiveContainer>
  );
}

// Extract actual InsightCard from Currentplan3.md
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

// Extract actual AchievementBadge from the plans
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

// Extract actual UpcomingSchedule from the plans
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
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
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
                <div className={cn(
                  "p-2 rounded-full",
                  item.type === 'evaluation' && "bg-blue-100 text-blue-600",
                  item.type === 'class' && "bg-green-100 text-green-600",
                  item.type === 'renewal' && "bg-orange-100 text-orange-600"
                )}>
                  {item.type === 'evaluation' && <ClipboardCheck className="h-4 w-4" />}
                  {item.type === 'class' && <Users className="h-4 w-4" />}
                  {item.type === 'renewal' && <RefreshCw className="h-4 w-4" />}
                </div>
                <div>
                  <p className="font-medium">
                    {item.name || item.type === 'evaluation' ? 'Evaluation' : 'Certification Renewal'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(item.date), 'PPP')}
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