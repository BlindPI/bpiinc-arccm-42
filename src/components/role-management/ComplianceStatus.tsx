
import { useComplianceStatus } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';

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
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {complianceData.isCompliant ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  Compliant
                </Badge>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-destructive" />
                <Badge variant="destructive">Non-Compliant</Badge>
              </>
            )}
          </div>
          {complianceData.notes && (
            <p className="text-sm text-muted-foreground">{complianceData.notes}</p>
          )}
          <div className="grid gap-2">
            <div className="text-sm">
              <span className="font-medium">Last Check:</span>{' '}
              {complianceData.lastCheck
                ? new Date(complianceData.lastCheck).toLocaleDateString()
                : 'Not available'}
            </div>
            <div className="text-sm">
              <span className="font-medium">Documents Status:</span>{' '}
              {`${complianceData.submittedDocuments || 0}/${
                complianceData.requiredDocuments || 0
              } Complete`}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
