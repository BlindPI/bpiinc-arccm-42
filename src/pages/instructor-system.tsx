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
import { cn } from '@/lib/utils';

// Phase 1: Capacity Management Integration
import {
  CapacityStatusBadge,
  getCapacityStatus,
  EnrollmentCapacityGuard,
  RosterCapacityDisplay
} from '@/components/enrollment/capacity';
import type { RosterCapacityInfo, CapacityStatus } from '@/types/roster-enrollment';

// Phase 2: Enhanced Enrollment Protection - Import the robust enrollment service
import { RosterEnrollmentService } from '@/services/enrollment/rosterEnrollmentService';
import type {
  RosterEnrollmentParams,
  BatchRosterEnrollmentParams,
  CapacityValidationParams
} from '@/types/roster-enrollment';

interface InstructorSystemProps {
  teamId?: string;
  locationId?: string;
  restrictToTeam?: boolean;
}

// Phase 1: Enhanced session data structure with capacity information
interface EnhancedSessionData {
  // Original session fields
  id: string;
  title: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  user_id: string;
  location_id: string;
  description?: string;
  status: string;
  instructor_profiles?: any;
  location_details?: any;
  session_enrollments?: any[];
  session_course?: any;
  
  // Enhanced capacity fields
  roster_id?: string;
  capacity_info?: RosterCapacityInfo;
  capacity_status?: CapacityStatus;
  max_capacity?: number;
}

// Phase 1: Roster ID mapping utilities
const getRosterIdForSession = (session: any): string | null => {
  // Try to get roster ID from session enrollments
  if (session.session_enrollments && session.session_enrollments.length > 0) {
    // Check if any enrollment has a roster_id through the student_rosters table
    const firstEnrollment = session.session_enrollments[0];
    return firstEnrollment.roster_id || null;
  }
  
  // Fallback: look for rosters linked to the availability_booking_id
  return null;
};

const createRosterIdMapping = (sessions: any[]): Map<string, string> => {
  const mapping = new Map<string, string>();
  
  sessions.forEach(session => {
    const rosterId = getRosterIdForSession(session);
    if (rosterId) {
      mapping.set(session.id, rosterId);
    }
  });
  
  return mapping;
};

const getCapacityInfoFromSession = (session: any): RosterCapacityInfo | null => {
  const enrollmentCount = session.session_enrollments?.length || 0;
  // REAL max_capacity from availability_bookings database field!
  const maxCapacity = session.max_capacity || 18;
  const rosterId = getRosterIdForSession(session);
  
  // Always return capacity info if we have a max_capacity - this gives REAL functionality!
  if (maxCapacity) {
    return {
      success: true,
      roster_id: rosterId || '',
      roster_name: session.title || 'Training Session',
      max_capacity: maxCapacity,
      current_enrollment: enrollmentCount,
      available_spots: Math.max(0, maxCapacity - enrollmentCount),
      can_enroll: enrollmentCount < maxCapacity,
      requested_students: 0 // Not applicable for display purposes
    };
  }
  
  // Fallback for sessions without capacity set
  return null;
};

