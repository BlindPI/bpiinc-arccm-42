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
  return <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader icon={<GraduationCap className="h-7 w-7 text-primary" />} title="Course Management" subtitle="Manage course catalog, schedule course offerings, and manage locations" actions={!showCourseForm && <Button onClick={() => setShowCourseForm(true)} className="gap-1">
                <Plus className="h-4 w-4" />
                Add Course
              </Button>} />

        {showCourseForm && <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Course</CardTitle>
              <CardDescription>
                Create a new course in the catalog
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CourseForm />
            </CardContent>
          </Card>}

        <Tabs defaultValue="catalog" className="w-full">
          <TabsList gradient="bg-gradient-to-r from-blue-500 to-teal-400" className="grid w-full max-w-[600px] grid-cols-2">
            <TabsTrigger value="catalog" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Course Catalog
            </TabsTrigger>
            <TabsTrigger value="offerings" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Course Offerings
            </TabsTrigger>
            
          </TabsList>
          
          <TabsContent value="catalog" className="space-y-6 mt-6">
            <CourseTable />
          </TabsContent>

          <TabsContent value="offerings" className="mt-6">
            <div className="max-w-3xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Schedule a Course Offering</CardTitle>
                  <CardDescription>
                    Set up a new course offering with dates, location, and instructor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CourseOfferingForm />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="locations" className="mt-6">
            <LocationTable />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>;
}