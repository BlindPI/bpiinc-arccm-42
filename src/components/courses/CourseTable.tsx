import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Calendar, Users, Search, Clock } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useCourseData } from '@/hooks/useCourseData';
import { EnhancedCourseForm } from './EnhancedCourseForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Course } from '@/types/courses';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';

interface CourseTableProps {
  courses?: Course[];
  isLoading?: boolean;
  showActions?: boolean;
  filters?: {
    search?: string;
    status?: 'ACTIVE' | 'INACTIVE';
  };
}

export function CourseTable({ courses: propCourses, isLoading: propIsLoading, showActions = true, filters }: CourseTableProps) {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const { data: profile } = useProfile();
  
  // Use either passed courses or fetch from hook
  const { data: fetchedCourses, isLoading: fetchedIsLoading } = useCourseData();
  const courses = propCourses || fetchedCourses || [];
  const isLoading = propIsLoading ?? fetchedIsLoading;
  
  // Apply filters if provided
  const filteredCourses = filters ? courses.filter(course => {
    if (filters.search && !course.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !course.description?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.status && course.status !== filters.status) {
      return false;
    }
    return true;
  }) : courses;

  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);

  if (isLoading) {
    return (
      <Card className="border border-border/50 shadow-sm">
        <div className="text-center py-8 text-muted-foreground">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p>Loading courses...</p>
        </div>
      </Card>
    );
  }

  if (filteredCourses.length === 0) {
    return (
      <Card className="border border-border/50 shadow-sm">
        <div className="text-center py-12 px-4">
          <Search className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-1">No courses found</h3>
          <p className="text-muted-foreground">Try adjusting your search criteria</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border border-border/50 shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Course Name</TableHead>
            <TableHead className="font-semibold">Description</TableHead>
            <TableHead className="font-semibold">Duration</TableHead>
            <TableHead className="font-semibold">Expiration</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Created</TableHead>
            {showActions && <TableHead className="text-right font-semibold">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCourses.map((course) => (
            <TableRow key={course.id} className="hover:bg-muted/30 transition-colors">
              <TableCell className="font-medium">{course.name}</TableCell>
              <TableCell className="max-w-xs truncate">
                {course.description || '-'}
              </TableCell>
              <TableCell>
                {course.length ? (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{course.length} min</span>
                  </div>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>
                {course.expiration_months ? `${course.expiration_months} months` : '-'}
              </TableCell>
              <TableCell>
                <Badge 
                  variant={course.status === 'ACTIVE' ? 'success' : 'secondary'}
                  className="font-medium"
                >
                  {course.status}
                </Badge>
              </TableCell>
              <TableCell>
                {format(new Date(course.created_at), 'MMM d, yyyy')}
              </TableCell>
              {showActions && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCourse(course)}
                        className="hover:bg-primary/10"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="hover:bg-primary/10"
                    >
                      <Calendar className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="hover:bg-primary/10"
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog 
        open={!!selectedCourse} 
        onOpenChange={(open) => !open && setSelectedCourse(null)}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
          </DialogHeader>
          <EnhancedCourseForm
            onSuccess={() => setSelectedCourse(null)}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}