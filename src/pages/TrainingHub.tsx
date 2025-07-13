
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TrainingHubHeader } from '@/components/training/dashboard/TrainingHubHeader';
import { TrainingHubNavigation } from '@/components/training/navigation/TrainingHubNavigation';
import { TeamManagementPanel } from '@/components/training/team/TeamManagementPanel';
import { TeachingSessionManager } from '@/components/teaching/TeachingSessionManager';
import { EnrollmentManagementDashboard } from '@/components/enrollment/EnrollmentManagementDashboard';
import { SimplifiedCourseTable } from '@/components/courses/SimplifiedCourseTable';
import { EnhancedCourseForm } from '@/components/courses/EnhancedCourseForm';
import { LocationTable } from '@/components/LocationTable';
import { LocationForm } from '@/components/LocationForm';
import { RosterManagement } from '@/components/rosters/RosterManagement';
import { CourseScheduler } from '@/components/courses/CourseScheduler';
import { ScheduleCalendarView } from '@/components/scheduling/ScheduleCalendarView';
import { ConflictDetector } from '@/components/scheduling/ConflictDetector';
import { SchedulingRecommendations } from '@/components/scheduling/SchedulingRecommendations';
import { ResourceAvailability } from '@/components/scheduling/ResourceAvailability';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, BookOpen, Users, Calendar, BarChart3, Activity, UserCheck, MapPin, ClipboardList, Plus, Clock, Award, TrendingUp, Search, AlertTriangle, Zap, ExternalLink } from 'lucide-react';
import { useTeachingManagement } from '@/hooks/useTeachingManagement';
import { useCourseScheduling } from '@/hooks/useCourseScheduling';
import { useNavigate } from 'react-router-dom';

