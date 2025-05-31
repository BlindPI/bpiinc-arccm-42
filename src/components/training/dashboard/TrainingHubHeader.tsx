
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  Plus
} from 'lucide-react';

interface TrainingHubHeaderProps {
  totalSessions: number;
  activeInstructors: number;
  upcomingSchedules: number;
  complianceRate: number;
  onCreateSession?: () => void;
  onExportData?: () => void;
}

export const TrainingHubHeader: React.FC<TrainingHubHeaderProps> = ({
  totalSessions,
  activeInstructors,
  upcomingSchedules,
  complianceRate,
  onCreateSession,
  onExportData
}) => {
  const getComplianceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const metrics = [
    {
      title: 'Active Sessions',
      value: totalSessions,
      icon: BookOpen,
      color: 'text-blue-600',
      description: 'This month',
      trend: totalSessions > 0 ? 'Active training' : 'No sessions'
    },
    {
      title: 'Instructors',
      value: activeInstructors,
      icon: Users,
      color: 'text-purple-600',
      description: 'Teaching staff',
      trend: activeInstructors > 0 ? 'Available' : 'None assigned'
    },
    {
      title: 'Scheduled',
      value: upcomingSchedules,
      icon: Calendar,
      color: 'text-amber-600',
      description: 'Upcoming courses',
      trend: upcomingSchedules > 0 ? 'Courses planned' : 'No schedules'
    },
    {
      title: 'Compliance',
      value: `${complianceRate}%`,
      icon: CheckCircle,
      color: getComplianceColor(complianceRate),
      description: 'Training compliance',
      trend: complianceRate >= 80 ? 'Excellent' : 'Needs attention'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Training Management Hub
          </h1>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <BookOpen className="h-3 w-3 mr-1" />
              Training Operations
            </Badge>
            {complianceRate >= 80 && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Compliant
              </Badge>
            )}
            {upcomingSchedules > 0 && (
              <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                <Calendar className="h-3 w-3 mr-1" />
                {upcomingSchedules} Scheduled
              </Badge>
            )}
          </div>
          <p className="text-gray-600">
            Unified training management dashboard for sessions, instructors, scheduling, and performance analytics
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          {onCreateSession && (
            <Button className="gap-2" onClick={onCreateSession}>
              <Plus className="h-4 w-4" />
              Create Session
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index} className="border-2 hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {metric.title}
                </CardTitle>
                <div className="p-2 rounded-lg bg-gray-50">
                  <metric.icon className={`h-4 w-4 ${metric.color}`} />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className={`text-3xl font-bold ${metric.color}`}>
                  {metric.value}
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {metric.description}
                  </p>
                  
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="text-xs font-medium text-green-600">
                      {metric.trend}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
