
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ComplianceProgress } from '@/types/analytics';
import { CheckCircle, Clock, AlertTriangle, Award } from 'lucide-react';

interface ComplianceProgressDashboardProps {
  userId?: string;
}

export function ComplianceProgressDashboard({ userId }: ComplianceProgressDashboardProps) {
  const { data: progress, isLoading } = useQuery({
    queryKey: ['compliance-progress', userId],
    queryFn: async (): Promise<ComplianceProgress> => {
      // Mock data with proper structure
      return {
        completion: {
          overall: 75,
          byCategory: {
            'Safety': 80,
            'Training': 70,
            'Documentation': 85
          },
          byPriority: {
            'High': 90,
            'Medium': 75,
            'Low': 60
          }
        },
        byType: {
          'Certification': { completed: 8, total: 10 },
          'Training': { completed: 15, total: 20 },
          'Documentation': { completed: 12, total: 15 }
        },
        points: {
          earned: 850,
          total: 1200,
          byCategory: {
            'Safety': 300,
            'Training': 400,
            'Documentation': 150
          }
        }
      };
    },
    enabled: !!userId
  });

  if (!userId) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Please select a user to view compliance progress</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const overallCompletion = progress?.completion?.overall || 0;
  const totalPoints = progress?.points?.total || 0;
  const earnedPoints = progress?.points?.earned || 0;

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
            <div className="text-2xl font-bold">{progress?.completion?.byPriority?.['High'] || 0}%</div>
            <Progress value={progress?.completion?.byPriority?.['High'] || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medium Priority</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress?.completion?.byPriority?.['Medium'] || 0}%</div>
            <Progress value={progress?.completion?.byPriority?.['Medium'] || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Points Earned</CardTitle>
            <Award className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{earnedPoints}/{totalPoints}</div>
            <Progress value={(earnedPoints / totalPoints) * 100} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Completion by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Progress by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(progress?.completion?.byCategory || {}).map(([category, percentage]) => (
              <div key={category} className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">{category}</span>
                  <span className="text-sm text-muted-foreground">{percentage}%</span>
                </div>
                <Progress value={percentage} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Completion by Type */}
      <Card>
        <CardHeader>
          <CardTitle>Completion by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(progress?.byType || {}).map(([type, data]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="font-medium">{type}</span>
                  <Badge variant="outline">
                    {data.completed}/{data.total}
                  </Badge>
                </div>
                <Progress 
                  value={(data.completed / data.total) * 100} 
                  className="w-32"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
