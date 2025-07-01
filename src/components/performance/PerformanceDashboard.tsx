
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CacheService } from '@/services/performance/cacheService';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Database, Clock, Activity } from 'lucide-react';

export function PerformanceDashboard() {
  const { data: cacheStats, isLoading } = useQuery({
    queryKey: ['cache-stats'],
    queryFn: () => CacheService.getStats(),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
          <p className="text-muted-foreground">System performance metrics and cache statistics</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Live Monitoring
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cache Entries</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cacheStats?.totalEntries || 0}</div>
            <p className="text-xs text-muted-foreground">
              {cacheStats?.activeEntries || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(cacheStats?.hitRate || 0).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Efficiency metric
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Accesses</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cacheStats?.totalAccesses || 0}</div>
            <p className="text-xs text-muted-foreground">
              All time requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Access Count</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(cacheStats?.averageAccessCount || 0).toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Per cache entry
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cache Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Active Entries</span>
              <Badge variant="secondary">{cacheStats?.activeEntries || 0}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Expired Entries</span>
              <Badge variant="outline">{cacheStats?.expiredEntries || 0}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Cache Efficiency</span>
              <Badge variant={cacheStats?.hitRate > 80 ? "default" : "destructive"}>
                {cacheStats?.hitRate > 80 ? "Good" : "Needs Improvement"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
