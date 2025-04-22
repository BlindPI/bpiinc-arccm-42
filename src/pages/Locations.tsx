
import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { LocationTable } from "@/components/LocationTable";
import { LocationForm } from "@/components/LocationForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from 'react-router-dom';
import { Loader2, MapPin, Plus, Search } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { LocationSearch } from "@/components/LocationSearch";
import { PageHeader } from "@/components/ui/PageHeader";

export default function Locations() {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const isMobile = useIsMobile();
  const [showForm, setShowForm] = useState(false);
  const [searchFilters, setSearchFilters] = useState<{ search?: string; city?: string }>({});
  
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
            <Button onClick={() => setShowForm(!showForm)} className="gap-1">
              <Plus className="h-4 w-4" />
              {showForm ? "Hide Form" : "Add Location"}
            </Button>
          }
        />

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Location</CardTitle>
              <CardDescription>
                Enter the details for a new training location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LocationForm onComplete={() => setShowForm(false)} />
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full max-w-[500px] grid-cols-3">
            <TabsTrigger value="all">All Locations</TabsTrigger>
            <TabsTrigger value="active">Active Locations</TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
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
            <LocationSearch onSearch={setSearchFilters} className="mb-4" />
            <LocationTable filters={searchFilters} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
