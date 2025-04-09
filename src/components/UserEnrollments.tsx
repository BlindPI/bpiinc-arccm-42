
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserEnrollments, useCancelEnrollment } from '@/hooks/useEnrollment';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, Clock, MapPin, X, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function UserEnrollments() {
  const { data: enrollments, isLoading } = useUserEnrollments();
  const cancelEnrollment = useCancelEnrollment();
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Enrollments</CardTitle>
          <CardDescription>View your course enrollments</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  if (!enrollments || enrollments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Enrollments</CardTitle>
          <CardDescription>View your course enrollments</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">You are not currently enrolled in any courses.</p>
          <Button className="mt-4">Browse Courses</Button>
        </CardContent>
      </Card>
    );
  }
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ENROLLED':
        return 'default';
      case 'WAITLISTED':
        return 'warning';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };
  
  const getAttendanceBadgeVariant = (attendance: string | null) => {
    if (!attendance) return 'secondary';
    
    switch (attendance) {
      case 'PRESENT':
        return 'success';
      case 'ABSENT':
        return 'destructive';
      case 'LATE':
        return 'warning';
      case 'EXCUSED':
        return 'default';
      default:
        return 'secondary';
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Enrollments</CardTitle>
        <CardDescription>View your course enrollments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {enrollments.map(enrollment => (
            <Card key={enrollment.id} className="overflow-hidden">
              <div className="bg-muted px-4 py-2 flex justify-between items-center">
                <div className="font-medium">
                  {enrollment.course_offerings.courses.name}
                </div>
                <Badge variant={getStatusBadgeVariant(enrollment.status)}>
                  {enrollment.status}
                </Badge>
              </div>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(enrollment.course_offerings.start_date), 'PPP')} - {format(new Date(enrollment.course_offerings.end_date), 'PPP')}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(enrollment.course_offerings.start_date), 'p')} - {format(new Date(enrollment.course_offerings.end_date), 'p')}
                    </span>
                  </div>
                  
                  {enrollment.course_offerings.locations && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {enrollment.course_offerings.locations.name}, {enrollment.course_offerings.locations.city}
                      </span>
                    </div>
                  )}
                  
                  {enrollment.attendance && (
                    <div className="mt-2">
                      <Badge variant={getAttendanceBadgeVariant(enrollment.attendance)}>
                        Attendance: {enrollment.attendance}
                      </Badge>
                    </div>
                  )}
                  
                  {enrollment.status === 'WAITLISTED' && enrollment.waitlist_position && (
                    <div className="mt-2 text-sm">
                      <span className="text-amber-600 font-medium">
                        Waitlist Position: {enrollment.waitlist_position}
                      </span>
                    </div>
                  )}
                  
                  {['ENROLLED', 'WAITLISTED'].includes(enrollment.status) && (
                    <div className="mt-4 flex justify-end">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <X className="h-4 w-4 mr-2" />
                            Cancel Enrollment
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Enrollment</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to cancel your enrollment for this course? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep Enrollment</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => cancelEnrollment.mutate(enrollment.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              {cancelEnrollment.isPending ? 'Cancelling...' : 'Yes, Cancel'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
