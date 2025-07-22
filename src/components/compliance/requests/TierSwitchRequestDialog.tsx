import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowRight, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Shield,
  FileText,
  Send,
  User
} from 'lucide-react';
import { TierSwitchRequestService, TierSwitchRequest } from '@/services/compliance/tierSwitchRequestService';
import { useComplianceDashboard } from '@/contexts/ComplianceDashboardContext';
import { toast } from 'sonner';

interface TierSwitchRequestDialogProps {
  userId: string;
  currentTier: 'basic' | 'robust';
  requestedTier: 'basic' | 'robust';
  userName: string;
  userRole: string;
  trigger?: React.ReactNode;
}

export function TierSwitchRequestDialog({
  userId,
  currentTier,
  requestedTier,
  userName,
  userRole,
  trigger
}: TierSwitchRequestDialogProps) {
  const { addNotification } = useComplianceDashboard();
  const [isOpen, setIsOpen] = useState(false);
  const [justification, setJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [userRequests, setUserRequests] = useState<TierSwitchRequest[]>([]);

  useEffect(() => {
    if (isOpen) {
      checkExistingRequests();
    }
  }, [isOpen, userId]);

  const checkExistingRequests = async () => {
    try {
      const [pending, requests] = await Promise.all([
        TierSwitchRequestService.hasPendingRequest(userId),
        TierSwitchRequestService.getUserTierSwitchRequests(userId)
      ]);
      
      setHasPendingRequest(pending);
      setUserRequests(requests.slice(0, 5)); // Show last 5 requests
    } catch (error) {
      console.error('Error checking existing requests:', error);
    }
  };

  const handleSubmit = async () => {
    if (!justification.trim()) {
      toast.error('Please provide a justification for the tier change request');
      return;
    }

    setIsSubmitting(true);
    try {
      const request = await TierSwitchRequestService.createTierSwitchRequest({
        user_id: userId,
        current_tier: currentTier,
        requested_tier: requestedTier,
        justification: justification.trim()
      });

      // Add notification to dashboard
      addNotification({
        type: 'tier_changed',
        title: 'Tier Change Request Submitted',
        message: `Your request to upgrade from ${currentTier} to ${requestedTier} tier has been submitted for admin review`,
        read: false
      });

      toast.success('Tier change request submitted successfully! An administrator will review your request.');
      setIsOpen(false);
      setJustification('');
      
      // Refresh requests
      await checkExistingRequests();
    } catch (error) {
      console.error('Error submitting tier change request:', error);
      toast.error('Failed to submit tier change request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const defaultTrigger = (
    <Button className="flex items-center gap-2">
      <Shield className="h-4 w-4" />
      Request Tier Change
      <ArrowRight className="h-4 w-4" />
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Request Tier Change: {currentTier} → {requestedTier}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* User Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">User:</span> {userName}
                </div>
                <div>
                  <span className="font-medium">Role:</span> {userRole}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Current Tier:</span>
                  <Badge variant="outline" className="flex items-center gap-1">
                    {currentTier === 'basic' ? <FileText className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                    {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Requested Tier:</span>
                  <Badge variant="outline" className="flex items-center gap-1">
                    {requestedTier === 'basic' ? <FileText className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                    {requestedTier.charAt(0).toUpperCase() + requestedTier.slice(1)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Request Warning */}
          {hasPendingRequest && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-yellow-800">
                <strong>You already have a pending tier change request.</strong> 
                Please wait for it to be reviewed before submitting another request.
              </AlertDescription>
            </Alert>
          )}

          {/* Justification Form */}
          {!hasPendingRequest && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  Justification for Tier Change <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  Please explain why you need to change your compliance tier. This will help administrators review your request.
                </p>
                <Textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Explain your business need for this tier change..."
                  rows={4}
                  className="resize-none"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {justification.length}/500 characters
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting || !justification.trim()}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="h-4 w-4 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Request
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Previous Requests */}
          {userRequests.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Recent Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userRequests.map((request) => (
                    <div key={request.id} className="flex items-start justify-between p-3 border rounded-lg">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {request.current_tier} → {request.requested_tier}
                          </span>
                          <Badge variant="outline" className={getStatusColor(request.status)}>
                            {getStatusIcon(request.status)}
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Requested: {formatDate(request.requested_at)}
                          {request.reviewed_at && (
                            <span className="ml-2">
                              • Reviewed: {formatDate(request.reviewed_at)}
                            </span>
                          )}
                        </div>
                        {request.admin_notes && (
                          <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                            <strong>Admin Notes:</strong> {request.admin_notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your tier change request will be reviewed by an administrator. You'll receive a notification when the review is complete.
              This process typically takes 1-3 business days.
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
}