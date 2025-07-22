import { supabase } from '@/integrations/supabase/client';

export interface TierSwitchRequest {
  id: string;
  user_id: string;
  current_tier: 'basic' | 'robust';
  requested_tier: 'basic' | 'robust';
  justification: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  admin_notes?: string;
  user_profile?: {
    display_name: string;
    email: string;
    role: string;
  };
}

export interface TierSwitchRequestInput {
  user_id: string;
  current_tier: 'basic' | 'robust';
  requested_tier: 'basic' | 'robust';
  justification: string;
}

export interface TierSwitchRequestReview {
  request_id: string;
  status: 'approved' | 'rejected';
  admin_notes?: string;
  reviewed_by: string;
}

export class TierSwitchRequestService {
  
  /**
   * Create a new tier switch request
   */
  static async createTierSwitchRequest(request: TierSwitchRequestInput): Promise<TierSwitchRequest> {
    try {
      const { data, error } = await supabase
        .from('tier_switch_requests')
        .insert({
          user_id: request.user_id,
          current_tier: request.current_tier,
          requested_tier: request.requested_tier,
          justification: request.justification,
          status: 'pending',
          requested_at: new Date().toISOString()
        })
        .select(`
          *,
          user_profile:profiles!user_id (
            display_name,
            email,
            role
          )
        `)
        .single();

      if (error) throw error;
      
      return data as TierSwitchRequest;
    } catch (error) {
      console.error('Error creating tier switch request:', error);
      throw error;
    }
  }

  /**
   * Get all pending tier switch requests (for admins)
   */
  static async getPendingTierSwitchRequests(): Promise<TierSwitchRequest[]> {
    try {
      const { data, error } = await supabase
        .from('tier_switch_requests')
        .select(`
          *,
          user_profile:profiles!user_id (
            display_name,
            email,
            role
          )
        `)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (error) throw error;
      
      return data as TierSwitchRequest[];
    } catch (error) {
      console.error('Error fetching pending tier switch requests:', error);
      return [];
    }
  }

  /**
   * Get tier switch requests for a specific user
   */
  static async getUserTierSwitchRequests(userId: string): Promise<TierSwitchRequest[]> {
    try {
      const { data, error } = await supabase
        .from('tier_switch_requests')
        .select(`
          *,
          user_profile:profiles!user_id (
            display_name,
            email,
            role
          )
        `)
        .eq('user_id', userId)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      
      return data as TierSwitchRequest[];
    } catch (error) {
      console.error('Error fetching user tier switch requests:', error);
      return [];
    }
  }

  /**
   * Check if user has pending tier switch request
   */
  static async hasPendingRequest(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('tier_switch_requests')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .limit(1);

      if (error) throw error;
      
      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('Error checking pending requests:', error);
      return false;
    }
  }

  /**
   * Review a tier switch request (approve or reject)
   */
  static async reviewTierSwitchRequest(review: TierSwitchRequestReview): Promise<TierSwitchRequest> {
    try {
      const { data, error } = await supabase
        .from('tier_switch_requests')
        .update({
          status: review.status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: review.reviewed_by,
          admin_notes: review.admin_notes
        })
        .eq('id', review.request_id)
        .select(`
          *,
          user_profile:profiles!user_id (
            display_name,
            email,
            role
          )
        `)
        .single();

      if (error) throw error;
      
      // If approved, actually switch the tier
      if (review.status === 'approved') {
        const request = data as TierSwitchRequest;
        const { ComplianceTierService } = await import('./complianceTierService');
        
        await ComplianceTierService.switchComplianceTier(
          request.user_id, 
          request.requested_tier
        );
      }
      
      return data as TierSwitchRequest;
    } catch (error) {
      console.error('Error reviewing tier switch request:', error);
      throw error;
    }
  }

  /**
   * Get all tier switch requests with filters (for admin dashboard)
   */
  static async getAllTierSwitchRequests(
    status?: 'pending' | 'approved' | 'rejected',
    limit: number = 50
  ): Promise<TierSwitchRequest[]> {
    try {
      let query = supabase
        .from('tier_switch_requests')
        .select(`
          *,
          user_profile:profiles!user_id (
            display_name,
            email,
            role
          )
        `)
        .order('requested_at', { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return data as TierSwitchRequest[];
    } catch (error) {
      console.error('Error fetching tier switch requests:', error);
      return [];
    }
  }

  /**
   * Cancel a pending tier switch request
   */
  static async cancelTierSwitchRequest(requestId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('tier_switch_requests')
        .delete()
        .eq('id', requestId)
        .eq('user_id', userId)
        .eq('status', 'pending');

      if (error) throw error;
    } catch (error) {
      console.error('Error canceling tier switch request:', error);
      throw error;
    }
  }

  /**
   * Get tier switch request statistics
   */
  static async getTierSwitchRequestStats(): Promise<{
    pending: number;
    approved_this_month: number;
    rejected_this_month: number;
    total_requests: number;
  }> {
    try {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const [pendingResult, approvedResult, rejectedResult, totalResult] = await Promise.all([
        supabase
          .from('tier_switch_requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        
        supabase
          .from('tier_switch_requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'approved')
          .gte('reviewed_at', oneMonthAgo.toISOString()),
        
        supabase
          .from('tier_switch_requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'rejected')
          .gte('reviewed_at', oneMonthAgo.toISOString()),
        
        supabase
          .from('tier_switch_requests')
          .select('id', { count: 'exact', head: true })
      ]);

      return {
        pending: pendingResult.count || 0,
        approved_this_month: approvedResult.count || 0,
        rejected_this_month: rejectedResult.count || 0,
        total_requests: totalResult.count || 0
      };
    } catch (error) {
      console.error('Error fetching tier switch request stats:', error);
      return {
        pending: 0,
        approved_this_month: 0,
        rejected_this_month: 0,
        total_requests: 0
      };
    }
  }
}