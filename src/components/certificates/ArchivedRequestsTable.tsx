
import React from 'react';
import { format } from 'date-fns';
import { Archive, Loader2, CircleHelp } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CertificateRequest } from '@/types/supabase-schema';

interface ArchivedRequestsTableProps {
  requests: CertificateRequest[];
  isLoading: boolean;
}

export function ArchivedRequestsTable({ requests, isLoading }: ArchivedRequestsTableProps) {
  const archivedRequests = requests.filter(request => request.status === 'ARCHIVED');
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[300px] bg-gray-50/50 rounded-lg">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading archived requests...</p>
        </div>
      </div>
    );
  }
  
  if (archivedRequests.length === 0) {
    return (
      <div className="text-center p-12 border rounded-lg bg-gradient-to-br from-gray-50 to-white">
        <CircleHelp className="h-12 w-12 text-muted-foreground/60 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900">No archived requests</h3>
        <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
          There are no archived certificate requests to display at this time.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-gradient-to-br from-white to-gray-50/80 shadow-sm">
      <Table>
        <TableHeader className="bg-gray-50/80">
          <TableRow className="hover:bg-gray-50/90">
            <TableHead className="font-semibold text-gray-700">Recipient</TableHead>
            <TableHead className="font-semibold text-gray-700">Course</TableHead>
            <TableHead className="font-semibold text-gray-700">Assessment</TableHead>
            <TableHead className="font-semibold text-gray-700">Archive Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {archivedRequests.map((request) => (
            <TableRow key={request.id} className="hover:bg-blue-50/30 transition-colors">
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span className="text-gray-900">{request.recipient_name}</span>
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
                <Badge 
                  variant={request.assessment_status === 'PASS' ? 'success' : 'destructive'}
                  className="flex items-center gap-1"
                >
                  {request.assessment_status || 'N/A'}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(request.updated_at), 'MMM d, yyyy')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
