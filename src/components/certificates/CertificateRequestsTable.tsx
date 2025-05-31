import React from 'react';
import { format } from 'date-fns';
import { AlertTriangle, Loader2, Calendar, UserCircle, Trash2, Check, X, CircleHelp, Archive } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
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
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CertificateRequest } from '@/types/supabase-schema';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';
import { useQueryClient } from '@tanstack/react-query';

interface CertificateRequestsTableProps {
  requests: CertificateRequest[];
  isLoading: boolean;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string, reason: string) => void;
  onDeleteRequest?: (requestId: string) => void;
  isDeleting?: boolean;
}

export function CertificateRequestsTable({ 
  requests, 
  isLoading,
  onApprove,
  onReject,
  onDeleteRequest,
  isDeleting = false
}: CertificateRequestsTableProps) {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [rejectionReason, setRejectionReason] = React.useState('');
  const [selectedRequestId, setSelectedRequestId] = React.useState<string | null>(null);
  const [deletingRequestId, setDeletingRequestId] = React.useState<string | null>(null);
  const [archivingRequestId, setArchivingRequestId] = React.useState<string | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = React.useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = React.useState(false);
  const [isArchiving, setIsArchiving] = React.useState(false);
  
  // CRITICAL FIX: Only SA/AD users should have management rights
  const canManageRequests = profile?.role && ['SA', 'AD'].includes(profile.role);
  const isSysAdmin = profile?.role === 'SA';

  // Debug log the requests to see what we're working with
  React.useEffect(() => {
    console.log('Certificate requests array:', requests);
    if (requests?.length > 0) {
      console.log('First request sample:', requests[0]);
      
      // Check for any failed assessments
      const failedAssessments = requests.filter(req => req.assessment_status === 'FAIL');
      if (failedAssessments.length > 0) {
        console.log(`Found ${failedAssessments.length} failed assessments`, failedAssessments);
      }
    }
  }, [requests]);
  
  const handleDelete = async () => {
    if (deletingRequestId && onDeleteRequest) {
      try {
        // Double-check permissions before deleting
        if (profile?.role !== 'SA') {
          toast.error('Only System Administrators can delete certificate requests');
          return;
        }

        await onDeleteRequest(deletingRequestId);
        setDeletingRequestId(null);
      } catch (error) {
        console.error('Error deleting request:', error);
        toast.error('Failed to delete certificate request. Please try again.');
      }
    }
  };
  
  const handleArchiveFailedAssessment = async () => {
    if (!archivingRequestId) return;

    try {
      setIsArchiving(true);
      
      // Log the archiving operation
      console.log(`Archiving failed assessment with ID ${archivingRequestId}`);
      
      if (isAdmin) {
        const { error: updateError } = await supabase
          .from('certificate_requests')
          .update({ 
            status: 'ARCHIVED',
            reviewer_id: profile?.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', archivingRequestId);
      
        if (updateError) {
          console.error('Error archiving failed assessment:', updateError);
          throw updateError;
        }
        
        toast.success('Failed assessment archived successfully');
        
        // Refresh UI after archiving
        queryClient.invalidateQueries({ queryKey: ['certificateRequests'] }); 
        queryClient.invalidateQueries({ queryKey: ['certificate_requests_archived'] });
        
        if (onDeleteRequest) {
          // Use the delete handler to refresh the UI for this specific item
          onDeleteRequest(archivingRequestId);
        }
      } else {
        toast.error('Only administrators can archive failed assessments');
      }
      
    } catch (error) {
      console.error('Error archiving failed assessment:', error);
      toast.error('Failed to archive assessment. Please try again.');
    } finally {
      setIsArchiving(false);
      setArchivingRequestId(null);
    }
  };
  
  const handleApprove = (requestId: string) => {
    // CRITICAL FIX: Double-check SA/AD permissions before approving
    if (!canManageRequests) {
      toast.error('Only System Administrators and Administrators can approve certificate requests');
      return;
    }
    
    // Log the approval attempt
    console.log(`Approving certificate request with ID ${requestId}`);
    onApprove(requestId);
  };
  
  const handleReject = () => {
    // CRITICAL FIX: Double-check SA/AD permissions before rejecting
    if (!canManageRequests) {
      toast.error('Only System Administrators and Administrators can reject certificate requests');
      return;
    }
    
    if (selectedRequestId) {
      // Log the rejection attempt
      console.log(`Rejecting certificate request with ID ${selectedRequestId}`);
      onReject(selectedRequestId, rejectionReason);
      setRejectionReason('');
      setSelectedRequestId(null);
    }
  };
  
  const openRejectDialog = (requestId: string) => {
    if (!canManageRequests) {
      toast.error('Only System Administrators and Administrators can reject certificate requests');
      return;
    }
    
    setSelectedRequestId(requestId);
    setRejectionReason('');
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'ARCHIVED':
        return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">Archived</Badge>;
      case 'PENDING':
      default:
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>;
    }
  };

  const getAssessmentBadge = (status: string | null) => {
    if (!status) return null;
    
    return status === 'PASS' ? (
      <Badge variant="success" className="ml-2">
        <Check className="w-3 h-3 mr-1" />
        Pass
      </Badge>
    ) : status === 'FAIL' ? (
      <Badge variant="destructive" className="ml-2">
        <X className="w-3 h-3 mr-1" />
        Fail
      </Badge>
    ) : null;
  };
  
  const handleBulkDelete = async () => {
    // Double-check permissions
    if (!profile || profile.role !== 'SA') {
      toast.error('Only System Administrators can bulk delete certificate requests');
      return;
    }
    
    try {
      setIsBulkDeleting(true);
      
      // Log the bulk delete operation
      console.log('Performing bulk deletion of certificate requests');
      
      const { error } = await supabase
        .from('certificate_requests')
        .delete()
        .filter('id', 'not.is', null);
      
      if (error) throw error;
      
      toast.success('All certificate requests deleted successfully');
      
      if (onDeleteRequest) {
        // For each visible request, call onDeleteRequest to refresh the UI
        requests.forEach(request => {
          onDeleteRequest(request.id);
        });
      }
      
      setConfirmBulkDelete(false);
    } catch (error) {
      console.error('Error deleting certificate requests:', error);
      toast.error('Failed to delete certificate requests');
    } finally {
      setIsBulkDeleting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[300px] bg-gray-50/50 rounded-lg">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading requests...</p>
        </div>
      </div>
    );
  }
  
  if (requests.length === 0) {
    return (
      <div className="text-center p-12 border rounded-lg bg-gradient-to-br from-gray-50 to-white">
        <CircleHelp className="h-12 w-12 text-muted-foreground/60 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900">No certificate requests</h3>
        <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
          {canManageRequests 
            ? "There are no certificate requests to review at this time."
            : "You don't have any certificate requests to display."
          }
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-gradient-to-br from-white to-gray-50/80 shadow-sm">
      {/* Only show bulk delete option for SA users */}
      {isSysAdmin && requests.length > 0 && (
        <div className="p-4 border-b bg-gray-50/50">
          <AlertDialog
            open={confirmBulkDelete}
            onOpenChange={setConfirmBulkDelete}
          >
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white"
                disabled={isBulkDeleting}
              >
                {isBulkDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Delete All Test Data
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete All Certificate Requests</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete all certificate requests? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleBulkDelete}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={isBulkDeleting}
                >
                  {isBulkDeleting ? 'Deleting...' : 'Delete All'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      <Table>
        <TableHeader className="bg-gray-50/80">
          <TableRow className="hover:bg-gray-50/90">
            <TableHead className="font-semibold text-gray-700">Recipient</TableHead>
            <TableHead className="font-semibold text-gray-700">Course</TableHead>
            <TableHead className="font-semibold text-gray-700">Dates</TableHead>
            <TableHead className="font-semibold text-gray-700">Status</TableHead>
            <TableHead className="text-right font-semibold text-gray-700">
              {canManageRequests ? 'Actions' : 'View Only'}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id} className="hover:bg-blue-50/30 transition-colors">
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <UserCircle className="h-4 w-4 text-primary/60" />
                    <span className="text-gray-900">{request.recipient_name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{request.email}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium text-gray-900">{request.course_name}</div>
                <div className="text-xs flex flex-col text-muted-foreground">
                  {request.first_aid_level && <span>First Aid: {request.first_aid_level}</span>}
                  {request.cpr_level && <span>CPR: {request.cpr_level}</span>}
                  {request.instructor_name && (
                    <span className="mt-1">Instructor: {request.instructor_name}</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Issue: {request.issue_date}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Expiry: {request.expiry_date}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getStatusBadge(request.status)}
                  {getAssessmentBadge(request.assessment_status)}
                </div>
                {request.rejection_reason && (
                  <div className="text-xs text-red-600 mt-1">
                    {request.rejection_reason}
                  </div>
                )}
                {request.assessment_status === 'FAIL' && (
                  <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Cannot process failed assessment
                  </div>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {/* CRITICAL FIX: Only show approve/reject buttons for SA/AD users */}
                  {canManageRequests && request.status === 'PENDING' && request.assessment_status !== 'FAIL' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 text-green-600 hover:text-green-700 border-green-200 hover:border-green-300 hover:bg-green-50"
                        onClick={() => handleApprove(request.id)}
                      >
                        <Check className="h-4 w-4" />
                        Approve
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50"
                            onClick={() => openRejectDialog(request.id)}
                          >
                            <X className="h-4 w-4" />
                            Reject
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Reject Certificate Request</AlertDialogTitle>
                            <AlertDialogDescription>
                              Please provide a reason for rejecting this certificate request.
                              This will be visible to the requester.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="py-4">
                            <Textarea
                              placeholder="Reason for rejection..."
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              className="min-h-[100px]"
                            />
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleReject}
                              disabled={!rejectionReason || isPending}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {isPending ? 'Rejecting...' : 'Reject'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}

                  {/* Show archive button only for SA/AD with failed assessments */}
                  {canManageRequests && request.assessment_status === 'FAIL' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={async () => {
                        setArchivingRequestId(request.id);
                        await handleArchiveFailedAssessment();
                      }}
                      disabled={isArchiving}
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </Button>
                  )}

                  {/* Show delete button only for SA users */}
                  {isSysAdmin && onDeleteRequest && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                          onClick={() => setDeletingRequestId(request.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Certificate Request</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this certificate request? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setDeletingRequestId(null)}>
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                  {/* Show info message for non-admin users */}
                  {!canManageRequests && (
                    <div className="text-sm text-muted-foreground text-right">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md">
                        View Only
                      </span>
                    </div>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
