
import { DashboardLayout } from "@/components/DashboardLayout";
import { CourseTable } from "@/components/CourseTable";
import { CourseForm } from "@/components/CourseForm";
import { CourseOfferingForm } from "@/components/CourseOfferingForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from 'react-router-dom';
import { Loader2 } from "lucide-react";

export default function Courses() {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  
  // If not authenticated, redirect to auth page
  if (!authLoading && !user) {
    return <Navigate to="/auth" />;
  }

  // Show loading state while checking auth
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
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Course Management</h1>
          <p className="text-muted-foreground">
            Manage course catalog and schedule course offerings
          </p>
        </div>

        <Tabs defaultValue="catalog" className="w-full">
          <TabsList className="grid w-full max-w-[600px] grid-cols-2">
            <TabsTrigger value="catalog">Course Catalog</TabsTrigger>
            <TabsTrigger value="offerings">Course Offerings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="catalog" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <CourseTable />
              </div>
              <div className="md:col-span-2">
                <CourseForm />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="offerings" className="mt-6">
            <div className="max-w-2xl mx-auto">
              <CourseOfferingForm />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
