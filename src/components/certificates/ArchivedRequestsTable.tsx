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
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { Archive, ArchiveX, Loader2 } from "lucide-react";
import { useProfile } from '@/hooks/useProfile';
import { Badge } from '@/components/ui/badge';

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

  return (
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
            <TableHead className={isMobile ? 'text-xs' : ''}>Status</TableHead>
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
                  <Archive className="h-8 w-8 animate-pulse text-muted-foreground" />
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
                  {request.created_at && format(new Date(request.created_at), 'MMMM d, yyyy')}
                </TableCell>
                <TableCell className={isMobile ? 'text-sm py-2 px-2' : ''}>
                  <Badge 
                    variant={
                      request.status === 'ARCHIVED' 
                        ? "outline" 
                        : request.status === 'DELETED' 
                          ? "destructive" 
                          : "secondary"
                    }
                    className="capitalize"
                  >
                    {request.status.toLowerCase()}
                  </Badge>
                </TableCell>
                {canManageRequests && (
                  <TableCell className={isMobile ? 'text-sm py-2 px-2' : ''}>
                    {request.reviewer_name || 'Unknown'}
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
  );
}