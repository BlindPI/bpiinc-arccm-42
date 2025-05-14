
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Profile from "./Profile";
import Settings from "./Settings";
import CertificateVerification from "./CertificateVerification";

export default function UserManagementPage() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>(searchParams.get("tab") || "profile");
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage your profile, settings, and certificate verification in one place.
          </p>
        </div>

        <Tabs 
          value={activeTab} 
          onValueChange={handleTabChange}
          className="space-y-4"
          defaultValue="profile"
        >
          <Card>
            <CardHeader>
              <CardTitle>User Dashboard</CardTitle>
              <CardDescription>
                {user?.email} - {profile?.role || "No role assigned"}
              </CardDescription>
              <TabsList className="mt-2">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="verification">Certificate Verification</TabsTrigger>
              </TabsList>
            </CardHeader>
          </Card>

          <TabsContent value="profile" className="mt-6">
            <Profile embedded={true} />
          </TabsContent>
          
          <TabsContent value="settings" className="mt-6">
            <Settings embedded={true} />
          </TabsContent>
          
          <TabsContent value="verification" className="mt-6">
            <CertificateVerification embedded={true} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
