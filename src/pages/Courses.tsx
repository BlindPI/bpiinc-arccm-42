
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
            Create and manage courses and course offerings
          </p>
        </div>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full max-w-[600px] grid-cols-3">
            <TabsTrigger value="list">Course List</TabsTrigger>
            <TabsTrigger value="new-course">New Course</TabsTrigger>
            <TabsTrigger value="new-offering">New Offering</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="mt-6">
            <CourseTable />
          </TabsContent>
          
          <TabsContent value="new-course" className="mt-6">
            <div className="max-w-2xl mx-auto">
              <CourseForm />
            </div>
          </TabsContent>

          <TabsContent value="new-offering" className="mt-6">
            <div className="max-w-2xl mx-auto">
              <CourseOfferingForm />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
