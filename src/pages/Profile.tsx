
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE_LABELS } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface ProfileProps {
  embedded?: boolean;
}

export default function Profile({ embedded = false }: ProfileProps) {
  const { user } = useAuth();
  const { data: profile, isLoading, refetch } = useProfile();
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const handleEdit = () => {
    setDisplayName(profile?.display_name || "");
    setBio(profile?.bio || "");
    setIsEditing(true);
  };
  
  const handleCancel = () => {
    setIsEditing(false);
  };
  
  const handleSave = async () => {
    try {
      setIsSaving(true);
      const { data, error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          bio: bio
        })
        .eq('id', user?.id);
      
      if (error) throw error;
      
      toast.success("Profile updated successfully");
      setIsEditing(false);
      refetch();
    } catch (error: any) {
      toast.error(`Error updating profile: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const content = (
    <div className="space-y-6">
      {!embedded && (
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Profile</h2>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>
      )}

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Profile Information</CardTitle>
              {!isEditing ? (
                <Button variant="outline" onClick={handleEdit}>Edit Profile</Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
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
                  <Label htmlFor="displayName">Display Name</Label>
                  {isLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Input
                      id="displayName"
                      value={isEditing ? displayName : (profile?.display_name || '')}
                      disabled={!isEditing}
                      onChange={(e) => setDisplayName(e.target.value)}
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
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  {isLoading ? (
                    <Skeleton className="h-24 w-full" />
                  ) : (
                    <textarea
                      id="bio"
                      className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      value={isEditing ? bio : (profile?.bio || '')}
                      disabled={!isEditing}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself"
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <DashboardLayout>
      {content}
    </DashboardLayout>
  );
}

import { supabase } from "@/integrations/supabase/client";
