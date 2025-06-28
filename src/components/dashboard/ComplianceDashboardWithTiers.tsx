
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useComplianceTierRealtime } from '@/hooks/useComplianceTier';
import { CheckCircle, Clock, AlertTriangle, Award } from 'lucide-react';

export function ComplianceDashboardWithTiers() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: tierInfo } = useComplianceTierRealtime(user?.id);

  if (!user || !profile || !tierInfo) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Loading compliance data...</p>
        </CardContent>
      </Card>
    );
  }

  const overallCompletion = tierInfo?.completion_percentage || 0;
  const totalRequirements = tierInfo?.requirements?.length || 0;
  const completedRequirements = tierInfo?.completed_requirements || 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallCompletion}%</div>
            <Progress value={overallCompletion} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">70%</div>
            <Progress value={70} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medium Priority</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">55%</div>
            <Progress value={55} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Points Earned</CardTitle>
            <Award className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">780/1200</div>
            <Progress value={65} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Tier Information */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Tier</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Current Tier: <Badge>{tierInfo?.tier}</Badge></p>
          <p>Requirements Completed: {completedRequirements} / {totalRequirements}</p>
          <Progress value={overallCompletion} />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <Button>View Requirements</Button>
        </CardContent>
      </Card>
    </div>
  );
}
