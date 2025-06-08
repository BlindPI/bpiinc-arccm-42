
import { supabase } from '@/integrations/supabase/client';

export interface CacheEntry {
  key: string;
  namespace: string;
  data: any;
  ttlSeconds: number;
  tags?: string[];
}

export class CacheService {
  static async get<T = any>(key: string): Promise<T | null> {
    try {
      const { data, error } = await supabase.rpc('get_cache_entry', {
        p_cache_key: key
      });

      if (error) {
        console.error('Cache get error:', error);
        return null;
      }

      return data as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  static async set(
    key: string,
    namespace: string,
    data: any,
    ttlSeconds: number = 3600,
    tags: string[] = []
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('set_cache_entry', {
        p_cache_key: key,
        p_cache_namespace: namespace,
        p_cache_data: JSON.stringify(data),
        p_ttl_seconds: ttlSeconds,
        p_cache_tags: tags
      });

      if (error) {
        console.error('Cache set error:', error);
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  static async invalidateByTags(tags: string[]): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('invalidate_cache_by_tags', {
        p_tags: tags
      });

      if (error) {
        console.error('Cache invalidation error:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Cache invalidation error:', error);
      return 0;
    }
  }

  static async cleanupExpired(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('cleanup_expired_cache');

      if (error) {
        console.error('Cache cleanup error:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Cache cleanup error:', error);
      return 0;
    }
  }

  static async getPerformanceMetrics(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('cache_performance')
        .select('*');

      if (error) {
        console.error('Cache performance metrics error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Cache performance metrics error:', error);
      return null;
    }
  }
}
