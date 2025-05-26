
import { useCallback, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { cacheManager } from '@/services/cache/cacheManager';

export function usePerformanceOptimization() {
  const queryClient = useQueryClient();
  const debounceTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Debounced function creator
  const createDebouncedFunction = useCallback((
    func: (...args: any[]) => void,
    delay: number,
    key: string
  ) => {
    return (...args: any[]) => {
      const existingTimeout = debounceTimeouts.current.get(key);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const timeout = setTimeout(() => {
        func(...args);
        debounceTimeouts.current.delete(key);
      }, delay);

      debounceTimeouts.current.set(key, timeout);
    };
  }, []);

  // Optimized search with caching
  const optimizedSearch = useCallback((
    searchFn: (query: string) => Promise<any[]>,
    cacheKey: string,
    debounceMs: number = 300
  ) => {
    return createDebouncedFunction(async (query: string) => {
      if (!query.trim()) return [];

      const cacheKeyWithQuery = `${cacheKey}_${query}`;
      const cached = cacheManager.get(cacheKeyWithQuery);
      
      if (cached) {
        return cached;
      }

      try {
        const results = await searchFn(query);
        cacheManager.set(cacheKeyWithQuery, results, 60000); // 1 minute cache
        return results;
      } catch (error) {
        console.error('Search error:', error);
        return [];
      }
    }, debounceMs, `search_${cacheKey}`);
  }, [createDebouncedFunction]);

  // Virtual scrolling helper
  const useVirtualScrolling = useCallback((
    items: any[],
    itemHeight: number = 50,
    containerHeight: number = 400
  ) => {
    return useMemo(() => {
      const visibleCount = Math.ceil(containerHeight / itemHeight);
      const bufferSize = Math.max(5, Math.floor(visibleCount * 0.5));
      
      return {
        visibleCount,
        bufferSize,
        totalHeight: items.length * itemHeight,
        getVisibleItems: (scrollTop: number) => {
          const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
          const endIndex = Math.min(items.length, startIndex + visibleCount + bufferSize * 2);
          
          return {
            startIndex,
            endIndex,
            items: items.slice(startIndex, endIndex),
            offsetY: startIndex * itemHeight
          };
        }
      };
    }, [items, itemHeight, containerHeight]);
  }, []);

  // Batch updates helper
  const batchUpdates = useCallback((updates: (() => void)[]) => {
    // Use React's automatic batching in React 18
    updates.forEach(update => update());
  }, []);

  // Memory cleanup
  const cleanup = useCallback(() => {
    // Clear all debounce timeouts
    debounceTimeouts.current.forEach(timeout => clearTimeout(timeout));
    debounceTimeouts.current.clear();
    
    // Clear query cache
    queryClient.clear();
    
    // Clear custom cache
    cacheManager.clear();
  }, [queryClient]);

  // Optimized data transformation
  const memoizedTransform = useCallback(<T, R>(
    data: T[],
    transformFn: (item: T) => R,
    dependencies: any[] = []
  ): R[] => {
    return useMemo(() => {
      return data.map(transformFn);
    }, [data, ...dependencies]);
  }, []);

  return {
    createDebouncedFunction,
    optimizedSearch,
    useVirtualScrolling,
    batchUpdates,
    cleanup,
    memoizedTransform,
  };
}

export function useDataPagination<T>(
  data: T[],
  pageSize: number = 50
) {
  const [currentPage, setCurrentPage] = useState(0);
  
  const paginatedData = useMemo(() => {
    const startIndex = currentPage * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, pageSize]);

  const totalPages = useMemo(() => {
    return Math.ceil(data.length / pageSize);
  }, [data.length, pageSize]);

  const hasNextPage = currentPage < totalPages - 1;
  const hasPreviousPage = currentPage > 0;

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (hasNextPage) setCurrentPage(prev => prev + 1);
  }, [hasNextPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) setCurrentPage(prev => prev - 1);
  }, [hasPreviousPage]);

  return {
    paginatedData,
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    nextPage,
    previousPage,
    pageInfo: {
      current: currentPage + 1,
      total: totalPages,
      startIndex: currentPage * pageSize + 1,
      endIndex: Math.min((currentPage + 1) * pageSize, data.length),
      totalItems: data.length
    }
  };
}
