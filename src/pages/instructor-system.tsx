import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock, Users, Plus, Edit3, Trash2, UserPlus, X, Check, ChevronLeft, ChevronRight, Search, Filter, Shield, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { DatabaseUserRole } from '@/types/database-roles';
import { hasEnterpriseAccess } from '@/types/database-roles';
import { SearchableStudentSelect } from '@/components/enrollment/SearchableStudentSelect';

interface InstructorSystemProps {
  teamId?: string;
  locationId?: string;
  restrictToTeam?: boolean;
}

const InstructorManagementSystem: React.FC<InstructorSystemProps> = ({
  teamId,
  locationId,
  restrictToTeam = false
}) => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  
  // State management
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('calendar');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [trainingSessions, setTrainingSessions] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [courseTemplates, setCourseTemplates] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  
  // Modal states
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [enrollmentForm, setEnrollmentForm] = useState({
    student_id: '',
    course_id: ''
  });
  
  // Form states
  const [sessionForm, setSessionForm] = useState({
    title: '',
    instructor_id: '',
    course_template: '',
    session_date: '',
    start_time: '09:00',
    end_time: '17:00',
    max_capacity: 18,
    location_id: locationId || '',
    description: ''
  });

  // Selected template data for display
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const [studentForm, setStudentForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    company: '',
    city: '',
    province: '',
    postal_code: '',
    first_aid_level: 'Standard',
    cpr_level: 'C',
    course_length: 8
  });

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    instructor: '',
    dateRange: 'week'
  });

  // Permission checks - FIXED: Remove invalid 'MG' role and add null checks
  const canManageInstructors = profile?.role === 'SA' || profile?.role === 'AD' || (profile?.role && hasEnterpriseAccess(profile.role as DatabaseUserRole));
  const canManageSessions = profile?.role === 'SA' || profile?.role === 'AD' || profile?.role === 'IN' || (profile?.role && hasEnterpriseAccess(profile.role as DatabaseUserRole));
  const canViewAll = profile?.role === 'SA' || profile?.role === 'AD' || (profile?.role && hasEnterpriseAccess(profile.role as DatabaseUserRole));

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, [teamId, locationId]);

  // Reload sessions when current date changes
  useEffect(() => {
    if (trainingSessions.length > 0 || currentDate) {
      loadTrainingSessions();
    }
  }, [currentDate]);

  useEffect(() => {
    if (selectedDay) {
      // Sessions are already loaded in loadTrainingSessions
      // This effect is just for tracking selected day changes
    }
  }, [selectedDay]);

  // Database operations
  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadInstructors(),
        loadStudents(),
        loadCourseTemplates(),
        loadCourses(),
        loadTrainingSessions(),
        loadLocations()
      ]);
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadInstructors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, email, role')
        .in('role', ['IT', 'IP', 'IC']);
      
      if (error) throw error;
      setInstructors(data || []);
    } catch (error: any) {
      console.error('Error loading instructors:', error);
      toast.error('Failed to load instructors');
    }
  };

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('student_enrollment_profiles')
        .select('id, display_name, email, phone, company, first_aid_level, cpr_level, course_length, enrollment_status, completion_status')
        .eq('is_active', true);
      
      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      console.error('Error loading students:', error);
      toast.error('Failed to load students');
    }
  };

  const loadCourseTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('course_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setCourseTemplates(data || []);
    } catch (error: any) {
      console.error('Error loading course templates:', error);
      toast.error('Failed to load course templates');
    }
  };

  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, name, description, expiration_months, length, status')
        .eq('status', 'ACTIVE')
        .order('name');
      
      if (error) throw error;
      setCourses(data || []);
    } catch (error: any) {
      console.error('Error loading courses:', error);
      toast.error('Failed to load courses');
    }
  };

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, address, city, state, status')
        .eq('status', 'ACTIVE')
        .order('name');
      
      if (error) throw error;
      setLocations(data || []);
    } catch (error: any) {
      console.error('Error loading locations:', error);
      toast.error('Failed to load locations');
    }
  };

  const loadTrainingSessions = async () => {
    try {
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const { data, error } = await supabase
        .from('availability_bookings')
        .select(`
          *,
          instructor_profiles:profiles!user_id(id, display_name, email),
          location_details:locations!location_id(id, name, address, city, state)
        `)
        .gte('booking_date', startDate.toISOString().split('T')[0])
        .lte('booking_date', endDate.toISOString().split('T')[0])
        .order('booking_date')
        .order('start_time');
      
      if (error) throw error;
      
      // Load roster data separately for sessions that have them
      const sessionsWithEnrollments = await Promise.all((data || []).map(async (session) => {
        try {
          const { data: rosterData } = await supabase
            .from('student_rosters')
            .select(`
              id,
              student_roster_members(
                id,
                enrollment_status,
                attendance_status,
                student_enrollment_profiles:student_enrollment_profiles!student_profile_id(id, display_name, email)
              )
            `)
            .eq('availability_booking_id', session.id);
          
          return {
            ...session,
            session_enrollments: rosterData?.[0]?.student_roster_members || []
          };
        } catch (rosterError) {
          console.warn('Failed to load roster for session:', session.id, rosterError);
          return {
            ...session,
            session_enrollments: []
          };
        }
      }));
      
      setTrainingSessions(sessionsWithEnrollments);
    } catch (error: any) {
      console.error('Error loading training sessions:', error);
      toast.error('Failed to load training sessions');
    }
  };

  const createTrainingSession = async (sessionData: any) => {
    try {
      const { data, error } = await supabase
        .from('availability_bookings')
        .insert([{
          title: sessionData.title,
          booking_date: sessionData.session_date,
          start_time: sessionData.start_time,
          end_time: sessionData.end_time,
          user_id: sessionData.instructor_id,
          course_sequence: sessionData.course_template ? { template_id: sessionData.course_template } : null,
          booking_type: 'training_session',
          status: 'scheduled',
          created_by: user?.id,
          location_id: sessionData.location_id,
          description: sessionData.description
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      await loadTrainingSessions();
      toast.success('Training session created successfully');
      return data;
    } catch (error: any) {
      console.error('Error creating training session:', error);
      toast.error('Failed to create training session');
      throw error;
    }
  };

  const updateTrainingSession = async (sessionId: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('availability_bookings')
        .update({
          title: updates.title,
          booking_date: updates.session_date,
          start_time: updates.start_time,
          end_time: updates.end_time,
          user_id: updates.instructor_id,
          course_sequence: updates.course_template ? { template_id: updates.course_template } : null,
          location_id: updates.location_id,
          description: updates.description
        })
        .eq('id', sessionId)
        .select()
        .single();
      
      if (error) throw error;
      
      await loadTrainingSessions();
      toast.success('Training session updated successfully');
      return data;
    } catch (error: any) {
      console.error('Error updating training session:', error);
      toast.error('Failed to update training session');
      throw error;
    }
  };

  const deleteTrainingSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('availability_bookings')
        .delete()
        .eq('id', sessionId);
      
      if (error) throw error;
      
      await loadTrainingSessions();
      toast.success('Training session deleted successfully');
    } catch (error: any) {
      console.error('Error deleting training session:', error);
      toast.error('Failed to delete training session');
    }
  };

  const enrollStudentInSession = async (sessionId: string, studentId: string, courseId?: string) => {
    try {
      // First create or get a roster for this session
      let rosterId;
      const { data: existingRoster } = await supabase
        .from('student_rosters')
        .select('id')
        .eq('availability_booking_id', sessionId)
        .single();
      
      if (existingRoster) {
        rosterId = existingRoster.id;
      } else {
        // Create a new roster for this session
        const { data: newRoster, error: rosterError } = await supabase
          .from('student_rosters')
          .insert([{
            roster_name: 'Training Session Roster',
            course_name: 'Training Session',
            availability_booking_id: sessionId,
            instructor_id: user?.id,
            location_id: locationId,
            roster_status: 'active',
            roster_type: 'course',
            course_id: courseId || null,
            created_by: user?.id
          }])
          .select()
          .single();
        
        if (rosterError) throw rosterError;
        rosterId = newRoster.id;
      }

      // Check if student is already enrolled
      const { data: existing } = await supabase
        .from('student_roster_members')
        .select('id')
        .eq('roster_id', rosterId)
        .eq('student_profile_id', studentId)
        .single();
      
      if (existing) {
        toast.error('Student is already enrolled in this session');
        return;
      }

      // Enroll the student
      const { data, error } = await supabase
        .from('student_roster_members')
        .insert([{
          roster_id: rosterId,
          student_profile_id: studentId,
          course_id: courseId || null,
          enrollment_status: 'enrolled'
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      await loadTrainingSessions();
      toast.success('Student enrolled successfully');
      return data;
    } catch (error: any) {
      console.error('Error enrolling student:', error);
      toast.error('Failed to enroll student');
    }
  };

  const updateStudentAttendance = async (enrollmentId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('student_roster_members')
        .update({ attendance_status: status })
        .eq('id', enrollmentId);
      
      if (error) throw error;
      
      await loadTrainingSessions();
      toast.success('Attendance updated successfully');
    } catch (error: any) {
      console.error('Error updating attendance:', error);
      toast.error('Failed to update attendance');
    }
  };

  const removeStudentFromSession = async (enrollmentId: string) => {
    try {
      const { error } = await supabase
        .from('student_roster_members')
        .delete()
        .eq('id', enrollmentId);
      
      if (error) throw error;
      
      await loadTrainingSessions();
      toast.success('Student removed from session successfully');
    } catch (error: any) {
      console.error('Error removing student from session:', error);
      toast.error('Failed to remove student from session');
    }
  };

  const createStudent = async (studentData: any) => {
    try {
      const { data, error } = await supabase
        .from('student_enrollment_profiles')
        .insert([{
          ...studentData,
          display_name: `${studentData.first_name} ${studentData.last_name}`,
          enrollment_status: 'ACTIVE',
          completion_status: 'NOT_STARTED',
          assessment_status: 'PENDING',
          location_id: locationId,
          imported_from: 'MANUAL'
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      await loadStudents();
      toast.success('Student created successfully');
      return data;
    } catch (error: any) {
      console.error('Error creating student:', error);
      toast.error('Failed to create student');
      throw error;
    }
  };

  // Helper functions
  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
    setSelectedDay(null);
  };

  const handleDayClick = (day: number | null) => {
    if (!day) return;
    const dateStr = formatDate(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDay(dateStr);
  };

  const handleSessionSubmit = async () => {
    if (!sessionForm.title || !sessionForm.instructor_id || !sessionForm.session_date || !sessionForm.location_id) {
      toast.error('Please fill in all required fields including location');
      return;
    }

    try {
      setLoading(true);
      if (editingSession) {
        await updateTrainingSession(editingSession.id, sessionForm);
      } else {
        await createTrainingSession(sessionForm);
      }
      setShowSessionModal(false);
      setEditingSession(null);
      resetSessionForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSubmit = async () => {
    if (!studentForm.email || !studentForm.first_name || !studentForm.last_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await createStudent(studentForm);
      setShowStudentModal(false);
      resetStudentForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetSessionForm = () => {
    setSessionForm({
      title: '',
      instructor_id: '',
      course_template: '',
      session_date: '',
      start_time: '09:00',
      end_time: '17:00',
      max_capacity: 12,
      location_id: locationId || '',
      description: ''
    });
    setSelectedTemplate(null);
  };

  // Handle template selection and auto-populate fields
  const handleTemplateSelection = (templateId: string) => {
    const template = courseTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      // Auto-populate fields from template
      setSessionForm(prev => ({
        ...prev,
        course_template: templateId,
        title: template.name,
        max_capacity: template.max_students || 12,
        description: template.description || '',
        // Calculate end time based on duration
        end_time: calculateEndTime(prev.start_time, template.duration_hours)
      }));
    } else {
      setSelectedTemplate(null);
    }
  };

  // Calculate end time based on start time and duration
  const calculateEndTime = (startTime: string, durationHours: number) => {
    if (!startTime || !durationHours) return '17:00';
    
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + (durationHours * 60);
    
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    
    return `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
  };

  const resetEnrollmentForm = () => {
    setEnrollmentForm({
      student_id: '',
      course_id: ''
    });
  };

  const resetStudentForm = () => {
    setStudentForm({
      email: '',
      first_name: '',
      last_name: '',
      phone: '',
      company: '',
      city: '',
      province: '',
      postal_code: '',
      first_aid_level: 'Standard',
      cpr_level: 'C',
      course_length: 8
    });
  };

  const getSessionsForDate = (date: string) => {
    return trainingSessions.filter(session => session.booking_date === date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredStudents = students.filter(student => 
    !filters.search || 
    student.display_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
    student.email?.toLowerCase().includes(filters.search.toLowerCase())
  );

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = getDaysInMonth(currentDate);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Permission check
  if (!canManageSessions) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Access Restricted</h3>
            <p className="text-gray-600">You don't have permission to access the instructor management system.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading && trainingSessions.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-6 w-6" />
                Training Management System
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage training sessions, instructors, and student enrollments
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {profile?.role}
              </Badge>
              {teamId && (
                <Badge variant="secondary">Team Restricted</Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setError(null)}
              className="ml-2"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Sessions
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Students
          </TabsTrigger>
          {canManageInstructors && (
            <TabsTrigger value="instructors" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Instructors
            </TabsTrigger>
          )}
        </TabsList>

        {/* Sessions Tab */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth(-1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <h3 className="text-lg font-semibold min-w-48 text-center">
                    {months[month]} {year}
                  </h3>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth(1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                
                <Dialog open={showSessionModal} onOpenChange={setShowSessionModal}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Session
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingSession ? 'Edit Session' : 'Create New Session'}
                      </DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Session Title *</Label>
                        <Input
                          id="title"
                          value={sessionForm.title}
                          onChange={(e) => setSessionForm({...sessionForm, title: e.target.value})}
                          placeholder="e.g., CPR Certification Course"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="instructor">Instructor *</Label>
                        <Select 
                          value={sessionForm.instructor_id} 
                          onValueChange={(value) => setSessionForm({...sessionForm, instructor_id: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select instructor..." />
                          </SelectTrigger>
                          <SelectContent>
                            {instructors.map(instructor => (
                              <SelectItem key={instructor.id} value={instructor.id}>
                                {instructor.display_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="template">Course Template *</Label>
                        <Select
                          value={sessionForm.course_template}
                          onValueChange={handleTemplateSelection}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select course template..." />
                          </SelectTrigger>
                          <SelectContent>
                            {courseTemplates.map(template => (
                              <SelectItem key={template.id} value={template.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{template.name}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {template.duration_hours}h • Max {template.max_students} students
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {/* Template Details Display */}
                        {selectedTemplate && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <h4 className="font-medium text-blue-900 mb-2">Template Details</h4>
                            <div className="space-y-1 text-sm text-blue-800">
                              <div><strong>Code:</strong> {selectedTemplate.code}</div>
                              <div><strong>Duration:</strong> {selectedTemplate.duration_hours} hours</div>
                              <div><strong>Max Students:</strong> {selectedTemplate.max_students}</div>
                              {selectedTemplate.description && (
                                <div><strong>Description:</strong> {selectedTemplate.description}</div>
                              )}
                              {selectedTemplate.course_components && selectedTemplate.course_components.length > 0 && (
                                <div>
                                  <strong>Components ({selectedTemplate.course_components.length}):</strong>
                                  <ul className="list-disc list-inside ml-2 mt-1">
                                    {selectedTemplate.course_components.slice(0, 3).map((comp: any, idx: number) => (
                                      <li key={idx} className="text-xs">
                                        {comp.name} ({comp.duration_minutes}min)
                                      </li>
                                    ))}
                                    {selectedTemplate.course_components.length > 3 && (
                                      <li className="text-xs italic">+{selectedTemplate.course_components.length - 3} more components</li>
                                    )}
                                  </ul>
                                </div>
                              )}
                              {selectedTemplate.required_specialties && selectedTemplate.required_specialties.length > 0 && (
                                <div>
                                  <strong>Required Specialties:</strong> {selectedTemplate.required_specialties.join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="location">Location *</Label>
                        <Select
                          value={sessionForm.location_id}
                          onValueChange={(value) => setSessionForm({...sessionForm, location_id: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select location..." />
                          </SelectTrigger>
                          <SelectContent>
                            {locations.map(location => (
                              <SelectItem key={location.id} value={location.id}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{location.name}</span>
                                  <span className="text-sm text-muted-foreground ml-2">
                                    {location.city}, {location.state}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="date">Date *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={sessionForm.session_date}
                          onChange={(e) => setSessionForm({...sessionForm, session_date: e.target.value})}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="start-time">Start Time *</Label>
                          <Input
                            id="start-time"
                            type="time"
                            value={sessionForm.start_time}
                            onChange={(e) => setSessionForm({...sessionForm, start_time: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="end-time">End Time *</Label>
                          <Input
                            id="end-time"
                            type="time"
                            value={sessionForm.end_time}
                            onChange={(e) => setSessionForm({...sessionForm, end_time: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="capacity">Max Capacity</Label>
                        <Input
                          id="capacity"
                          type="number"
                          value={sessionForm.max_capacity}
                          onChange={(e) => setSessionForm({...sessionForm, max_capacity: parseInt(e.target.value)})}
                          min="1"
                          max="50"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={sessionForm.description}
                          onChange={(e) => setSessionForm({...sessionForm, description: e.target.value})}
                          placeholder="Optional session description..."
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowSessionModal(false);
                          setEditingSession(null);
                          resetSessionForm();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSessionSubmit}
                        disabled={loading}
                      >
                        {loading ? 'Saving...' : editingSession ? 'Update' : 'Create'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {daysOfWeek.map(day => (
                  <div key={day} className="p-2 text-center font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 mb-6">
                {days.map((day, index) => {
                  if (!day) {
                    return <div key={`empty-${year}-${month}-${index}`} className="p-2 h-20"></div>;
                  }

                  const dateStr = formatDate(year, month, day);
                  const daySessions = getSessionsForDate(dateStr);
                  const isSelected = selectedDay === dateStr;

                  return (
                    <div
                      key={day}
                      onClick={() => handleDayClick(day)}
                      className={`p-2 h-20 border rounded-md cursor-pointer transition-colors hover:bg-muted ${
                        isSelected ? 'ring-2 ring-primary' : ''
                      } ${daySessions.length > 0 ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-medium">{day}</span>
                        {daySessions.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {daySessions.length}
                          </Badge>
                        )}
                      </div>
                      
                      {daySessions.length > 0 && (
                        <div className="mt-1 text-xs">
                          {daySessions.slice(0, 2).map((session, idx) => (
                            <div key={`${dateStr}-session-${idx}-${session.id || session.title}`} className="truncate text-blue-700">
                              {session.title}
                            </div>
                          ))}
                          {daySessions.length > 2 && (
                            <div className="text-muted-foreground">+{daySessions.length - 2} more</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Selected Day Sessions */}
              {selectedDay && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Sessions for {new Date(selectedDay).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {getSessionsForDate(selectedDay).map((session) => (
                        <Card key={session.id} className="border-l-4 border-l-blue-500">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold">{session.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {session.instructor_profiles?.display_name || 'No instructor assigned'} |
                                  {session.start_time} - {session.end_time}
                                </p>
                                {session.location_details && (
                                  <p className="text-xs text-muted-foreground">
                                    📍 {session.location_details.name}, {session.location_details.city}
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(session.status)}>
                                  {session.status}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingSession(session);
                                    const templateId = session.course_sequence?.template_id || session.course_id || '';
                                    setSessionForm({
                                      title: session.title,
                                      instructor_id: session.user_id,
                                      course_template: templateId,
                                      session_date: session.booking_date,
                                      start_time: session.start_time,
                                      end_time: session.end_time,
                                      max_capacity: 12, // Default capacity since this field doesn't exist in availability_bookings
                                      location_id: session.location_id || '',
                                      description: session.description || ''
                                    });
                                    // Set selected template for editing
                                    if (templateId) {
                                      const template = courseTemplates.find(t => t.id === templateId);
                                      setSelectedTemplate(template || null);
                                    } else {
                                      setSelectedTemplate(null);
                                    }
                                    setShowSessionModal(true);
                                  }}
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteTrainingSession(session.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">
                                Students ({session.session_enrollments?.length || 0}/{session.max_capacity})
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedSession(session);
                                  setShowEnrollmentModal(true);
                                }}
                              >
                                <UserPlus className="h-4 w-4 mr-1" />
                                Enroll Student
                              </Button>
                            </div>
                            
                            {session.session_enrollments?.length > 0 && (
                              <div className="space-y-2">
                                {session.session_enrollments.map((enrollment: any) => (
                                  <div key={enrollment.id} className="flex items-center justify-between p-3 bg-muted rounded border">
                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary">
                                        <Users className="h-4 w-4" />
                                      </div>
                                      <div>
                                        <div className="font-medium text-sm">
                                          {enrollment.student_enrollment_profiles?.display_name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {enrollment.student_enrollment_profiles?.email}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Select
                                        value={enrollment.attendance_status || "REGISTERED"}
                                        onValueChange={(value) => updateStudentAttendance(enrollment.id, value)}
                                      >
                                        <SelectTrigger className="w-32">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="REGISTERED">Registered</SelectItem>
                                          <SelectItem value="PRESENT">Present</SelectItem>
                                          <SelectItem value="ABSENT">Absent</SelectItem>
                                          <SelectItem value="LATE">Late</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeStudentFromSession(enrollment.id)}
                                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                      
                      {getSessionsForDate(selectedDay).length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No sessions scheduled for this day</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Student Management</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search students..."
                      className="pl-10"
                      value={filters.search}
                      onChange={(e) => setFilters({...filters, search: e.target.value})}
                    />
                  </div>
                  <Dialog open={showStudentModal} onOpenChange={setShowStudentModal}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Student
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Student</DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="first-name">First Name</Label>
                            <Input
                              id="first-name"
                              value={studentForm.first_name}
                              onChange={(e) => setStudentForm({...studentForm, first_name: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="last-name">Last Name</Label>
                            <Input
                              id="last-name"
                              value={studentForm.last_name}
                              onChange={(e) => setStudentForm({...studentForm, last_name: e.target.value})}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={studentForm.email}
                            onChange={(e) => setStudentForm({...studentForm, email: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={studentForm.phone}
                            onChange={(e) => setStudentForm({...studentForm, phone: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="company">Company</Label>
                          <Input
                            id="company"
                            value={studentForm.company}
                            onChange={(e) => setStudentForm({...studentForm, company: e.target.value})}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="first-aid">First Aid Level</Label>
                            <Select 
                              value={studentForm.first_aid_level}
                              onValueChange={(value) => setStudentForm({...studentForm, first_aid_level: value})}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Emergency">Emergency</SelectItem>
                                <SelectItem value="Standard">Standard</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="cpr">CPR Level</Label>
                            <Select 
                              value={studentForm.cpr_level}
                              onValueChange={(value) => setStudentForm({...studentForm, cpr_level: value})}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="A">A</SelectItem>
                                <SelectItem value="C">C</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowStudentModal(false);
                            resetStudentForm();
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleStudentSubmit}
                          disabled={loading}
                        >
                          {loading ? 'Adding...' : 'Add Student'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredStudents.map((student) => (
                  <Card key={student.id}>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h3 className="font-semibold">{student.display_name}</h3>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                          <p className="text-sm text-muted-foreground">{student.phone}</p>
                          {student.company && (
                            <p className="text-sm text-muted-foreground">{student.company}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Badge variant="outline">
                              {student.first_aid_level} First Aid
                            </Badge>
                            <Badge variant="outline">
                              CPR Level {student.cpr_level}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Course Length: {student.course_length} hours
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Badge className={student.enrollment_status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {student.enrollment_status}
                            </Badge>
                            <Badge variant="outline">
                              {student.completion_status?.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Instructors Tab */}
        {canManageInstructors && (
          <TabsContent value="instructors" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Instructor Management</CardTitle>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Instructor
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {instructors.map((instructor) => (
                    <Card key={instructor.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{instructor.display_name}</h3>
                            <p className="text-sm text-muted-foreground">{instructor.email}</p>
                            <p className="text-sm text-muted-foreground">{instructor.phone}</p>
                          </div>
                          <div className="text-right">
                            <div className="flex flex-wrap gap-1 mb-2">
                              {instructor.specialties?.map((specialty: string, idx: number) => (
                                <Badge key={`${instructor.id}-specialty-${idx}-${specialty}`} variant="secondary">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Max Students: {instructor.max_students_per_session}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Enrollment Modal */}
      <Dialog open={showEnrollmentModal} onOpenChange={setShowEnrollmentModal}>
        <DialogContent className="max-w-6xl w-[95vw] max-h-[95vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Enroll Student in Session</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Select Student *</Label>
              <SearchableStudentSelect
                value={enrollmentForm.student_id}
                onValueChange={(value) => setEnrollmentForm({...enrollmentForm, student_id: value})}
                students={students}
                placeholder="Search for a student to enroll..."
              />
            </div>
            
            <div>
              <Label>Select Course (Optional)</Label>
              <Select
                value={enrollmentForm.course_id}
                onValueChange={(value) => setEnrollmentForm({...enrollmentForm, course_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a course..." />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{course.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {course.description} • Expires: {course.expiration_months} months
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowEnrollmentModal(false);
                setEnrollmentForm({ student_id: '', course_id: '' });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedSession && enrollmentForm.student_id) {
                  enrollStudentInSession(
                    selectedSession.id,
                    enrollmentForm.student_id,
                    enrollmentForm.course_id || undefined
                  );
                  setShowEnrollmentModal(false);
                  setEnrollmentForm({ student_id: '', course_id: '' });
                }
              }}
              disabled={!enrollmentForm.student_id}
            >
              Enroll Student
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InstructorManagementSystem;