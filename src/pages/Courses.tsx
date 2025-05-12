
import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { SimplifiedCourseTable } from "@/components/courses/SimplifiedCourseTable";
import { EnhancedCourseForm } from "@/components/courses/EnhancedCourseForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from 'react-router-dom';
import { GraduationCap, Loader2, Plus, Calendar, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";

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

  const handleFormSuccess = () => {
    setShowCourseForm(false);
    // Could also show a success notification here
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader 
          icon={<GraduationCap className="h-7 w-7 text-primary" />} 
          title="Course Management" 
          subtitle="Manage courses with simplified workflow" 
          actions={!showCourseForm && 
            <Button 
              onClick={() => setShowCourseForm(true)} 
              className="gap-1.5 bg-primary hover:bg-primary/90 text-white"
            >
              <Plus className="h-4 w-4" />
              Add Course
            </Button>
          } 
        />

        {showCourseForm && (
          <Card className="mb-6 border border-border/50 shadow-md bg-gradient-to-br from-card to-muted/20">
            <CardContent className="pt-6">
              <EnhancedCourseForm onSuccess={handleFormSuccess} />
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="catalog" onValueChange={handleTabChange} className="w-full">
          <TabsList gradient="bg-gradient-to-r from-primary/90 to-primary" className="grid w-full max-w-[400px] grid-cols-2 p-1 rounded-lg shadow-md">
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
            <SimplifiedCourseTable />
          </TabsContent>

          <TabsContent value="offerings" className="mt-6">
            <div className="flex items-center justify-center p-8 bg-muted/20 rounded-lg border border-dashed">
              <p className="text-muted-foreground">Course offerings will be implemented in the next phase</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
