
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_LABELS } from "@/lib/roles";
import { History } from "lucide-react";

interface HistoryRequest {
  id: string;
  from_role: string;
  to_role: string;
  status: string;
  created_at: string;
}

interface TransitionHistoryCardProps {
  userHistory: HistoryRequest[];
}

export function TransitionHistoryCard({ userHistory }: TransitionHistoryCardProps) {
  if (userHistory.length === 0) return null;

  return (
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
                    : 'default'
              }
            >
              <AlertTitle>
                {request.status === 'PENDING' && 'Pending Request'}
                {request.status === 'APPROVED' && 'Approved Request'}
                {request.status === 'REJECTED' && 'Rejected Request'}
              </AlertTitle>
              <AlertDescription>
                <p>From {ROLE_LABELS[request.from_role]} to {ROLE_LABELS[request.to_role]}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(request.created_at).toLocaleDateString()}
                </p>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
