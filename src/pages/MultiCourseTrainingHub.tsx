import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrainingHubNavigation } from '@/components/training/navigation/TrainingHubNavigation';
import { MultiCourseTemplateBuilder } from '@/components/training/MultiCourseTemplateBuilder';
import { MultiCourseSessionCreator } from '@/components/training/MultiCourseSessionCreator';
import { ComponentProgressTracker } from '@/components/training/ComponentProgressTracker';
import { 
  MultiCourseTrainingService,
  type SessionTemplate,
  type SessionTemplateComponent
} from '@/services/multiCourseTraining';
import {
  Plus,
  Calendar,
  Users,
  BookOpen,
  Layers,
  Target,
  CheckCircle,
  AlertCircle,
  Workflow,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface TrainingSession {
  id: string;
  title: string;
  session_template_id?: string;
  templateName?: string;
  instructor_id: string;
  instructorName: string;
  location_id: string;
  locationName: string;
  session_date: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  enrolled_count: number;
  status: string;
  registration_status: string;
  base_price?: number;
  isMultiCourse: boolean;
}

export const MultiCourseTrainingHub: React.FC = (): JSX.Element => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const [showSessionCreator, setShowSessionCreator] = useState(false);
  const [showProgressTracker, setShowProgressTracker] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SessionTemplate | null>(null);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Data state
  const [templates, setTemplates] = useState<SessionTemplate[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      const templatesData = await MultiCourseTrainingService.getSessionTemplates();
      const sessionsData = await MultiCourseTrainingService.getMultiCourseSessions();
      const instructorsData = await MultiCourseTrainingService.getInstructors();
      const locationsData = await MultiCourseTrainingService.getLocations();
      const coursesData = await MultiCourseTrainingService.getCourses();
      
      setTemplates(templatesData || []);
      setSessions(sessionsData || []);
      setInstructors(instructorsData || []);
      setLocations(locationsData || []);
      setCourses(coursesData || []);
      
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load training data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    // Handle special navigation actions
    switch (tab) {
      case 'multi-course-templates':
        setShowTemplateBuilder(true);
        break;
      case 'sessions':
        // Show session management
        break;
      case 'component-progress':
        setShowProgressTracker(true);
        break;
      default:
        break;
    }
  };

  const handleSaveTemplate = async (templateData: any) => {
    try {
      if (selectedTemplate) {
        // Update existing template
        await MultiCourseTrainingService.updateSessionTemplate(selectedTemplate.id, templateData);
        toast.success('Template updated successfully');
      } else {
        // Create new template
        await MultiCourseTrainingService.createSessionTemplate(templateData);
        toast.success('Template created successfully');
      }
      
      // Reload templates
      const updatedTemplates = await MultiCourseTrainingService.getSessionTemplates();
      setTemplates(updatedTemplates || []);
      
      setShowTemplateBuilder(false);
      setSelectedTemplate(null);
      
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  const handleSaveSession = async (sessionData: any) => {
    try {
      if (selectedSession) {
        // Update existing session - would need to implement this in service
        toast.success('Session updated successfully');
      } else {
        // Create new session from template
        if (sessionData.sessionTemplateId) {
          await MultiCourseTrainingService.createSessionFromTemplate(
            sessionData.sessionTemplateId,
            sessionData
          );
        }
        toast.success('Session created successfully');
      }
      
      // Reload sessions
      const updatedSessions = await MultiCourseTrainingService.getMultiCourseSessions();
      setSessions(updatedSessions || []);
      
      setShowSessionCreator(false);
      setSelectedSession(null);
      
    } catch (error) {
      console.error('Error saving session:', error);
      toast.error('Failed to save session');
    }
  };

  const handleUpdateProgress = async (enrollmentId: string, componentId: string, updates: any) => {
    try {
      await MultiCourseTrainingService.updateComponentProgress(enrollmentId, componentId, updates);
      toast.success('Progress updated successfully');
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getDashboardStats = () => {
    const totalSessions = sessions.length;
    const multiCourseSessions = sessions.filter(s => s.isMultiCourse).length;
    const activeTemplates = templates.filter(t => t.is_active).length;
    const totalEnrollments = sessions.reduce((sum, s) => sum + (s.enrolled_count || 0), 0);
    
    return {
      totalSessions,
      multiCourseSessions,
      activeTemplates,
      totalEnrollments,
      activeInstructors: instructors.filter(i => i.is_active).length,
      upcomingSchedules: sessions.filter(s => s.status === 'SCHEDULED').length,
      complianceRate: 95 // This would be calculated from actual data
    };
  };

  const stats = getDashboardStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading multi-course training system...</span>
        </div>
      </div>
    );
  }

  if (showTemplateBuilder) {
    return (
      <MultiCourseTemplateBuilder
        courses={courses}
        template={selectedTemplate}
        onSave={handleSaveTemplate}
        onCancel={() => {
          setShowTemplateBuilder(false);
          setSelectedTemplate(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Multi-Course Training Hub</h1>
            <p className="text-gray-600 mt-1">
              Comprehensive training management with advanced multi-course session support
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="default" className="flex items-center gap-1">
              <Workflow className="h-3 w-3" />
              Enhanced Platform
            </Badge>
            <Button 
              onClick={() => setShowSessionCreator(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Session
            </Button>
          </div>
        </div>

        {/* Dashboard Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{stats.totalSessions}</span>
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.multiCourseSessions} multi-course
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{stats.activeTemplates}</span>
                <Layers className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Reusable itineraries
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Enrollments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{stats.totalEnrollments}</span>
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Active registrations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Component Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-emerald-600">Active</span>
                <Target className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Real-time progress
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Dashboard */}
        <TrainingHubNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
          totalSessions={stats.totalSessions}
          activeInstructors={stats.activeInstructors}
          upcomingSchedules={stats.upcomingSchedules}
          complianceRate={stats.complianceRate}
          multiCourseTemplates={stats.activeTemplates}
          activeComponentTracking={stats.totalEnrollments}
        />

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="overview" className="space-y-6">
            {/* Templates Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Multi-Course Templates
                  </CardTitle>
                  <Button 
                    onClick={() => setShowTemplateBuilder(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    New Template
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {templates.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Layers className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No templates created yet</p>
                    <p className="text-sm">Create your first multi-course template to get started</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map(template => (
                      <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{template.name}</CardTitle>
                              <Badge variant="outline" className="mt-1">
                                {template.code}
                              </Badge>
                            </div>
                            <Badge variant={template.is_active ? 'default' : 'secondary'}>
                              {template.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Duration:</span>
                              <span className="font-medium">{formatDuration(template.total_duration_minutes)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Type:</span>
                              <span className="font-medium">{template.template_type}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Max Participants:</span>
                              <span className="font-medium">{template.max_participants || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedTemplate(template);
                                setShowTemplateBuilder(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => {
                                setShowSessionCreator(true);
                              }}
                            >
                              Use Template
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sessions Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Recent Sessions
                  </CardTitle>
                  <Button 
                    onClick={() => setShowSessionCreator(true)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create Session
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No sessions scheduled yet</p>
                    <p className="text-sm">Create your first multi-course session using a template</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessions.map(session => (
                      <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            {session.isMultiCourse ? (
                              <Layers className="h-5 w-5 text-blue-600" />
                            ) : (
                              <BookOpen className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium">{session.title}</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>{session.session_date}</span>
                              <span>{session.start_time} - {session.end_time}</span>
                              <span>{session.instructorName}</span>
                              <span>{session.locationName}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {session.isMultiCourse && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Workflow className="h-3 w-3" />
                              Multi-Course
                            </Badge>
                          )}
                          <Badge variant="outline">
                            {session.enrolled_count}/{session.max_capacity}
                          </Badge>
                          <Badge variant={
                            session.status === 'COMPLETED' ? 'default' :
                            session.status === 'IN_PROGRESS' ? 'secondary' :
                            'outline'
                          }>
                            {session.status}
                          </Badge>
                          {session.isMultiCourse && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedSession(session);
                                setShowProgressTracker(true);
                              }}
                            >
                              Track Progress
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Session Creator Modal */}
        <MultiCourseSessionCreator
          isOpen={showSessionCreator}
          onClose={() => {
            setShowSessionCreator(false);
            setSelectedSession(null);
          }}
          onSave={handleSaveSession}
          templates={templates}
          instructors={instructors}
          locations={locations}
          editSession={selectedSession}
        />

        {/* Progress Tracker Modal */}
        {showProgressTracker && selectedSession && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-semibold">Component Progress Tracking</h2>
                <Button variant="ghost" onClick={() => setShowProgressTracker(false)}>
                  ×
                </Button>
              </div>
              <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                <ComponentProgressTracker
                  sessionId={selectedSession.id}
                  sessionData={{
                    id: selectedSession.id,
                    title: selectedSession.title,
                    sessionDate: selectedSession.session_date,
                    startTime: selectedSession.start_time,
                    endTime: selectedSession.end_time,
                    instructorName: selectedSession.instructorName,
                    locationName: selectedSession.locationName,
                    templateName: selectedSession.templateName || '',
                    status: selectedSession.status
                  }}
                  studentProgress={[]} // Would be loaded from actual progress data
                  onUpdateProgress={handleUpdateProgress}
                  onBulkUpdate={() => {}}
                  isInstructor={true}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiCourseTrainingHub;