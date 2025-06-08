
import { supabase } from '@/integrations/supabase/client';

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  type: 'team' | 'member' | 'certificate' | 'course' | 'location';
  relevanceScore: number;
  metadata: Record<string, any>;
}

export interface SearchFilters {
  entityTypes?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  location?: string;
  team?: string;
}

export class IntelligentSearchService {
  static async search(
    query: string,
    filters: SearchFilters = {},
    limit: number = 50
  ): Promise<SearchResult[]> {
    try {
      // Use full-text search with search vectors
      let searchQuery = supabase
        .from('search_index')
        .select('*')
        .textSearch('search_vector', query, {
          type: 'websearch',
          config: 'english'
        })
        .limit(limit);

      // Apply filters
      if (filters.entityTypes && filters.entityTypes.length > 0) {
        searchQuery = searchQuery.in('entity_type', filters.entityTypes);
      }

      if (filters.dateRange) {
        searchQuery = searchQuery
          .gte('created_at', filters.dateRange.start.toISOString())
          .lte('created_at', filters.dateRange.end.toISOString());
      }

      const { data, error } = await searchQuery;

      if (error) throw error;

      // Transform results
      return (data || []).map(item => ({
        id: item.entity_id,
        title: item.title || 'Untitled',
        content: item.content || '',
        type: item.entity_type as any,
        relevanceScore: item.relevance_score || 0,
        metadata: typeof item.metadata === 'object' ? item.metadata : {}
      }));
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  static async searchTeams(query: string, limit: number = 20): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          description,
          status,
          team_type,
          location_id,
          locations (name, city, state)
        `)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('status', 'active')
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Team search error:', error);
      return [];
    }
  }

  static async searchMembers(query: string, limit: number = 20): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          display_name,
          email,
          role,
          team_members (
            team_id,
            teams (name)
          )
        `)
        .or(`display_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Member search error:', error);
      return [];
    }
  }

  static async searchCertificates(query: string, limit: number = 20): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select(`
          id,
          recipient_name,
          course_name,
          issue_date,
          expiry_date,
          status,
          verification_code
        `)
        .or(`recipient_name.ilike.%${query}%,course_name.ilike.%${query}%,verification_code.ilike.%${query}%`)
        .eq('status', 'ACTIVE')
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Certificate search error:', error);
      return [];
    }
  }

  static async getSearchSuggestions(query: string): Promise<string[]> {
    try {
      if (query.length < 2) return [];

      // Get suggestions from multiple sources
      const [teamSuggestions, memberSuggestions, courseSuggestions] = await Promise.all([
        supabase
          .from('teams')
          .select('name')
          .ilike('name', `%${query}%`)
          .limit(5),
        supabase
          .from('profiles')
          .select('display_name')
          .ilike('display_name', `%${query}%`)
          .limit(5),
        supabase
          .from('courses')
          .select('name')
          .ilike('name', `%${query}%`)
          .limit(5)
      ]);

      const suggestions: string[] = [];
      
      teamSuggestions.data?.forEach(team => suggestions.push(team.name));
      memberSuggestions.data?.forEach(member => suggestions.push(member.display_name));
      courseSuggestions.data?.forEach(course => suggestions.push(course.name));

      return [...new Set(suggestions)].slice(0, 10);
    } catch (error) {
      console.error('Search suggestions error:', error);
      return [];
    }
  }

  static async trackSearchQuery(query: string, resultsCount: number, userId?: string): Promise<void> {
    try {
      await supabase
        .from('search_analytics')
        .insert({
          search_query: query,
          results_count: resultsCount,
          user_id: userId,
          search_timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('Search tracking error:', error);
    }
  }

  static async getPopularSearches(limit: number = 10): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('search_analytics')
        .select('search_query')
        .order('search_timestamp', { ascending: false })
        .limit(limit * 3); // Get more to filter duplicates

      if (error) throw error;

      // Count occurrences and return most popular
      const queryCount = new Map<string, number>();
      data?.forEach(item => {
        const count = queryCount.get(item.search_query) || 0;
        queryCount.set(item.search_query, count + 1);
      });

      return Array.from(queryCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([query]) => query);
    } catch (error) {
      console.error('Popular searches error:', error);
      return [];
    }
  }

  static async getActivityAnalytics(
    timeRange: { start: Date; end: Date }
  ): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('access_patterns')
        .select('*')
        .gte('created_at', timeRange.start.toISOString())
        .lte('created_at', timeRange.end.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Aggregate the data
      const pageViews = new Map<string, number>();
      const userActivity = new Map<string, number>();
      
      data?.forEach(pattern => {
        // Count page views
        const pageCount = pageViews.get(pattern.page_path) || 0;
        pageViews.set(pattern.page_path, pageCount + 1);
        
        // Count user activity
        if (pattern.user_id) {
          const userCount = userActivity.get(pattern.user_id) || 0;
          userActivity.set(pattern.user_id, userCount + 1);
        }
      });

      return {
        totalViews: data?.length || 0,
        uniqueUsers: userActivity.size,
        topPages: Array.from(pageViews.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10),
        topUsers: Array.from(userActivity.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
      };
    } catch (error) {
      console.error('Activity analytics error:', error);
      return {
        totalViews: 0,
        uniqueUsers: 0,
        topPages: [],
        topUsers: []
      };
    }
  }
}
