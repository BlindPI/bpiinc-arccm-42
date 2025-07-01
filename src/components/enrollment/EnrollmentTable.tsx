
import React, { useState } from 'react';
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
import { MoreHorizontal, UserCheck, UserX, Clock, CheckCircle, XCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Enrollment } from '@/types/enrollment';
import { formatDistanceToNow } from 'date-fns';
import { useUpdateAttendance, useCancelEnrollment } from '@/hooks/useEnrollment';
import { type EnrollmentWithDetails } from '@/services/enrollment/enrollmentService';

interface EnrollmentTableProps {
  enrollments: EnrollmentWithDetails[];
  isLoading: boolean;
  compact?: boolean;
  searchTerm?: string;
  onApprove?: (enrollmentId: string) => void;
  onReject?: (enrollmentId: string, reason: string) => void;
}

export function EnrollmentTable({ 
  enrollments, 
  isLoading, 
  compact = false,
  searchTerm = '',
  onApprove,
  onReject
}: EnrollmentTableProps) {
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; enrollmentId: string }>({
    open: false,
    enrollmentId: ''
  });
  const [rejectReason, setRejectReason] = useState('');
  
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

  const handleRejectSubmit = () => {
    if (onReject && rejectDialog.enrollmentId && rejectReason.trim()) {
      onReject(rejectDialog.enrollmentId, rejectReason);
      setRejectDialog({ open: false, enrollmentId: '' });
      setRejectReason('');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            {!compact && <TableHead>Course</TableHead>}
            <TableHead>Status</TableHead>
            {!compact && <TableHead>Attendance</TableHead>}
            <TableHead>Enrolled</TableHead>
            <TableHead>Actions</TableHead>
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
              <TableCell>
                <div className="flex items-center gap-2">
                  {/* Quick Actions for Pending Enrollments */}
                  {enrollment.status === 'WAITLISTED' && onApprove && onReject && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onApprove(enrollment.id)}
                        className="h-8 px-2"
                      >
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRejectDialog({ open: true, enrollmentId: enrollment.id })}
                        className="h-8 px-2"
                      >
                        <XCircle className="h-3 w-3 text-red-600" />
                      </Button>
                    </>
                  )}
                  
                  {/* More Actions Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      {/* Attendance Actions */}
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
                      
                      {/* Management Actions */}
                      {enrollment.status === 'WAITLISTED' && onApprove && (
                        <DropdownMenuItem onClick={() => onApprove(enrollment.id)}>
                          <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                          Approve Enrollment
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuItem 
                        onClick={() => handleCancelEnrollment(enrollment.id)}
                        className="text-destructive"
                      >
                        Cancel Enrollment
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {filteredEnrollments.length === 0 && (
            <TableRow>
              <TableCell colSpan={compact ? 4 : 6} className="text-center py-8">
                No enrollments found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Reject Enrollment Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ ...rejectDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Enrollment</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this enrollment. The student will be notified.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter reason for rejection..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, enrollmentId: '' })}>
              Cancel
            </Button>
            <Button 
              onClick={handleRejectSubmit}
              disabled={!rejectReason.trim()}
              variant="destructive"
            >
              Reject Enrollment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
