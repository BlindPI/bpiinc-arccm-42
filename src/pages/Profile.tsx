import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE_LABELS } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UserProfile } from "@/types/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, UserCircle2 } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const { data: profile, isLoading, mutate } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [profileCompleteness, setProfileCompleteness] = useState(0);

  // Calculate profile completeness
  const calculateProfileCompleteness = (profileData: Partial<UserProfile> | null) => {
    if (!profileData) return 0;
    
    const fields = [
      'display_name',
      'email',
      'phone',
      'organization',
      'job_title'
    ];
    
    const filledFields = fields.filter(field =>
      profileData[field as keyof UserProfile] &&
      String(profileData[field as keyof UserProfile]).trim() !== ''
    );
    
    return Math.round((filledFields.length / fields.length) * 100);
  };

  // Initialize form data when profile data is loaded
  useEffect(() => {
    if (profile && !isLoading) {
      setFormData({
        display_name: profile.display_name || '',
        phone: profile.phone || '',
        organization: profile.organization || '',
        job_title: profile.job_title || ''
      });
      setProfileCompleteness(calculateProfileCompleteness(profile));
    }
  }, [profile, isLoading]);

  const handleEdit = () => {
    setFormData({
      display_name: profile?.display_name || '',
      phone: profile?.phone || '',
      organization: profile?.organization || '',
      job_title: profile?.job_title || ''
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Call the updateProfile method from AuthContext
      await user.updateProfile?.(formData);
      
      // Update the local profile data
      mutate();
      
      // Update profile completeness
      setProfileCompleteness(calculateProfileCompleteness({
        ...profile,
        ...formData
      }));
      
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-500">Profile Completeness:</div>
          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full"
              style={{ width: `${profileCompleteness}%` }}
            ></div>
          </div>
          <div className="text-sm font-medium">{profileCompleteness}%</div>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and organization details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profileCompleteness < 100 && !isEditing && (
                <Alert className="bg-blue-50 border-blue-200 mb-4">
                  <UserCircle2 className="h-4 w-4 text-blue-600 mr-2" />
                  <AlertDescription className="text-blue-800">
                    Your profile is incomplete. Please fill in all fields to improve your experience.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    readOnly
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name</Label>
                  {isLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Input
                      id="display_name"
                      name="display_name"
                      value={isEditing ? formData.display_name : profile?.display_name || ''}
                      disabled={!isEditing}
                      readOnly={!isEditing}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                    />
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  {isLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Input
                      id="phone"
                      name="phone"
                      value={isEditing ? formData.phone : profile?.phone || ''}
                      disabled={!isEditing}
                      readOnly={!isEditing}
                      onChange={handleChange}
                      placeholder="Enter your phone number"
                    />
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization / Company</Label>
                  {isLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Input
                      id="organization"
                      name="organization"
                      value={isEditing ? formData.organization : profile?.organization || ''}
                      disabled={!isEditing}
                      readOnly={!isEditing}
                      onChange={handleChange}
                      placeholder="Enter your organization name"
                    />
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="job_title">Job Title</Label>
                  {isLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Input
                      id="job_title"
                      name="job_title"
                      value={isEditing ? formData.job_title : profile?.job_title || ''}
                      disabled={!isEditing}
                      readOnly={!isEditing}
                      onChange={handleChange}
                      placeholder="Enter your job title"
                    />
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  {isLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Input
                      id="role"
                      value={profile?.role ? ROLE_LABELS[profile.role] : 'No role assigned'}
                      disabled
                      readOnly
                    />
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 pt-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              ) : (
                <Button onClick={handleEdit}>
                  Edit Profile
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                View your account security information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Account Created</Label>
                <Input
                  value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  disabled
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label>Last Sign In</Label>
                <Input
                  value={user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'N/A'}
                  disabled
                  readOnly
                />
              </div>
              <div className="mt-6">
                <Button variant="outline">
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
