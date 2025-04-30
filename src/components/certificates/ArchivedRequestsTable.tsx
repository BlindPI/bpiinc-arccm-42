
import React from 'react';
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { Archive, ArchiveX, Loader2, Clock, Bug } from "lucide-react";
import { useProfile } from '@/hooks/useProfile';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ArchivedRequestsTableProps {
  requests: any[];
  isLoading: boolean;
}

export function ArchivedRequestsTable({ 
  requests,
  isLoading
}: ArchivedRequestsTableProps) {
  const isMobile = useIsMobile();
  const { data: profile } = useProfile();
  const canManageRequests = profile?.role && ['SA', 'AD'].includes(profile.role);
  
  // Filter requests for non-admin users to only show their own
  const filteredRequests = canManageRequests 
    ? requests 
    : requests.filter(req => req.user_id === profile?.id);

  // Debug logging for archived requests
  React.useEffect(() => {
    console.log('Archived requests data:', requests);
    console.log('Filtered archived requests:', filteredRequests);
  }, [requests, filteredRequests]);

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'N/A';
      return format(parseISO(dateString), 'MMMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return dateString || 'N/A'; // Return original string if parsing fails
    }
  };

  const showDebugInfo = () => {
    console.log('Current requests state:', requests);
    console.log('Current filtered requests:', filteredRequests);
    console.log('User profile:', profile);
  };

  return (
    <div className="space-y-4">
      {/* Debug button for admins */}
      {canManageRequests && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={showDebugInfo}
          className="mb-2"
        >
          <Bug className="h-4 w-4 mr-2" /> Debug Archived Data
        </Button>
      )}
      
      <ScrollArea className="h-[600px] w-full">
        <Table>
          <TableCaption>
            {canManageRequests 
              ? "Archived certificate requests" 
              : "Your archived certificate requests"}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className={isMobile ? 'text-xs' : ''}>Recipient</TableHead>
              <TableHead className={isMobile ? 'text-xs' : ''}>Course</TableHead>
              <TableHead className={isMobile ? 'text-xs' : ''}>Request Date</TableHead>
              <TableHead className={isMobile ? 'text-xs' : ''}>Archive Date</TableHead>
              {canManageRequests && (
                <TableHead className={isMobile ? 'text-xs' : ''}>Reviewed By</TableHead>
              )}
              <TableHead className={isMobile ? 'text-xs' : ''}>Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={canManageRequests ? 6 : 5} className="text-center py-8">
                  <div className="flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mt-2">Loading archived requests...</p>
                </TableCell>
              </TableRow>
            ) : filteredRequests?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManageRequests ? 6 : 5} className="text-center py-8">
                  <div className="flex justify-center">
                    <ArchiveX className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mt-2">No archived requests found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Approved or rejected requests should appear here
                  </p>
                  <p className="text-xs text-red-500 mt-2">Debug: {requests ? requests.length : 0} total requests available</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests?.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className={isMobile ? 'text-sm py-2 px-2' : ''}>
                    {request.recipient_name}
                  </TableCell>
                  <TableCell className={isMobile ? 'text-sm py-2 px-2' : ''}>
                    {request.course_name}
                  </TableCell>
                  <TableCell className={isMobile ? 'text-sm py-2 px-2' : ''}>
                    {request.created_at && formatDate(request.created_at)}
                  </TableCell>
                  <TableCell className={isMobile ? 'text-sm py-2 px-2' : ''}>
                    <div className="flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                      {request.updated_at && formatDate(request.updated_at)}
                    </div>
                  </TableCell>
                  {canManageRequests && (
                    <TableCell className={isMobile ? 'text-sm py-2 px-2' : ''}>
                      {request.reviewer_name || 'System'}
                    </TableCell>
                  )}
                  <TableCell className={isMobile ? 'text-sm py-2 px-2' : ''}>
                    {request.rejection_reason ? (
                      <div className="flex flex-col">
                        <Badge variant="destructive">Rejected</Badge>
                        <span className="text-xs mt-1 text-gray-500">
                          {request.rejection_reason.length > 30 
                            ? `${request.rejection_reason.substring(0, 30)}...` 
                            : request.rejection_reason
                          }
                        </span>
                      </div>
                    ) : request.assessment_status === 'FAIL' ? (
                      <Badge variant="destructive">Failed Assessment</Badge>
                    ) : (
                      <Badge variant="success">Approved</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
