
import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { ProfileEditor } from "@/components/user-management/ProfileEditor";
import { ProfileHeader } from "@/components/user-management/ProfileHeader";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ContactInfo } from "@/components/user-management/ContactInfo";
import { PreferencesPanel } from "@/components/user-management/PreferencesPanel";
import { ActivityLog } from "@/components/user-management/ActivityLog";
import { SecuritySettings } from "@/components/user-management/SecuritySettings";

export default function UserManagement() {
  const { user } = useAuth();
  const { data: profile, isLoading, refetch } = useProfile();
  const [activeTab, setActiveTab] = useState("profile");
  
  const handleProfileUpdate = async () => {
    toast.success("Profile updated successfully");
    await refetch();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
        </div>
        
        <ProfileHeader profile={profile} onUpdateSuccess={handleProfileUpdate} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 sm:w-[400px]">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card className="p-6">
              <ProfileEditor 
                profile={profile}
                onUpdateSuccess={handleProfileUpdate}
              />
            </Card>
          </TabsContent>
          
          <TabsContent value="contact">
            <Card className="p-6">
              <ContactInfo
                profile={profile}
                onUpdateSuccess={handleProfileUpdate}
              />
            </Card>
          </TabsContent>
          
          <TabsContent value="preferences">
            <Card className="p-6">
              <PreferencesPanel
                profile={profile}
                onUpdateSuccess={handleProfileUpdate}
              />
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <Card className="p-6">
              <SecuritySettings
                user={user}
                profile={profile}
              />
              <ActivityLog userId={user?.id} className="mt-8" />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
