
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Trash2, Power, Pencil, Search, Award, ActivitySquare } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useSimplifiedCourseData } from '@/hooks/useSimplifiedCourseData';
import { Skeleton } from '@/components/ui/skeleton';
import { Course } from '@/types/courses';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EnhancedCourseForm } from './EnhancedCourseForm';

export function SimplifiedCourseTable() {
  const queryClient = useQueryClient();
  const {
    data: courses = [],
    isLoading,
    error
  } = useSimplifiedCourseData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Error handling
  if (error) {
    console.error('Error loading courses:', error);
  }

  const toggleStatus = useMutation({
    mutationFn: async ({
      id,
      newStatus
    }: {
      id: string;
      newStatus: 'ACTIVE' | 'INACTIVE';
    }) => {
      const {
        error
      } = await supabase.from('courses').update({
        status: newStatus
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simplified-courses'] });
      toast.success('Course status updated successfully');
    },
    onError: error => {
      console.error('Error updating course status:', error);
      toast.error('Failed to update course status');
    }
  });

  const deleteCourse = useMutation({
    mutationFn: async (id: string) => {
      const {
        error
      } = await supabase.from('courses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simplified-courses'] });
      toast.success('Course deleted successfully');
    },
    onError: error => {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    }
  });

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
                  <TableHead className="font-medium text-right w-[120px]">Actions</TableHead>
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
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => toggleStatus.mutate({
                              id: course.id,
                              newStatus: course.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
                            })} 
                            title={course.status === 'ACTIVE' ? 'Deactivate Course' : 'Activate Course'}
                          >
                            <Power className={`h-4 w-4 ${course.status === 'ACTIVE' ? 'text-green-500' : 'text-red-500'}`} />
                          </Button>

                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => setIsEditDialogOpen(true)}
                            title="Edit Course"
                          >
                            <Pencil className="h-4 w-4 text-blue-500" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="icon" title="Delete Course">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Course</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this course? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteCourse.mutate(course.id)} 
                                  className="bg-red-500 hover:bg-red-600 text-white"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
          </DialogHeader>
          <EnhancedCourseForm onSuccess={() => setIsEditDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
