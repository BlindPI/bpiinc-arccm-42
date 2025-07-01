
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus, Users, Calendar, CheckCircle, XCircle } from "lucide-react";

interface EnrollmentStatsProps {
  stats: {
    totalEnrollments: number;
    activeEnrollments: number;
    waitlistCount: number;
    completedCount: number;
    cancelledCount?: number;
    enrollmentTrends?: {
      thisMonth: number;
      lastMonth: number;
      percentageChange: number;
    };
  };
  isLoading: boolean;
}

export function EnrollmentStats({ stats, isLoading }: EnrollmentStatsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const completionRate = stats.totalEnrollments > 0 
    ? Math.round((stats.completedCount / stats.totalEnrollments) * 100) 
    : 0;

  const activeRate = stats.totalEnrollments > 0 
    ? Math.round((stats.activeEnrollments / stats.totalEnrollments) * 100) 
    : 0;

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-3 w-3 text-red-600" />;
    return <Minus className="h-3 w-3 text-gray-500" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalEnrollments}</div>
          {stats.enrollmentTrends && (
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {getTrendIcon(stats.enrollmentTrends.percentageChange)}
              <span className={`ml-1 ${getTrendColor(stats.enrollmentTrends.percentageChange)}`}>
                {Math.abs(stats.enrollmentTrends.percentageChange).toFixed(1)}% from last month
              </span>
            </div>
          )}
          <Progress value={100} className="mt-2 h-1" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Enrollments</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeEnrollments}</div>
          <p className="text-xs text-muted-foreground">
            {activeRate}% of total enrollments
          </p>
          <Progress value={activeRate} className="mt-2 h-1" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Waitlisted</CardTitle>
          <Calendar className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.waitlistCount}</div>
          <p className="text-xs text-muted-foreground">
            Awaiting enrollment spots
          </p>
          <Progress 
            value={stats.totalEnrollments > 0 ? (stats.waitlistCount / stats.totalEnrollments) * 100 : 0} 
            className="mt-2 h-1" 
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.completedCount}</div>
          <p className="text-xs text-muted-foreground">
            {completionRate}% completion rate
          </p>
          <Progress value={completionRate} className="mt-2 h-1" />
        </CardContent>
      </Card>
    </div>
  );
}
