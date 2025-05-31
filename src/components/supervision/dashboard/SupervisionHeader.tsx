
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  UserCheck, 
  Shield, 
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  UserPlus,
  Download
} from 'lucide-react';

interface SupervisionHeaderProps {
  activeSupervisees: number;
  activeSupervisors: number;
  pendingRequests: number;
  complianceRate: number;
  userRole: string;
  onCreateRelationship?: () => void;
  onExportData?: () => void;
}

export const SupervisionHeader: React.FC<SupervisionHeaderProps> = ({
  activeSupervisees,
  activeSupervisors,
  pendingRequests,
  complianceRate,
  userRole,
  onCreateRelationship,
  onExportData
}) => {
  const getComplianceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const canSupervise = ['AP', 'AD', 'SA'].includes(userRole);

  const metrics = [
    {
      title: 'My Supervisees',
      value: activeSupervisees,
      icon: Users,
      color: 'text-blue-600',
      description: 'People I supervise',
      trend: activeSupervisees > 0 ? 'Active supervision' : 'No supervisees'
    },
    {
      title: 'My Supervisors',
      value: activeSupervisors,
      icon: UserCheck,
      color: 'text-green-600',
      description: 'People supervising me',
      trend: activeSupervisors > 0 ? 'Under supervision' : 'Independent'
    },
    {
      title: 'Pending Requests',
      value: pendingRequests,
      icon: Clock,
      color: 'text-amber-600',
      description: 'Awaiting response',
      trend: pendingRequests > 0 ? 'Action required' : 'All clear'
    },
    {
      title: 'Compliance Rate',
      value: `${complianceRate}%`,
      icon: Shield,
      color: getComplianceColor(complianceRate),
      description: 'Overall supervision compliance',
      trend: complianceRate >= 80 ? 'Excellent' : 'Needs attention'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Supervision Management
          </h1>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Shield className="h-3 w-3 mr-1" />
              {userRole}
            </Badge>
            {canSupervise && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <UserCheck className="h-3 w-3 mr-1" />
                Can Supervise
              </Badge>
            )}
            {complianceRate >= 80 && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Compliant
              </Badge>
            )}
            {pendingRequests > 0 && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {pendingRequests} Pending
              </Badge>
            )}
          </div>
          <p className="text-gray-600">
            Manage supervision relationships, track progress, and ensure compliance across your organization
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          {canSupervise && onCreateRelationship && (
            <Button className="gap-2" onClick={onCreateRelationship}>
              <UserPlus className="h-4 w-4" />
              Create Supervision
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index} className="border-2 hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {metric.title}
                </CardTitle>
                <div className="p-2 rounded-lg bg-gray-50">
                  <metric.icon className={`h-4 w-4 ${metric.color}`} />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className={`text-3xl font-bold ${metric.color}`}>
                  {metric.value}
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {metric.description}
                  </p>
                  
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="text-xs font-medium text-green-600">
                      {metric.trend}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
