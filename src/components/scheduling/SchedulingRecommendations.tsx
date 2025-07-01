
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, TrendingUp, Clock, Users, Calendar, Lightbulb } from 'lucide-react';
import { format, parseISO, addDays, startOfWeek, endOfWeek, isSameWeek } from 'date-fns';
import type { CourseSchedule } from '@/types/courseScheduling';

interface SchedulingRecommendationsProps {
  schedules: CourseSchedule[];
  selectedDate: Date;
}

interface Recommendation {
  id: string;
  type: 'optimization' | 'capacity' | 'timing' | 'resource';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  action?: string;
}

export const SchedulingRecommendations: React.FC<SchedulingRecommendationsProps> = ({
  schedules,
  selectedDate
}) => {
  const recommendations = useMemo(() => {
    const recs: Recommendation[] = [];
    const weekStart = startOfWeek(selectedDate);
    const weekEnd = endOfWeek(selectedDate);
    
    // Get schedules for the selected week
    const weekSchedules = schedules.filter(schedule => 
      isSameWeek(parseISO(schedule.start_date), selectedDate)
    );

    // Capacity optimization recommendations
    const underutilizedSchedules = schedules.filter(schedule => 
      schedule.current_enrollment / schedule.max_capacity < 0.5
    );
    
    if (underutilizedSchedules.length > 0) {
      recs.push({
        id: 'capacity-optimization',
        type: 'capacity',
        priority: 'medium',
        title: 'Optimize Course Capacity',
        description: `${underutilizedSchedules.length} courses are running at less than 50% capacity`,
        impact: 'Could reduce costs and improve resource utilization',
        action: 'Consider consolidating or rescheduling low-enrollment courses'
      });
    }

    // Peak time distribution
    const hourDistribution = schedules.reduce((acc, schedule) => {
      const hour = parseISO(schedule.start_date).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const peakHours = Object.entries(hourDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([hour]) => parseInt(hour));

    if (peakHours.length > 0 && hourDistribution[peakHours[0]] > 3) {
      recs.push({
        id: 'time-distribution',
        type: 'timing',
        priority: 'medium',
        title: 'Distribute Peak Hours',
        description: `Heavy scheduling concentration at ${peakHours.map(h => `${h}:00`).join(' and ')}`,
        impact: 'Better distribution could improve resource availability',
        action: 'Consider moving some courses to off-peak hours'
      });
    }

    // Weekly load balancing
    const weeklyLoad = weekSchedules.length;
    const averageWeeklyLoad = schedules.length / 4; // Assuming monthly view
    
    if (weeklyLoad > averageWeeklyLoad * 1.5) {
      recs.push({
        id: 'weekly-balance',
        type: 'optimization',
        priority: 'high',
        title: 'Heavy Weekly Load Detected',
        description: `This week has ${weeklyLoad} courses vs average of ${Math.round(averageWeeklyLoad)}`,
        impact: 'May strain instructors and resources',
        action: 'Consider redistributing some courses to lighter weeks'
      });
    }

    // Instructor workload
    const instructorWorkload = schedules.reduce((acc, schedule) => {
      if (schedule.instructor_id) {
        acc[schedule.instructor_id] = (acc[schedule.instructor_id] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const overloadedInstructors = Object.values(instructorWorkload).filter(load => load > 5);
    if (overloadedInstructors.length > 0) {
      recs.push({
        id: 'instructor-workload',
        type: 'resource',
        priority: 'high',
        title: 'Instructor Overload Warning',
        description: `${overloadedInstructors.length} instructors have more than 5 scheduled courses`,
        impact: 'May affect teaching quality and instructor wellbeing',
        action: 'Consider redistributing courses or hiring additional instructors'
      });
    }

    // Scheduling gaps
    const sortedSchedules = [...weekSchedules].sort((a, b) => 
      parseISO(a.start_date).getTime() - parseISO(b.start_date).getTime()
    );

    let hasLargeGaps = false;
    for (let i = 0; i < sortedSchedules.length - 1; i++) {
      const currentEnd = parseISO(sortedSchedules[i].end_date);
      const nextStart = parseISO(sortedSchedules[i + 1].start_date);
      const gapHours = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60 * 60);
      
      if (gapHours > 4 && gapHours < 24) {
        hasLargeGaps = true;
        break;
      }
    }

    if (hasLargeGaps) {
      recs.push({
        id: 'scheduling-gaps',
        type: 'optimization',
        priority: 'low',
        title: 'Optimize Scheduling Gaps',
        description: 'Large gaps detected between consecutive courses',
        impact: 'Could improve facility utilization',
        action: 'Consider filling gaps with additional courses or activities'
      });
    }

    // Smart scheduling suggestion for selected date
    if (weekSchedules.length === 0) {
      recs.push({
        id: 'date-suggestion',
        type: 'timing',
        priority: 'low',
        title: 'Ideal Scheduling Opportunity',
        description: `${format(selectedDate, 'EEEE, MMMM d')} has no scheduled courses`,
        impact: 'Good opportunity for new course scheduling',
        action: 'Consider scheduling high-demand courses on this date'
      });
    }

    return recs.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [schedules, selectedDate]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'optimization': return <TrendingUp className="h-4 w-4" />;
      case 'capacity': return <Users className="h-4 w-4" />;
      case 'timing': return <Clock className="h-4 w-4" />;
      case 'resource': return <Calendar className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          Smart Scheduling Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recommendations.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recommendations at this time.</p>
            <p className="text-sm">Your scheduling appears optimal!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <div key={rec.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(rec.type)}
                    <h3 className="font-medium">{rec.title}</h3>
                  </div>
                  <Badge className={getPriorityColor(rec.priority)}>
                    {rec.priority} priority
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                
                <div className="bg-blue-50 p-3 rounded-md mb-3">
                  <p className="text-sm font-medium text-blue-900">Expected Impact:</p>
                  <p className="text-sm text-blue-700">{rec.impact}</p>
                </div>
                
                {rec.action && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-700">
                      <strong>Recommended Action:</strong> {rec.action}
                    </p>
                    <Button size="sm" variant="outline">
                      Apply
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
