
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

type UserRole = 'SA' | 'AD' | 'AP' | 'IC' | 'IP' | 'IT';

const ROLE_HIERARCHY: { [key in UserRole]: UserRole[] } = {
  'SA': ['AD'],
  'AD': ['AP'],
  'AP': ['IC'],
  'IC': ['IP'],
  'IP': ['IT'],
  'IT': []
};

const ROLE_LABELS: { [key in UserRole]: string } = {
  'SA': 'System Admin',
  'AD': 'Admin',
  'AP': 'Authorized Provider',
  'IC': 'Instructor Certified',
  'IP': 'Instructor Provisional',
  'IT': 'Instructor Training'
};

const Index = () => {
  const { user, signOut, loading } = useAuth();
  const [targetRole, setTargetRole] = useState<UserRole | ''>('');

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

  const { data: pendingRequest, isLoading: requestLoading } = useQuery({
    queryKey: ['roleRequest', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_transition_requests')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'PENDING')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user
  });

  const handleRoleRequest = async () => {
    if (!user || !profile || !targetRole) return;
    
    try {
      const { error } = await supabase
        .from('role_transition_requests')
        .insert({
          user_id: user.id,
          from_role: profile.role,
          to_role: targetRole,
        });

      if (error) throw error;
      
      toast.success('Role transition request submitted successfully');
      setTargetRole('');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading || profileLoading || requestLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const availableRoles = profile ? ROLE_HIERARCHY[profile.role as UserRole] : [];
  const isSuperAdmin = profile?.role === 'SA';

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {isSuperAdmin && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-800">
              You are logged in as a System Administrator (Superadmin)
            </AlertDescription>
          </Alert>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Certificate Management</CardTitle>
            <CardDescription>
              Manage your certifications and role requests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm text-gray-500">Current Role</p>
              <p className="font-medium">{profile?.role ? ROLE_LABELS[profile.role as UserRole] : 'Loading...'}</p>
            </div>
            
            {pendingRequest ? (
              <div className="bg-yellow-50 p-4 rounded-md">
                <p className="text-sm text-yellow-800">
                  You have a pending request to transition from {ROLE_LABELS[pendingRequest.from_role]} to {ROLE_LABELS[pendingRequest.to_role]}
                </p>
              </div>
            ) : availableRoles.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm font-medium">Request Role Transition</p>
                <div className="flex gap-4">
                  <Select value={targetRole} onValueChange={(value) => setTargetRole(value as UserRole)}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select new role" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleRoleRequest} disabled={!targetRole}>
                    Submit Request
                  </Button>
                </div>
              </div>
            ) : null}
            
            <div className="pt-4">
              <Button onClick={signOut} variant="outline">Sign Out</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
