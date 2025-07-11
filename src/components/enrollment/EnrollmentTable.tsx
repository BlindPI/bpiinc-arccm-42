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
import { Progress } from "@/components/ui/progress";
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

  const getStatusColor = (status: string): "default" | "destructive" | "outline" | "secondary" | "success" => {
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

  const getAttendanceColor = (attendance: string | null): "default" | "destructive" | "outline" | "secondary" | "success" => {
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


  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return `${diffDays} days ago`;
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
                {formatTimeAgo(enrollment.enrollment_date)}
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
                        ✓
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRejectDialog({ open: true, enrollmentId: enrollment.id })}
                        className="h-8 px-2"
                      >
                        ✗
                      </Button>
                    </>
                  )}
                  
                  {/* More Actions Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        ⋯
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      {/* Attendance Actions */}
                      <DropdownMenuItem 
                        onClick={() => handleAttendanceUpdate(enrollment.id, 'PRESENT')}
                      >
                        Mark Present
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleAttendanceUpdate(enrollment.id, 'ABSENT')}
                      >
                        Mark Absent
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleAttendanceUpdate(enrollment.id, 'LATE')}
                      >
                        Mark Late
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      
                      {/* Management Actions */}
                      {enrollment.status === 'WAITLISTED' && onApprove && (
                        <DropdownMenuItem onClick={() => onApprove(enrollment.id)}>
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
