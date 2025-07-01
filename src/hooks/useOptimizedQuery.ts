
import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

interface CacheConfig {
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
}

interface OptimizedQueryOptions<TData> extends UseQueryOptions<TData> {
  cacheConfig?: CacheConfig;
  dependencies?: string[];
  backgroundRefetch?: boolean;
}

export function useOptimizedQuery<TData>(
  options: OptimizedQueryOptions<TData>
) {
  const queryClient = useQueryClient();
  
  const defaultCacheConfig: CacheConfig = {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  };

  const mergedConfig = useMemo(() => ({
    ...defaultCacheConfig,
    ...options.cacheConfig,
  }), [options.cacheConfig]);

  const optimizedOptions = useMemo(() => ({
    ...options,
    ...mergedConfig,
    select: options.select,
    enabled: options.enabled,
  }), [options, mergedConfig]);

  const query = useQuery(optimizedOptions);

  const prefetchRelated = useCallback(async () => {
    if (options.dependencies && query.data) {
      for (const dep of options.dependencies) {
        await queryClient.prefetchQuery({
          queryKey: [dep, query.data],
          staleTime: mergedConfig.staleTime,
        });
      }
    }
  }, [options.dependencies, query.data, queryClient, mergedConfig.staleTime]);

  const invalidateRelated = useCallback(() => {
    if (options.dependencies) {
      options.dependencies.forEach(dep => {
        queryClient.invalidateQueries({ queryKey: [dep] });
      });
    }
  }, [options.dependencies, queryClient]);

  return {
    ...query,
    prefetchRelated,
    invalidateRelated,
  };
}

export function useBulkMutation<TData, TVariables>({
  mutationFn,
  onSuccess,
  onError,
  invalidateQueries = [],
  batchSize = 10,
}: {
  mutationFn: (variables: TVariables[]) => Promise<TData[]>;
  onSuccess?: (data: TData[]) => void;
  onError?: (error: Error) => void;
  invalidateQueries?: string[];
  batchSize?: number;
}) {
  const queryClient = useQueryClient();

  const processBatch = useCallback(async (items: TVariables[]) => {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }

    const results: TData[] = [];
    for (const batch of batches) {
      try {
        const batchResults = await mutationFn(batch);
        results.push(...batchResults);
      } catch (error) {
        console.error('Batch processing error:', error);
        if (onError) onError(error as Error);
        throw error;
      }
    }

    // Invalidate related queries
    invalidateQueries.forEach(queryKey => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    });

    if (onSuccess) onSuccess(results);
    return results;
  }, [mutationFn, batchSize, onSuccess, onError, invalidateQueries, queryClient]);

  return { processBatch };
}
