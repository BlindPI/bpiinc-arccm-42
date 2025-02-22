
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import { ROLE_LABELS } from "@/lib/roles";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ReviewableRequestsCardProps {
  reviewableRequests: any[];
  updateTransitionRequest: any;
}

export function ReviewableRequestsCard({ 
  reviewableRequests,
  updateTransitionRequest 
}: ReviewableRequestsCardProps) {
  const [rejectionDialog, setRejectionDialog] = useState<{
    open: boolean;
    requestId: string | null;
  }>({ open: false, requestId: null });
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = async (requestId: string) => {
    try {
      await updateTransitionRequest.mutateAsync({ 
        id: requestId, 
        status: 'APPROVED'
      });
      toast.success("Request approved successfully");
    } catch (error) {
      toast.error("Failed to approve request");
    }
  };

  const handleReject = async () => {
    if (!rejectionDialog.requestId || !rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      await updateTransitionRequest.mutateAsync({ 
        id: rejectionDialog.requestId, 
        status: 'REJECTED',
        rejectionReason: rejectionReason.trim()
      });
      setRejectionDialog({ open: false, requestId: null });
      setRejectionReason("");
      toast.success("Request rejected successfully");
    } catch (error) {
      toast.error("Failed to reject request");
    }
  };

  if (!reviewableRequests.length) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Pending Review Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {reviewableRequests.map((request) => (
            <div
              key={request.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <p className="font-medium">
                  Role Change Request: {ROLE_LABELS[request.from_role]} →{" "}
                  {ROLE_LABELS[request.to_role]}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(request.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleApprove(request.id)}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={() => setRejectionDialog({ 
                    open: true, 
                    requestId: request.id 
                  })}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog
        open={rejectionDialog.open}
        onOpenChange={(open) => {
          setRejectionDialog({ open, requestId: null });
          setRejectionReason("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Role Change Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this request. This will be
              visible to the user who made the request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="Enter the reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectionDialog({ open: false, requestId: null });
                setRejectionReason("");
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
