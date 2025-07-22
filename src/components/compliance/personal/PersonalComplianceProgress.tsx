import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Shield, 
  FileText, 
  TrendingUp 
} from 'lucide-react';
import { useComplianceDashboard } from '@/contexts/ComplianceDashboardContext';

export function PersonalComplianceProgress() {
  const { state } = useComplianceDashboard();
  const { complianceSummary, tierInfo } = state.data;

  if (!complianceSummary || !tierInfo) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-2 bg-gray-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (score >= 70) return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    return <AlertTriangle className="h-5 w-5 text-red-600" />;
  };

  const getStatusText = (score: number) => {
    if (score >= 90) return 'Compliant';
    if (score >= 70) return 'Needs Attention';
    return 'Non-Compliant';
  };

  return (
    <div className="space-y-6">
      {/* Main Progress Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              My Compliance Progress
            </CardTitle>
            <Badge 
              variant="outline" 
              className={tierInfo.tier === 'robust' ? 'bg-green-50' : 'bg-blue-50'}
            >
              {tierInfo.tier === 'robust' ? (
                <Shield className="h-3 w-3 mr-1" />
              ) : (
                <FileText className="h-3 w-3 mr-1" />
              )}
              {tierInfo.tier.charAt(0).toUpperCase() + tierInfo.tier.slice(1)} Tier
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Score */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(complianceSummary.overall_score)}
                <span className="text-lg font-semibold">
                  Overall Compliance Score
                </span>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${getStatusColor(complianceSummary.overall_score)}`}>
                  {complianceSummary.overall_score}%
                </div>
                <div className="text-sm text-gray-500">
                  {getStatusText(complianceSummary.overall_score)}
                </div>
              </div>
            </div>
            
            <Progress 
              value={complianceSummary.overall_score} 
              className="h-3"
            />
          </div>

          {/* Tier Progress */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {tierInfo.template_name} Progress
              </span>
              <span className="text-sm text-gray-500">
                {tierInfo.completed_requirements} of {tierInfo.total_requirements} requirements
              </span>
            </div>
            
            <Progress 
              value={tierInfo.completion_percentage} 
              className="h-2"
            />
            
            <div className="text-xs text-gray-500">
              {tierInfo.completion_percentage}% completed
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {complianceSummary.compliant_count}
                </div>
                <div className="text-xs text-gray-500">Compliant</div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {complianceSummary.warning_count}
                </div>
                <div className="text-xs text-gray-500">Warnings</div>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {complianceSummary.non_compliant_count}
                </div>
                <div className="text-xs text-gray-500">Issues</div>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {complianceSummary.pending_count}
                </div>
                <div className="text-xs text-gray-500">Pending</div>
              </div>
              <Clock className="h-8 w-8 text-blue-600 opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}