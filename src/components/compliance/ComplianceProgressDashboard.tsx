
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ComplianceProgress } from '@/types/analytics';
import { Shield, TrendingUp, CheckCircle, AlertTriangle, Clock, Target } from 'lucide-react';

interface ComplianceProgressDashboardProps {
  userId: string;
  userRole: string;
}

export function ComplianceProgressDashboard({ userId, userRole }: ComplianceProgressDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: progress, isLoading } = useQuery({
    queryKey: ['compliance-progress', userId],
    queryFn: async (): Promise<ComplianceProgress> => {
      // Mock implementation - replace with actual service call
      return {
        userId,
        overallProgress: 75,
        completedRequirements: 12,
        totalRequirements: 16,
        tier: 'basic',
        canAdvanceTier: false,
        requirements: {
          completed: 12,
          total: 16
        }
      };
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!progress) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No compliance progress data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress.overallProgress}%</div>
            <Progress value={progress.overallProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requirements</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progress.requirements.completed}/{progress.requirements.total}
            </div>
            <p className="text-xs text-muted-foreground">
              {progress.requirements.completed} of {progress.requirements.total} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Tier</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={progress.tier === 'robust' ? 'default' : 'secondary'}>
              {progress.tier.charAt(0).toUpperCase() + progress.tier.slice(1)}
            </Badge>
            {progress.canAdvanceTier && (
              <p className="text-xs text-green-600 mt-1">Ready to advance!</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={progress.overallProgress >= 80 ? 'default' : 'secondary'}>
              {progress.overallProgress >= 80 ? 'On Track' : 'In Progress'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Progress */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Overall Progress</span>
                  <span className="font-medium">{progress.overallProgress}%</span>
                </div>
                <Progress value={progress.overallProgress} />
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-medium">Current Status</h4>
                    <p className="text-sm text-muted-foreground">
                      You have completed {progress.completedRequirements} out of {progress.totalRequirements} requirements.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Next Steps</h4>
                    <p className="text-sm text-muted-foreground">
                      {progress.canAdvanceTier 
                        ? 'You are ready to advance to the next tier!'
                        : `Complete ${progress.totalRequirements - progress.completedRequirements} more requirements to advance.`
                      }
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requirements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Requirements Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Requirements detail view</p>
                <p className="text-sm">Detailed breakdown of compliance requirements</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Progress Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Timeline visualization</p>
                <p className="text-sm">Track your compliance progress over time</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
