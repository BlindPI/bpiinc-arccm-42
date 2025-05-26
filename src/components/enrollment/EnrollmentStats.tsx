
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown } from "lucide-react";

interface EnrollmentStatsProps {
  stats: {
    totalEnrollments: number;
    activeEnrollments: number;
    waitlistCount: number;
    completedCount: number;
  };
  isLoading: boolean;
}

export function EnrollmentStats({ stats, isLoading }: EnrollmentStatsProps) {
  const completionRate = stats.totalEnrollments > 0 
    ? (stats.completedCount / stats.totalEnrollments) * 100 
    : 0;

  const enrollmentRate = stats.totalEnrollments > 0 
    ? (stats.activeEnrollments / stats.totalEnrollments) * 100 
    : 0;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Enrollment Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{enrollmentRate.toFixed(1)}%</div>
          <Progress value={enrollmentRate} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {stats.activeEnrollments} of {stats.totalEnrollments} enrolled
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
          <Progress value={completionRate} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {stats.completedCount} completed courses
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Waitlist Status</CardTitle>
          {stats.waitlistCount > 0 ? (
            <TrendingDown className="h-4 w-4 text-orange-500" />
          ) : (
            <TrendingUp className="h-4 w-4 text-green-500" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.waitlistCount}</div>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.waitlistCount === 0 ? 'No waitlisted students' : 'Students awaiting enrollment'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
