
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RosterStatistics as RosterStatsType } from '@/types/rosters';
import { Skeleton } from '@/components/ui/skeleton';
import { CircleCheck, CircleMinus, CircleAlert, Clock } from 'lucide-react';

interface RosterStatisticsProps {
  roster: any;
  statistics?: RosterStatsType;
  isLoading: boolean;
}

export function RosterStatistics({ roster, statistics, isLoading }: RosterStatisticsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = statistics || {
    total_certificates: 0,
    active_certificates: 0,
    expired_certificates: 0,
    revoked_certificates: 0
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_certificates}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <CircleCheck className="h-4 w-4 text-green-500 mr-1" />
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_certificates}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Clock className="h-4 w-4 text-amber-500 mr-1" />
              Expired
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.expired_certificates}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <CircleAlert className="h-4 w-4 text-destructive mr-1" />
              Revoked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.revoked_certificates}</div>
          </CardContent>
        </Card>
      </div>

      {roster && (
        <Card>
          <CardHeader>
            <CardTitle>Roster Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="font-medium text-muted-foreground">Course</dt>
                <dd>{roster.course?.name || 'Not specified'}</dd>
              </div>
              
              <div>
                <dt className="font-medium text-muted-foreground">Location</dt>
                <dd>{roster.location?.name || 'Not specified'}</dd>
              </div>
              
              <div>
                <dt className="font-medium text-muted-foreground">Issue Date</dt>
                <dd>{roster.issue_date ? new Date(roster.issue_date).toLocaleDateString() : 'Not specified'}</dd>
              </div>
              
              <div>
                <dt className="font-medium text-muted-foreground">Created By</dt>
                <dd>{roster.creator_name || 'Unknown'}</dd>
              </div>
              
              {roster.description && (
                <div className="col-span-2">
                  <dt className="font-medium text-muted-foreground">Description</dt>
                  <dd className="mt-1">{roster.description}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
