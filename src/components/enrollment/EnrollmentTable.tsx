
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, UserCheck, UserX, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Enrollment } from '@/types/enrollment';
import { formatDistanceToNow } from 'date-fns';
import { useUpdateAttendance, useCancelEnrollment } from '@/hooks/useEnrollment';
import { toast } from 'sonner';

interface EnrollmentTableProps {
  enrollments: Array<Enrollment & {
    profiles?: { display_name: string; email: string | null };
    course_offerings?: {
      start_date: string;
      end_date: string;
      courses: { name: string };
      locations: { name: string; address: string | null; city: string | null } | null;
    };
  }>;
  isLoading: boolean;
  compact?: boolean;
  searchTerm?: string;
}

export function EnrollmentTable({ 
  enrollments, 
  isLoading, 
  compact = false,
  searchTerm = ''
}: EnrollmentTableProps) {
  const updateAttendance = useUpdateAttendance();
  const cancelEnrollment = useCancelEnrollment();

  const filteredEnrollments = enrollments.filter(enrollment => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      enrollment.profiles?.display_name?.toLowerCase().includes(searchLower) ||
      enrollment.profiles?.email?.toLowerCase().includes(searchLower) ||
      enrollment.course_offerings?.courses?.name?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ENROLLED':
        return 'default';
      case 'WAITLISTED':
        return 'secondary';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getAttendanceColor = (attendance: string | null) => {
    switch (attendance) {
      case 'PRESENT':
        return 'success';
      case 'ABSENT':
        return 'destructive';
      case 'LATE':
        return 'secondary';
      case 'EXCUSED':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const handleAttendanceUpdate = (enrollmentId: string, attendance: Enrollment['attendance']) => {
    updateAttendance.mutate({ enrollmentId, attendance });
  };

  const handleCancelEnrollment = (enrollmentId: string) => {
    cancelEnrollment.mutate(enrollmentId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student</TableHead>
          {!compact && <TableHead>Course</TableHead>}
          <TableHead>Status</TableHead>
          {!compact && <TableHead>Attendance</TableHead>}
          <TableHead>Enrolled</TableHead>
          {!compact && <TableHead>Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredEnrollments.map((enrollment) => (
          <TableRow key={enrollment.id}>
            <TableCell className="font-medium">
              <div>
                <div>{enrollment.profiles?.display_name || 'Unknown'}</div>
                {!compact && (
                  <div className="text-sm text-muted-foreground">
                    {enrollment.profiles?.email}
                  </div>
                )}
              </div>
            </TableCell>
            {!compact && (
              <TableCell>
                <div>
                  <div className="font-medium">
                    {enrollment.course_offerings?.courses?.name}
                  </div>
                  {enrollment.course_offerings?.locations && (
                    <div className="text-sm text-muted-foreground">
                      {enrollment.course_offerings.locations.name}
                    </div>
                  )}
                </div>
              </TableCell>
            )}
            <TableCell>
              <Badge variant={getStatusColor(enrollment.status)}>
                {enrollment.status}
              </Badge>
              {enrollment.status === 'WAITLISTED' && enrollment.waitlist_position && (
                <div className="text-xs text-muted-foreground mt-1">
                  Position #{enrollment.waitlist_position}
                </div>
              )}
            </TableCell>
            {!compact && (
              <TableCell>
                {enrollment.attendance ? (
                  <Badge variant={getAttendanceColor(enrollment.attendance)}>
                    {enrollment.attendance}
                  </Badge>
                ) : (
                  <Badge variant="outline">Not marked</Badge>
                )}
              </TableCell>
            )}
            <TableCell>
              {formatDistanceToNow(new Date(enrollment.enrollment_date), { addSuffix: true })}
            </TableCell>
            {!compact && (
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleAttendanceUpdate(enrollment.id, 'PRESENT')}
                    >
                      <UserCheck className="mr-2 h-4 w-4" />
                      Mark Present
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleAttendanceUpdate(enrollment.id, 'ABSENT')}
                    >
                      <UserX className="mr-2 h-4 w-4" />
                      Mark Absent
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleAttendanceUpdate(enrollment.id, 'LATE')}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Mark Late
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleCancelEnrollment(enrollment.id)}
                      className="text-destructive"
                    >
                      Cancel Enrollment
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            )}
          </TableRow>
        ))}
        {filteredEnrollments.length === 0 && (
          <TableRow>
            <TableCell colSpan={compact ? 3 : 6} className="text-center py-8">
              No enrollments found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