export default function TrainingHub() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('sessions');
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showScheduler, setShowScheduler] = useState(false);
  const { useInstructorWorkload } = useTeachingManagement();
  const { getCourseSchedules } = useCourseScheduling();

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
        .in('role', ['IC', 'IP', 'IT', 'AP']);

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

      // Get active locations count
      const { data: locations, error: locationsError } = await supabase
        .from('locations')
        .select('id')
        .eq('status', 'ACTIVE');

      if (locationsError) {
        console.error('Error fetching locations:', locationsError);
        throw locationsError;
      }

      // Get team-related data
      const { data: bulkOps, error: bulkError } = await supabase
        .from('bulk_operation_queue')
        .select('id, status')
        .in('status', ['pending', 'processing']);

      if (bulkError) {
        console.error('Error fetching bulk operations:', bulkError);
      }

      // Calculate compliance rate from sessions
      const complianceRate = sessions && sessions.length > 0 
        ? Math.round((sessions.filter(s => s.compliance_status === 'compliant').length / sessions.length) * 100)
        : 0;

      console.log('Training metrics calculated:', {
        sessions: sessions?.length || 0,
        instructors: instructors?.length || 0,
        schedules: schedules?.length || 0,
        locations: locations?.length || 0,
        compliance: complianceRate,
        totalMembers: instructors?.length || 0,
        activeBulkOps: bulkOps?.length || 0
      });

      return {
        totalSessions: sessions?.length || 0,
        activeInstructors: instructors?.length || 0,
        upcomingSchedules: schedules?.length || 0,
        activeLocations: locations?.length || 0,
        complianceRate,
        totalMembers: instructors?.length || 0,
        activeBulkOps: bulkOps?.length || 0
      };
    },
    enabled: !!user && !!profile,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Get course schedules for scheduling tab
  const { data: schedules } = getCourseSchedules();

  // Get all instructors for instructor management tab
  const { data: instructors = [], isLoading: instructorsLoading } = useQuery({
    queryKey: ['instructors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['IC', 'IP', 'IT', 'AP'])
        .eq('status', 'ACTIVE')
        .order('display_name');
      
      if (error) throw error;
      return data;
    },
    enabled: activeTab === 'instructors'
  });

  // Get instructor workload summary
  const { data: workloadData = [] } = useQuery({
    queryKey: ['instructor-workload-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instructor_workload_summary')
        .select('*')
        .order('total_hours_all_time', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: activeTab === 'instructors'
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'IC': return 'bg-blue-100 text-blue-800';
      case 'IP': return 'bg-yellow-100 text-yellow-800';
      case 'IT': return 'bg-green-100 text-green-800';
      case 'AP': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      'IC': 'Instructor Candidate',
      'IP': 'Instructor Provisional',
      'IT': 'Instructor Trainer',
      'AP': 'Authorized Provider'
    };
    return labels[role] || role;
  };

  const filteredInstructors = instructors.filter(instructor =>
    instructor.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instructor.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleNavigateToAvailability = () => {
    navigate('/availability');
  };

  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'sessions':
        return <TeachingSessionManager />;
        
      case 'instructors':
        if (instructorsLoading) {
          return (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading instructors...</span>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-blue-500" />
                    <div>
                      <div className="text-2xl font-bold">{instructors.length}</div>
                      <div className="text-sm text-gray-600">Total Instructors</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Clock className="h-8 w-8 text-green-500" />
                    <div>
                      <div className="text-2xl font-bold">
                        {workloadData.reduce((sum, w) => sum + (w.total_hours_all_time || 0), 0).toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-600">Total Hours Taught</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Award className="h-8 w-8 text-purple-500" />
                    <div>
                      <div className="text-2xl font-bold">
                        {instructors.filter(i => i.compliance_status).length}
                      </div>
                      <div className="text-sm text-gray-600">Compliant Instructors</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-8 w-8 text-orange-500" />
                    <div>
                      <div className="text-2xl font-bold">
                        {workloadData.reduce((sum, w) => sum + (w.sessions_this_month || 0), 0)}
                      </div>
                      <div className="text-sm text-gray-600">Sessions This Month</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="workload">Workload Analysis</TabsTrigger>
                <TabsTrigger value="certifications">Certifications</TabsTrigger>
                <TabsTrigger value="compliance">Compliance</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search instructors..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {isAdmin && (
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Instructor
                    </Button>
                  )}
                </div>

                <div className="grid gap-4">
                  {filteredInstructors.map((instructor) => {
                    const workload = workloadData.find(w => w.instructor_id === instructor.id);
                    
                    return (
                      <Card key={instructor.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold">{instructor.display_name}</h3>
                                <Badge className={getRoleColor(instructor.role)}>
                                  {getRoleLabel(instructor.role)}
                                </Badge>
                                {instructor.compliance_status && (
                                  <Badge className="bg-green-100 text-green-800">Compliant</Badge>
                                )}
                              </div>
                              
                              <div className="text-sm text-gray-600 mb-4">{instructor.email}</div>

                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <div className="font-medium">Total Sessions</div>
                                  <div className="text-gray-600">{workload?.total_sessions_all_time || 0}</div>
                                </div>
                                <div>
                                  <div className="font-medium">Total Hours</div>
                                  <div className="text-gray-600">{workload?.total_hours_all_time || 0}</div>
                                </div>
                                <div>
                                  <div className="font-medium">This Month</div>
                                  <div className="text-gray-600">{workload?.sessions_this_month || 0} sessions</div>
                                </div>
                                <div>
                                  <div className="font-medium">Compliance</div>
                                  <div className="text-gray-600">{workload?.compliance_percentage || 0}%</div>
                                </div>
                              </div>
                            </div>

                            {isAdmin && (
                              <div className="flex gap-2 ml-4">
                                <Button variant="outline" size="sm">View Details</Button>
                                <Button variant="outline" size="sm">Edit</Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="workload" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Instructor Workload Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {workloadData.map((workload) => (
                        <div key={workload.instructor_id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <div className="font-medium">{workload.display_name}</div>
                            <div className="text-sm text-gray-600">{getRoleLabel(workload.role)}</div>
                          </div>
                          <div className="grid grid-cols-3 gap-8 text-sm">
                            <div className="text-center">
                              <div className="font-medium">{workload.total_sessions_all_time}</div>
                              <div className="text-gray-600">Total Sessions</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium">{workload.hours_this_month}</div>
                              <div className="text-gray-600">Hours This Month</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium">{workload.compliance_percentage}%</div>
                              <div className="text-gray-600">Compliance</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="certifications">
                <Card>
                  <CardContent className="text-center py-12">
                    <Award className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Certification Management</h3>
                    <p className="text-gray-500">Instructor certification tracking will be implemented in Phase 2</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="compliance">
                <Card>
                  <CardContent className="text-center py-12">
                    <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Compliance Monitoring</h3>
                    <p className="text-gray-500">Advanced compliance tracking will be implemented in Phase 2</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        );
        
      case 'courses':
        return (
          <div className="space-y-6">
            {isAdmin && (
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Course Management</h3>
                <Button
                  onClick={() => setShowCourseForm(!showCourseForm)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Course
                </Button>
              </div>
            )}
            
            {showCourseForm && isAdmin && (
              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <EnhancedCourseForm onSuccess={() => setShowCourseForm(false)} />
                </CardContent>
              </Card>
            )}
            
            <Tabs defaultValue="catalog" className="w-full">
              <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                <TabsTrigger value="catalog">Course Catalog</TabsTrigger>
                <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
              </TabsList>
              
              <TabsContent value="catalog" className="space-y-4">
                <SimplifiedCourseTable />
              </TabsContent>
              
              <TabsContent value="enrollments" className="space-y-4">
                <EnrollmentManagementDashboard />
              </TabsContent>
            </Tabs>
          </div>
        );
        
      case 'locations':
        return (
          <div className="space-y-6">
            {isAdmin && (
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Location Management</h3>
                <Button
                  onClick={() => setShowLocationForm(!showLocationForm)}
                  className="gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  Add Location
                </Button>
              </div>
            )}
            
            {showLocationForm && isAdmin && (
              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <LocationForm onComplete={() => setShowLocationForm(false)} />
                </CardContent>
              </Card>
            )}
            
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full max-w-[400px] grid-cols-3">
                <TabsTrigger value="all">All Locations</TabsTrigger>
                <TabsTrigger value="active">Active Locations</TabsTrigger>
                <TabsTrigger value="search">Search</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                <LocationTable />
              </TabsContent>
              
              <TabsContent value="active">
                <LocationTable filters={{ status: 'ACTIVE' }} />
              </TabsContent>
              
              <TabsContent value="search">
                <LocationTable showSearch />
              </TabsContent>
            </Tabs>
          </div>
        );
        
      case 'rosters':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Roster Management</h3>
            <RosterManagement />
          </div>
        );
        
      case 'scheduling':
        const canSchedule = profile?.role && ['SA', 'AD', 'AP'].includes(profile.role);
        
        if (!canSchedule) {
          return (
            <Card>
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
                <p className="text-muted-foreground">
                  Only System Administrators, Administrators, and Authorized Providers can access course scheduling.
                </p>
              </CardContent>
            </Card>
          );
        }
        
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Course Scheduling</h3>
              <Button
                onClick={() => setShowScheduler(true)}
                className="gap-2"
              >
                <Clock className="h-4 w-4" />
                New Schedule
              </Button>
            </div>

            {showScheduler && (
              <Card>
                <CardHeader>
                  <CardTitle>Create New Course Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  <CourseScheduler
                    onScheduleCreated={() => setShowScheduler(false)}
                  />
                  <div className="mt-4 flex justify-end">
                    <Button variant="outline" onClick={() => setShowScheduler(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="calendar" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="calendar" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Calendar View</span>
                  <span className="sm:hidden">Calendar</span>
                </TabsTrigger>
                <TabsTrigger value="conflicts" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="hidden sm:inline">Conflicts</span>
                  <span className="sm:hidden">Issues</span>
                </TabsTrigger>
                <TabsTrigger value="recommendations" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span className="hidden sm:inline">Recommendations</span>
                  <span className="sm:hidden">Suggest</span>
                </TabsTrigger>
                <TabsTrigger value="resources" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Resources</span>
                  <span className="sm:hidden">People</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="calendar" className="space-y-4">
                <ScheduleCalendarView
                  schedules={schedules || []}
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  onScheduleClick={(schedule) => console.log('Schedule clicked:', schedule)}
                />
              </TabsContent>

              <TabsContent value="conflicts" className="space-y-4">
                <ConflictDetector schedules={schedules || []} />
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-4">
                <SchedulingRecommendations
                  schedules={schedules || []}
                  selectedDate={selectedDate}
                />
              </TabsContent>

              <TabsContent value="resources" className="space-y-4">
                <ResourceAvailability
                  schedules={schedules || []}
                  selectedDate={selectedDate}
                />
              </TabsContent>
            </Tabs>
          </div>
        );

      case 'team-management':
        return (
          <TeamManagementPanel onNavigateToAvailability={handleNavigateToAvailability} />
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
          activeLocations={metrics?.activeLocations || 0}
          complianceRate={metrics?.complianceRate || 0}
          totalTeamMembers={metrics?.totalMembers || 0}
          bulkOperations={metrics?.activeBulkOps || 0}
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
