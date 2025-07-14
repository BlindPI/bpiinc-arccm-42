import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, TrendingUp } from "lucide-react";
import { WorkflowStage } from '@/services/analytics/enrollmentAnalyticsService';

interface WorkflowProgressChartProps {
  data?: WorkflowStage[];
}

export function WorkflowProgressChart({ data }: WorkflowProgressChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No workflow data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (stage: string) => {
    switch (stage) {
      case 'ENROLLED': return 'bg-green-500';
      case 'WAITLISTED': return 'bg-yellow-500';
      case 'COMPLETED': return 'bg-blue-500';
      case 'CANCELLED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (stage: string) => {
    switch (stage) {
      case 'ENROLLED': return 'Active Enrollments';
      case 'WAITLISTED': return 'Waiting for Spots';
      case 'COMPLETED': return 'Course Completed';
      case 'CANCELLED': return 'Cancelled/Withdrawn';
      default: return stage;
    }
  };

  const totalStudents = data.reduce((sum, stage) => sum + stage.count, 0);
  const avgTimeInWorkflow = data.reduce((sum, stage) => sum + (stage.avgTimeInStage * stage.count), 0) / totalStudents;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all workflow stages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time in Workflow</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgTimeInWorkflow.toFixed(1)} days</div>
            <p className="text-xs text-muted-foreground">
              From enrollment to completion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((data.find(s => s.stage === 'ENROLLED')?.percentage || 0)).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Students actively enrolled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Stage Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Stage Distribution</CardTitle>
          <p className="text-sm text-muted-foreground">
            Current distribution of students across workflow stages
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {data.map((stage) => (
              <div key={stage.stage} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded ${getStatusColor(stage.stage)}`} />
                    <div>
                      <h3 className="font-medium">{getStatusLabel(stage.stage)}</h3>
                      <p className="text-sm text-muted-foreground">
                        Average time: {stage.avgTimeInStage} days
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">{stage.count}</div>
                    <Badge variant="outline">{stage.percentage.toFixed(1)}%</Badge>
                  </div>
                </div>
                
                <Progress value={stage.percentage} className="h-2" />
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{stage.count} students</span>
                  <span>{stage.percentage.toFixed(1)}% of total</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stage Analysis */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Stage Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.map((stage) => (
              <div key={stage.stage} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">{getStatusLabel(stage.stage)}</p>
                  <p className="text-sm text-muted-foreground">
                    {stage.avgTimeInStage} days avg. duration
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{stage.count}</div>
                  <div className="text-xs text-muted-foreground">students</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Optimization Opportunities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-800">Fast Track Completions</p>
              <p className="text-sm text-blue-600">
                {data.find(s => s.stage === 'ENROLLED')?.count || 0} students ready for advancement
              </p>
            </div>
            
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm font-medium text-yellow-800">Waitlist Management</p>
              <p className="text-sm text-yellow-600">
                {data.find(s => s.stage === 'WAITLISTED')?.count || 0} students awaiting placement
              </p>
            </div>
            
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-800">Success Rate</p>
              <p className="text-sm text-green-600">
                {((data.find(s => s.stage === 'COMPLETED')?.percentage || 0)).toFixed(1)}% completion rate
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}