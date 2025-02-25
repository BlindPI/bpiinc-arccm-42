
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ROLE_LABELS } from "@/lib/roles";
import { History } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface HistoryRequest {
  id: string;
  from_role: string;
  to_role: string;
  status: string;
  created_at: string;
  deadline: string;
  required_approvals: number;
  received_approvals: number;
  can_appeal: boolean;
  appeal_reason?: string;
  appeal_deadline?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
}

interface TransitionHistoryCardProps {
  userHistory: HistoryRequest[];
  onAppeal?: (id: string, reason: string) => void;
  onCancel?: (id: string, reason: string) => void;
}

export function TransitionHistoryCard({ 
  userHistory,
  onAppeal,
  onCancel 
}: TransitionHistoryCardProps) {
  const [appealDialog, setAppealDialog] = useState<{
    open: boolean;
    requestId: string | null;
  }>({ open: false, requestId: null });

  const [cancelDialog, setCancelDialog] = useState<{
    open: boolean;
    requestId: string | null;
  }>({ open: false, requestId: null });

  const [reason, setReason] = useState("");

  const handleAppealSubmit = () => {
    if (appealDialog.requestId && reason.trim() && onAppeal) {
      onAppeal(appealDialog.requestId, reason.trim());
      setAppealDialog({ open: false, requestId: null });
      setReason("");
    }
  };

  const handleCancelSubmit = () => {
    if (cancelDialog.requestId && reason.trim() && onCancel) {
      onCancel(cancelDialog.requestId, reason.trim());
      setCancelDialog({ open: false, requestId: null });
      setReason("");
    }
  };

  if (userHistory.length === 0) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-6 w-6" />
            Role Transition History
          </CardTitle>
          <CardDescription>
            Your role transition request history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userHistory.map((request) => (
              <Alert
                key={request.id}
                variant={
                  request.status === 'APPROVED' 
                    ? 'default'
                    : request.status === 'REJECTED'
                      ? 'destructive'
                      : request.status === 'CANCELLED'
                        ? 'outline'
                        : 'default'
                }
              >
                <AlertTitle>
                  {request.status === 'PENDING' && 'Pending Request'}
                  {request.status === 'APPROVED' && 'Approved Request'}
                  {request.status === 'REJECTED' && 'Rejected Request'}
                  {request.status === 'CANCELLED' && 'Cancelled Request'}
                </AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>From {ROLE_LABELS[request.from_role]} to {ROLE_LABELS[request.to_role]}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(request.created_at).toLocaleDateString()}
                  </p>
                  {request.status === 'PENDING' && (
                    <>
                      <p className="text-sm">
                        Approvals: {request.received_approvals}/{request.required_approvals}
                      </p>
                      <p className="text-sm">
                        Deadline: {new Date(request.deadline).toLocaleDateString()}
                      </p>
                      {onCancel && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCancelDialog({ 
                            open: true, 
                            requestId: request.id 
                          })}
                        >
                          Cancel Request
                        </Button>
                      )}
                    </>
                  )}
                  {request.status === 'REJECTED' && request.can_appeal && onAppeal && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAppealDialog({ 
                        open: true, 
                        requestId: request.id 
                      })}
                    >
                      Appeal Decision
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={appealDialog.open}
        onOpenChange={(open) => {
          setAppealDialog({ open, requestId: null });
          setReason("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Appeal Rejected Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for your appeal. This will be reviewed by the administrators.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="appeal-reason">Appeal Reason</Label>
              <Textarea
                id="appeal-reason"
                placeholder="Enter your appeal reason..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAppealDialog({ open: false, requestId: null });
                setReason("");
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAppealSubmit}
              disabled={!reason.trim()}
            >
              Submit Appeal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={cancelDialog.open}
        onOpenChange={(open) => {
          setCancelDialog({ open, requestId: null });
          setReason("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling this request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Cancellation Reason</Label>
              <Textarea
                id="cancel-reason"
                placeholder="Enter your cancellation reason..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelDialog({ open: false, requestId: null });
                setReason("");
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleCancelSubmit}
              disabled={!reason.trim()}
            >
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
