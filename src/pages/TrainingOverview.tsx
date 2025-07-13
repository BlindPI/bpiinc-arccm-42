import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProfessionalMetricsGrid } from '@/components/training/dashboard/ProfessionalMetricsGrid';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  MapPin, 
  Award, 
  TrendingUp,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { realTeamDataService } from '@/services/team/realTeamDataService';

export default function TrainingOverview() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();

  // Fetch training metrics
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['training-overview-metrics'],
    queryFn: async () => {
      // Get sessions
      const { data: sessions } = await supabase
        .from('teaching_sessions')
        .select('*')
        .gte('session_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

      // Get instructors
      const { data: instructors } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['IC', 'IP', 'IT', 'AP']);

      // Get schedules
      const { data: schedules } = await supabase
        .from('course_schedules')
        .select('*')
        .gte('start_date', new Date().toISOString())
        .eq('status', 'scheduled');

      // Get locations
      const { data: locations } = await supabase
        .from('locations')
        .select('*')
        .eq('status', 'ACTIVE');

      // Get system analytics
      const systemAnalytics = await realTeamDataService.getSystemAnalytics();

      const complianceRate = sessions && sessions.length > 0 
        ? Math.round((sessions.filter(s => s.compliance_status === 'compliant').length / sessions.length) * 100)
        : 0;

      return {
        totalSessions: sessions?.length || 0,
        activeInstructors: instructors?.length || 0,
        upcomingSchedules: schedules?.length || 0,
        activeLocations: locations?.length || 0,
        complianceRate: systemAnalytics.averageCompliance,
        totalMembers: systemAnalytics.totalMembers,
        averagePerformance: systemAnalytics.averagePerformance
      };
    },
    enabled: !!user && !!profile,
    refetchInterval: 30000
  });

  if (!user || !profile || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Training Overview
        </h1>
        <p className="text-muted-foreground">
          Comprehensive view of training activities and performance
        </p>
      </div>

      {/* Professional Metrics Grid */}
      <ProfessionalMetricsGrid metrics={metrics} />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-500" />
                <div>
                  <h3 className="font-semibold">Team Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage teams and members
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => navigate('/teams')}
                size="sm"
                className="gap-2"
              >
                Open
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-green-500" />
                <div>
                  <h3 className="font-semibold">Scheduling</h3>
                  <p className="text-sm text-muted-foreground">
                    Schedule sessions and resources
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => navigate('/scheduling')}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                Open
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-purple-500" />
                <div>
                  <h3 className="font-semibold">Analytics</h3>
                  <p className="text-sm text-muted-foreground">
                    View detailed reports
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => navigate('/analytics')}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                View
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-2xl font-bold">{metrics?.totalSessions || 0}</p>
              <p className="text-sm text-muted-foreground">Active sessions this month</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Compliance Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-2xl font-bold">{Math.round(metrics?.complianceRate || 0)}%</p>
              <p className="text-sm text-muted-foreground">Overall compliance rate</p>
              <Badge 
                variant={metrics?.complianceRate && metrics.complianceRate > 80 ? "default" : "secondary"}
                className="mt-2"
              >
                {metrics?.complianceRate && metrics.complianceRate > 80 ? "Excellent" : "Needs Attention"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}