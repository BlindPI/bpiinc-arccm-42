import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Upload,
  Calendar,
  Info
} from 'lucide-react';
import { useComplianceDashboard } from '@/contexts/ComplianceDashboardContext';

export function RequirementsChecklist() {
  const { state, dispatch } = useComplianceDashboard();
  const { complianceRecords, tierInfo } = state.data;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'non_compliant':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-blue-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant':
        return <Badge className="bg-green-100 text-green-800">Complete</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'non_compliant':
        return <Badge className="bg-red-100 text-red-800">Required</Badge>;
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleUploadClick = (metricId: string) => {
    dispatch({ type: 'OPEN_UPLOAD_MODAL', payload: metricId });
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const isOverdue = (dateString: string | null | undefined) => {
    if (!dateString) return false;
    try {
      return new Date(dateString) < new Date();
    } catch {
      return false;
    }
  };

  // Group requirements by category
  const groupedRequirements = complianceRecords.reduce((groups, record) => {
    const category = record.compliance_metrics?.category || 'General';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(record);
    return groups;
  }, {} as Record<string, typeof complianceRecords>);

  // Calculate completion stats
  const totalRequirements = complianceRecords.length;
  const completedRequirements = complianceRecords.filter(r => r.compliance_status === 'compliant').length;
  const completionPercentage = totalRequirements > 0 ? Math.round((completedRequirements / totalRequirements) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Requirements Checklist
          </CardTitle>
          <div className="text-right">
            <div className="text-sm text-gray-500">
              {completedRequirements} of {totalRequirements} complete
            </div>
            <div className="text-lg font-semibold">
              {completionPercentage}%
            </div>
          </div>
        </div>
        <Progress value={completionPercentage} className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedRequirements).map(([category, requirements]) => (
          <div key={category} className="space-y-4">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-900">{category}</h4>
              <Badge variant="outline" className="text-xs">
                {requirements.filter(r => r.compliance_status === 'compliant').length}/{requirements.length}
              </Badge>
            </div>
            
            <div className="space-y-3">
              {requirements.map((record) => (
                <div 
                  key={record.id} 
                  className={`p-4 border rounded-lg transition-colors ${
                    record.compliance_status === 'compliant' 
                      ? 'bg-green-50 border-green-200' 
                      : record.compliance_status === 'non_compliant'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(record.compliance_status)}
                        <span className="font-medium">
                          {record.compliance_metrics?.name}
                        </span>
                        {getStatusBadge(record.compliance_status)}
                      </div>
                      
                      {record.compliance_metrics?.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {record.compliance_metrics.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                        {record.last_checked_at && (
                          <span>
                            Last checked: {formatDate(record.last_checked_at)}
                          </span>
                        )}
                        {record.next_check_due && (
                          <span className={isOverdue(record.next_check_due) ? 'text-red-600 font-medium' : ''}>
                            <Calendar className="inline h-3 w-3 mr-1" />
                            Due: {formatDate(record.next_check_due)}
                            {isOverdue(record.next_check_due) && ' (Overdue)'}
                          </span>
                        )}
                      </div>

                      {record.notes && (
                        <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                          <strong>Notes:</strong> {record.notes}
                        </div>
                      )}
                    </div>

                    {record.compliance_status !== 'compliant' && 
                     record.compliance_metrics?.measurement_type === 'boolean' && (
                      <Button
                        size="sm"
                        onClick={() => handleUploadClick(record.metric_id)}
                        className="ml-4"
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Upload
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {complianceRecords.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FileText className="mx-auto h-12 w-12 mb-4 text-gray-300" />
            <p className="text-lg font-medium">No requirements found</p>
            <p className="text-sm">
              {tierInfo ? 
                'Your compliance requirements will appear here once they are assigned.' :
                'Please contact your administrator to assign compliance requirements.'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}