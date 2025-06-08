
import { supabase } from '@/integrations/supabase/client';
import { CacheService } from '../performance/cacheService';
import { PerformanceMonitor } from '../performance/performanceMonitor';

export interface SearchResult {
  entityType: string;
  entityId: string;
  searchContent: string;
  rank: number;
  metadata: Record<string, any>;
}

export interface SearchOptions {
  entityTypes?: string[];
  limit?: number;
  useCache?: boolean;
  boostFactors?: Record<string, number>;
}

export class IntelligentSearchService {
  static async search(
    query: string, 
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const {
      entityTypes,
      limit = 50,
      useCache = true,
      boostFactors = {}
    } = options;
    
    if (!query.trim()) return [];
    
    const cacheKey = `search:${query}:${JSON.stringify(entityTypes)}:${limit}`;
    
    // Check cache first
    if (useCache) {
      const cached = await CacheService.get<SearchResult[]>(cacheKey, 'search');
      if (cached) {
        PerformanceMonitor.trackCacheHit(cacheKey, true);
        return cached;
      }
      PerformanceMonitor.trackCacheHit(cacheKey, false);
    }
    
    try {
      const startTime = performance.now();
      
      const { data, error } = await supabase.rpc('intelligent_search', {
        p_query: query,
        p_entity_types: entityTypes || null,
        p_limit: limit
      });
      
      if (error) throw error;
      
      const searchDuration = performance.now() - startTime;
      
      // Track search analytics
      await this.trackSearchAnalytics(query, data?.length || 0, searchDuration);
      
      const results: SearchResult[] = (data || []).map((item: any) => ({
        entityType: item.entity_type,
        entityId: item.entity_id,
        searchContent: item.search_content,
        rank: item.rank * (boostFactors[item.entity_type] || 1),
        metadata: item.metadata || {}
      }));
      
      // Sort by adjusted rank
      results.sort((a, b) => b.rank - a.rank);
      
      // Cache results
      if (useCache && results.length > 0) {
        await CacheService.set(cacheKey, results, {
          ttl: 300, // 5 minutes
          tags: ['search', 'global'],
          namespace: 'search'
        });
      }
      
      return results;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }
  
  static async indexEntity(
    entityType: string,
    entityId: string,
    searchContent: string,
    metadata: Record<string, any> = {},
    boostScore: number = 1.0
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('search_index')
        .upsert({
          entity_type: entityType,
          entity_id: entityId,
          search_content: searchContent,
          metadata,
          boost_score: boostScore,
          is_active: true
        }, {
          onConflict: 'entity_type,entity_id'
        });
      
      if (error) throw error;
      
      // Invalidate search cache
      await CacheService.invalidateByTags(['search']);
    } catch (error) {
      console.error('Error indexing entity:', error);
    }
  }
  
  static async removeFromIndex(entityType: string, entityId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('search_index')
        .update({ is_active: false })
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);
      
      if (error) throw error;
      
      // Invalidate search cache
      await CacheService.invalidateByTags(['search']);
    } catch (error) {
      console.error('Error removing from search index:', error);
    }
  }
  
  static async getSuggestions(query: string, limit: number = 5): Promise<string[]> {
    if (query.length < 2) return [];
    
    const cacheKey = `suggestions:${query}:${limit}`;
    const cached = await CacheService.get<string[]>(cacheKey, 'search');
    if (cached) return cached;
    
    try {
      const { data, error } = await supabase
        .from('search_analytics')
        .select('search_query')
        .ilike('search_query', `%${query}%`)
        .gte('results_count', 1)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      const suggestions = [...new Set(data?.map(item => item.search_query) || [])];
      
      // Cache suggestions
      await CacheService.set(cacheKey, suggestions, {
        ttl: 1800, // 30 minutes
        tags: ['search', 'suggestions'],
        namespace: 'search'
      });
      
      return suggestions;
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  }
  
  private static async trackSearchAnalytics(
    query: string,
    resultsCount: number,
    searchDuration: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('search_analytics')
        .insert({
          search_query: query,
          results_count: resultsCount,
          search_duration_ms: Math.round(searchDuration),
          session_id: this.getSessionId()
        });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error tracking search analytics:', error);
    }
  }
  
  private static getSessionId(): string {
    if (typeof window === 'undefined') return 'server';
    return sessionStorage.getItem('performance-session-id') || 'unknown';
  }
  
  static async getPopularSearches(limit: number = 10): Promise<Array<{ query: string; count: number }>> {
    try {
      const { data, error } = await supabase
        .from('search_analytics')
        .select('search_query, COUNT(*) as search_count')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .group('search_query')
        .order('search_count', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      return data?.map(item => ({
        query: item.search_query,
        count: item.search_count
      })) || [];
    } catch (error) {
      console.error('Error getting popular searches:', error);
      return [];
    }
  }
}
