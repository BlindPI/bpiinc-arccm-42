import { supabase } from '@/integrations/supabase/client';

export interface DashboardMetrics {
  // System metrics
  totalUsers?: number;
  activeCourses?: number;
  totalCertificates?: number;
  pendingRequests?: number;
  
  // Team metrics
  teamSize?: number;
  locationName?: string;
  locationCity?: string;
  locationState?: string;
  locationAddress?: string;
  
  // AP user info
  apUserName?: string;
  apUserEmail?: string;
  apUserPhone?: string;
  
  // Instructor metrics
  upcomingClasses?: number;
  studentsTaught?: number;
  certificationsIssued?: number;
  teachingHours?: number;
  
  // Student metrics
  activeCertifications?: number;
  expiringSoon?: number;
  complianceIssues?: number;
}

export interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user_name?: string;
}

export class DashboardDataService {
  /**
   * Get metrics for System Admins only
   */
  static async getSystemAdminMetrics(): Promise<DashboardMetrics> {
    try {
      // Get total users count
      const { count: totalUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      // Get active courses count
      const { count: activeCourses, error: coursesError } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ACTIVE');

      if (coursesError) throw coursesError;

      // Get total certificates
      const { count: totalCertificates, error: certsError } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true });

      if (certsError) throw certsError;

      // Get pending requests
      const { count: pendingRequests, error: requestsError } = await supabase
        .from('role_transition_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING');

      if (requestsError) throw requestsError;

      return {
        totalUsers: totalUsers || 0,
        activeCourses: activeCourses || 0,
        totalCertificates: totalCertificates || 0,
        pendingRequests: pendingRequests || 0
      };
    } catch (error) {
      console.error('Error fetching system admin metrics:', error);
      return {
        totalUsers: 0,
        activeCourses: 0,
        totalCertificates: 0,
        pendingRequests: 0
      };
    }
  }

  /**
   * Get metrics for AP users based on their location assignments
   */
  static async getAPUserMetrics(userId: string): Promise<DashboardMetrics> {
    try {
      // Check if user is an AP user
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, display_name, email, phone')
        .eq('id', userId)
        .single();
      
      if (profileError || profile?.role !== 'AP') {
        throw new Error('User is not an AP user');
      }
      
      // Get AP user's location assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('ap_user_location_assignments')
        .select(`
          location_id,
          status,
          locations (
            id,
            name,
            city,
            state,
            address
          )
        `)
        .eq('ap_user_id', userId);
      
      if (assignmentsError) throw assignmentsError;
      
      // Filter for active assignments only
      const activeAssignments = assignments?.filter(a => a.status === 'active') || [];
      
      if (activeAssignments.length === 0) {
        console.log(`AP user ${userId} has no active location assignments`);
        return {
          locationName: 'No Location Assigned',
          totalCertificates: 0,
          activeCourses: 0,
          apUserName: profile.display_name,
          apUserEmail: profile.email,
          apUserPhone: profile.phone
        };
      }
      
      // Use the first active location assignment
      const primaryLocation = activeAssignments[0].locations;
      
      if (!primaryLocation || !primaryLocation.id) {
        console.error(`Invalid location data for AP user ${userId}:`, activeAssignments[0]);
        return {
          locationName: 'Invalid Location Data',
          totalCertificates: 0,
          activeCourses: 0,
          apUserName: profile.display_name,
          apUserEmail: profile.email,
          apUserPhone: profile.phone
        };
      }
      
      console.log(`AP user ${userId} primary location:`, primaryLocation.id);
      
      // Get certificates for this location
      const { count: totalCertificates, error: certsError } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('location_id', primaryLocation.id);
      
      if (certsError) {
        console.error(`Error fetching certificates for location ${primaryLocation.id}:`, certsError);
        throw certsError;
      }
      
      // Get teams for this location
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id')
        .eq('location_id', primaryLocation.id)
        .eq('status', 'active');
      
      if (teamsError) {
        console.error(`Error fetching teams for location ${primaryLocation.id}:`, teamsError);
        throw teamsError;
      }
      
      // Get team members count
      let teamSize = 0;
      if (teams && teams.length > 0) {
        const teamIds = teams.map(t => t.id);
        console.log(`Found ${teamIds.length} teams for location ${primaryLocation.id}:`, teamIds);
        
        const { count: memberCount, error: memberError } = await supabase
          .from('team_members')
          .select('*', { count: 'exact', head: true })
          .in('team_id', teamIds)
          .eq('status', 'active');
        
        if (!memberError) {
          teamSize = memberCount || 0;
        } else {
          console.error(`Error fetching team members for teams:`, memberError);
        }
      }
      
      // Get active courses for this location
      const { count: activeCourses, error: coursesError } = await supabase
        .from('course_offerings')
        .select('*', { count: 'exact', head: true })
        .eq('location_id', primaryLocation.id)
        .eq('status', 'SCHEDULED');
      
      if (coursesError) {
        console.error(`Error fetching courses for location ${primaryLocation.id}:`, coursesError);
        throw coursesError;
      }
      
      return {
        teamSize,
        locationName: primaryLocation.name,
        locationCity: primaryLocation.city,
        locationState: primaryLocation.state,
        locationAddress: primaryLocation.address,
        totalCertificates: totalCertificates || 0,
        activeCourses: activeCourses || 0,
        apUserName: profile.display_name,
        apUserEmail: profile.email,
        apUserPhone: profile.phone
      };
    } catch (error) {
      console.error('Error fetching AP user metrics:', error);
      return {
        teamSize: 0,
        locationName: 'Error loading location',
        totalCertificates: 0,
        activeCourses: 0
      };
    }
  }

  /**
   * Get metrics for team-scoped users (team members only see their team data)
   */
  static async getTeamScopedMetrics(teamId: string, userId: string): Promise<DashboardMetrics> {
    try {
      console.log(`Getting team-scoped metrics for team ${teamId}, user ${userId}`);
      
      // Verify user is a member of this team
      const { data: membership, error: membershipError } = await supabase
        .from('team_members')
        .select('role, status')
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (membershipError) {
        console.error(`Error verifying team membership:`, membershipError);
        throw membershipError;
      }
      
      // Check if user is an active member of this team
      const activeMembership = membership?.find(m => m.status === 'active');
      if (!activeMembership) {
        console.error(`User ${userId} is not an active member of team ${teamId}`);
        throw new Error('Access denied: User not an active member of this team');
      }

      // Get team info with expanded location and provider data
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          location_id,
          provider_id,
          status,
          locations (
            id,
            name,
            city,
            state,
            address
          ),
          authorized_providers:provider_id (
            id,
            name,
            contact_email,
            contact_phone,
            user_id,
            profiles!authorized_providers_user_id_fkey (
              display_name,
              email,
              phone
            )
          )
        `)
        .eq('id', teamId)
        .single();

      if (teamError) {
        console.error(`Error fetching team data:`, teamError);
        throw teamError;
      }
      
      if (team.status !== 'active') {
        console.warn(`Team ${teamId} is not active (status: ${team.status})`);
      }
      
      if (!team.location_id) {
        console.warn(`Team ${teamId} has no location_id`);
      }

      // Get team size
      const { count: teamSize, error: teamSizeError } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .eq('status', 'active');
        
      if (teamSizeError) {
        console.error(`Error fetching team size:`, teamSizeError);
      }

      // Get location-specific certificates if location exists
      let totalCertificates = 0;
      if (team.location_id) {
        const { count, error: certCountError } = await supabase
          .from('certificates')
          .select('*', { count: 'exact', head: true })
          .eq('location_id', team.location_id);
          
        if (certCountError) {
          console.error(`Error fetching certificate count:`, certCountError);
        } else {
          totalCertificates = count || 0;
          console.log(`Found ${totalCertificates} certificates for location ${team.location_id}`);
        }
      }

      // Get location-specific courses
      let activeCourses = 0;
      if (team.location_id) {
        const { count, error: courseCountError } = await supabase
          .from('course_offerings')
          .select('*', { count: 'exact', head: true })
          .eq('location_id', team.location_id)
          .eq('status', 'SCHEDULED');
          
        if (courseCountError) {
          console.error(`Error fetching course count:`, courseCountError);
        } else {
          activeCourses = count || 0;
        }
      }

      // Extract AP user contact details
      let apUser = null;
      if (team.authorized_providers) {
        // Check if provider has a linked user profile
        if (team.authorized_providers.user_id && team.authorized_providers.profiles) {
          apUser = {
            name: team.authorized_providers.profiles.display_name,
            email: team.authorized_providers.profiles.email,
            phone: team.authorized_providers.profiles.phone
          };
          console.log(`Found AP user profile for provider ${team.provider_id}`);
        } else {
          // Fall back to provider contact info
          apUser = {
            name: team.authorized_providers.name,
            email: team.authorized_providers.contact_email,
            phone: team.authorized_providers.contact_phone
          };
          console.log(`Using provider contact info for provider ${team.provider_id}`);
        }
      } else if (team.provider_id) {
        console.warn(`Provider ${team.provider_id} exists but data could not be loaded`);
      }

      // Prepare location data
      let location = null;
      if (team.locations) {
        location = {
          name: team.locations.name,
          address: team.locations.address,
          city: team.locations.city,
          state: team.locations.state
        };
      } else if (team.location_id) {
        console.warn(`Location ${team.location_id} exists but data could not be loaded`);
      }

      return {
        teamSize: teamSize || 0,
        locationName: location?.name || 'No Location',
        locationAddress: location?.address,
        locationCity: location?.city,
        locationState: location?.state,
        apUserName: apUser?.name,
        apUserEmail: apUser?.email,
        apUserPhone: apUser?.phone,
        totalCertificates,
        activeCourses
      };
    } catch (error) {
      console.error('Error fetching team metrics:', error);
      return {
        teamSize: 0,
        locationName: 'Unknown',
        totalCertificates: 0,
        activeCourses: 0
      };
    }
  }

  /**
   * Get instructor-specific metrics
   */
  static async getInstructorMetrics(instructorId: string): Promise<DashboardMetrics> {
    try {
      // Get upcoming classes (next 14 days)
      const fourteenDaysFromNow = new Date();
      fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);

      const { count: upcomingClasses, error: upcomingError } = await supabase
        .from('teaching_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('instructor_id', instructorId)
        .gte('session_date', new Date().toISOString())
        .lte('session_date', fourteenDaysFromNow.toISOString());

      if (upcomingError) throw upcomingError;

      // Get students taught (last 12 months)
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

      const { data: sessionsData, error: sessionsError } = await supabase
        .from('teaching_sessions')
        .select('attendees')
        .eq('instructor_id', instructorId)
        .gte('session_date', twelveMonthsAgo.toISOString());

      if (sessionsError) throw sessionsError;

      const uniqueStudents = new Set();
      sessionsData?.forEach(session => {
        if (session.attendees) {
          session.attendees.forEach((studentId: string) => uniqueStudents.add(studentId));
        }
      });

      // Get certifications issued
      const { count: certificationsIssued, error: certsError } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('issued_by', instructorId)
        .gte('created_at', twelveMonthsAgo.toISOString());

      if (certsError) throw certsError;

      // Get teaching hours
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const { data: hoursData, error: hoursError } = await supabase
        .from('teaching_sessions')
        .select('teaching_hours_credit')
        .eq('instructor_id', instructorId)
        .gte('session_date', threeMonthsAgo.toISOString());

      if (hoursError) throw hoursError;

      const teachingHours = hoursData?.reduce((total, session) => 
        total + (session.teaching_hours_credit || 0), 0) || 0;

      return {
        upcomingClasses: upcomingClasses || 0,
        studentsTaught: uniqueStudents.size,
        certificationsIssued: certificationsIssued || 0,
        teachingHours: Math.round(teachingHours)
      };
    } catch (error) {
      console.error('Error fetching instructor metrics:', error);
      return {
        upcomingClasses: 0,
        studentsTaught: 0,
        certificationsIssued: 0,
        teachingHours: 0
      };
    }
  }

  /**
   * Get student-specific metrics
   */
  static async getStudentMetrics(studentId: string): Promise<DashboardMetrics> {
    try {
      // Get active enrollments
      const { count: activeCourses, error: activeError } = await supabase
        .from('course_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', studentId)
        .eq('status', 'enrolled');

      if (activeError) throw activeError;

      // Get certificates
      const { count: activeCertifications, error: certsError } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', studentId)
        .eq('status', 'ACTIVE');

      if (certsError) throw certsError;

      // Get expiring certificates (next 60 days)
      const sixtyDaysFromNow = new Date();
      sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

      const { count: expiringSoon, error: expiringError } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', studentId)
        .eq('status', 'ACTIVE')
        .lte('expiry_date', sixtyDaysFromNow.toISOString());

      if (expiringError) throw expiringError;

      return {
        activeCourses: activeCourses || 0,
        activeCertifications: activeCertifications || 0,
        expiringSoon: expiringSoon || 0,
        complianceIssues: 0 // Students don't have compliance issues tracked
      };
    } catch (error) {
      console.error('Error fetching student metrics:', error);
      return {
        activeCourses: 0,
        activeCertifications: 0,
        expiringSoon: 0,
        complianceIssues: 0
      };
    }
  }

  /**
   * Get recent activities with proper RBAC
   */
  static async getRecentActivities(userId: string, userRole: string, teamId?: string): Promise<RecentActivity[]> {
    try {
      console.log(`Getting recent activities for user ${userId}, role ${userRole}, team ${teamId || 'none'}`);
      const activities: RecentActivity[] = [];

      if (['SA', 'AD'].includes(userRole)) {
        // System admins can see all activities
        const { data: auditLogs, error } = await supabase
          .from('audit_logs')
          .select('id, action, created_at, user_id')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error fetching audit logs:', error);
        } else if (auditLogs) {
          activities.push(...auditLogs.map(log => ({
            id: log.id,
            type: 'system',
            description: log.action,
            timestamp: log.created_at
          })));
          console.log(`Found ${auditLogs.length} audit logs for admin user`);
        }
      } else if (userRole === 'AP') {
        // AP users see activities for their locations
        const { data: apLocations, error: locError } = await supabase
          .from('ap_user_location_assignments')
          .select('location_id, status')
          .eq('ap_user_id', userId);
          
        if (locError) {
          console.error('Error fetching AP location assignments:', locError);
          return activities;
        }
        
        // Filter for active assignments only
        const activeLocations = apLocations?.filter(loc => loc.status === 'active') || [];
          
        if (activeLocations.length > 0) {
          const locationIds = activeLocations.map(loc => loc.location_id);
          console.log(`AP user has ${locationIds.length} active locations:`, locationIds);
          
          const { data: certActivities, error } = await supabase
            .from('certificates')
            .select('id, course_name, created_at, recipient_name, location_id')
            .in('location_id', locationIds)
            .order('created_at', { ascending: false })
            .limit(10);
            
          if (error) {
            console.error('Error fetching certificate activities:', error);
          } else if (certActivities) {
            activities.push(...certActivities.map(cert => ({
              id: cert.id,
              type: 'certificate',
              description: `Certificate issued for ${cert.course_name}`,
              timestamp: cert.created_at,
              user_name: cert.recipient_name
            })));
            console.log(`Found ${certActivities.length} certificate activities for AP user locations`);
          }
        } else {
          console.warn(`AP user ${userId} has no active location assignments`);
        }
      } else if (teamId) {
        // Team members see team-specific activities
        // First get the team's location_id
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select('location_id, name')
          .eq('id', teamId)
          .single();
          
        if (teamError) {
          console.error('Error fetching team data:', teamError);
          return activities;
        }
        
        if (!teamData.location_id) {
          console.warn(`Team ${teamId} has no location_id`);
          return activities;
        }
        
        console.log(`Team ${teamId} (${teamData.name}) has location_id: ${teamData.location_id}`);
        
        // Then use the location_id to filter certificates
        const { data: teamActivities, error } = await supabase
          .from('certificates')
          .select('id, course_name, created_at, recipient_name, location_id')
          .eq('location_id', teamData.location_id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error fetching team certificate activities:', error);
        } else if (teamActivities) {
          activities.push(...teamActivities.map(cert => ({
            id: cert.id,
            type: 'certificate',
            description: `Certificate issued for ${cert.course_name}`,
            timestamp: cert.created_at,
            user_name: cert.recipient_name
          })));
          console.log(`Found ${teamActivities.length} certificate activities for team location ${teamData.location_id}`);
        }
      } else {
        // Individual user activities
        const { data: userActivities, error } = await supabase
          .from('certificates')
          .select('id, course_name, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error fetching user certificate activities:', error);
        } else if (userActivities) {
          activities.push(...userActivities.map(cert => ({
            id: cert.id,
            type: 'certificate',
            description: `Received certificate for ${cert.course_name}`,
            timestamp: cert.created_at
          })));
          console.log(`Found ${userActivities.length} certificate activities for user ${userId}`);
        }
      }

      return activities;
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  }
}
