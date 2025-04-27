import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Trash2, Power, Eye, FileText, Timer, Calendar, Search, Pencil } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCourseData } from '@/hooks/useCourseData';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Course } from '@/types/supabase-schema';
import { EditCourseDialog } from './EditCourseDialog';
export function CourseTable() {
  const queryClient = useQueryClient();
  const {
    data: courses,
    isLoading
  } = useCourseData();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
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
      queryClient.invalidateQueries({
        queryKey: ['courses']
      });
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
      queryClient.invalidateQueries({
        queryKey: ['courses']
      });
      toast.success('Course deleted successfully');
    },
    onError: error => {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    }
  });
  const filteredCourses = courses?.filter(course => course.name.toLowerCase().includes(searchTerm.toLowerCase()) || course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()));
  if (isLoading) {
    return <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-2">
          {Array(5).fill(0).map((_, i) => <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-12 w-full" />
            </div>)}
        </CardContent>
      </Card>;
  }
  return <Card className="shadow-md">
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
            <Input type="search" placeholder="Search courses..." className="pl-8" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-medium">Name</TableHead>
                <TableHead className="font-medium">Description</TableHead>
                <TableHead className="font-medium">Certification Details</TableHead>
                <TableHead className="font-medium w-[140px]">Duration</TableHead>
                <TableHead className="font-medium w-[100px]">Status</TableHead>
                <TableHead className="font-medium text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCourses?.length === 0 ? <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No courses found. Try adjusting your search or create a new course.
                  </TableCell>
                </TableRow> : filteredCourses?.map(course => <TableRow key={course.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{course.name}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="line-clamp-2 text-sm">
                        {course.description || 'No description provided'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {course.first_aid_level || course.cpr_level ? <div className="space-y-1">
                          {course.first_aid_level && <Badge variant="outline" className="mr-2">
                              {course.first_aid_level}
                            </Badge>}
                          {course.cpr_level && <Badge variant="outline">
                              {course.cpr_level}
                            </Badge>}
                        </div> : <span className="text-muted-foreground text-sm">No specific certification</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Timer className="h-4 w-4 text-muted-foreground" />
                        <span>{course.expiration_months} month{course.expiration_months !== 1 ? 's' : ''}</span>
                      </div>
                      {course.length && <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                          <Timer className="h-3 w-3" />
                          <span>{course.length} hours</span>
                        </div>}
                      {course.created_at && <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Created {format(new Date(course.created_at), 'MMM d, yyyy')}</span>
                        </div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={course.status === 'ACTIVE' ? 'default' : 'outline'} className={course.status === 'ACTIVE' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-gray-100 text-gray-800 hover:bg-gray-100'}>
                        {course.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => setEditingCourse(course)} title="Edit Course">
                          <Pencil className="h-4 w-4 text-blue-500" />
                        </Button>

                        <Button variant="outline" size="icon" onClick={() => toggleStatus.mutate({
                    id: course.id,
                    newStatus: course.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
                  })} title={course.status === 'ACTIVE' ? 'Deactivate Course' : 'Activate Course'}>
                          <Power className={`h-4 w-4 ${course.status === 'ACTIVE' ? 'text-green-500' : 'text-red-500'}`} />
                        </Button>

                        <Button variant="outline" size="icon" title="View Details">
                          <Eye className="h-4 w-4 text-blue-500" />
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
                              <AlertDialogAction onClick={() => deleteCourse.mutate(course.id)} className="bg-red-500 hover:bg-red-600 text-white">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>)}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t p-4 bg-muted/10">
        <div className="text-sm text-muted-foreground">
          Showing {filteredCourses?.length || 0} of {courses?.length || 0} courses
        </div>
        <Button variant="outline" className="gap-1">
          <FileText className="h-4 w-4" />
          Export
        </Button>
      </CardFooter>

      {editingCourse && <EditCourseDialog course={editingCourse} open={Boolean(editingCourse)} onOpenChange={open => {
      if (!open) setEditingCourse(null);
    }} />}
    </Card>;
}