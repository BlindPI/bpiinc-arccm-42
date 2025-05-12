import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Trash2, Power, Pencil, Search, Award, ActivitySquare, FileHistory } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useSimplifiedCourseData } from '@/hooks/useSimplifiedCourseData';
import { Skeleton } from '@/components/ui/skeleton';
import { Course } from '@/types/courses';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EnhancedCourseForm } from './EnhancedCourseForm';
import { Textarea } from '@/components/ui/textarea';
import { useToggleCourseStatus, useDeleteCourse } from '@/hooks/useUpdateCourse';
import { Label } from '@/components/ui/label';
import { AuditLogsDialog } from './AuditLogsDialog';
import { useProfile } from '@/hooks/useProfile';

export function SimplifiedCourseTable() {
  const queryClient = useQueryClient();
  const {
    data: courses = [],
    isLoading,
    error
  } = useSimplifiedCourseData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAuditLogDialogOpen, setIsAuditLogDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [statusChangeReason, setStatusChangeReason] = useState('');
  
  const { data: profile } = useProfile();
  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
  
  const toggleStatus = useToggleCourseStatus();
  const deleteCourse = useDeleteCourse();

  // Error handling
  if (error) {
    console.error('Error loading courses:', error);
  }

  const filteredCourses = courses.filter(course => 
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (course.first_aid_level && course.first_aid_level.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (course.cpr_level && course.cpr_level.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Helper function to render certification badges
  const renderCertificationBadges = (course: Course) => {
    const badges = [];
    
    if (course.first_aid_level) {
      badges.push(
        <div key="first-aid" className="flex items-center gap-1.5">
          <Award className="h-4 w-4 text-green-600" />
          <Badge variant="outline" className="bg-green-50 text-green-700">
            {course.first_aid_level}
          </Badge>
        </div>
      );
    }
    
    if (course.cpr_level) {
      badges.push(
        <div key="cpr" className="flex items-center gap-1.5">
          <ActivitySquare className="h-4 w-4 text-orange-600" />
          <Badge variant="outline" className="bg-orange-50 text-orange-700">
            {course.cpr_level}
          </Badge>
        </div>
      );
    }
    
    return badges.length > 0 ? (
      <div className="space-y-1.5">{badges}</div>
    ) : (
      <span className="text-muted-foreground text-sm italic">None</span>
    );
  };

  // Helper function to handle course selection
  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
  };

  // Function to handle audit log viewing
  const handleViewAuditLogs = (course: Course) => {
    setSelectedCourse(course);
    setIsAuditLogDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-2">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Course Catalogue</CardTitle>
              <CardDescription>
                Manage your course offerings and their details
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Search courses..." 
                className="pl-8" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-medium">Name</TableHead>
                  <TableHead className="font-medium">Type</TableHead>
                  <TableHead className="font-medium">Certification Details</TableHead>
                  <TableHead className="font-medium w-[100px]">Expiration</TableHead>
                  <TableHead className="font-medium w-[100px]">Status</TableHead>
                  <TableHead className="font-medium text-right w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No courses found. Try adjusting your search or create a new course.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCourses.map(course => (
                    <TableRow key={course.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">
                        <div>
                          {course.name}
                        </div>
                        {course.description && (
                          <div className="line-clamp-2 text-sm text-muted-foreground">
                            {course.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {course.course_type ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {course.course_type.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {renderCertificationBadges(course)}
                      </TableCell>
                      <TableCell>
                        {course.expiration_months} months
                      </TableCell>
                      <TableCell>
                        <Badge variant={course.status === 'ACTIVE' ? 'default' : 'outline'} className={course.status === 'ACTIVE' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-gray-100 text-gray-800 hover:bg-gray-100'}>
                          {course.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {isAdmin && (
                            <>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    title={course.status === 'ACTIVE' ? 'Deactivate Course' : 'Activate Course'}
                                    onClick={() => handleSelectCourse(course)}
                                  >
                                    <Power className={`h-4 w-4 ${course.status === 'ACTIVE' ? 'text-green-500' : 'text-red-500'}`} />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      {course.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} Course
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to {course.status === 'ACTIVE' ? 'deactivate' : 'activate'} "{course.name}"?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  
                                  <div className="space-y-2 py-2">
                                    <Label htmlFor="statusReason">Reason (optional):</Label>
                                    <Textarea 
                                      id="statusReason" 
                                      value={statusChangeReason} 
                                      onChange={e => setStatusChangeReason(e.target.value)} 
                                      placeholder="Enter reason for status change"
                                      className="min-h-[80px]"
                                    />
                                  </div>
                                  
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setStatusChangeReason('')}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => {
                                        toggleStatus.mutate({
                                          id: selectedCourse?.id || course.id,
                                          status: course.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                                          reason: statusChangeReason
                                        });
                                        setStatusChangeReason('');
                                      }} 
                                      className={course.status === 'ACTIVE' ? "bg-amber-500 hover:bg-amber-600" : "bg-green-500 hover:bg-green-600"}
                                    >
                                      {course.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>

                              <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={() => {
                                  setSelectedCourse(course);
                                  setIsEditDialogOpen(true);
                                }}
                                title="Edit Course"
                              >
                                <Pencil className="h-4 w-4 text-blue-500" />
                              </Button>
                            </>
                          )}
                          
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleViewAuditLogs(course)}
                            title="View Audit History"
                          >
                            <FileHistory className="h-4 w-4 text-violet-500" />
                          </Button>
                          
                          {isAdmin && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  title="Delete Course"
                                  onClick={() => handleSelectCourse(course)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Course</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{course.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                
                                <div className="space-y-2 py-2">
                                  <Label htmlFor="deleteReason">Reason for deletion:</Label>
                                  <Textarea 
                                    id="deleteReason" 
                                    value={deleteReason} 
                                    onChange={e => setDeleteReason(e.target.value)} 
                                    placeholder="Please provide a reason for this deletion"
                                    className="min-h-[80px]"
                                  />
                                </div>
                                
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setDeleteReason('')}>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => {
                                      deleteCourse.mutate({
                                        id: selectedCourse?.id || course.id,
                                        reason: deleteReason
                                      });
                                      setDeleteReason('');
                                    }} 
                                    className="bg-red-500 hover:bg-red-600 text-white"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedCourse && (
        <>
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Edit Course</DialogTitle>
              </DialogHeader>
              <EnhancedCourseForm 
                onSuccess={() => setIsEditDialogOpen(false)} 
                course={selectedCourse}
                mode="edit"
              />
            </DialogContent>
          </Dialog>
          
          <AuditLogsDialog 
            open={isAuditLogDialogOpen}
            onOpenChange={setIsAuditLogDialogOpen}
            courseId={selectedCourse.id}
            courseName={selectedCourse.name}
          />
        </>
      )}
    </>
  );
}
