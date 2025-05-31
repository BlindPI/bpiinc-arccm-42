
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TrainingHubHeader } from '@/components/training/dashboard/TrainingHubHeader';
import { TrainingHubNavigation } from '@/components/training/navigation/TrainingHubNavigation';
import { TeachingSessionManager } from '@/components/teaching/TeachingSessionManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookOpen, Users, Calendar, BarChart3 } from 'lucide-react';

export default function TrainingHub() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const [activeTab, setActiveTab] = useState('sessions');

  // Fetch training metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['training-metrics'],
    queryFn: async () => {
      const { data: sessions, error: sessionsError } = await supabase
        .from('teaching_sessions')
        .select('*')
        .gte('session_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

      if (sessionsError) throw sessionsError;

      const { data: instructors, error: instructorsError } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['instructor_candidate', 'instructor_provisional', 'instructor_trainer']);

      if (instructorsError) throw instructorsError;

      const { data: schedules, error: schedulesError } = await supabase
        .from('course_schedules')
        .select('*')
        .gte('start_date', new Date().toISOString());

      if (schedulesError) throw schedulesError;

      const complianceRate = sessions?.length > 0 
        ? Math.round((sessions.filter(s => s.compliance_status === 'compliant').length / sessions.length) * 100)
        : 0;

      return {
        totalSessions: sessions?.length || 0,
        activeInstructors: instructors?.length || 0,
        upcomingSchedules: schedules?.length || 0,
        complianceRate
      };
    },
    enabled: !!user && !!profile
  });

  if (!user || profileLoading || metricsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'sessions':
        return <TeachingSessionManager />;
      case 'instructors':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Instructor Workload Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                <h3 className="text-lg font-medium mb-2">Instructor Management</h3>
                <p className="text-muted-foreground">Comprehensive instructor workload and performance analytics</p>
              </div>
            </CardContent>
          </Card>
        );
      case 'scheduling':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Course Scheduling & Offerings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-medium mb-2">Course Scheduling</h3>
                <p className="text-muted-foreground">Unified course scheduling and offerings management</p>
              </div>
            </CardContent>
          </Card>
        );
      case 'analytics':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Training Analytics Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-amber-500" />
                <h3 className="text-lg font-medium mb-2">Training Analytics</h3>
                <p className="text-muted-foreground">Comprehensive training performance and compliance analytics</p>
              </div>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <TrainingHubHeader
          totalSessions={metrics?.totalSessions || 0}
          activeInstructors={metrics?.activeInstructors || 0}
          upcomingSchedules={metrics?.upcomingSchedules || 0}
          complianceRate={metrics?.complianceRate || 0}
        />

        {/* Navigation Cards */}
        <TrainingHubNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          totalSessions={metrics?.totalSessions || 0}
          activeInstructors={metrics?.activeInstructors || 0}
          upcomingSchedules={metrics?.upcomingSchedules || 0}
          complianceRate={metrics?.complianceRate || 0}
        />

        {/* Content Area */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 md:p-8">
            <div className="animate-fade-in">
              {renderActiveContent()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
