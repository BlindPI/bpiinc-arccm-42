
// Foundation Services - Unified API Layer
import { supabase } from '@/integrations/supabase/client';
import type { 
  UserProfile, 
  Team, 
  TeamMember, 
  Certificate, 
  Notification,
  ApiResponse,
  PaginatedResponse 
} from '@/types/foundation';

class FoundationService {
  // User Management
  async getCurrentUser(): Promise<ApiResponse<UserProfile | null>> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      
      if (!user) {
        return { data: null, success: true };
      }

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      return {
        data: {
          id: profile.id,
          email: profile.email || user.email || '',
          display_name: profile.display_name,
          role: profile.role,
          status: profile.status || 'ACTIVE',
          compliance_status: profile.compliance_status,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          avatar_url: profile.avatar_url,
          phone: profile.phone,
          organization: profile.organization
        },
        success: true
      };
    } catch (error: any) {
      return {
        data: null,
        success: false,
        error: error.message
      };
    }
  }

  async getUsers(page = 1, limit = 10): Promise<PaginatedResponse<UserProfile>> {
    try {
      const offset = (page - 1) * limit;
      
      const { data, error, count } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact' })
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        data: data || [],
        total: count || 0,
        page,
        limit,
        hasMore: (count || 0) > page * limit
      };
    } catch (error: any) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        hasMore: false
      };
    }
  }

  // Team Management
  async getTeams(): Promise<ApiResponse<Team[]>> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name');

      if (error) throw error;

      return {
        data: data || [],
        success: true
      };
    } catch (error: any) {
      return {
        data: [],
        success: false,
        error: error.message
      };
    }
  }

  async getTeamMembers(teamId: string): Promise<ApiResponse<TeamMember[]>> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          user:user_profiles(*),
          team:teams(*)
        `)
        .eq('team_id', teamId);

      if (error) throw error;

      return {
        data: data || [],
        success: true
      };
    } catch (error: any) {
      return {
        data: [],
        success: false,
        error: error.message
      };
    }
  }

  // Certificate Management
  async getCertificates(page = 1, limit = 10): Promise<PaginatedResponse<Certificate>> {
    try {
      const offset = (page - 1) * limit;
      
      const { data, error, count } = await supabase
        .from('certificates')
        .select('*', { count: 'exact' })
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        data: data || [],
        total: count || 0,
        page,
        limit,
        hasMore: (count || 0) > page * limit
      };
    } catch (error: any) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        hasMore: false
      };
    }
  }

  // Notification Management
  async getNotifications(): Promise<ApiResponse<Notification[]>> {
    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return {
        data: data || [],
        success: true
      };
    } catch (error: any) {
      return {
        data: [],
        success: false,
        error: error.message
      };
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      return {
        data: true,
        success: true
      };
    } catch (error: any) {
      return {
        data: false,
        success: false,
        error: error.message
      };
    }
  }
}

export const foundationService = new FoundationService();
