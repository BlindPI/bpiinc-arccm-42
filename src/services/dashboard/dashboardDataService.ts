
import { supabase } from '@/integrations/supabase/client';

export interface DashboardMetrics {
  // System Admin metrics
  totalUsers?: number;
  activeUsers?: number;
  pendingApprovals?: number;
  systemHealth?: {
    healthy: number;
    warning: number;
    critical: number;
  };
  
  // Provider metrics
  activeCertifications?: number;
  expiringSoon?: number;
  complianceIssues?: number;
  
  // Team metrics
  teamMembers?: number;
  activeProjects?: number;
  completionRate?: number;
  
  // Location context
  locationName?: string;
  locationCity?: string;
  locationState?: string;
  locationAddress?: string;
  apUserName?: string;
  apUserEmail?: string;
  apUserPhone?: string;
}

export interface RecentActivity {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  user_name?: string;
  created_at: string;
  metadata?: any;
}

export class DashboardDataService {
  // System Admin Dashboard Data
  static async getSystemAdminMetrics(): Promise<DashboardMetrics> {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get active users (signed in within last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_sign_in_at', thirtyDaysAgo.toISOString());

      // Get pending certificate requests
      const { count: pendingApprovals } = await supabase
        .from('certificate_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING');

      // Get system health from backend_function_status
      const { data: healthData } = await supabase
        .from('backend_function_status')
        .select('status');

      const systemHealth = {
        healthy: healthData?.filter(h => h.status === 'healthy').length || 0,
        warning: healthData?.filter(h => h.status === 'warning').length || 0,
        critical: healthData?.filter(h => ['critical', 'degraded'].includes(h.status)).length || 0,
      };

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        pendingApprovals: pendingApprovals || 0,
        systemHealth
      };
    } catch (error) {
      console.error('Error fetching system admin metrics:', error);
      return {};
    }
  }

  // AP User Dashboard Data  
  static async getAPUserMetrics(userId: string): Promise<DashboardMetrics> {
    try {
      // Get AP user's location assignment
      const { data: locationAssignment } = await supabase
        .from('ap_user_location_assignments')
        .select(`
          locations!inner(
            id, name, city, state, address
          )
        `)
        .eq('ap_user_id', userId)
        .eq('status', 'active')
        .single();

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, email, phone')
        .eq('id', userId)
        .single();

      const locationData = locationAssignment?.locations;

      // Get certificates for this location
      const { count: activeCertifications } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('location_id', locationData?.id)
        .eq('status', 'ACTIVE');

      // Get expiring certificates (next 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const { data: certificates } = await supabase
        .from('certificates')
        .select('expiry_date')
        .eq('location_id', locationData?.id)
        .eq('status', 'ACTIVE');

      const expiringSoon = certificates?.filter(cert => {
        const expiryDate = new Date(cert.expiry_date);
        return expiryDate <= thirtyDaysFromNow && expiryDate > new Date();
      }).length || 0;

      return {
        activeCertifications: activeCertifications || 0,
        expiringSoon,
        complianceIssues: 0, // Will implement when compliance_issues table exists
        locationName: locationData?.name || 'No Location Assigned',
        locationCity: locationData?.city,
        locationState: locationData?.state,
        locationAddress: locationData?.address,
        apUserName: profile?.display_name,
        apUserEmail: profile?.email,
        apUserPhone: profile?.phone,
      };
    } catch (error) {
      console.error('Error fetching AP user metrics:', error);
      return {};
    }
  }

  // Team Scoped Dashboard Data
  static async getTeamScopedMetrics(teamId: string, userId: string): Promise<DashboardMetrics> {
    try {
      // Get team members count
      const { count: teamMembers } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .eq('status', 'active');

      // Get team info with location
      const { data: teamData } = await supabase
        .from('teams')
        .select(`
          name,
          locations!inner(name, city, state, address)
        `)
        .eq('id', teamId)
        .single();

      return {
        teamMembers: teamMembers || 0,
        activeProjects: 0, // Will implement when projects table exists
        completionRate: 85, // Mock for now
        locationName: teamData?.locations?.name,
        locationCity: teamData?.locations?.city,
        locationState: teamData?.locations?.state,
        locationAddress: teamData?.locations?.address,
      };
    } catch (error) {
      console.error('Error fetching team scoped metrics:', error);
      return {};
    }
  }

  // Instructor Dashboard Data
  static async getInstructorMetrics(userId: string): Promise<DashboardMetrics> {
    try {
      // Get certificates issued by this instructor
      const { count: activeCertifications } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('issued_by', userId);

      return {
        activeCertifications: activeCertifications || 0,
        expiringSoon: 0,
        complianceIssues: 0,
      };
    } catch (error) {
      console.error('Error fetching instructor metrics:', error);
      return {};
    }
  }

  // Student Dashboard Data
  static async getStudentMetrics(userId: string): Promise<DashboardMetrics> {
    try {
      // Get student's certificates
      const { count: activeCertifications } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'ACTIVE');

      return {
        activeCertifications: activeCertifications || 0,
        expiringSoon: 0,
        complianceIssues: 0,
      };
    } catch (error) {
      console.error('Error fetching student metrics:', error);
      return {};
    }
  }

  // Recent Activities (all roles)
  static async getRecentActivities(userId: string, userRole: string, teamId?: string): Promise<RecentActivity[]> {
    try {
      // For SA/AD users, show global activities
      if (['SA', 'AD'].includes(userRole)) {
        const { data } = await supabase
          .from('audit_logs')
          .select(`
            id, action, entity_type, entity_id, created_at,
            profiles!inner(display_name)
          `)
          .order('created_at', { ascending: false })
          .limit(10);

        return data?.map(activity => ({
          id: activity.id,
          action: activity.action,
          entity_type: activity.entity_type,
          entity_id: activity.entity_id,
          user_name: activity.profiles?.display_name,
          created_at: activity.created_at,
        })) || [];
      }

      // For other users, show their own activities
      const { data } = await supabase
        .from('audit_logs')
        .select('id, action, entity_type, entity_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      return data?.map(activity => ({
        id: activity.id,
        action: activity.action,
        entity_type: activity.entity_type,
        entity_id: activity.entity_id,
        created_at: activity.created_at,
      })) || [];
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  }
}
