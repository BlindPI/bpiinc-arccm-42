import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/supabase-schema';
import { toast } from 'sonner';
import { Profile } from '@/types/user-management';

export interface RoleTransitionRequest {
  id: string;
  user_id: string;
  from_role: UserRole;
  to_role: UserRole;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  reviewer_id: string | null;
  rejection_reason?: string;
  profiles?: { role: UserRole | null };
}

export function useRoleTransitions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch role transition requests
  const { data: transitionRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ['role_transition_requests'],
    queryFn: async () => {
      if (!user) return [];

      // First fetch the requests
      const { data: requests, error } = await supabase
        .from('role_transition_requests')
        .select(`
          id,
          user_id,
          from_role,
          to_role,
          status,
          created_at,
          reviewer_id,
          rejection_reason
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching transition requests:', error);
        throw error;
      }

      // Then fetch roles separately using the users' profiles
      const userIds = [...new Set(requests.map(r => r.user_id))];
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, role')
        .in('id', userIds);
        
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }
      
      // Create a map for quick lookup
      const roleMap = new Map();
      profiles.forEach(p => roleMap.set(p.id, p.role));

      // Combine the data
      const requestsWithRoles = requests.map(request => ({
        ...request,
        profiles: { role: roleMap.get(request.user_id) || null }
      }));

      return requestsWithRoles as RoleTransitionRequest[];
    },
    enabled: !!user
  });

  // Create role transition request
  const createTransitionRequest = useMutation({
    mutationFn: async (toRole: UserRole) => {
      if (!user) throw new Error('No user found');

      // Get current user's role from their profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profileError) throw profileError;
      if (!profile) throw new Error('Could not determine current role');

      // Check if there's already a pending request
      const { data: existingRequests, error: existingError } = await supabase
        .from('role_transition_requests')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'PENDING');

      if (existingError) throw existingError;
      if (existingRequests && existingRequests.length > 0) {
        throw new Error('You already have a pending role transition request');
      }

      const { error } = await supabase
        .from('role_transition_requests')
        .insert({
          user_id: user.id,
          from_role: profile.role as UserRole,
          to_role: toRole,
          status: 'PENDING'
        });
      
      if (error) throw error;

      // Create notification for admins about the new request
      await notifyAdminsAboutRoleRequest(user.id, profile.role as UserRole, toRole);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role_transition_requests'] });
      toast.success('Role transition request submitted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit role transition request');
      console.error('Error:', error);
    }
  });

  // Update role transition request
  const updateTransitionRequest = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      rejectionReason 
    }: { 
      id: string; 
      status: 'APPROVED' | 'REJECTED';
      rejectionReason?: string;
    }) => {
      if (!user) throw new Error('No user found');

      // Get the request to determine which user we're updating
      const { data: request, error: requestError } = await supabase
        .from('role_transition_requests')
        .select('user_id, from_role, to_role')
        .eq('id', id)
        .single();
        
      if (requestError) throw requestError;

      const updateData: any = {
        status,
        reviewer_id: user.id,
      };

      if (rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from('role_transition_requests')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;

      if (status === 'APPROVED') {
        // Update the user's role
        const { error: roleUpdateError } = await supabase
          .from('profiles')
          .update({ role: request.to_role })
          .eq('id', request.user_id);
        
        if (roleUpdateError) throw roleUpdateError;
          
        // Create notification for the user about approved request
        await notifyUserAboutRoleUpdate(request.user_id, request.to_role as UserRole, true);
      } else if (status === 'REJECTED') {
        // Create notification for the user about rejected request
        await notifyUserAboutRoleUpdate(request.user_id, request.to_role as UserRole, false, rejectionReason);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role_transition_requests'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Request updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update request: ' + error.message);
      console.error('Error:', error);
    }
  });

  // Get role requirements data
  const { data: roleRequirements, isLoading: requirementsLoading } = useQuery({
    queryKey: ['role_requirements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_requirements')
        .select('*');
      
      if (error) throw error;
      return data;
    }
  });

  // Notify admins about new role transition request
  const notifyAdminsAboutRoleRequest = async (userId: string, fromRole: UserRole, toRole: UserRole) => {
    try {
      // Get user's display name
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', userId)
        .single();

      const displayName = profile?.display_name || 'A user';

      // Get admin user ids
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['SA', 'AD']);

      if (!admins || admins.length === 0) return;

      // Create notifications for each admin
      const notifications = admins.map(admin => ({
        user_id: admin.id,
        type: 'ACTION',
        title: 'Role Transition Request',
        message: `${displayName} has requested to upgrade from ${fromRole} to ${toRole}`,
        action_url: '/role-management',
        read: false
      }));

      await supabase.from('notifications').insert(notifications);
    } catch (error) {
      console.error('Error notifying admins:', error);
    }
  };

  // Notify user about role transition approval/rejection
  const notifyUserAboutRoleUpdate = async (userId: string, toRole: UserRole, approved: boolean, rejectionReason?: string) => {
    try {
      const notification = {
        user_id: userId,
        type: approved ? 'SUCCESS' : 'ERROR',
        title: approved ? 'Role Upgrade Approved' : 'Role Upgrade Rejected',
        message: approved 
          ? `Your request to upgrade to ${toRole} has been approved.`
          : `Your request to upgrade to ${toRole} has been rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
        action_url: '/profile',
        read: false
      };

      await supabase.from('notifications').insert([notification]);
    } catch (error) {
      console.error('Error notifying user:', error);
    }
  };

  const fetchRoleProgress = async (userId: string, currentRole: UserRole) => {
    try {
      // This would ideally call a dedicated database function or view
      // For now, we'll mock this data based on the user's role
      
      // In a real implementation, you would query:
      // 1. Teaching hours and sessions from teaching_sessions
      // 2. Document submissions from document_submissions
      // 3. Video submissions from role_video_submissions
      // 4. Role requirements from role_requirements
      
      const mockProgressData = {
        from_role: currentRole,
        to_role: getNextRole(currentRole),
        teaching_hours: 20,
        completed_teaching_hours: Math.floor(Math.random() * 20),
        min_sessions: 5,
        completed_sessions: Math.floor(Math.random() * 5),
        required_documents: 3,
        submitted_documents: Math.floor(Math.random() * 3),
        required_videos: currentRole === 'IP' ? 2 : 0,
        submitted_videos: currentRole === 'IP' ? Math.floor(Math.random() * 2) : 0,
        time_in_role_days: Math.floor(Math.random() * 90),
        min_time_in_role_days: 30,
        meets_teaching_requirement: Math.random() > 0.5,
        meets_evaluation_requirement: Math.random() > 0.5,
        meets_time_requirement: Math.random() > 0.5,
        document_compliance: Math.random() > 0.5,
        supervisor_evaluations_required: currentRole === 'IT' ? 2 : 0,
        supervisor_evaluations_completed: currentRole === 'IT' ? Math.floor(Math.random() * 2) : 0
      };
      
      return mockProgressData;
    } catch (error) {
      console.error('Error fetching role progress:', error);
      throw error;
    }
  };

  // Add support for document uploads
  const handleUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['role_transition_requests'] });
    queryClient.invalidateQueries({ queryKey: ['document-submissions'] });
    toast.success('Document uploaded successfully');
  };

  return {
    transitionRequests,
    requestsLoading,
    roleRequirements,
    requirementsLoading,
    createTransitionRequest,
    updateTransitionRequest,
    handleUploadSuccess,
    fetchRoleProgress,
  };
}

// Helper function to get the next role in the hierarchy
const getNextRole = (currentRole: UserRole): UserRole => {
  const roleProgression: { [key in UserRole]: UserRole } = {
    'IT': 'IP',
    'IP': 'IC',
    'IC': 'AP',
    'AP': 'AD',
    'AD': 'SA',
    'SA': 'SA',
    'IN': 'IT'  // Add the progression for 'IN' role
  };
  
  return roleProgression[currentRole];
};
