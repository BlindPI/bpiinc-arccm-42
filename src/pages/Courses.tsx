
import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CourseTable } from "@/components/CourseTable";
import { CourseForm } from "@/components/courses/CourseForm";
import { CourseOfferingForm } from "@/components/CourseOfferingForm";
import { LocationTable } from "@/components/LocationTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from 'react-router-dom';
import { GraduationCap, Loader2, Plus, Calendar, MapPin, BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { PageHeader } from "@/components/ui/PageHeader";

export default function Courses() {
  const {
    user,
    loading: authLoading
  } = useAuth();
  const {
    data: profile,
    isLoading: profileLoading
  } = useProfile();

  const isMobile = useIsMobile();
  const [showCourseForm, setShowCourseForm] = useState(false);

  if (!authLoading && !user) {
    return <Navigate to="/auth" />;
  }

  if (authLoading || profileLoading) {
    return <DashboardLayout>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>;
  }

  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
  if (!isAdmin) {
    return <DashboardLayout>
        <div className="flex flex-col gap-6">
          <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
          <p className="text-muted-foreground">
            You do not have permission to access this page.
          </p>
        </div>
      </DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader 
          icon={<GraduationCap className="h-7 w-7 text-primary" />} 
          title="Course Management" 
          subtitle="Manage course catalogue, schedule course offerings, and manage locations" 
          actions={!showCourseForm && 
            <Button 
              onClick={() => setShowCourseForm(true)} 
              className="gap-1.5 bg-primary hover:bg-primary-600 text-white"
            >
              <Plus className="h-4 w-4" />
              Add Course
            </Button>
          } 
        />

        {showCourseForm && (
          <Card className="mb-6 border border-border/50 shadow-md bg-gradient-to-br from-card to-muted/20">
            <CardHeader className="space-y-1.5">
              <CardTitle className="text-2xl font-semibold">Add New Course</CardTitle>
              <CardDescription className="text-muted-foreground">
                Create a new course in the catalogue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CourseForm />
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="catalog" className="w-full">
          <TabsList gradient="bg-gradient-to-r from-primary/90 to-primary" className="grid w-full max-w-[600px] grid-cols-2 p-1 rounded-lg shadow-md">
            <TabsTrigger 
              value="catalog" 
              className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center gap-2 text-white transition-all"
            >
              <BookOpen className="h-4 w-4" />
              Course Catalogue
            </TabsTrigger>
            <TabsTrigger 
              value="offerings" 
              className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center gap-2 text-white transition-all"
            >
              <Calendar className="h-4 w-4" />
              Course Offerings
            </TabsTrigger>
            
          </TabsList>
          
          <TabsContent value="catalog" className="space-y-6 mt-6">
            <CourseTable />
          </TabsContent>

          <TabsContent value="offerings" className="mt-6">
            <div className="mx-auto">
              <CourseOfferingForm />
            </div>
          </TabsContent>

          <TabsContent value="locations" className="mt-6">
            <LocationTable />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
