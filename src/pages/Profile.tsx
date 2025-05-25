
import { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ROLE_LABELS } from '@/lib/roles';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Profile = () => {
  const { data: profile, isLoading, error } = useProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    display_name: '',
    organization: '',
    job_title: '',
    phone: ''
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<typeof editedProfile>) => {
      if (!profile?.id) throw new Error('No profile ID');
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleEdit = () => {
    if (profile) {
      setEditedProfile({
        display_name: profile.display_name || '',
        organization: profile.organization || '',
        job_title: profile.job_title || '',
        phone: profile.phone || ''
      });
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    updateProfileMutation.mutate(editedProfile);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProfile({
      display_name: '',
      organization: '',
      job_title: '',
      phone: ''
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !profile) {
    return (
      <DashboardLayout>
        <Alert className="bg-red-50 border-red-200">
          <AlertDescription className="text-red-800">
            Error loading profile. Please try again later.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          </div>
          {!isEditing ? (
            <Button onClick={handleEdit} variant="outline">
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={updateProfileMutation.isPending}
                size="sm"
              >
                {updateProfileMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save
              </Button>
              <Button onClick={handleCancel} variant="outline" size="sm">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={profile.email || ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name</Label>
                {isEditing ? (
                  <Input
                    id="display_name"
                    value={editedProfile.display_name}
                    onChange={(e) => setEditedProfile(prev => ({
                      ...prev,
                      display_name: e.target.value
                    }))}
                  />
                ) : (
                  <Input
                    value={profile.display_name || ''}
                    disabled
                    className="bg-gray-50"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    value={editedProfile.phone}
                    onChange={(e) => setEditedProfile(prev => ({
                      ...prev,
                      phone: e.target.value
                    }))}
                  />
                ) : (
                  <Input
                    value={profile.phone || ''}
                    disabled
                    className="bg-gray-50"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={ROLE_LABELS[profile.role] || profile.role}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                {isEditing ? (
                  <Input
                    id="organization"
                    value={editedProfile.organization}
                    onChange={(e) => setEditedProfile(prev => ({
                      ...prev,
                      organization: e.target.value
                    }))}
                  />
                ) : (
                  <Input
                    value={profile.organization || ''}
                    disabled
                    className="bg-gray-50"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="job_title">Job Title</Label>
                {isEditing ? (
                  <Input
                    id="job_title"
                    value={editedProfile.job_title}
                    onChange={(e) => setEditedProfile(prev => ({
                      ...prev,
                      job_title: e.target.value
                    }))}
                  />
                ) : (
                  <Input
                    value={profile.job_title || ''}
                    disabled
                    className="bg-gray-50"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Input
                  id="status"
                  value={profile.status}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
