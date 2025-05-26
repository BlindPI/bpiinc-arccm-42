
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useInstructorDashboardData } from '@/hooks/dashboard/useInstructorDashboardData';
import { InlineLoader } from '@/components/ui/LoadingStates';

interface ComplianceStatusWidgetProps {
  userId: string;
}

export const ComplianceStatusWidget: React.FC<ComplianceStatusWidgetProps> = ({ 
  userId 
}) => {
  const { complianceData, isLoading } = useInstructorDashboardData(userId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance Status</CardTitle>
        </CardHeader>
        <CardContent>
          <InlineLoader message="Loading compliance data..." />
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Shield className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const score = complianceData?.score || 0;
  const status = complianceData?.status || 'critical';
  const lastEvaluation = complianceData?.lastEvaluation;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon(status)}
          Compliance Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Compliance Score</span>
          <Badge className={getStatusColor(status)}>
            {score}%
          </Badge>
        </div>
        
        <Progress value={score} className="h-2" />
        
        <div className="text-sm text-muted-foreground">
          {lastEvaluation ? (
            <p>Last evaluation: {new Date(lastEvaluation).toLocaleDateString()}</p>
          ) : (
            <p>No evaluations recorded</p>
          )}
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm">
            {status === 'compliant' && 'Great work! You are meeting all compliance requirements.'}
            {status === 'warning' && 'Some compliance areas need attention. Please review your requirements.'}
            {status === 'critical' && 'Immediate action required to meet compliance standards.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
