import { supabase } from '@/integrations/supabase/client';
import { UserAvailabilitySlot } from '@/types/availability';

export interface AvailabilityUser {
  user_id: string;
  display_name: string;
  email: string;
  team_role?: string;
  job_title?: string;
  availability_slots: UserAvailabilitySlot[];
}

export class DashboardAvailabilityService {
  /**
   * Get user's own availability
   */
  static async getOwnAvailability(userId: string): Promise<AvailabilityUser> {
    try {
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, email, job_title')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        throw new Error(`Failed to get user profile: ${profileError?.message}`);
      }

      // Get user's availability slots
      const { data: slots, error: slotsError } = await supabase
        .from('user_availability')
        .select('*')
        .eq('user_id', userId)
        .order('day_of_week')
        .order('start_time');

      if (slotsError) {
        throw new Error(`Failed to get availability slots: ${slotsError.message}`);
      }

      return {
        user_id: profile.id,
        display_name: profile.display_name || 'Unknown User',
        email: profile.email || '',
        job_title: profile.job_title || '',
        availability_slots: slots || []
      };
    } catch (error: any) {
      console.error('Error getting own availability:', error);
      throw error;
    }
  }

  /**
   * Get team members' availability (for AP role)
   */
  static async getTeamAvailability(teamIds: string[]): Promise<AvailabilityUser[]> {
    try {
      if (!teamIds || teamIds.length === 0) {
        return [];
      }

      // Get team members
      const { data: teamMembers, error: teamError } = await supabase
        .from('team_members')
        .select('user_id, role, team_position')
        .in('team_id', teamIds)
        .eq('status', 'active');

      if (teamError) {
        throw new Error(`Failed to get team members: ${teamError.message}`);
      }

      if (!teamMembers || teamMembers.length === 0) {
        return [];
      }

      const userIds = teamMembers.map(tm => tm.user_id);

      // Get profiles for team members
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, email, job_title')
        .in('id', userIds);

      if (profileError) {
        throw new Error(`Failed to get member profiles: ${profileError.message}`);
      }

      // Get availability slots for all team members
      const { data: allSlots, error: slotsError } = await supabase
        .from('user_availability')
        .select('*')
        .in('user_id', userIds)
        .order('user_id')
        .order('day_of_week')
        .order('start_time');

      if (slotsError) {
        throw new Error(`Failed to get availability slots: ${slotsError.message}`);
      }

      // Group slots by user
      const slotsByUser = (allSlots || []).reduce((acc, slot) => {
        if (!acc[slot.user_id]) {
          acc[slot.user_id] = [];
        }
        acc[slot.user_id].push(slot);
        return acc;
      }, {} as Record<string, UserAvailabilitySlot[]>);

      // Combine data
      return teamMembers.map(member => {
        const profile = profiles?.find(p => p.id === member.user_id);
        const slots = slotsByUser[member.user_id] || [];

        return {
          user_id: member.user_id,
          display_name: profile?.display_name || 'Unknown User',
          email: profile?.email || '',
          team_role: member.role,
          job_title: profile?.job_title || '',
          availability_slots: slots
        };
      });
    } catch (error: any) {
      console.error('Error getting team availability:', error);
      throw error;
    }
  }

  /**
   * Get all users' availability (for SA/AD roles)
   */
  static async getAllUsersAvailability(): Promise<AvailabilityUser[]> {
    try {
      // Get all active profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, email, job_title, role')
        .neq('role', 'SA') // Exclude system admins from availability view
        .order('display_name');

      if (profileError) {
        throw new Error(`Failed to get user profiles: ${profileError.message}`);
      }

      if (!profiles || profiles.length === 0) {
        return [];
      }

      const userIds = profiles.map(p => p.id);

      // Get availability slots for all users
      const { data: allSlots, error: slotsError } = await supabase
        .from('user_availability')
        .select('*')
        .in('user_id', userIds)
        .order('user_id')
        .order('day_of_week')
        .order('start_time');

      if (slotsError) {
        throw new Error(`Failed to get availability slots: ${slotsError.message}`);
      }

      // Group slots by user
      const slotsByUser = (allSlots || []).reduce((acc, slot) => {
        if (!acc[slot.user_id]) {
          acc[slot.user_id] = [];
        }
        acc[slot.user_id].push(slot);
        return acc;
      }, {} as Record<string, UserAvailabilitySlot[]>);

      // Combine data
      return profiles.map(profile => ({
        user_id: profile.id,
        display_name: profile.display_name || 'Unknown User',
        email: profile.email || '',
        job_title: profile.job_title || '',
        availability_slots: slotsByUser[profile.id] || []
      }));
    } catch (error: any) {
      console.error('Error getting all users availability:', error);
      throw error;
    }
  }

  /**
   * Get user's team IDs for determining availability access
   */
  static async getUserTeamIds(userId: string): Promise<string[]> {
    try {
      const { data: teamMembers, error } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error) {
        console.warn('Failed to get user team IDs:', error.message);
        return [];
      }

      return teamMembers?.map(tm => tm.team_id) || [];
    } catch (error: any) {
      console.error('Error getting user team IDs:', error);
      return [];
    }
  }

  /**
   * Check if user can view team availability
   */
  static canViewTeamAvailability(userRole: string): boolean {
    return ['AP', 'SA', 'AD'].includes(userRole);
  }

  /**
   * Check if user can view all users availability
   */
  static canViewAllAvailability(userRole: string): boolean {
    return ['SA', 'AD'].includes(userRole);
  }
}