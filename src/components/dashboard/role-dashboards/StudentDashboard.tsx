
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Award, 
  Clock,
  TrendingUp,
  Target,
  CheckCircle,
  AlertTriangle,
  Star
} from 'lucide-react';
import { ComprehensiveDashboardService } from '@/services/dashboard/comprehensiveDashboardService';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardActionButton } from '../ui/DashboardActionButton';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['student-dashboard', user?.id],
    queryFn: () => user?.id ? ComprehensiveDashboardService.getStudentDashboard(user.id) : Promise.reject('No user ID'),
    enabled: !!user?.id,
    refetchInterval: 300000 // Refresh every 5 minutes
  });

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(6)].map((_, i) => (
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
            <span className="text-red-800">Failed to load student dashboard data</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  const completionRate = metrics.coursesEnrolled > 0 ? 
    (metrics.coursesCompleted / metrics.coursesEnrolled) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Learning Progress Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            My Learning Journey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{metrics.coursesEnrolled}</div>
              <div className="text-sm text-muted-foreground">Courses Enrolled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{metrics.coursesCompleted}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{metrics.certificatesEarned}</div>
              <div className="text-sm text-muted-foreground">Certificates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{completionRate.toFixed(0)}%</div>
              <div className="text-sm text-muted-foreground">Completion Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.hoursCompleted}</div>
            <p className="text-xs text-muted-foreground">Hours completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current GPA</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.currentGPA.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Grade Point Average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates Earned</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.certificatesEarned}</div>
            <p className="text-xs text-muted-foreground">Total achievements</p>
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

      {/* Learning Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Learning Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <DashboardActionButton
              icon={BookOpen}
              label="Browse Courses"
              description="Explore available courses"
              path="/courses"
              colorScheme="blue"
            />
            <DashboardActionButton
              icon={TrendingUp}
              label="My Progress"
              description="Track learning progress"
              path="/progress"
              colorScheme="green"
            />
            <DashboardActionButton
              icon={Award}
              label="My Certificates"
              description="View earned certificates"
              path="/my-certificates"
              colorScheme="purple"
            />
            <DashboardActionButton
              icon={Target}
              label="Learning Goals"
              description="Set and track goals"
              path="/goals"
              colorScheme="amber"
            />
          </div>
        </CardContent>
      </Card>

      {/* Progress Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Course Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Completion</span>
                <span>{completionRate.toFixed(0)}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">{metrics.coursesEnrolled}</div>
                <div className="text-sm text-blue-700">Enrolled Courses</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">{metrics.coursesCompleted}</div>
                <div className="text-sm text-green-700">Completed Courses</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-600">{metrics.certificatesEarned}</div>
                <div className="text-sm text-purple-700">Certificates Earned</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDashboard;
