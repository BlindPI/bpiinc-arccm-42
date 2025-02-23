
import { useComplianceStatus } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { ComplianceData } from '@/types/api';

interface ComplianceStatusProps {
  userId: string;
}

export function ComplianceStatus({ userId }: ComplianceStatusProps) {
  const { data: response, isLoading, error } = useComplianceStatus();
  const complianceData = response?.data;

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

  if (error || !complianceData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>Error loading compliance status</span>
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
