
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  XCircle, 
  Users, 
  Calendar, 
  User, 
  Package, 
  MapPin, 
  GraduationCap,
  Archive,
  AlertTriangle,
  Building,
  FileText
} from 'lucide-react';
import { EnterpriseRequestCard } from './EnterpriseRequestCard';
import { format } from 'date-fns';
import { useProfile } from '@/hooks/useProfile';
import { CertificateRequest } from '@/types/supabase-schema';

interface EnterpriseBatchGroupProps {
  batchId: string;
  batchName: string;
  requests: (CertificateRequest & {
    submitter_name?: string;
    submitter_email?: string;
    location_name?: string;
    location_address?: string;
  })[];
  submittedBy: string;
  submittedAt: string;
  isPending: boolean;
  onUpdateRequest: (params: any) => Promise<void>;
  globalRejectionReason: string;
  setGlobalRejectionReason: (reason: string) => void;
}

export function EnterpriseBatchGroup({
  batchId,
  batchName,
  requests,
  submittedBy,
  submittedAt,
  isPending,
  onUpdateRequest,
  globalRejectionReason,
  setGlobalRejectionReason
}: EnterpriseBatchGroupProps) {
  const { data: profile } = useProfile();
  const [localRejectionReason, setLocalRejectionReason] = useState('');
  
  const isIndividualRequest = batchId.startsWith('individual_');
  const canManageRequests = profile?.role && ['SA', 'AD'].includes(profile.role);

  // Calculate statistics
  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
  const approvedCount = requests.filter(r => r.status === 'APPROVED').length;
  const rejectedCount = requests.filter(r => r.status === 'REJECTED').length;
  const failedCount = requests.filter(r => r.assessment_status === 'FAIL').length;

  // Get unique metadata
  const uniqueLocations = [...new Set(requests.map(r => r.location_name).filter(Boolean))];
  const uniqueInstructors = [...new Set(requests.map(r => r.instructor_name).filter(Boolean))];
  const uniqueCourses = [...new Set(requests.map(r => r.course_name))];

  const handleBatchApprove = async () => {
    if (!canManageRequests) return;
    
    const pendingRequests = requests.filter(r => r.status === 'PENDING' && r.assessment_status !== 'FAIL');
    for (const request of pendingRequests) {
      try {
        await onUpdateRequest({
          id: request.id,
          status: 'APPROVED'
        });
      } catch (error) {
        console.error('Failed to approve request:', error);
        break;
      }
    }
  };

  const handleBatchReject = async () => {
    if (!canManageRequests) return;
    
    const reasonToUse = localRejectionReason.trim() || globalRejectionReason.trim();
    if (!reasonToUse) return;
    
    const pendingRequests = requests.filter(r => r.status === 'PENDING' && r.assessment_status !== 'FAIL');
    for (const request of pendingRequests) {
      try {
        await onUpdateRequest({
          id: request.id,
          status: 'REJECTED',
          rejectionReason: reasonToUse
        });
      } catch (error) {
        console.error('Failed to reject request:', error);
        break;
      }
    }
    setLocalRejectionReason('');
  };

  const handleBatchArchiveFailed = async () => {
    if (!canManageRequests) return;
    
    const failedRequests = requests.filter(r => r.assessment_status === 'FAIL');
    for (const request of failedRequests) {
      try {
        await onUpdateRequest({
          id: request.id,
          status: 'ARCHIVED'
        });
      } catch (error) {
        console.error('Failed to archive request:', error);
        break;
      }
    }
  };

  return (
    <Card className="mb-6 border-l-4 border-l-blue-500">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {isIndividualRequest ? (
              <User className="h-6 w-6 text-blue-600 mt-1" />
            ) : (
              <Package className="h-6 w-6 text-green-600 mt-1" />
            )}
            
            <div className="flex-1">
              <CardTitle className="text-xl font-semibold mb-2">
                {batchName}
              </CardTitle>
              
              {/* Enterprise Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-muted-foreground">Submitted:</span>
                    <span className="font-medium">
                      {format(new Date(submittedAt), 'PPP p')}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-muted-foreground">By:</span>
                    <span className="font-medium">{submittedBy}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-muted-foreground">Requests:</span>
                    <span className="font-medium">{requests.length}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {uniqueLocations.length > 0 && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                      <div className="flex-1">
                        <span className="text-muted-foreground">Locations:</span>
                        <div className="font-medium">
                          {uniqueLocations.slice(0, 2).join(', ')}
                          {uniqueLocations.length > 2 && ` +${uniqueLocations.length - 2} more`}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {uniqueInstructors.length > 0 && (
                    <div className="flex items-start gap-2">
                      <GraduationCap className="h-4 w-4 text-gray-500 mt-0.5" />
                      <div className="flex-1">
                        <span className="text-muted-foreground">Instructors:</span>
                        <div className="font-medium">
                          {uniqueInstructors.slice(0, 2).join(', ')}
                          {uniqueInstructors.length > 2 && ` +${uniqueInstructors.length - 2} more`}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {uniqueCourses.length > 0 && (
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                      <div className="flex-1">
                        <span className="text-muted-foreground">Courses:</span>
                        <div className="font-medium">
                          {uniqueCourses.slice(0, 2).join(', ')}
                          {uniqueCourses.length > 2 && ` +${uniqueCourses.length - 2} more`}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!isIndividualRequest && (
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-500" />
                      <span className="text-muted-foreground">Batch ID:</span>
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                        {batchId.slice(0, 8)}...
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Status Badges and Actions */}
          <div className="flex flex-col items-end gap-3">
            <div className="flex flex-wrap gap-2 justify-end">
              {pendingCount > 0 && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  {pendingCount} Pending
                </Badge>
              )}
              {approvedCount > 0 && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {approvedCount} Approved
                </Badge>
              )}
              {rejectedCount > 0 && (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  {rejectedCount} Rejected
                </Badge>
              )}
              {failedCount > 0 && (
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {failedCount} Failed
                </Badge>
              )}
            </div>

            {/* Batch Actions */}
            {canManageRequests && (
              <div className="flex flex-col gap-2">
                {/* Bulk Actions for Pending Requests */}
                {pendingCount > 0 && !isIndividualRequest && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBatchApprove}
                      disabled={isPending}
                      className="text-green-700 border-green-200 hover:bg-green-50"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve All
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBatchReject}
                      disabled={isPending || (!localRejectionReason.trim() && !globalRejectionReason.trim())}
                      className="text-red-700 border-red-200 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject All
                    </Button>
                  </div>
                )}

                {/* Archive Failed Requests */}
                {failedCount > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBatchArchiveFailed}
                    disabled={isPending}
                    className="text-gray-700 border-gray-200 hover:bg-gray-50"
                  >
                    <Archive className="h-4 w-4 mr-1" />
                    Archive Failed ({failedCount})
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Batch-specific rejection reason input */}
        {canManageRequests && pendingCount > 0 && !isIndividualRequest && (
          <div className="mt-4 max-w-md">
            <Label htmlFor={`batch-rejection-${batchId}`} className="text-sm">
              Batch Rejection Reason (overrides global)
            </Label>
            <Input
              id={`batch-rejection-${batchId}`}
              placeholder="Enter batch-specific reason..."
              value={localRejectionReason}
              onChange={(e) => setLocalRejectionReason(e.target.value)}
              className="mt-1"
            />
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          {requests.map((request) => (
            <EnterpriseRequestCard
              key={request.id}
              request={request}
              onUpdateRequest={onUpdateRequest}
              isPending={isPending}
              showBatchInfo={false}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
