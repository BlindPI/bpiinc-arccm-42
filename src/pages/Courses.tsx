
import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CourseTable } from "@/components/CourseTable";
import { SimplifiedCourseForm } from "@/components/courses/SimplifiedCourseForm";
import { CourseOfferingForm } from "@/components/CourseOfferingForm";
import { LocationTable } from "@/components/LocationTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from 'react-router-dom';
import { GraduationCap, Loader2, Plus, Calendar, MapPin, BookOpen, Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { CourseSettings } from "@/components/courses/CourseSettings";

export default function Courses() {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const [showCourseForm, setShowCourseForm] = useState(false);

  // Loading state
  if (authLoading || profileLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Authentication check
  if (!user) {
    return <Navigate to="/auth" />;
  }

  // Admin access check
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

  // Hide form when tab changes
  const handleTabChange = (value: string) => {
    if (value !== 'catalog') {
      setShowCourseForm(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader 
          icon={<GraduationCap className="h-7 w-7 text-primary" />} 
          title="Course Management" 
          subtitle="Manage courses, schedule offerings, and update course settings" 
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
            <CardContent className="pt-6">
              <SimplifiedCourseForm onSuccess={() => setShowCourseForm(false)} />
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="catalog" onValueChange={handleTabChange} className="w-full">
          <TabsList gradient="bg-gradient-to-r from-primary/90 to-primary" className="grid w-full max-w-[600px] grid-cols-3 p-1 rounded-lg shadow-md">
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
            <TabsTrigger 
              value="settings" 
              className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center gap-2 text-white transition-all"
            >
              <Settings className="h-4 w-4" />
              Course Settings
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

          <TabsContent value="settings" className="mt-6">
            <CourseSettings />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
