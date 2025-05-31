
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TrainingHubHeader } from '@/components/training/dashboard/TrainingHubHeader';
import { TrainingHubNavigation } from '@/components/training/navigation/TrainingHubNavigation';
import { TeachingSessionManager } from '@/components/teaching/TeachingSessionManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookOpen, Users, Calendar, BarChart3, Activity, UserCheck } from 'lucide-react';

export default function TrainingHub() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const [activeTab, setActiveTab] = useState('sessions');

  // Fetch real training metrics from database
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['training-metrics'],
    queryFn: async () => {
      console.log('Fetching training metrics...');

      // Get teaching sessions count
      const { data: sessions, error: sessionsError } = await supabase
        .from('teaching_sessions')
        .select('*')
        .gte('session_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError);
        throw sessionsError;
      }

      // Get active instructors count
      const { data: instructors, error: instructorsError } = await supabase
        .from('profiles')
        .select('id, role')
        .in('role', ['instructor_candidate', 'instructor_provisional', 'instructor_trainer']);

      if (instructorsError) {
        console.error('Error fetching instructors:', instructorsError);
        throw instructorsError;
      }

      // Get upcoming course schedules
      const { data: schedules, error: schedulesError } = await supabase
        .from('course_schedules')
        .select('*')
        .gte('start_date', new Date().toISOString())
        .eq('status', 'scheduled');

      if (schedulesError) {
        console.error('Error fetching schedules:', schedulesError);
        throw schedulesError;
      }

      // Calculate compliance rate from sessions
      const complianceRate = sessions && sessions.length > 0 
        ? Math.round((sessions.filter(s => s.compliance_status === 'compliant').length / sessions.length) * 100)
        : 0;

      console.log('Training metrics calculated:', {
        sessions: sessions?.length || 0,
        instructors: instructors?.length || 0,
        schedules: schedules?.length || 0,
        compliance: complianceRate
      });

      return {
        totalSessions: sessions?.length || 0,
        activeInstructors: instructors?.length || 0,
        upcomingSchedules: schedules?.length || 0,
        complianceRate
      };
    },
    enabled: !!user && !!profile,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  if (!user || profileLoading || metricsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleCreateSession = () => {
    setActiveTab('sessions');
    // Additional logic for opening create session modal would go here
  };

  const handleExportData = () => {
    console.log('Exporting training data...');
    // Export functionality would be implemented here
  };

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
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Active Instructors</span>
                      </div>
                      <p className="text-2xl font-bold mt-1">{metrics?.activeInstructors || 0}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Total Sessions</span>
                      </div>
                      <p className="text-2xl font-bold mt-1">{metrics?.totalSessions || 0}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium">Compliance Rate</span>
                      </div>
                      <p className="text-2xl font-bold mt-1">{metrics?.complianceRate || 0}%</p>
                    </CardContent>
                  </Card>
                </div>
                <p className="text-center text-muted-foreground mt-8">
                  Detailed instructor workload analytics and management tools are being implemented.
                </p>
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
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Upcoming Schedules</span>
                      </div>
                      <p className="text-2xl font-bold mt-1">{metrics?.upcomingSchedules || 0}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Active Courses</span>
                      </div>
                      <p className="text-2xl font-bold mt-1">{metrics?.totalSessions || 0}</p>
                    </CardContent>
                  </Card>
                </div>
                <p className="text-center text-muted-foreground mt-8">
                  Unified course scheduling and offerings management interface is being developed.
                </p>
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
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Sessions</p>
                        <p className="text-2xl font-bold">{metrics?.totalSessions || 0}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Instructors</p>
                        <p className="text-2xl font-bold">{metrics?.activeInstructors || 0}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Schedules</p>
                        <p className="text-2xl font-bold">{metrics?.upcomingSchedules || 0}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Compliance</p>
                        <p className="text-2xl font-bold">{metrics?.complianceRate || 0}%</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <p className="text-center text-muted-foreground mt-8">
                  Comprehensive training performance analytics and compliance reporting coming soon.
                </p>
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
        {/* Header with real data */}
        <TrainingHubHeader
          totalSessions={metrics?.totalSessions || 0}
          activeInstructors={metrics?.activeInstructors || 0}
          upcomingSchedules={metrics?.upcomingSchedules || 0}
          complianceRate={metrics?.complianceRate || 0}
          onCreateSession={handleCreateSession}
          onExportData={handleExportData}
        />

        {/* Navigation Cards with real data */}
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
