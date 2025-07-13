import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Database, 
  RefreshCw, 
  Trash2, 
  Clock, 
  HardDrive,
  Zap,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

interface CacheEntry {
  id: string;
  cache_key: string;
  cache_namespace: string;
  created_at: string;
  expires_at: string | null;
  last_accessed: string | null;
  access_count: number;
  cache_data: any;
  ttl_seconds: number | null;
}

interface CacheStats {
  totalEntries: number;
  totalSize: number;
  expiredEntries: number;
  namespaces: Record<string, number>;
  hitRate: number;
  avgAccessCount: number;
}

export function ActivityCacheManager() {
  const [selectedNamespace, setSelectedNamespace] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  // Fetch cache entries
  const { data: cacheEntries = [], isLoading, refetch } = useQuery({
    queryKey: ['cache-entries'],
    queryFn: async (): Promise<CacheEntry[]> => {
      const { data, error } = await supabase
        .from('cache_entries')
        .select('*')
        .order('last_accessed', { ascending: false, nullsFirst: false });
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Calculate cache statistics
  const cacheStats: CacheStats = React.useMemo(() => {
    if (!cacheEntries.length) {
      return {
        totalEntries: 0,
        totalSize: 0,
        expiredEntries: 0,
        namespaces: {},
        hitRate: 0,
        avgAccessCount: 0
      };
    }

    const now = new Date();
    const expired = cacheEntries.filter(entry => 
      entry.expires_at && new Date(entry.expires_at) < now
    ).length;

    const namespaces = cacheEntries.reduce((acc, entry) => {
      acc[entry.cache_namespace] = (acc[entry.cache_namespace] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalAccessCount = cacheEntries.reduce((acc, entry) => acc + entry.access_count, 0);
    const totalSize = cacheEntries.reduce((acc, entry) => {
      const sizeEstimate = JSON.stringify(entry.cache_data).length;
      return acc + sizeEstimate;
    }, 0);

    return {
      totalEntries: cacheEntries.length,
      totalSize,
      expiredEntries: expired,
      namespaces,
      hitRate: cacheEntries.length > 0 ? (totalAccessCount / cacheEntries.length) : 0,
      avgAccessCount: cacheEntries.length > 0 ? totalAccessCount / cacheEntries.length : 0
    };
  }, [cacheEntries]);

  // Clear expired entries
  const clearExpiredEntries = async () => {
    setIsClearing(true);
    try {
      const { error } = await supabase
        .from('cache_entries')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) throw error;
      refetch();
    } catch (error) {
      console.error('Failed to clear expired entries:', error);
    } finally {
      setIsClearing(false);
    }
  };

  // Clear all cache entries
  const clearAllCache = async () => {
    setIsClearing(true);
    try {
      const { error } = await supabase
        .from('cache_entries')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) throw error;
      refetch();
    } catch (error) {
      console.error('Failed to clear all cache:', error);
    } finally {
      setIsClearing(false);
    }
  };

  // Clear namespace cache
  const clearNamespaceCache = async (namespace: string) => {
    setIsClearing(true);
    try {
      const { error } = await supabase
        .from('cache_entries')
        .delete()
        .eq('cache_namespace', namespace);

      if (error) throw error;
      refetch();
      setSelectedNamespace(null);
    } catch (error) {
      console.error('Failed to clear namespace cache:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getExpirationStatus = (entry: CacheEntry): 'expired' | 'expiring' | 'fresh' => {
    if (!entry.expires_at) return 'fresh';
    
    const now = new Date().getTime();
    const expires = new Date(entry.expires_at).getTime();
    const timeToExpire = expires - now;
    
    if (timeToExpire <= 0) return 'expired';
    if (timeToExpire <= 60 * 60 * 1000) return 'expiring'; // Less than 1 hour
    return 'fresh';
  };

  const filteredEntries = selectedNamespace
    ? cacheEntries.filter(entry => entry.cache_namespace === selectedNamespace)
    : cacheEntries;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Database className="h-6 w-6" />
          Activity Cache Manager
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isClearing}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearExpiredEntries} 
            disabled={isClearing || cacheStats.expiredEntries === 0}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear Expired
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={clearAllCache} 
            disabled={isClearing || cacheStats.totalEntries === 0}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Cache Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Entries</p>
                <p className="text-2xl font-bold">{cacheStats.totalEntries}</p>
              </div>
              <HardDrive className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Cache Size</p>
                <p className="text-2xl font-bold">{formatSize(cacheStats.totalSize)}</p>
              </div>
              <Database className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Hit Rate</p>
                <p className="text-2xl font-bold">{cacheStats.hitRate.toFixed(1)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Expired Entries</p>
                <p className="text-2xl font-bold">{cacheStats.expiredEntries}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Namespace Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Namespaces</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedNamespace === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedNamespace(null)}
            >
              All ({cacheStats.totalEntries})
            </Button>
            {Object.entries(cacheStats.namespaces).map(([namespace, count]) => (
              <Button
                key={namespace}
                variant={selectedNamespace === namespace ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedNamespace(namespace)}
                className="relative"
              >
                {namespace} ({count})
                {selectedNamespace === namespace && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-2 h-auto p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearNamespaceCache(namespace);
                    }}
                    disabled={isClearing}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cache Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Cache Entries
            <Badge variant="outline">
              {filteredEntries.length} entries
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredEntries.length === 0 ? (
              <div className="text-center py-8">
                <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-muted-foreground">No cache entries found</p>
              </div>
            ) : (
              filteredEntries.slice(0, 50).map((entry) => {
                const status = getExpirationStatus(entry);
                const size = JSON.stringify(entry.cache_data).length;
                
                return (
                  <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">
                          {entry.cache_key}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {entry.cache_namespace}
                        </Badge>
                        <Badge 
                          variant={status === 'expired' ? 'destructive' : status === 'expiring' ? 'secondary' : 'default'}
                          className="text-xs"
                        >
                          {status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          {formatSize(size)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {entry.access_count} hits
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {entry.last_accessed 
                            ? new Date(entry.last_accessed).toLocaleString()
                            : 'Never accessed'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            
            {filteredEntries.length > 50 && (
              <div className="text-center py-4">
                <Badge variant="outline">
                  Showing 50 of {filteredEntries.length} entries
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}