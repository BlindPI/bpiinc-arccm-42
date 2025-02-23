
import { useComplianceStatus } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Progress } from "@/components/ui/progress";

interface ComplianceStatusProps {
  userId: string;
}

export function ComplianceStatus({ userId }: ComplianceStatusProps) {
  const queryClient = useQueryClient();
  const { data: complianceData, isLoading, error, isError } = useComplianceStatus();

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['compliance'] });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-2 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error instanceof Error ? error.message : 'Error loading compliance status'}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRetry}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!complianceData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>No compliance data available</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const completionPercentage = complianceData.requiredDocuments
    ? (complianceData.submittedDocuments / complianceData.requiredDocuments) * 100
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Compliance Status
          {complianceData.isCompliant ? (
            <Badge variant="outline" className="bg-green-100 text-green-800">
              Compliant
            </Badge>
          ) : (
            <Badge variant="destructive">Non-Compliant</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Document Completion</span>
              <span className="font-medium">
                {complianceData.submittedDocuments}/{complianceData.requiredDocuments}
              </span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>

          <div className="space-y-4">
            {complianceData.notes && (
              <div className="rounded-md bg-muted/50 p-3">
                <p className="text-sm text-muted-foreground">{complianceData.notes}</p>
              </div>
            )}
            
            <div className="grid gap-4 text-sm">
              <div className="flex justify-between items-center py-1 border-b">
                <span className="text-muted-foreground">Last Verification</span>
                <span className="font-medium">
                  {complianceData.lastCheck
                    ? new Date(complianceData.lastCheck).toLocaleDateString()
                    : 'Not available'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b">
                <span className="text-muted-foreground">Next Review Due</span>
                <span className="font-medium">
                  {complianceData.nextReviewDate
                    ? new Date(complianceData.nextReviewDate).toLocaleDateString()
                    : 'Not scheduled'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
