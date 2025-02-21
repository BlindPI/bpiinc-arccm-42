
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_LABELS } from "@/lib/roles";
import { CheckCircle2, XCircle } from "lucide-react";
import { UseMutationResult } from "@tanstack/react-query";

interface ReviewableRequest {
  id: string;
  from_role: string;
  to_role: string;
}

interface ReviewableRequestsCardProps {
  reviewableRequests: ReviewableRequest[];
  updateTransitionRequest: UseMutationResult<void, Error, { id: string; status: 'APPROVED' | 'REJECTED' }, unknown>;
}

export function ReviewableRequestsCard({
  reviewableRequests,
  updateTransitionRequest
}: ReviewableRequestsCardProps) {
  if (reviewableRequests.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Requests for Review</CardTitle>
        <CardDescription>
          Review and manage role transition requests
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reviewableRequests.map((request) => (
            <Alert key={request.id} className="relative">
              <AlertTitle>
                Role Transition Request
              </AlertTitle>
              <AlertDescription>
                <div className="space-y-2">
                  <p>
                    From {ROLE_LABELS[request.from_role]} to {ROLE_LABELS[request.to_role]}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => updateTransitionRequest.mutate({ 
                        id: request.id, 
                        status: 'APPROVED' 
                      })}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => updateTransitionRequest.mutate({ 
                        id: request.id, 
                        status: 'REJECTED' 
                      })}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
