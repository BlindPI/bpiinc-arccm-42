import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Users, Clock, MapPin, BookOpen, TrendingUp, Plus } from 'lucide-react';
import { CourseTemplateManager } from '@/components/training/CourseTemplateManager';
import { MultiCourseSessionCreator } from '@/components/training/MultiCourseSessionCreator';
import { ComponentProgressTracker } from '@/components/training/ComponentProgressTracker';
import { MultiCourseTrainingService, SessionTemplate } from '@/services/multiCourseTraining';
import { supabase } from '@/integrations/supabase/client';

interface Session {
  id: string;
  session_template_id: string;
  session_date: string;
  start_time: string;
  status: string;
  training_session_templates?: {
    name: string;
    code: string;
  };
  instructor_profiles?: {
    user_id: string;
    users: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
  locations?: {
    name: string;
    address: string;
  };
}

interface DashboardStats {
  totalTemplates: number;
  activeSessions: number;
  totalEnrollments: number;
  completionRate: number;
}

const MultiCourseTrainingHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [templates, setTemplates] = useState<SessionTemplate[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalTemplates: 0,
    activeSessions: 0,
    totalEnrollments: 0,
    completionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [showSessionCreator, setShowSessionCreator] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all required data
      const [templatesData, sessionsData, coursesData, instructorsData, locationsData] = await Promise.all([
        // Load course templates from the new simple table
        (supabase as any).from('course_templates').select('*').then((result: any) => result.data || []),
        MultiCourseTrainingService.getMultiCourseSessions(),
        MultiCourseTrainingService.getCourses(),
        MultiCourseTrainingService.getInstructors(),
        MultiCourseTrainingService.getLocations()
      ]);
      
      setTemplates(templatesData || []);
      setSessions(sessionsData || []);
      setCourses(coursesData || []);
      setInstructors(instructorsData || []);
      setLocations(locationsData || []);
      
      // Calculate stats
      const totalTemplates = templatesData?.length || 0;
      const activeSessions = sessionsData?.filter(s => s.status === 'scheduled')?.length || 0;
      const totalEnrollments = 0; // Would need to count from enrollments table
      const completionRate = 85; // This would come from progress tracking in real implementation
      
      setStats({
        totalTemplates,
        activeSessions,
        totalEnrollments,
        completionRate
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionCreated = () => {
    loadDashboardData();
    setShowSessionCreator(false);
    setActiveTab('dashboard');
  };

  const handleSaveSession = async (sessionData: any) => {
    try {
      await MultiCourseTrainingService.createSessionFromTemplate(sessionData.sessionTemplateId, sessionData);
      handleSessionCreated();
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const getSessionInfo = (session: Session) => {
    return {
      templateName: session.training_session_templates?.name || 'Unknown Template',
      instructorName: session.instructor_profiles?.users
        ? `${session.instructor_profiles.users.first_name} ${session.instructor_profiles.users.last_name}`
        : 'Unassigned',
      locationName: session.locations?.name || 'TBD'
    };
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'scheduled': return 'default';
      case 'in_progress': return 'secondary';
      case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading multi-course training data...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Multi-Course Training Hub</h1>
          <p className="text-muted-foreground">
            Manage complex training sessions with multiple courses, breaks, and activities
          </p>
        </div>
        <Button onClick={loadDashboardData} variant="outline">
          Refresh Data
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="create">Create</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Templates</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTemplates}</div>
                <p className="text-xs text-muted-foreground">Active course templates</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeSessions}</div>
                <p className="text-xs text-muted-foreground">Scheduled sessions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Enrollments</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEnrollments}</div>
                <p className="text-xs text-muted-foreground">Total student enrollments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completionRate}%</div>
                <p className="text-xs text-muted-foreground">Average completion</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Templates</CardTitle>
              <CardDescription>Latest multi-course training templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates.slice(0, 5).map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {template.duration_hours ? `${template.duration_hours}h` : 'Duration TBD'}
                        </span>
                        <span>Max students: {template.max_students || 12}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setShowSessionCreator(true);
                        }}
                      >
                        Use Template
                      </Button>
                    </div>
                  </div>
                ))}
                {templates.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No templates found. Create your first template in the Templates tab.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Sessions */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Sessions</CardTitle>
              <CardDescription>Scheduled multi-course training sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions.slice(0, 5).map((session) => {
                  const sessionInfo = getSessionInfo(session);
                  return (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="font-medium">{sessionInfo.templateName}</h4>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <CalendarDays className="w-3 h-3 mr-1" />
                            {new Date(session.session_date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {session.start_time}
                          </span>
                          <span className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {sessionInfo.locationName}
                          </span>
                          <span className="flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            Instructor: {sessionInfo.instructorName}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getStatusBadgeVariant(session.status)}>
                          {session.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {sessions.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No sessions scheduled. Create your first session in the Sessions tab.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <CourseTemplateManager />
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Training Session</CardTitle>
              <CardDescription>
                Schedule a new training session from an existing template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Schedule New Session</h3>
                    <p className="text-sm text-muted-foreground">
                      Create sessions from existing templates
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowSessionCreator(true)}
                    className="flex items-center gap-2"
                    disabled={templates.length === 0}
                  >
                    <Plus className="h-4 w-4" />
                    New Session
                  </Button>
                </div>

                <MultiCourseSessionCreator
                  isOpen={showSessionCreator}
                  onClose={() => setShowSessionCreator(false)}
                  onSave={handleSaveSession}
                  templates={templates.map(t => ({
                    id: t.id,
                    name: t.name,
                    code: t.code,
                    description: t.description || '',
                    templateType: t.template_type,
                    totalDuration: t.total_duration_minutes,
                    estimatedBreakMinutes: t.estimated_break_minutes,
                    maxParticipants: t.max_participants || 12,
                    requiredInstructors: t.required_instructors,
                    requiredRooms: t.required_rooms,
                    requiredEquipment: t.required_equipment,
                    components: []
                  }))}
                  instructors={instructors.map(i => ({
                    id: i.id,
                    name: `${i.users?.first_name || ''} ${i.users?.last_name || ''}`.trim(),
                    email: i.users?.email || '',
                    specializations: i.specializations || [],
                    isAvailable: i.is_active
                  }))}
                  locations={locations.map(l => ({
                    id: l.id,
                    name: l.name,
                    address: l.address || '',
                    capacity: l.capacity || 12,
                    equipment: l.equipment || []
                  }))}
                />

                {!showSessionCreator && (
                  <div className="space-y-3">
                    {sessions.length > 0 ? (
                      <div>
                        <h4 className="font-medium mb-3">Recent Sessions</h4>
                        {sessions.slice(0, 5).map(session => {
                          const sessionInfo = getSessionInfo(session);
                          return (
                            <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg mb-3">
                              <div className="space-y-1">
                                <h5 className="font-medium text-sm">{sessionInfo.templateName}</h5>
                                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                  <span className="flex items-center">
                                    <CalendarDays className="w-3 h-3 mr-1" />
                                    {new Date(session.session_date).toLocaleDateString()}
                                  </span>
                                  <span className="flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {session.start_time}
                                  </span>
                                  <span className="flex items-center">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {sessionInfo.locationName}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={getStatusBadgeVariant(session.status)}>
                                  {session.status}
                                </Badge>
                                <Button variant="outline" size="sm">
                                  View Details
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <CalendarDays className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No sessions scheduled</p>
                        <p className="text-sm">
                          {templates.length === 0
                            ? 'Create templates first to schedule sessions'
                            : 'Create your first session from an existing template'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Progress Tracking</CardTitle>
              <CardDescription>
                Monitor student progress through multi-course training sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">Active Sessions</h3>
                        <p className="text-sm text-muted-foreground">
                          Select a session to track component-level progress
                        </p>
                      </div>
                    </div>
                    
                    {sessions.filter(s => ['scheduled', 'in_progress'].includes(s.status)).map(session => {
                      const sessionInfo = getSessionInfo(session);
                      return (
                        <div key={session.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium">{sessionInfo.templateName}</h4>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <span className="flex items-center">
                                  <CalendarDays className="w-3 h-3 mr-1" />
                                  {new Date(session.session_date).toLocaleDateString()}
                                </span>
                                <span className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {session.start_time}
                                </span>
                                <span className="flex items-center">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {sessionInfo.locationName}
                                </span>
                                <span className="flex items-center">
                                  <Users className="w-3 h-3 mr-1" />
                                  {sessionInfo.instructorName}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={getStatusBadgeVariant(session.status)}>
                                {session.status}
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Progress tracker integration */}
                          <ComponentProgressTracker
                            sessionId={session.id}
                            sessionData={{
                              id: session.id,
                              title: sessionInfo.templateName,
                              sessionDate: session.session_date,
                              startTime: session.start_time,
                              endTime: '', // Would need end time from session
                              instructorName: sessionInfo.instructorName,
                              locationName: sessionInfo.locationName,
                              templateName: sessionInfo.templateName,
                              status: session.status
                            }}
                            studentProgress={[]} // Would be loaded from enrollments
                            onUpdateProgress={(enrollmentId, componentId, updates) => {
                              // Handle progress updates
                              console.log('Progress update:', { enrollmentId, componentId, updates });
                            }}
                            onBulkUpdate={(updates) => {
                              // Handle bulk updates
                              console.log('Bulk update:', updates);
                            }}
                            isInstructor={true}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No active sessions to track</p>
                    <p className="text-sm">Schedule sessions to monitor student progress</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Template</CardTitle>
                <CardDescription>
                  Create a new training template with multiple courses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setActiveTab('templates')} 
                  className="w-full"
                  size="lg"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Schedule Session</CardTitle>
                <CardDescription>
                  Schedule a new training session from existing templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setActiveTab('sessions')} 
                  className="w-full"
                  size="lg"
                  variant="outline"
                >
                  <CalendarDays className="w-4 h-4 mr-2" />
                  Schedule Session
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Features</CardTitle>
              <CardDescription>
                Key capabilities of the multi-course training system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Multi-Course Templates</h4>
                  <p className="text-sm text-muted-foreground">
                    Create reusable templates with courses, breaks, and activities in sequence
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Progress Tracking</h4>
                  <p className="text-sm text-muted-foreground">
                    Track student progress through each component with detailed status
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Prerequisites</h4>
                  <p className="text-sm text-muted-foreground">
                    Define course dependencies and validation requirements
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Resource Management</h4>
                  <p className="text-sm text-muted-foreground">
                    Allocate instructors, rooms, and equipment per session
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Flexible Scheduling</h4>
                  <p className="text-sm text-muted-foreground">
                    Support breaks, activities, and complex time arrangements
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Security & Access</h4>
                  <p className="text-sm text-muted-foreground">
                    Role-based access control with provider isolation
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MultiCourseTrainingHub;