const getCapacityStatusFromSession = (session: any): CapacityStatus => {
  const capacityInfo = getCapacityInfoFromSession(session);
  if (!capacityInfo) return 'UNLIMITED';
  
  return getCapacityStatus({
    max_capacity: capacityInfo.max_capacity,
    current_enrollment: capacityInfo.current_enrollment,
    available_spots: capacityInfo.available_spots
  });
};

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
  
  // Track if user has manually edited the title
  const [hasCustomTitle, setHasCustomTitle] = useState(false);
  const [previousTemplateName, setPreviousTemplateName] = useState<string>('');

  // Calendar hover state management for layered overlay
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [hoveredDayIndex, setHoveredDayIndex] = useState<number | null>(null);

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
      
      // Phase 1: Enhanced session loading with capacity data
      const sessionsWithEnrollments = await Promise.all((data || []).map(async (session): Promise<EnhancedSessionData> => {
        try {
          // First try to find rosters linked to this session
          // Using a more robust query that handles different linking patterns
          let rosterData: any[] = [];
          let enrollments: any[] = [];
          let rosterId: string | null = null;
          
          try {
            // Try multiple approaches to find roster data
            const { data: directRosterData, error: directRosterError } = await supabase
              .from('student_rosters')
              .select(`
                id,
                course_id,
                courses:course_id(id, name, description),
                student_roster_members(
                  id,
                  enrollment_status,
                  attendance_status,
                  completion_status,
                  practical_score,
                  written_score,
                  course_id,
                  courses:course_id(id, name, description),
                  student_enrollment_profiles:student_enrollment_profiles!student_profile_id(id, display_name, email)
                )
              `)
              .eq('availability_booking_id', session.id)
              .limit(1);
              
            if (directRosterData && directRosterData.length > 0) {
              rosterData = directRosterData;
              enrollments = directRosterData[0]?.student_roster_members || [];
              rosterId = directRosterData[0]?.id || null;
            }
          } catch (rosterQueryError) {
            console.warn('Direct roster query failed, trying alternative approach:', rosterQueryError);
            
            // Fallback: Try to find enrollments through session enrollments table if it exists
            try {
              const { data: sessionEnrollments } = await supabase
                .from('session_enrollments')
                .select(`
                  id,
                  student_id,
                  roster_id,
                  enrollment_status,
                  student_enrollment_profiles:student_id(id, display_name, email)
                `)
                .eq('session_id', session.id);
                
              if (sessionEnrollments && sessionEnrollments.length > 0) {
                enrollments = sessionEnrollments.map(e => ({
                  id: e.id,
                  enrollment_status: e.enrollment_status || 'enrolled',
                  attendance_status: 'pending',
                  completion_status: 'not_started',
                  practical_score: null,
                  written_score: null,
                  course_id: null,
                  courses: null,
                  student_enrollment_profiles: e.student_enrollment_profiles
                }));
                rosterId = sessionEnrollments[0]?.roster_id || null;
              }
            } catch (sessionEnrollmentError) {
              console.warn('Session enrollment fallback failed:', sessionEnrollmentError);
              // Continue with empty enrollments
            }
          }
          
          // Phase 1: Calculate capacity information with safe defaults
          const enhancedSession: EnhancedSessionData = {
            ...session,
            session_enrollments: enrollments,
            session_course: rosterData?.[0]?.courses || null,
            roster_id: rosterId,
            max_capacity: typeof session.max_capacity === 'number' ? session.max_capacity : 18, // Ensure numeric
          };
          
          // Add capacity info and status with error handling
          try {
            enhancedSession.capacity_info = getCapacityInfoFromSession(enhancedSession);
            enhancedSession.capacity_status = getCapacityStatusFromSession(enhancedSession);
          } catch (capacityError) {
            console.warn('Failed to calculate capacity for session:', session.id, capacityError);
            enhancedSession.capacity_info = null;
            enhancedSession.capacity_status = 'UNLIMITED';
          }
          
          return enhancedSession;
        } catch (rosterError) {
          console.warn('Failed to load roster for session:', session.id, rosterError);
          
          // Return session with minimal capacity info and safe defaults
          const enhancedSession: EnhancedSessionData = {
            ...session,
            session_enrollments: [],
            session_course: null,
            roster_id: null,
            max_capacity: typeof session.max_capacity === 'number' ? session.max_capacity : 18,
          };
          
          // Provide safe fallback capacity info
          enhancedSession.capacity_info = null;
          enhancedSession.capacity_status = 'UNLIMITED';
          
          return enhancedSession;
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
          description: sessionData.description,
          max_capacity: typeof sessionData.max_capacity === 'number' && sessionData.max_capacity > 0
            ? sessionData.max_capacity
            : 18 // REAL max_capacity field with validation!
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
          description: updates.description,
          max_capacity: typeof updates.max_capacity === 'number' && updates.max_capacity > 0
            ? updates.max_capacity
            : 18 // REAL max_capacity field with validation!
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
      // First, get all rosters for this session
      const { data: rosters, error: rosterError } = await supabase
        .from('student_rosters')
        .select('id')
        .eq('availability_booking_id', sessionId);
      
      if (rosterError) throw rosterError;
      
      // Delete all roster members for each roster
      if (rosters && rosters.length > 0) {
        for (const roster of rosters) {
          const { error: membersError } = await supabase
            .from('student_roster_members')
            .delete()
            .eq('roster_id', roster.id);
          
          if (membersError) throw membersError;
        }
        
        // Delete all rosters for this session
        const { error: deleteRostersError } = await supabase
          .from('student_rosters')
          .delete()
          .eq('availability_booking_id', sessionId);
        
        if (deleteRostersError) throw deleteRostersError;
      }
      
      // Finally, delete the training session
      const { error } = await supabase
        .from('availability_bookings')
        .delete()
        .eq('id', sessionId);
      
      if (error) throw error;
      
      await loadTrainingSessions();
      toast.success('Training session and all enrollments deleted successfully');
    } catch (error: any) {
      console.error('Error deleting training session:', error);
      toast.error('Failed to delete training session: ' + (error.message || 'Unknown error'));
    }
  };

  // Helper function to sync roster capacity with session capacity
  const syncRosterCapacityWithSession = async (sessionId: string) => {
    try {
      // Get session capacity
      const { data: session, error: sessionError } = await supabase
        .from('availability_bookings')
        .select('max_capacity')
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) {
        console.warn('Could not fetch session capacity:', sessionError);
        return;
      }

      // Update roster capacity to match session capacity
      const { error: updateError } = await supabase
        .from('student_rosters')
        .update({ max_capacity: session.max_capacity })
        .eq('availability_booking_id', sessionId);

      if (updateError) {
        console.warn('Could not update roster capacity:', updateError);
      } else {
        console.log(`Synced roster capacity to ${session.max_capacity} for session ${sessionId}`);
      }
    } catch (error) {
      console.warn('Error syncing roster capacity:', error);
    }
  };

  // Helper function to ensure roster exists and is synced before enrollment modal
  const ensureRosterForSession = async (sessionId: string): Promise<string | null> => {
    try {
      // First try to find existing roster
      const { data: existingRoster, error: rosterError } = await supabase
        .from('student_rosters')
        .select('id')
        .eq('availability_booking_id', sessionId)
        .maybeSingle();

      if (existingRoster) {
        // Sync existing roster capacity with session capacity
        await syncRosterCapacityWithSession(sessionId);
        return existingRoster.id;
      }

      // No roster exists, create one using data from the session that's already loaded
      const session = trainingSessions.find(s => s.id === sessionId);
      
      const rosterData = {
        roster_name: session?.title || 'Training Session Roster',
        course_name: 'Training Session',
        instructor_id: user?.id || null,
        location_id: locationId || null,
        roster_status: 'active',
        roster_type: 'course',
        course_id: null,
        created_by: user?.id || null,
        max_capacity: session?.max_capacity || 18,
        availability_booking_id: sessionId
      };

      const { data: newRoster, error: createError } = await supabase
        .from('student_rosters')
        .insert([rosterData])
        .select()
        .single();

      if (createError) {
        console.error('Error creating roster:', createError);
        return null;
      }

      return newRoster.id;
    } catch (error) {
      console.error('Error ensuring roster for session:', error);
      return null;
    }
  };

  // Phase 2: Enhanced Capacity Validation Functions
  /**
   * Validate enrollment capacity for a session before proceeding with enrollment
   * @param sessionId - The training session ID
   * @param studentCount - Number of students to enroll (default: 1)
   * @returns CapacityValidationResult indicating if enrollment is allowed
   */
  const validateEnrollmentCapacity = async (sessionId: string, studentCount: number = 1) => {
    try {
      // Get or create roster for the session
      const rosterId = await ensureRosterForSession(sessionId);
      if (!rosterId) {
        return {
          allowed: false,
          allowWaitlist: false,
          error: 'Could not create or find roster for session',
          capacityInfo: null
        };
      }

      // Use the robust capacity validation service
      const capacityValidation = await RosterEnrollmentService.checkRosterCapacityStatus({
        rosterId,
        additionalStudents: studentCount,
        includeWaitlist: true
      });

      if (!capacityValidation.success) {
        return {
          allowed: false,
          allowWaitlist: false,
          error: capacityValidation.error || 'Capacity validation failed',
          capacityInfo: capacityValidation.capacity
        };
      }

      const canEnroll = capacityValidation.capacity.can_enroll;
      const allowWaitlist = !canEnroll && capacityValidation.capacity.max_capacity !== null;

      return {
        allowed: canEnroll,
        allowWaitlist,
        capacityInfo: capacityValidation.capacity,
        waitlistInfo: capacityValidation.waitlist,
        recommendations: capacityValidation.recommendations,
        warnings: capacityValidation.warnings
      };
    } catch (error: any) {
      console.error('Error validating enrollment capacity:', error);
      return {
        allowed: false,
        allowWaitlist: false,
        error: error.message || 'Failed to validate capacity',
        capacityInfo: null
      };
    }
  };

  /**
   * Enhanced enrollment function with capacity protection and waitlist support
   * Replaces the legacy enrollStudentInSession with robust capacity validation
   */
  const enrollStudentInSession = async (sessionId: string, studentId: string, courseId?: string) => {
    try {
      setLoading(true);

      // Phase 2: Enhanced capacity validation before enrollment
      console.log('🔍 Validating enrollment capacity before proceeding...');
      const capacityCheck = await validateEnrollmentCapacity(sessionId, 1);
      
      if (!capacityCheck.allowed && !capacityCheck.allowWaitlist) {
        toast.error(capacityCheck.error || 'Cannot enroll - session capacity exceeded');
        return;
      }

      // Get or create roster for the session
      const rosterId = await ensureRosterForSession(sessionId);
      if (!rosterId) {
        toast.error('Could not create roster for session');
        return;
      }

      // Determine enrollment type based on capacity
      const isWaitlistEnrollment = !capacityCheck.allowed && capacityCheck.allowWaitlist;
      
      if (isWaitlistEnrollment) {
        console.log('⚠️ Session at capacity - enrolling as waitlisted');
        toast.warning('Session at capacity - student added to waitlist');
      } else {
        console.log('✅ Capacity available - enrolling normally');
      }

      // Use the robust RosterEnrollmentService for enrollment
      const enrollmentParams: RosterEnrollmentParams = {
        rosterId,
        studentId,
        enrolledBy: user?.id || 'system',
        userRole: (profile?.role as DatabaseUserRole) || 'AP',
        enrollmentType: 'standard',
        notes: courseId ? `Course: ${courseId}` : undefined,
        forceEnrollment: false // Don't force - let capacity system handle waitlist
      };

      console.log('📝 Enrolling student with parameters:', enrollmentParams);
      const result = await RosterEnrollmentService.enrollStudentWithCapacityCheck(enrollmentParams);

      if (!result.success) {
        console.error('❌ Enrollment failed:', result.error);
        
        // Enhanced error handling based on enrollment service response
        if (result.error?.includes('CAPACITY_EXCEEDED')) {
          toast.error('Session is at full capacity');
        } else if (result.error?.includes('ALREADY_ENROLLED')) {
          toast.error('Student is already enrolled in this session');
        } else if (result.error?.includes('STUDENT_NOT_FOUND')) {
          toast.error('Student profile not found');
        } else if (result.error?.includes('ROSTER_NOT_FOUND')) {
          toast.error('Session roster not found');
        } else if (result.error?.includes('INSUFFICIENT_PERMISSIONS')) {
          toast.error('Permission denied: Contact administrator');
        } else {
          toast.error(`Enrollment failed: ${result.error || 'Unknown error'}`);
        }
        return;
      }

      // Update course assignment if provided
      if (courseId && result.results.enrollment?.id) {
        try {
          await updateStudentCourseAssignment(result.results.enrollment.id, courseId);
        } catch (courseError) {
          console.warn('Failed to update course assignment:', courseError);
          // Don't fail the entire enrollment for course assignment issues
        }
      }

      // Reload sessions to show updated enrollment
      await loadTrainingSessions();
      
      // Success feedback based on enrollment status
      const enrollmentStatus = result.results.enrollment?.enrollment_status;
      if (enrollmentStatus === 'waitlisted') {
        toast.success('Student added to waitlist successfully');
      } else {
        toast.success('Student enrolled successfully');
      }

      // Log capacity status after enrollment
      if (capacityCheck.capacityInfo) {
        console.log('📊 Post-enrollment capacity:', {
          enrolled: capacityCheck.capacityInfo.current_enrollment + 1,
          capacity: capacityCheck.capacityInfo.max_capacity,
          available: Math.max(0, (capacityCheck.capacityInfo.available_spots || 0) - 1)
        });
      }

      return result.results.enrollment;
    } catch (error: any) {
      console.error('💥 Error enrolling student:', error);
      
      // Enhanced error handling with specific messaging
      if (error.message?.includes('CAPACITY_EXCEEDED')) {
        toast.error('Session is at full capacity - please try waitlist enrollment');
      } else if (error.message?.includes('ALREADY_ENROLLED')) {
        toast.error('Student is already enrolled in this session');
      } else if (error.message?.includes('STUDENT_NOT_FOUND')) {
        toast.error('Student profile not found');
      } else if (error.message?.includes('INSUFFICIENT_PERMISSIONS')) {
        toast.error('Permission denied: Contact administrator');
      } else if (error.code === '23505') {
        toast.error('Student is already enrolled in this session');
      } else if (error.code === '23503') {
        toast.error('Reference error: Student or session not found');
      } else if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('RLS')) {
        toast.error('Permission denied: Database access restricted. Contact administrator.');
      } else {
        toast.error(`Failed to enroll student: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Phase 2: Batch enrollment protection with capacity validation
   * Handles enrolling multiple students while respecting capacity limits
   */
  const enrollMultipleStudentsInSession = async (
    sessionId: string,
    studentIds: string[],
    courseId?: string
  ) => {
    if (!studentIds || studentIds.length === 0) {
      toast.error('No students selected for enrollment');
      return { success: false, enrolled: [], waitlisted: [], failed: [] };
    }

    try {
      setLoading(true);
      console.log(`🔍 Starting batch enrollment for ${studentIds.length} students...`);

      // Phase 2: Validate batch capacity before starting enrollments
      const capacityCheck = await validateEnrollmentCapacity(sessionId, studentIds.length);
      
      if (!capacityCheck.allowed && !capacityCheck.allowWaitlist) {
        toast.error(`Cannot enroll ${studentIds.length} students - session capacity exceeded`);
        return { success: false, enrolled: [], waitlisted: [], failed: studentIds };
      }

      // Get or create roster for the session
      const rosterId = await ensureRosterForSession(sessionId);
      if (!rosterId) {
        toast.error('Could not create roster for session');
        return { success: false, enrolled: [], waitlisted: [], failed: studentIds };
      }

      // Show capacity warning if needed
      if (capacityCheck.capacityInfo) {
        const availableSpots = capacityCheck.capacityInfo.available_spots || 0;
        if (studentIds.length > availableSpots && availableSpots > 0) {
          toast.warning(
            `Only ${availableSpots} spots available. ${studentIds.length - availableSpots} students will be waitlisted.`
          );
        } else if (availableSpots === 0) {
          toast.warning('Session at capacity - all students will be waitlisted');
        }
      }

      // Use the robust batch enrollment service
      const batchParams: BatchRosterEnrollmentParams = {
        rosterId,
        studentIds,
        enrolledBy: user?.id || 'system',
        userRole: (profile?.role as DatabaseUserRole) || 'AP',
        enrollmentType: 'standard',
        notes: courseId ? `Course: ${courseId}` : undefined,
        continueOnError: true // Continue enrolling even if some fail
      };

      console.log('📝 Starting batch enrollment with parameters:', batchParams);
      const batchResult = await RosterEnrollmentService.enrollMultipleStudents(batchParams);

      // Process results and update course assignments if needed
      const enrolled = batchResult.summary?.enrolled || [];
      const waitlisted = batchResult.summary?.waitlisted || [];
      const failed = batchResult.summary?.failed || [];

      // Update course assignments for successfully enrolled students
      if (courseId && batchResult.results) {
        const successfulEnrollments = batchResult.results.filter(r => r.success && r.results.enrollment?.id);
        
        for (const result of successfulEnrollments) {
          try {
            await updateStudentCourseAssignment(result.results.enrollment.id, courseId);
          } catch (courseError) {
            console.warn('Failed to update course assignment for student:', result.student_id, courseError);
            // Don't fail the entire batch for course assignment issues
          }
        }
      }

      // Reload sessions to show updated enrollments
      await loadTrainingSessions();

      // Provide comprehensive feedback
      const totalSuccessful = enrolled.length + waitlisted.length;
      const totalFailed = failed.length;

      if (totalSuccessful === studentIds.length) {
        if (waitlisted.length > 0) {
          toast.success(
            `Batch enrollment complete: ${enrolled.length} enrolled, ${waitlisted.length} waitlisted`
          );
        } else {
          toast.success(`All ${enrolled.length} students enrolled successfully`);
        }
      } else if (totalSuccessful > 0) {
        toast.warning(
          `Partial success: ${totalSuccessful} enrolled/waitlisted, ${totalFailed} failed`
        );
      } else {
        toast.error(`Batch enrollment failed for all ${studentIds.length} students`);
      }

      // Log detailed results
      console.log('📊 Batch enrollment results:', {
        total: studentIds.length,
        enrolled: enrolled.length,
        waitlisted: waitlisted.length,
        failed: totalFailed,
        details: batchResult.summary
      });

      return {
        success: batchResult.success,
        enrolled,
        waitlisted,
        failed: failed.map((f: any) => f.studentId || f),
        capacityInfo: batchResult.capacityInfo
      };

    } catch (error: any) {
      console.error('💥 Error in batch enrollment:', error);
      toast.error(`Batch enrollment failed: ${error.message || 'Unknown error'}`);
      
      return {
        success: false,
        enrolled: [],
        waitlisted: [],
        failed: studentIds
      };
    } finally {
      setLoading(false);
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

  const updateStudentCourseAssignment = async (enrollmentId: string, courseId: string) => {
    try {
      const { error } = await supabase
        .from('student_roster_members')
        .update({ course_id: courseId })
        .eq('id', enrollmentId);
      
      if (error) throw error;
      
      await loadTrainingSessions();
      toast.success('Course assignment updated successfully');
    } catch (error: any) {
      console.error('Error updating course assignment:', error);
      toast.error('Failed to update course assignment');
    }
  };

  const updateStudentInClassStatus = async (enrollmentId: string, status: string) => {
    try {
      // Update practical_score based on pass/fail
      const practicalScore = status === 'PASS' ? 100 : status === 'FAIL' ? 0 : null;
      
      const { error } = await supabase
        .from('student_roster_members')
        .update({
          practical_score: practicalScore,
          completion_status: status === 'PASS' ? 'completed' : status === 'FAIL' ? 'failed' : 'pending'
        })
        .eq('id', enrollmentId);
      
      if (error) throw error;
      
      await loadTrainingSessions();
      toast.success('In-class status updated successfully');
    } catch (error: any) {
      console.error('Error updating in-class status:', error);
      toast.error('Failed to update in-class status');
    }
  };

  const updateStudentOnlineStatus = async (enrollmentId: string, status: string) => {
    try {
      // Update written_score based on complete/incomplete
      const writtenScore = status === 'COMPLETE' ? 100 : status === 'INCOMPLETE' ? 0 : null;
      
      const { error } = await supabase
        .from('student_roster_members')
        .update({
          written_score: writtenScore,
          completion_status: status === 'COMPLETE' ? 'completed' : status === 'INCOMPLETE' ? 'failed' : 'not_started'
        })
        .eq('id', enrollmentId);
      
      if (error) throw error;
      
      await loadTrainingSessions();
      toast.success('Online content status updated successfully');
    } catch (error: any) {
      console.error('Error updating online content status:', error);
      toast.error('Failed to update online content status');
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
    setHasCustomTitle(false);
    setPreviousTemplateName('');
  };

  // Handle template selection and auto-populate fields
  const handleTemplateSelection = (templateId: string) => {
    const template = courseTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      // Auto-populate fields from template
      setSessionForm(prev => {
        // Only auto-populate title if:
        // 1. Current title is empty, OR
        // 2. Current title matches the previous template name (hasn't been manually edited)
        const shouldUpdateTitle = !hasCustomTitle && (
          !prev.title ||
          prev.title === previousTemplateName
        );
        
        const updatedForm = {
          ...prev,
          course_template: templateId,
          max_capacity: template.max_students || 12,
          description: template.description || '',
          // Calculate end time based on duration
          end_time: calculateEndTime(prev.start_time, template.duration_hours)
        };
        
        if (shouldUpdateTitle) {
          updatedForm.title = template.name;
        }
        
        return updatedForm;
      });
      
      // Track the template name for future comparisons
      setPreviousTemplateName(template.name);
    } else {
      setSelectedTemplate(null);
      setPreviousTemplateName('');
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

  // Helper function to calculate target square for session description overlay
  const getTargetSquareIndex = (hoveredIndex: number, totalDays: number) => {
    const daysPerRow = 7;
    const hoveredRow = Math.floor(hoveredIndex / daysPerRow);
    const hoveredCol = hoveredIndex % daysPerRow;
    
    // Try to show description in the square below
    const belowIndex = hoveredIndex + daysPerRow;
    if (belowIndex < totalDays && days[belowIndex] !== null) {
      return belowIndex;
    }
    
    // If below is not available, try above
    const aboveIndex = hoveredIndex - daysPerRow;
    if (aboveIndex >= 0 && days[aboveIndex] !== null) {
      return aboveIndex;
    }
    
    // If both above and below are unavailable, try adjacent squares
    if (hoveredCol < 6 && hoveredIndex + 1 < totalDays && days[hoveredIndex + 1] !== null) {
      return hoveredIndex + 1; // Right
    }
    if (hoveredCol > 0 && days[hoveredIndex - 1] !== null) {
      return hoveredIndex - 1; // Left
    }
    
    return null; // No suitable target found
  };

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
                    <div>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Session
                      </Button>
                    </div>
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
                          onChange={(e) => {
                            setSessionForm({...sessionForm, title: e.target.value});
                            // Mark as custom title if user manually edits
                            if (e.target.value !== previousTemplateName) {
                              setHasCustomTitle(true);
                            } else {
                              setHasCustomTitle(false);
                            }
                          }}
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
                          <SelectTrigger className="h-auto min-h-[2.5rem] py-2">
                            <SelectValue placeholder="Select course template..." />
                          </SelectTrigger>
                          <SelectContent className="max-w-[500px]">
                            {courseTemplates.map(template => (
                              <SelectItem key={template.id} value={template.id}>
                                <div className="flex flex-col py-2 max-w-[460px]">
                                  <span className="font-medium leading-tight text-wrap" title={template.name}>
                                    {template.name}
                                  </span>
                                  <span className="text-sm text-muted-foreground leading-tight">
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
                          onChange={(e) => {
                            const newCapacity = parseInt(e.target.value);
                            setSessionForm({...sessionForm, max_capacity: newCapacity});
                            
                            // Real-time validation against template limits
                            if (selectedTemplate && newCapacity > selectedTemplate.max_students) {
                              toast.warning(`Capacity exceeds template maximum of ${selectedTemplate.max_students}`);
                            }
                          }}
                          min="1"
                          max={selectedTemplate?.max_students || 50}
                          className={cn(
                            selectedTemplate && sessionForm.max_capacity > selectedTemplate.max_students
                              ? "border-yellow-500 focus:border-yellow-500"
                              : ""
                          )}
                        />
                        
                        {/* Enhanced capacity guidance */}
                        {selectedTemplate && (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-muted-foreground">
                              Template recommends max {selectedTemplate.max_students} students
                            </p>
                            {sessionForm.max_capacity > selectedTemplate.max_students && (
                              <p className="text-xs text-yellow-600 flex items-center gap-1">
                                ⚠️ Capacity exceeds template recommendation
                              </p>
                            )}
                            {sessionForm.max_capacity <= selectedTemplate.max_students && sessionForm.max_capacity > 0 && (
                              <p className="text-xs text-green-600 flex items-center gap-1">
                                ✓ Capacity within template limits
                              </p>
                            )}
                          </div>
                        )}
                        
                        {/* General capacity guidance when no template selected */}
                        {!selectedTemplate && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Select a course template for capacity recommendations
                          </p>
                        )}
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

              <div className="grid grid-cols-7 gap-1 mb-6 relative">
                {days.map((day, index) => {
                  if (!day) {
                    return <div key={`empty-${year}-${month}-${index}`} className="p-2 h-20"></div>;
                  }

                  const dateStr = formatDate(year, month, day);
                  const daySessions = getSessionsForDate(dateStr);
                  const isSelected = selectedDay === dateStr;
                  const isHovered = hoveredDay === dateStr && daySessions.length > 0;

                  return (
                    <div
                      key={day}
                      onClick={() => handleDayClick(day)}
                      onMouseEnter={() => {
                        // Calculate sessions fresh on hover
                        const freshDaySessions = getSessionsForDate(dateStr);
                        
                        if (freshDaySessions.length > 0) {
                          setHoveredDay(dateStr);
                          setHoveredDayIndex(index);
                        }
                      }}
                      onMouseLeave={() => {
                        setHoveredDay(null);
                        setHoveredDayIndex(null);
                      }}
                      className={`p-2 h-20 border rounded-md cursor-pointer transition-colors hover:bg-muted relative ${
                        isSelected ? 'ring-2 ring-primary' : ''
                      } ${daySessions.length > 0 ? 'bg-blue-50 hover:bg-blue-100' : ''} ${
                        isHovered ? 'z-10 relative' : ''
                      }`}
                    >
                      {/* Normal calendar day content */}
                      {!isHovered && (
                        <>
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
                        </>
                      )}
                      
                      {/* Session description overlay when hovered */}
                      {isHovered && (
                        <div className="absolute inset-0 bg-white border-2 border-blue-500 rounded-md shadow-lg p-2 z-20">
                          <div className="h-full overflow-hidden">
                            {(() => {
                              const session = daySessions[0]; // Show first session
                              
                              if (!session) {
                                return <div className="text-xs text-red-500">No session data</div>;
                              }
                              
                              return (
                                <div className="h-full flex flex-col">
                                  {/* Session title */}
                                  <div className="text-xs font-semibold text-gray-900 truncate mb-1">
                                    {session.title || 'Untitled Session'}
                                  </div>
                                  
                                  {/* Time */}
                                  <div className="text-xs text-gray-600 mb-1">
                                    {session.start_time && session.end_time ?
                                      `${session.start_time} - ${session.end_time}` :
                                      'Time not set'
                                    }
                                  </div>
                                  
                                  {/* Description or instructor */}
                                  <div className="text-xs text-gray-600 flex-1 overflow-hidden">
                                    {session.description ? (
                                      <p className="leading-tight line-clamp-2">{session.description}</p>
                                    ) : session.instructor_profiles?.display_name ? (
                                      <p className="leading-tight">Instructor: {session.instructor_profiles.display_name}</p>
                                    ) : (
                                      <p className="leading-tight text-gray-400">No details available</p>
                                    )}
                                  </div>
                                  
                                  {/* Bottom info */}
                                  <div className="flex items-center justify-between text-xs text-gray-700 mt-1">
                                    <div className="flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      <span>{session.session_enrollments?.length || 0}</span>
                                    </div>
                                    {daySessions.length > 1 && (
                                      <span className="text-gray-500">+{daySessions.length - 1}</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
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
                                {/* Phase 1: Add capacity status badge */}
                                {session.capacity_status && session.capacity_info && (
                                  <CapacityStatusBadge
                                    status={session.capacity_status}
                                    capacityInfo={session.capacity_info}
                                    showSpots={true}
                                    size="sm"
                                    className="mr-1"
                                  />
                                )}
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
                                      max_capacity: session.max_capacity || 18, // REAL max_capacity from database!
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
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium">
                                  Students ({session.session_enrollments?.length || 0}/{session.max_capacity || 'N/A'})
                                </span>
                                {/* Phase 1: Enhanced capacity display in content area */}
                                {session.capacity_status && session.capacity_info && (
                                  <CapacityStatusBadge
                                    status={session.capacity_status}
                                    capacityInfo={session.capacity_info}
                                    showPercentage={true}
                                    size="sm"
                                    variant="outline"
                                  />
                                )}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  // Ensure roster exists before opening modal
                                  const rosterId = await ensureRosterForSession(session.id);
                                  if (rosterId) {
                                    // Update session with roster_id for the modal
                                    setSelectedSession({...session, roster_id: rosterId});
                                  } else {
                                    setSelectedSession(session);
                                  }
                                  setShowEnrollmentModal(true);
                                }}
                              >
                                <UserPlus className="h-4 w-4 mr-1" />
                                Enroll Student
                              </Button>
                            </div>
                            
                            {session.session_enrollments?.length > 0 && (
                              <div className="space-y-3">
                                {session.session_enrollments.map((enrollment: any) => (
                                  <div key={enrollment.id} className="p-4 bg-muted rounded-lg border">
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary">
                                          <Users className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1">
                                          <div className="font-medium">
                                            {enrollment.student_enrollment_profiles?.display_name}
                                          </div>
                                          <div className="text-sm text-muted-foreground">
                                            {enrollment.student_enrollment_profiles?.email}
                                          </div>
                                          {/* Course Assignment Display */}
                                          <div className="mt-1">
                                            {enrollment.courses?.name ? (
                                              <Badge variant="outline" className="text-xs">
                                                📚 {enrollment.courses.name}
                                              </Badge>
                                            ) : session.session_course?.name ? (
                                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                                📚 {session.session_course.name}
                                              </Badge>
                                            ) : (
                                              <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600">
                                                📚 No Course Assigned
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeStudentFromSession(enrollment.id)}
                                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    
                                    {/* Enhanced Status Controls */}
                                    <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
                                      {/* Course Assignment Dropdown */}
                                      <div>
                                        <Label className="text-xs font-medium text-muted-foreground">Course Assignment</Label>
                                        <Select
                                          value={enrollment.course_id || ""}
                                          onValueChange={(value) => updateStudentCourseAssignment(enrollment.id, value)}
                                        >
                                          <SelectTrigger className="w-full h-auto min-h-[2.5rem] text-sm py-2">
                                            <SelectValue placeholder="Select course..." />
                                          </SelectTrigger>
                                          <SelectContent className="max-w-[400px]">
                                            {courses.map(course => (
                                              <SelectItem key={course.id} value={course.id}>
                                                <div className="flex flex-col py-1 max-w-[360px]">
                                                  <span className="font-medium text-sm leading-tight" title={course.name}>
                                                    {course.name}
                                                  </span>
                                                  <span className="text-xs text-muted-foreground">
                                                    {course.length}h • Expires: {course.expiration_months}mo
                                                  </span>
                                                </div>
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      {/* Attendance Status */}
                                      <div>
                                        <Label className="text-xs font-medium text-muted-foreground">Attendance</Label>
                                        <Select
                                          value={enrollment.attendance_status || "pending"}
                                          onValueChange={(value) => updateStudentAttendance(enrollment.id, value)}
                                        >
                                          <SelectTrigger className="w-full h-8 text-xs">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="present">Present</SelectItem>
                                            <SelectItem value="absent">Absent</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      {/* In-Class Performance (Pass/Fail) */}
                                      <div>
                                        <Label className="text-xs font-medium text-muted-foreground">In-Class Status</Label>
                                        <Select
                                          value={enrollment.practical_score === 100 ? "PASS" : enrollment.practical_score === 0 ? "FAIL" : "PENDING"}
                                          onValueChange={(value) => updateStudentInClassStatus(enrollment.id, value)}
                                        >
                                          <SelectTrigger className="w-full h-8 text-xs">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="PENDING">Pending</SelectItem>
                                            <SelectItem value="PASS">Pass</SelectItem>
                                            <SelectItem value="FAIL">Fail</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      {/* Online Content Completion */}
                                      <div>
                                        <Label className="text-xs font-medium text-muted-foreground">Online Content</Label>
                                        <Select
                                          value={enrollment.written_score === 100 ? "COMPLETE" : enrollment.written_score === 0 ? "INCOMPLETE" : "NOT_STARTED"}
                                          onValueChange={(value) => updateStudentOnlineStatus(enrollment.id, value)}
                                        >
                                          <SelectTrigger className="w-full h-8 text-xs">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                                            <SelectItem value="COMPLETE">Complete</SelectItem>
                                            <SelectItem value="INCOMPLETE">Incomplete</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>

                                    {/* Progress Indicators */}
                                    <div className="mt-3 flex items-center gap-4">
                                      <div className="flex items-center gap-1">
                                        <div className={`w-2 h-2 rounded-full ${
                                          enrollment.attendance_status === 'present' ? 'bg-green-500' :
                                          enrollment.attendance_status === 'absent' ? 'bg-red-500' : 'bg-gray-300'
                                        }`} />
                                        <span className="text-xs text-muted-foreground">Attendance</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <div className={`w-2 h-2 rounded-full ${
                                          enrollment.practical_score === 100 ? 'bg-green-500' :
                                          enrollment.practical_score === 0 ? 'bg-red-500' : 'bg-gray-300'
                                        }`} />
                                        <span className="text-xs text-muted-foreground">In-Class</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <div className={`w-2 h-2 rounded-full ${
                                          enrollment.written_score === 100 ? 'bg-green-500' :
                                          enrollment.written_score === 0 ? 'bg-red-500' : 'bg-gray-300'
                                        }`} />
                                        <span className="text-xs text-muted-foreground">Online</span>
                                      </div>
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
                      <div>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Student
                        </Button>
                      </div>
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
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Enroll Student in Session</DialogTitle>
            {selectedSession && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Session: {selectedSession.title} • {selectedSession.booking_date} • {selectedSession.start_time} - {selectedSession.end_time}
                </p>
                {/* Add capacity status display */}
                {selectedSession.roster_id && (
                  <RosterCapacityDisplay
                    rosterId={selectedSession.roster_id}
                    compact={true}
                    showDetails={false}
                    showWaitlist={true}
                    showActions={false}
                    className="mt-2"
                  />
                )}
              </div>
            )}
          </DialogHeader>
          
          <EnrollmentCapacityGuard
            rosterId={selectedSession?.roster_id || ''}
            studentCount={1}
            showCapacityInFallback={true}
            allowWaitlist={true}
            onCapacityExceeded={(capacity) => {
              toast.warning('Session at capacity - student will be waitlisted');
            }}
          >
            <div className="space-y-6">
              {/* Search Filter */}
              <div className="space-y-2">
                <Label>Search Students</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or company..."
                    className="pl-10"
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                  />
                </div>
              </div>

              {/* Student Selection */}
              <div className="space-y-2">
                <Label>Select Student *</Label>
                <ScrollArea className="h-[300px] border rounded-md">
                  <div className="p-2">
                    {filteredStudents.length > 0 ? (
                      <div className="space-y-1">
                        {filteredStudents.map((student) => (
                          <div
                            key={student.id}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors",
                              enrollmentForm.student_id === student.id ? "bg-primary/10 border-primary" : "hover:bg-muted"
                            )}
                            onClick={() => setEnrollmentForm({...enrollmentForm, student_id: student.id})}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary">
                                <Users className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="font-medium">{student.display_name}</div>
                                <div className="text-sm text-muted-foreground">{student.email}</div>
                                {student.company && (
                                  <div className="text-xs text-muted-foreground">{student.company}</div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {student.first_aid_level && (
                                <Badge variant="secondary" className="text-xs">
                                  {student.first_aid_level} FA
                                </Badge>
                              )}
                              {student.cpr_level && (
                                <Badge variant="secondary" className="text-xs">
                                  CPR {student.cpr_level}
                                </Badge>
                              )}
                              {enrollmentForm.student_id === student.id && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No students found</p>
                        {filters.search && (
                          <p className="text-xs mt-1">Try a different search term</p>
                        )}
                      </div>
                    )}
                  </div>
                </ScrollArea>
                <p className="text-xs text-muted-foreground">
                  {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} available
                </p>
              </div>
              
              {/* Course Selection */}
              <div className="space-y-2">
                <Label>Select Course (Optional)</Label>
                <Select
                  value={enrollmentForm.course_id}
                  onValueChange={(value) => setEnrollmentForm({...enrollmentForm, course_id: value})}
                >
                  <SelectTrigger className="h-auto min-h-[2.5rem] py-2">
                    <SelectValue placeholder="Choose a course..." />
                  </SelectTrigger>
                  <SelectContent className="max-w-[500px]">
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        <div className="flex flex-col py-2 max-w-[460px]">
                          <span className="font-medium leading-tight text-wrap" title={course.name}>
                            {course.name}
                          </span>
                          <span className="text-sm text-muted-foreground leading-tight">
                            {course.description} • Expires: {course.expiration_months} months
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </EnrollmentCapacityGuard>
          
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowEnrollmentModal(false);
                setEnrollmentForm({ student_id: '', course_id: '' });
                setFilters({...filters, search: ''});
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
                  setFilters({...filters, search: ''});
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