
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Package,
  Download,
  RefreshCw,
  Building,
  MapPin,
  StickyNote
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { CertificateRequest } from '@/types/supabase-schema';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface CertificateRequestWithSubmitter extends CertificateRequest {
  submitter?: {
    id: string;
    display_name: string;
    email: string;
  };
}

interface EnhancedCertificateRequest extends CertificateRequest {
  submitter?: {
    id: string;
    display_name: string;
    email: string;
  };
}

interface BulkActionBarProps {
  selectedCount: number;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
  onClearSelection: () => void;
  rejectionReason: string;
  onRejectionReasonChange: (reason: string) => void;
  isProcessing: boolean;
}

interface DetailedRequestCardProps {
  request: EnhancedCertificateRequest;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onView: () => void;
  onApprove: () => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  canManage: boolean;
  isProcessing: boolean;
}

interface RequestDetailsModalProps {
  request: EnhancedCertificateRequest;
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
  canManage: boolean;
  isProcessing: boolean;
}

export function EnhancedPendingRequestsView() {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [viewingRequest, setViewingRequest] = useState<EnhancedCertificateRequest | null>(null);
  const [bulkRejectionReason, setBulkRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
  const canManageRequests = profile?.role && ['SA', 'AD'].includes(profile.role);

  const { data: requestsData, isLoading, error } = useQuery({
    queryKey: ['enhanced-pending-requests', profile?.id],
    queryFn: async () => {
      try {
        let query = supabase
          .from('certificate_requests')
          .select('*')
          .eq('status', 'PENDING');

        if (!isAdmin && profile?.id) {
          query = query.eq('user_id', profile.id);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw error;
        
        return (data || []) as CertificateRequest[];
      } catch (error) {
        console.error('Error fetching enhanced pending requests:', error);
        throw error;
      }
    },
    enabled: !!profile,
    staleTime: 30000
  });

  const requests = React.useMemo(() => {
    if (!requestsData) return [];

    return requestsData.filter(request => {
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        return (
          request.recipient_name?.toLowerCase().includes(searchLower) ||
          request.course_name?.toLowerCase().includes(searchLower) ||
          (request.email && request.email.toLowerCase().includes(searchLower))
        );
      }
      return true;
    }) as EnhancedCertificateRequest[];
  }, [requestsData, searchQuery]);

  const handleSelectRequest = (id: string) => {
    setSelectedRequests(prev => {
      if (prev.includes(id)) {
        return prev.filter(reqId => reqId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const clearSelection = () => {
    setSelectedRequests([]);
  };

  const handleViewDetails = (request: EnhancedCertificateRequest) => {
    setViewingRequest(request);
  };

  const handleApprove = async (id: string) => {
    if (!canManageRequests) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('certificate_requests')
        .update({ status: 'APPROVED' })
        .eq('id', id);

      if (error) throw error;

      toast.success('Request approved successfully');
      queryClient.invalidateQueries({ queryKey: ['enhanced-pending-requests'] });
      setSelectedRequests(prev => prev.filter(reqId => reqId !== id));
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    if (!canManageRequests) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('certificate_requests')
        .update({ status: 'REJECTED', rejection_reason: reason })
        .eq('id', id);

      if (error) throw error;

      toast.success('Request rejected successfully');
      queryClient.invalidateQueries({ queryKey: ['enhanced-pending-requests'] });
      setSelectedRequests(prev => prev.filter(reqId => reqId !== id));
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkApprove = async () => {
    if (!canManageRequests) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('certificate_requests')
        .update({ status: 'APPROVED' })
        .in('id', selectedRequests);

      if (error) throw error;

      toast.success('Selected requests approved successfully');
      queryClient.invalidateQueries({ queryKey: ['enhanced-pending-requests'] });
      clearSelection();
    } catch (error) {
      console.error('Error approving selected requests:', error);
      toast.error('Failed to approve selected requests');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    if (!canManageRequests) return;

    if (!bulkRejectionReason) {
      toast.error('Please provide a rejection reason for the selected requests');
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('certificate_requests')
        .update({ status: 'REJECTED', rejection_reason: bulkRejectionReason })
        .in('id', selectedRequests);

      if (error) throw error;

      toast.success('Selected requests rejected successfully');
      queryClient.invalidateQueries({ queryKey: ['enhanced-pending-requests'] });
      clearSelection();
    } catch (error) {
      console.error('Error rejecting selected requests:', error);
      toast.error('Failed to reject selected requests');
    } finally {
      setIsProcessing(false);
    }
  };

  const BulkActionBar = ({ 
    selectedCount, 
    onApprove, 
    onReject, 
    onClearSelection, 
    rejectionReason, 
    onRejectionReasonChange, 
    isProcessing 
  }: BulkActionBarProps) => (
    <Card className="mb-4 bg-blue-50 border-blue-200">
      <CardContent className="py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              {selectedCount} request{selectedCount !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="text"
              placeholder="Rejection reason"
              value={rejectionReason}
              onChange={(e) => onRejectionReasonChange(e.target.value)}
              className="max-w-xs text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={onReject}
              disabled={isProcessing || !rejectionReason}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Reject All
            </Button>
            <Button
              size="sm"
              onClick={onApprove}
              disabled={isProcessing}
              className="text-green-600 border-green-300 hover:bg-green-50"
            >
              Approve All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              disabled={isProcessing}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const DetailedRequestCard = ({ 
    request, 
    isSelected, 
    onSelect, 
    onView, 
    onApprove, 
    onReject, 
    canManage, 
    isProcessing 
  }: DetailedRequestCardProps) => (
    <Card className={`mb-4 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{request.recipient_name}</span>
              <Badge variant="secondary">{request.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{request.course_name}</p>
            {request.submitter && (
              <p className="text-xs text-gray-500">
                Submitted by: {request.submitter.display_name} ({request.submitter.email})
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`select-${request.id}`}
              checked={isSelected}
              onCheckedChange={() => onSelect(request.id)}
              disabled={!canManage}
            />
            <Button variant="outline" size="sm" onClick={onView}>
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const RequestDetailsModal = ({ 
    request, 
    isOpen, 
    onClose, 
    onApprove, 
    onReject, 
    canManage, 
    isProcessing 
  }: RequestDetailsModalProps) => (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Certificate Request Details</DialogTitle>
          <DialogDescription>
            Review the details of this certificate request before taking action.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Basic Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Recipient Name</Label>
                <Input type="text" value={request.recipient_name} readOnly />
              </div>
              <div>
                <Label>Course Name</Label>
                <Input type="text" value={request.course_name} readOnly />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={request.email || 'N/A'} readOnly />
              </div>
              <div>
                <Label>Phone</Label>
                <Input type="tel" value={request.phone || 'N/A'} readOnly />
              </div>
              <div>
                <Label>Issue Date</Label>
                <Input type="text" value={request.issue_date} readOnly />
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input type="text" value={request.expiry_date} readOnly />
              </div>
            </div>
          </div>

          {/* Company & Address Information */}
          {(request.company || request.city || request.province || request.postal_code) && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Building className="h-4 w-4" />
                Company & Address
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {request.company && (
                  <div>
                    <Label>Company</Label>
                    <Input type="text" value={request.company} readOnly />
                  </div>
                )}
                {request.city && (
                  <div>
                    <Label>City</Label>
                    <Input type="text" value={request.city} readOnly />
                  </div>
                )}
                {request.province && (
                  <div>
                    <Label>Province</Label>
                    <Input type="text" value={request.province} readOnly />
                  </div>
                )}
                {request.postal_code && (
                  <div>
                    <Label>Postal Code</Label>
                    <Input type="text" value={request.postal_code} readOnly />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Instructor Information */}
          {(request.instructor_name || request.instructor_level) && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Instructor Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {request.instructor_name && (
                  <div>
                    <Label>Instructor Name</Label>
                    <Input type="text" value={request.instructor_name} readOnly />
                  </div>
                )}
                {request.instructor_level && (
                  <div>
                    <Label>Instructor Level</Label>
                    <Input type="text" value={request.instructor_level} readOnly />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Certification Details */}
          {(request.cpr_level || request.first_aid_level || request.assessment_status) && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Certification Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {request.cpr_level && (
                  <div>
                    <Label>CPR Level</Label>
                    <Input type="text" value={request.cpr_level} readOnly />
                  </div>
                )}
                {request.first_aid_level && (
                  <div>
                    <Label>First Aid Level</Label>
                    <Input type="text" value={request.first_aid_level} readOnly />
                  </div>
                )}
                {request.assessment_status && (
                  <div>
                    <Label>Assessment Status</Label>
                    <Input type="text" value={request.assessment_status} readOnly />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes Section */}
          {(request as any).notes && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <StickyNote className="h-4 w-4" />
                Notes
              </h4>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{(request as any).notes}</p>
              </div>
            </div>
          )}
        </div>
        {canManage && (
          <div className="mt-4">
            <Label htmlFor="rejection-reason">Rejection Reason</Label>
            <Input
              id="rejection-reason"
              placeholder="Enter rejection reason..."
              className="mt-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const target = e.currentTarget as HTMLInputElement;
                  handleReject(request.id, target.value);
                  onClose();
                }
              }}
            />
          </div>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
          {canManage && (
            <>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  const reasonInput = document.getElementById('rejection-reason') as HTMLInputElement;
                  const reason = reasonInput?.value || 'No reason provided';
                  handleReject(request.id, reason);
                  onClose();
                }}
                disabled={isProcessing}
              >
                Reject
              </Button>
              <Button
                type="button"
                onClick={() => {
                  handleApprove(request.id);
                  onClose();
                }}
                disabled={isProcessing}
              >
                Approve
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Pending Certificate Requests</span>
            <Input
              type="search"
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </CardTitle>
        </CardHeader>
      </Card>

      {selectedRequests.length > 0 && canManageRequests && (
        <BulkActionBar
          selectedCount={selectedRequests.length}
          onApprove={handleBulkApprove}
          onReject={handleBulkReject}
          onClearSelection={clearSelection}
          rejectionReason={bulkRejectionReason}
          onRejectionReasonChange={setBulkRejectionReason}
          isProcessing={isProcessing}
        />
      )}

      {isLoading ? (
        <Card className="py-5">
          <CardContent className="text-center text-gray-500">Loading requests...</CardContent>
        </Card>
      ) : error ? (
        <Card className="py-5">
          <CardContent className="text-center text-red-500">Error: {error.message}</CardContent>
        </Card>
      ) : requests.length === 0 ? (
        <Card className="py-5">
          <CardContent className="text-center text-gray-500">No pending requests found.</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map(request => (
            <DetailedRequestCard
              key={request.id}
              request={request}
              isSelected={selectedRequests.includes(request.id)}
              onSelect={handleSelectRequest}
              onView={() => handleViewDetails(request)}
              onApprove={() => handleApprove(request.id)}
              onReject={(reason) => handleReject(request.id, reason)}
              canManage={canManageRequests}
              isProcessing={isProcessing}
            />
          ))}
        </div>
      )}

      {viewingRequest && (
        <RequestDetailsModal
          request={viewingRequest}
          isOpen={!!viewingRequest}
          onClose={() => setViewingRequest(null)}
          onApprove={() => handleApprove(viewingRequest.id)}
          onReject={(reason) => handleReject(viewingRequest.id, reason)}
          canManage={canManageRequests}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
}
