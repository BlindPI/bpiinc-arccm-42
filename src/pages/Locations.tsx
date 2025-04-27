
import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { LocationTable } from "@/components/LocationTable";
import { LocationForm } from "@/components/LocationForm";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from 'react-router-dom';
import { Loader2, MapPin, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";

export default function Locations() {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const [showForm, setShowForm] = useState(false);
  
  if (!authLoading && !user) {
    return <Navigate to="/auth" />;
  }

  if (authLoading || profileLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
          <p className="text-muted-foreground">
            You do not have permission to access this page.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          icon={<MapPin className="h-7 w-7 text-primary" />}
          title="Location Management"
          subtitle="Add, edit, and manage training locations"
          actions={
            <Button 
              onClick={() => setShowForm(!showForm)}
              className="gap-2 bg-primary hover:bg-primary-600 text-white"
            >
              <Plus className="h-4 w-4" />
              Add Location
            </Button>
          }
        />

        {showForm && (
          <Card className="mb-6 border border-border/50 shadow-md bg-gradient-to-br from-card to-muted/20">
            <div className="p-6">
              <LocationForm onComplete={() => setShowForm(false)} />
            </div>
          </Card>
        )}

        <Tabs defaultValue="all" className="w-full">
          <TabsList 
            className="grid w-full max-w-[400px] grid-cols-3 p-1 rounded-lg shadow-md"
            gradient="bg-gradient-to-r from-primary/90 to-primary"
          >
            <TabsTrigger 
              value="all"
              className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center gap-2 text-white transition-all"
            >
              All Locations
            </TabsTrigger>
            <TabsTrigger 
              value="active"
              className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center gap-2 text-white transition-all"
            >
              Active Locations
            </TabsTrigger>
            <TabsTrigger 
              value="search"
              className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center gap-2 text-white transition-all"
            >
              Search
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            <LocationTable />
          </TabsContent>
          
          <TabsContent value="active" className="mt-6">
            <LocationTable filters={{ status: 'ACTIVE' }} />
          </TabsContent>
          
          <TabsContent value="search" className="mt-6">
            <LocationTable showSearch />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
