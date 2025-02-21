
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ROLE_LABELS, ROLE_HIERARCHY, UserRole } from '@/lib/roles';
import { Loader2, ArrowUpCircle, CheckCircle2, XCircle, History, Shield } from 'lucide-react';
import { toast } from 'sonner';

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

      // If approved, update the user's role
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {(profileLoading || requestsLoading) ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Current Role Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-6 w-6" />
                  Role Management
                </CardTitle>
                <CardDescription>
                  View and manage your role in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Current Role</Label>
                    <p className="mt-1 text-lg font-semibold">
                      {profile?.role ? ROLE_LABELS[profile.role] : 'Loading...'}
                    </p>
                  </div>

                  {/* Role Upgrade Section */}
                  {Object.keys(ROLE_HIERARCHY).map((role) => (
                    canRequestUpgrade(role as UserRole) && (
                      <div key={role} className="mt-4">
                        <Button
                          onClick={() => createTransitionRequest.mutate(role as UserRole)}
                          className="w-full sm:w-auto"
                        >
                          <ArrowUpCircle className="mr-2 h-4 w-4" />
                          Request Upgrade to {ROLE_LABELS[role as UserRole]}
                        </Button>
                      </div>
                    )
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Reviewable Requests */}
            {reviewableRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Pending Requests for Review</CardTitle>
                  <CardDescription>
                    Review and manage role transition requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reviewableRequests.map((request) => (
                      <Alert key={request.id} className="relative">
                        <AlertTitle>
                          Role Transition Request
                        </AlertTitle>
                        <AlertDescription>
                          <div className="space-y-2">
                            <p>
                              From {ROLE_LABELS[request.from_role]} to {ROLE_LABELS[request.to_role]}
                            </p>
                            <div className="flex gap-2">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => updateTransitionRequest.mutate({ 
                                  id: request.id, 
                                  status: 'APPROVED' 
                                })}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => updateTransitionRequest.mutate({ 
                                  id: request.id, 
                                  status: 'REJECTED' 
                                })}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Role Transition History */}
            {userHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-6 w-6" />
                    Role Transition History
                  </CardTitle>
                  <CardDescription>
                    Your role transition request history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userHistory.map((request) => (
                      <Alert
                        key={request.id}
                        variant={
                          request.status === 'APPROVED' 
                            ? 'default'
                            : request.status === 'REJECTED'
                              ? 'destructive'
                              : 'default'
                        }
                      >
                        <AlertTitle>
                          {request.status === 'PENDING' && 'Pending Request'}
                          {request.status === 'APPROVED' && 'Approved Request'}
                          {request.status === 'REJECTED' && 'Rejected Request'}
                        </AlertTitle>
                        <AlertDescription>
                          <p>From {ROLE_LABELS[request.from_role]} to {ROLE_LABELS[request.to_role]}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default RoleManagement;
