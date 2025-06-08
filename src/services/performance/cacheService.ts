
import { supabase } from '@/integrations/supabase/client';

export interface CacheEntry {
  id: string;
  cache_key: string;
  cache_namespace: string;
  cache_data: any;
  cache_tags: string[];
  ttl_seconds: number;
  expires_at: string;
  access_count: number;
  last_accessed: string;
}

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  namespace?: string;
}

export class CacheService {
  private static memoryCache = new Map<string, { data: any; expires: number }>();
  
  static async get<T = any>(key: string, namespace: string = 'default'): Promise<T | null> {
    const cacheKey = `${namespace}:${key}`;
    
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(cacheKey);
    if (memoryEntry && memoryEntry.expires > Date.now()) {
      return memoryEntry.data;
    }
    
    // Check database cache
    try {
      const { data, error } = await supabase.rpc('get_cache_entry', {
        p_cache_key: cacheKey
      });
      
      if (error) throw error;
      
      if (data) {
        // Store in memory cache for faster access
        this.memoryCache.set(cacheKey, {
          data: data,
          expires: Date.now() + 300000 // 5 minutes in memory
        });
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }
  
  static async set(
    key: string, 
    data: any, 
    options: CacheOptions = {}
  ): Promise<void> {
    const {
      ttl = 3600,
      tags = [],
      namespace = 'default'
    } = options;
    
    const cacheKey = `${namespace}:${key}`;
    
    try {
      // Store in database
      await supabase.rpc('set_cache_entry', {
        p_cache_key: cacheKey,
        p_cache_namespace: namespace,
        p_cache_data: data,
        p_ttl_seconds: ttl,
        p_cache_tags: tags
      });
      
      // Store in memory cache
      this.memoryCache.set(cacheKey, {
        data: data,
        expires: Date.now() + Math.min(ttl * 1000, 300000) // Max 5 minutes in memory
      });
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }
  
  static async invalidateByTags(tags: string[]): Promise<void> {
    try {
      await supabase.rpc('invalidate_cache_by_tags', {
        p_tags: tags
      });
      
      // Clear memory cache entries with matching tags
      this.memoryCache.clear(); // Simple approach - clear all memory cache
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }
  
  static async invalidate(key: string, namespace: string = 'default'): Promise<void> {
    const cacheKey = `${namespace}:${key}`;
    
    try {
      const { error } = await supabase
        .from('cache_entries')
        .delete()
        .eq('cache_key', cacheKey);
      
      if (error) throw error;
      
      // Remove from memory cache
      this.memoryCache.delete(cacheKey);
    } catch (error) {
      console.error('Cache invalidate error:', error);
    }
  }
  
  static async getStats(): Promise<Record<string, any>> {
    try {
      const { data, error } = await supabase
        .from('cache_performance')
        .select('*');
      
      if (error) throw error;
      
      return {
        database: data || [],
        memory: {
          entries: this.memoryCache.size,
          maxSize: 1000
        }
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return { database: [], memory: { entries: 0, maxSize: 1000 } };
    }
  }
}
