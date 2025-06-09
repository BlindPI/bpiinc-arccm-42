
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Users, 
  Award, 
  Star,
  Clock,
  TrendingUp,
  Calendar,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { ComprehensiveDashboardService } from '@/services/dashboard/comprehensiveDashboardService';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardActionButton } from '../ui/DashboardActionButton';

export const InstructorDashboard: React.FC = () => {
  const { user } = useAuth();
  
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['instructor-dashboard', user?.id],
    queryFn: () => user?.id ? ComprehensiveDashboardService.getInstructorDashboard(user.id) : Promise.reject('No user ID'),
    enabled: !!user?.id,
    refetchInterval: 300000 // Refresh every 5 minutes
  });

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">Failed to load instructor dashboard data</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Instructor Overview */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Teaching Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{metrics.coursesAssigned}</div>
              <div className="text-sm text-muted-foreground">Courses Assigned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{metrics.studentsEnrolled}</div>
              <div className="text-sm text-muted-foreground">Students Enrolled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{metrics.completionRate}%</div>
              <div className="text-sm text-muted-foreground">Completion Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{metrics.averageRating}</div>
              <div className="text-sm text-muted-foreground">Avg Rating</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Performance Indicators */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.upcomingClasses}</div>
            <p className="text-xs text-muted-foreground">Scheduled this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates Issued</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.certificatesIssued}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours Delivered</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.hoursDelivered}</div>
            <p className="text-xs text-muted-foreground">Total teaching hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold capitalize">{metrics.complianceStatus.replace('_', ' ')}</div>
            <Badge variant={
              metrics.complianceStatus === 'compliant' ? 'default' :
              metrics.complianceStatus === 'at_risk' ? 'secondary' : 'destructive'
            }>
              {metrics.complianceStatus.replace('_', ' ')}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Teaching Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Teaching Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <DashboardActionButton
              icon={BookOpen}
              label="My Courses"
              description="Manage assigned courses"
              path="/courses"
              colorScheme="blue"
            />
            <DashboardActionButton
              icon={Users}
              label="Students"
              description="View enrolled students"
              path="/students"
              colorScheme="green"
            />
            <DashboardActionButton
              icon={Calendar}
              label="Schedule"
              description="Manage class schedule"
              path="/schedule"
              colorScheme="purple"
            />
            <DashboardActionButton
              icon={Award}
              label="Certificates"
              description="Issue certificates"
              path="/certificates"
              colorScheme="amber"
            />
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Teaching Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Course Completion Rate</span>
                  <span>{metrics.completionRate}%</span>
                </div>
                <Progress value={metrics.completionRate} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Student Rating</span>
                  <span>{metrics.averageRating}/5.0</span>
                </div>
                <Progress value={(metrics.averageRating / 5) * 100} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Teaching Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">{metrics.studentsEnrolled}</div>
                <div className="text-sm text-blue-700">Total Students</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">{metrics.certificatesIssued}</div>
                <div className="text-sm text-green-700">Certificates Issued</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-600">{metrics.hoursDelivered}</div>
                <div className="text-sm text-purple-700">Hours Delivered</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-lg font-bold text-orange-600">{metrics.averageRating}</div>
                <div className="text-sm text-orange-700">Avg Rating</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InstructorDashboard;
