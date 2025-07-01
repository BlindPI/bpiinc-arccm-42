
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  TrendingUp, 
  Users, 
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  Download
} from 'lucide-react';

interface RoleManagementHeaderProps {
  currentRole: string;
  totalProgression: number;
  pendingRequests: number;
  complianceRate: number;
  nextEligibleRole?: string;
  onExportData?: () => void;
}

export const RoleManagementHeader: React.FC<RoleManagementHeaderProps> = ({
  currentRole,
  totalProgression,
  pendingRequests,
  complianceRate,
  nextEligibleRole,
  onExportData
}) => {
  const getComplianceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const metrics = [
    {
      title: 'Current Role',
      value: currentRole,
      icon: Shield,
      color: 'text-blue-600',
      description: 'Your current position',
      trend: nextEligibleRole ? `Next: ${nextEligibleRole}` : 'Top level'
    },
    {
      title: 'Active Progressions',
      value: totalProgression,
      icon: TrendingUp,
      color: 'text-purple-600',
      description: 'In progress',
      trend: 'System wide'
    },
    {
      title: 'Pending Reviews',
      value: pendingRequests,
      icon: Clock,
      color: 'text-amber-600',
      description: 'Awaiting approval',
      trend: pendingRequests > 0 ? 'Action needed' : 'All clear'
    },
    {
      title: 'Compliance Rate',
      value: `${complianceRate}%`,
      icon: CheckCircle,
      color: getComplianceColor(complianceRate),
      description: 'Overall compliance',
      trend: complianceRate >= 80 ? 'Excellent' : 'Needs attention'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Role Management
          </h1>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Shield className="h-3 w-3 mr-1" />
              {currentRole}
            </Badge>
            {complianceRate >= 80 && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Compliant
              </Badge>
            )}
            {nextEligibleRole && (
              <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                Eligible for {nextEligibleRole}
              </Badge>
            )}
          </div>
          <p className="text-gray-600">
            Track your role progression, manage transitions, and monitor compliance requirements
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export Progress
          </Button>
          {nextEligibleRole && (
            <Button className="gap-2">
              <ArrowUpRight className="h-4 w-4" />
              Request Upgrade
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
