
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, 
  XCircle, 
  Archive, 
  AlertCircle, 
  MapPin, 
  User, 
  GraduationCap,
  Calendar,
  Building,
  Phone,
  Mail
} from 'lucide-react';
import { CertificateRequest } from '@/types/supabase-schema';
import { useProfile } from '@/hooks/useProfile';
import { format } from 'date-fns';

interface EnterpriseRequestCardProps {
  request: CertificateRequest & {
    submitter_name?: string;
    submitter_email?: string;
    location_name?: string;
    location_address?: string;
  };
  onUpdateRequest: (params: {
    id: string;
    status: 'APPROVED' | 'REJECTED' | 'ARCHIVED';
    rejectionReason?: string;
  }) => Promise<void>;
  isPending: boolean;
  showBatchInfo?: boolean;
}

export const EnterpriseRequestCard: React.FC<EnterpriseRequestCardProps> = ({
  request,
  onUpdateRequest,
  isPending,
  showBatchInfo = true
}) => {
  const { data: profile } = useProfile();
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  
  const canManageRequests = profile?.role && ['SA', 'AD'].includes(profile.role);
  const isFailedAssessment = request.assessment_status === 'FAIL';

  const handleApprove = async () => {
    if (!canManageRequests) return;
    await onUpdateRequest({ id: request.id, status: 'APPROVED' });
  };

  const handleReject = async () => {
    if (!canManageRequests || !rejectionReason.trim()) return;
    await onUpdateRequest({ 
      id: request.id, 
      status: 'REJECTED', 
      rejectionReason: rejectionReason.trim() 
    });
    setIsRejectionDialogOpen(false);
    setRejectionReason('');
  };

  const handleArchive = async () => {
    if (!canManageRequests) return;
    await onUpdateRequest({ id: request.id, status: 'ARCHIVED' });
  };

  return (
    <>
      <Card className={`border rounded-lg shadow-sm ${isFailedAssessment ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                {request.recipient_name}
                {isFailedAssessment && (
                  <Badge variant="destructive" className="ml-2">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Failed Assessment
                  </Badge>
                )}
              </CardTitle>
              
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <GraduationCap className="h-4 w-4" />
                  <span className="font-medium">{request.course_name}</span>
                </div>
                
                {request.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {request.email}
                  </div>
                )}
                
                {request.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {request.phone}
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <Badge variant="outline" className="mb-2">
                {request.status}
              </Badge>
              
              {showBatchInfo && request.batch_name && (
                <div className="text-xs text-muted-foreground">
                  Batch: {request.batch_name}
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="py-3">
          {/* Enterprise Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {/* Left Column */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-muted-foreground">Issue:</span>
                <span className="font-medium">{request.issue_date}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-muted-foreground">Expiry:</span>
                <span className="font-medium">{request.expiry_date}</span>
              </div>
              
              {request.instructor_name && (
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-gray-500" />
                  <span className="text-muted-foreground">Instructor:</span>
                  <span className="font-medium">{request.instructor_name}</span>
                  {request.instructor_level && (
                    <Badge variant="outline" className="text-xs">
                      {request.instructor_level}
                    </Badge>
                  )}
                </div>
              )}
              
              {request.company && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span className="text-muted-foreground">Company:</span>
                  <span className="font-medium">{request.company}</span>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-2">
              {request.location_name && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium">{request.location_name}</div>
                    {request.location_address && (
                      <div className="text-xs text-muted-foreground">
                        {request.location_address}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {(request.city || request.province) && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium">
                    {[request.city, request.province].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              
              {request.submitter_name && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-muted-foreground">Submitted by:</span>
                  <span className="font-medium">{request.submitter_name}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-muted-foreground">Submitted:</span>
                <span className="font-medium">
                  {format(new Date(request.created_at), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          </div>

          {/* Certification Levels */}
          {(request.first_aid_level || request.cpr_level) && (
            <div className="mt-4 pt-3 border-t">
              <div className="flex flex-wrap gap-2">
                {request.first_aid_level && (
                  <Badge variant="outline" className="text-xs">
                    First Aid: {request.first_aid_level}
                  </Badge>
                )}
                {request.cpr_level && (
                  <Badge variant="outline" className="text-xs">
                    CPR: {request.cpr_level}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Batch Information */}
          {showBatchInfo && (request.batch_id || request.roster_id) && (
            <div className="mt-4 pt-3 border-t">
              <div className="text-xs text-muted-foreground space-y-1">
                {request.batch_id && (
                  <div>Batch ID: <span className="font-mono">{request.batch_id.slice(0, 8)}...</span></div>
                )}
                {request.roster_id && (
                  <div>Roster ID: <span className="font-mono">{request.roster_id.slice(0, 8)}...</span></div>
                )}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="bg-gray-50 p-3 flex justify-end gap-2">
          {canManageRequests ? (
            <>
              {isFailedAssessment ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleArchive}
                  disabled={isPending}
                  className="text-gray-600 hover:text-gray-700"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsRejectionDialogOpen(true)}
                    disabled={isPending}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleApprove}
                    disabled={isPending}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </>
              )}
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              View only - Administrative approval required
            </div>
          )}
        </CardFooter>
      </Card>

      {/* Rejection Dialog */}
      {canManageRequests && (
        <Dialog open={isRejectionDialogOpen} onOpenChange={setIsRejectionDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Reject Certificate Request</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="mb-3 text-sm">
                Please provide a reason for rejecting the certificate request for{' '}
                <strong>{request.recipient_name}</strong>.
              </p>
              <Textarea
                placeholder="Reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsRejectionDialogOpen(false);
                  setRejectionReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectionReason.trim() || isPending}
              >
                {isPending ? 'Rejecting...' : 'Reject'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
