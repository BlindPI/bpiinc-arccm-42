
import React from 'react';
import { Loader2, User, BookOpen, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingDashboardProps {
  message?: string;
}

export function LoadingDashboard({ message = "Loading your dashboard..." }: LoadingDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Loading Header */}
      <div className="text-center py-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Welcome Back!</h2>
        <p className="text-muted-foreground">{message}</p>
      </div>

      {/* Loading Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BookOpen className="h-4 w-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-6 w-20 mb-2" />
            <Skeleton className="h-4 w-28" />
          </CardContent>
        </Card>
      </div>

      {/* Loading Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
