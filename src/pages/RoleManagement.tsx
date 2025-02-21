
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ROLE_LABELS, UserRole } from '@/lib/roles';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { RoleHierarchyCard } from '@/components/role-management/RoleHierarchyCard';
import { RoleTransitionRequestCard } from '@/components/role-management/RoleTransitionRequestCard';
import { ReviewableRequestsCard } from '@/components/role-management/ReviewableRequestsCard';
import { TransitionHistoryCard } from '@/components/role-management/TransitionHistoryCard';

const RoleManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch current user's profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Fetch role transition requests
  const { data: transitionRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ['role_transition_requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_transition_requests')
        .select(`
          *,
          profiles:user_id (role)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Create role transition request
  const createTransitionRequest = useMutation({
    mutationFn: async (toRole: UserRole) => {
      const { error } = await supabase
        .from('role_transition_requests')
        .insert({
          user_id: user!.id,
          from_role: profile!.role,
          to_role: toRole,
          status: 'PENDING'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role_transition_requests'] });
      toast.success('Role transition request submitted successfully');
    },
    onError: (error) => {
      toast.error('Failed to submit role transition request');
      console.error('Error:', error);
    }
  });

  // Update role transition request
  const updateTransitionRequest = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) => {
      const { error } = await supabase
        .from('role_transition_requests')
        .update({ 
          status,
          reviewer_id: user!.id,
        })
        .eq('id', id);
      
      if (error) throw error;

      if (status === 'APPROVED') {
        const request = transitionRequests?.find(r => r.id === id);
        if (request) {
          const { error: roleUpdateError } = await supabase
            .from('profiles')
            .update({ role: request.to_role })
            .eq('id', request.user_id);
          
          if (roleUpdateError) throw roleUpdateError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role_transition_requests'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Request updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update request');
      console.error('Error:', error);
    }
  });

  // Helper function to check if user can request upgrade to a role
  const canRequestUpgrade = (toRole: UserRole) => {
    if (!profile?.role) return false;
    const currentRoleIndex = Object.keys(ROLE_HIERARCHY).indexOf(profile.role);
    const targetRoleIndex = Object.keys(ROLE_HIERARCHY).indexOf(toRole);
    return targetRoleIndex === currentRoleIndex + 1;
  };

  // Helper function to check if user can review a request
  const canReviewRequest = (request: any) => {
    if (!profile?.role) return false;
    return ROLE_HIERARCHY[profile.role].includes(request.to_role);
  };

  if (!user) return null;

  const pendingRequests = transitionRequests?.filter(r => r.status === 'PENDING') || [];
  const userHistory = transitionRequests?.filter(r => r.user_id === user.id) || [];
  const reviewableRequests = pendingRequests.filter(r => canReviewRequest(r));

  if (profileLoading || requestsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Role Management</h2>
          <p className="text-muted-foreground">
            View and manage your role in the organization
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <RoleHierarchyCard currentRole={profile!.role} />
          <RoleTransitionRequestCard
            currentRole={profile!.role}
            canRequestUpgrade={canRequestUpgrade}
            createTransitionRequest={createTransitionRequest}
          />
        </div>

        <ReviewableRequestsCard
          reviewableRequests={reviewableRequests}
          updateTransitionRequest={updateTransitionRequest}
        />

        <TransitionHistoryCard userHistory={userHistory} />
      </div>
    </DashboardLayout>
  );
};

export default RoleManagement;
