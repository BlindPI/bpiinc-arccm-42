
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Clock, 
  TrendingUp, 
  BarChart3, 
  AlertTriangle,
  CheckCircle2,
  Activity
} from 'lucide-react';
import { useTeachingManagement } from '@/hooks/useTeachingManagement';

export const InstructorWorkloadDashboard: React.FC = () => {
  const { useInstructorWorkload, balanceLoad, generateComplianceReport } = useTeachingManagement();
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  
  const { data: workloads, isLoading } = useInstructorWorkload();

  const handleLoadBalancing = () => {
    balanceLoad.mutate();
  };

  const getWorkloadStatus = (hours: number, average: number) => {
    if (hours > average * 1.5) return { status: 'overloaded', color: 'bg-red-100 text-red-800' };
    if (hours < average * 0.5) return { status: 'underloaded', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'balanced', color: 'bg-green-100 text-green-800' };
  };

  const getComplianceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!workloads || workloads.length === 0) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No instructor workload data available. Teaching sessions need to be logged first.
        </AlertDescription>
      </Alert>
    );
  }

  const averageHours = workloads.reduce((sum, w) => sum + w.hours_this_month, 0) / workloads.length;
  const totalInstructors = workloads.length;
  const overloadedCount = workloads.filter(w => w.hours_this_month > averageHours * 1.5).length;
  const underloadedCount = workloads.filter(w => w.hours_this_month < averageHours * 0.5).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Instructor Workload Dashboard</h1>
          <p className="text-muted-foreground">Monitor and balance instructor teaching loads</p>
        </div>
        <Button onClick={handleLoadBalancing} disabled={balanceLoad.isPending}>
          <BarChart3 className="h-4 w-4 mr-2" />
          {balanceLoad.isPending ? 'Analyzing...' : 'Balance Load'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalInstructors}</div>
              <div className="text-sm text-muted-foreground">Total Instructors</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{averageHours.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Avg Hours/Month</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{overloadedCount}</div>
              <div className="text-sm text-muted-foreground">Overloaded</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{underloadedCount}</div>
              <div className="text-sm text-muted-foreground">Underloaded</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workload Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Instructor Workload Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workloads.map((instructor) => {
              const workloadStatus = getWorkloadStatus(instructor.hours_this_month, averageHours);
              const compliancePercentage = instructor.compliance_percentage || 0;
              
              return (
                <div key={instructor.instructor_id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{instructor.display_name}</h4>
                      <p className="text-sm text-muted-foreground">{instructor.role}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={workloadStatus.color}>
                        {workloadStatus.status}
                      </Badge>
                      <div className={`text-sm font-medium ${getComplianceColor(compliancePercentage)}`}>
                        {compliancePercentage.toFixed(1)}% Compliant
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div className="text-center">
                      <div className="text-lg font-semibold">{instructor.sessions_this_month}</div>
                      <div className="text-xs text-muted-foreground">Sessions This Month</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">{instructor.hours_this_month.toFixed(1)}</div>
                      <div className="text-xs text-muted-foreground">Hours This Month</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">{instructor.total_sessions_all_time}</div>
                      <div className="text-xs text-muted-foreground">Total Sessions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">{instructor.total_hours_all_time.toFixed(1)}</div>
                      <div className="text-xs text-muted-foreground">Total Hours</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Workload vs Average</span>
                      <span>{((instructor.hours_this_month / averageHours) * 100).toFixed(0)}%</span>
                    </div>
                    <Progress 
                      value={Math.min((instructor.hours_this_month / (averageHours * 2)) * 100, 100)} 
                      className="h-2" 
                    />
                    
                    <div className="flex justify-between text-sm">
                      <span>Compliance Rate</span>
                      <span>{compliancePercentage.toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={compliancePercentage} 
                      className="h-2" 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Load Balancing Recommendations */}
      {balanceLoad.data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Load Balancing Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {balanceLoad.data.recommendations.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                Workload distribution is well balanced!
              </div>
            ) : (
              <div className="space-y-3">
                {balanceLoad.data.recommendations.map((rec, index) => (
                  <Alert key={index}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium">{rec.message}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Priority: {rec.priority} | Type: {rec.type}
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InstructorWorkloadDashboard;
