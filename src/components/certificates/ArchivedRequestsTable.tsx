
import React, { useState } from 'react';
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
import { Archive, ArchiveX, Loader2, Clock, Bug, ChevronDown, ChevronRight, StickyNote, Phone, Building, MapPin, User, Package } from "lucide-react";
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
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  // Filter requests for non-admin users to only show their own
  const filteredRequests = canManageRequests
    ? requests
    : requests.filter(req => req.user_id === profile?.id);

  const toggleRowExpansion = (requestId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(requestId)) {
      newExpanded.delete(requestId);
    } else {
      newExpanded.add(requestId);
    }
    setExpandedRows(newExpanded);
  };

  const hasAdditionalData = (request: any) => {
    const extendedRequest = request as any;
    return extendedRequest.notes || request.phone || request.company ||
           request.city || request.province || request.postal_code ||
           request.instructor_name || request.instructor_level ||
           request.cpr_level || request.first_aid_level;
  };

  // Debug logging for archived requests
  React.useEffect(() => {
    console.log('Archived requests data:', requests);
    console.log('Filtered archived requests:', filteredRequests);
    console.log('Are we showing archived requests?', requests?.some(req => req.status === 'ARCHIVED'));
    console.log('Status distribution:', 
      requests?.reduce((acc, req) => {
        acc[req.status] = (acc[req.status] || 0) + 1;
        return acc;
      }, {})
    );
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
    console.log('Status counts:', 
      requests?.reduce((acc, req) => {
        acc[req.status] = (acc[req.status] || 0) + 1;
        return acc;
      }, {})
    );
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
              <TableHead className="w-8"></TableHead>
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
                <TableCell colSpan={canManageRequests ? 7 : 6} className="text-center py-8">
                  <div className="flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mt-2">Loading archived requests...</p>
                </TableCell>
              </TableRow>
            ) : filteredRequests?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManageRequests ? 7 : 6} className="text-center py-8">
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
              filteredRequests?.map((request) => {
                const isExpanded = expandedRows.has(request.id);
                const additionalData = hasAdditionalData(request);
                const extendedRequest = request as any;
                
                return (
                  <React.Fragment key={request.id}>
                    <TableRow>
                      <TableCell>
                        {additionalData && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRowExpansion(request.id)}
                            className="h-6 w-6 p-0"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </TableCell>
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
                    
                    {/* Expanded details row */}
                    {isExpanded && additionalData && (
                      <TableRow>
                        <TableCell colSpan={canManageRequests ? 7 : 6} className="bg-gray-50 p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Contact Information */}
                            {(request.phone || request.company) && (
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm text-gray-700 flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  Contact Information
                                </h4>
                                {request.phone && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Phone className="h-3 w-3 text-gray-400" />
                                    <span>{request.phone}</span>
                                  </div>
                                )}
                                {request.company && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Building className="h-3 w-3 text-gray-400" />
                                    <span>{request.company}</span>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Address Information */}
                            {(request.city || request.province || request.postal_code) && (
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm text-gray-700 flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  Address
                                </h4>
                                <div className="text-sm text-gray-600">
                                  {[request.city, request.province, request.postal_code]
                                    .filter(Boolean)
                                    .join(', ')}
                                </div>
                              </div>
                            )}
                            
                            {/* Instructor Information */}
                            {(request.instructor_name || request.instructor_level) && (
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm text-gray-700 flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  Instructor
                                </h4>
                                {request.instructor_name && (
                                  <div className="text-sm text-gray-600">
                                    <span className="font-medium">Name:</span> {request.instructor_name}
                                  </div>
                                )}
                                {request.instructor_level && (
                                  <div className="text-sm text-gray-600">
                                    <span className="font-medium">Level:</span> {request.instructor_level}
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Certification Details */}
                            {(request.cpr_level || request.first_aid_level) && (
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm text-gray-700 flex items-center gap-1">
                                  <Package className="h-4 w-4" />
                                  Certification Details
                                </h4>
                                {request.cpr_level && (
                                  <div className="text-sm text-gray-600">
                                    <span className="font-medium">CPR Level:</span> {request.cpr_level}
                                  </div>
                                )}
                                {request.first_aid_level && (
                                  <div className="text-sm text-gray-600">
                                    <span className="font-medium">First Aid Level:</span> {request.first_aid_level}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Notes Section - Always full width if present */}
                          {extendedRequest.notes && (
                            <div className="mt-4 space-y-2">
                              <h4 className="font-medium text-sm text-gray-700 flex items-center gap-1">
                                <StickyNote className="h-4 w-4" />
                                Notes
                              </h4>
                              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{extendedRequest.notes}</p>
                              </div>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
