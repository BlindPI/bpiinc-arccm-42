
import React from 'react';
import { format } from 'date-fns';
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
import { Check, X, Calendar, CircleHelp, UserCircle } from 'lucide-react';

interface CertificateRequestsTableProps {
  requests: CertificateRequest[];
  isLoading: boolean;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string, reason: string) => void;
}

export function CertificateRequestsTable({ 
  requests, 
  isLoading, 
  onApprove, 
  onReject 
}: CertificateRequestsTableProps) {
  const [rejectionReason, setRejectionReason] = React.useState('');
  const [selectedRequestId, setSelectedRequestId] = React.useState<string | null>(null);
  
  const handleApprove = (requestId: string) => {
    onApprove(requestId);
  };
  
  const handleReject = () => {
    if (selectedRequestId) {
      onReject(selectedRequestId, rejectionReason);
      setRejectionReason('');
      setSelectedRequestId(null);
    }
  };
  
  const openRejectDialog = (requestId: string) => {
    setSelectedRequestId(requestId);
    setRejectionReason('');
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'PENDING':
      default:
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (requests.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-muted/20">
        <CircleHelp className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-lg font-medium">No certificate requests</h3>
        <p className="text-muted-foreground mt-1">There are no certificate requests to display.</p>
      </div>
    );
  }
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead>Recipient</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id} className="hover:bg-muted/10">
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <UserCircle className="h-4 w-4 text-muted-foreground" />
                    <span>{request.recipient_name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{request.email}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium">{request.course_name}</div>
                <div className="text-xs flex flex-col text-muted-foreground">
                  {request.first_aid_level && <span>First Aid: {request.first_aid_level}</span>}
                  {request.cpr_level && <span>CPR: {request.cpr_level}</span>}
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
                {getStatusBadge(request.status)}
                {request.rejection_reason && (
                  <div className="text-xs text-red-600 mt-1">
                    {request.rejection_reason}
                  </div>
                )}
              </TableCell>
              <TableCell className="text-right">
                {request.status === 'PENDING' && (
                  <div className="flex justify-end gap-2">
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
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Enter rejection reason..."
                            className="min-h-[100px]"
                          />
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleReject}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Reject Request
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
