
import { supabase } from '@/integrations/supabase/client';

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  type: 'team' | 'member' | 'certificate' | 'course' | 'location';
  relevanceScore: number;
  metadata: Record<string, any>;
  entityType: string;
  entityId: string;
  searchContent: string;
  rank: number;
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

export interface PopularSearch {
  query: string;
  count: number;
}

export class IntelligentSearchService {
  static async search(
    query: string,
    filters: SearchFilters = {},
    limit: number = 50
  ): Promise<SearchResult[]> {
    try {
      // Check if search_index table exists and has data
      const { data: searchData, error: searchError } = await supabase
        .from('search_index')
        .select('*')
        .limit(1);

      // If search index exists and has data, use it
      if (!searchError && searchData && searchData.length > 0) {
        return this.searchUsingIndex(query, filters, limit);
      }

      // Fallback to direct table searches
      return this.searchDirectTables(query, filters, limit);
    } catch (error) {
      console.error('Search error:', error);
      return this.searchDirectTables(query, filters, limit);
    }
  }

  private static async searchUsingIndex(
    query: string,
    filters: SearchFilters,
    limit: number
  ): Promise<SearchResult[]> {
    let searchQuery = supabase
      .from('search_index')
      .select('*')
      .ilike('search_content', `%${query}%`)
      .eq('is_active', true)
      .limit(limit);

    if (filters.entityTypes && filters.entityTypes.length > 0) {
      searchQuery = searchQuery.in('entity_type', filters.entityTypes);
    }

    const { data, error } = await searchQuery;

    if (error) throw error;

    return (data || []).map((item, index) => ({
      id: item.entity_id,
      title: this.extractTitle(item.search_content, item.entity_type),
      content: item.search_content,
      type: this.mapEntityTypeToSearchType(item.entity_type),
      relevanceScore: item.boost_score || 1.0,
      metadata: typeof item.metadata === 'object' ? item.metadata as Record<string, any> : {},
      entityType: item.entity_type,
      entityId: item.entity_id,
      searchContent: item.search_content,
      rank: item.boost_score || 1.0
    }));
  }

  private static async searchDirectTables(
    query: string,
    filters: SearchFilters,
    limit: number
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    // Search teams
    if (!filters.entityTypes || filters.entityTypes.includes('teams')) {
      const teamResults = await this.searchTeams(query, Math.floor(limit / 4));
      results.push(...teamResults.map(team => ({
        id: team.id,
        title: team.name,
        content: `${team.name} ${team.description || ''}`,
        type: 'team' as const,
        relevanceScore: 1.0,
        metadata: { team_type: team.team_type, status: team.status },
        entityType: 'teams',
        entityId: team.id,
        searchContent: `${team.name} ${team.description || ''}`,
        rank: 1.0
      })));
    }

    // Search members/profiles
    if (!filters.entityTypes || filters.entityTypes.includes('profiles')) {
      const memberResults = await this.searchMembers(query, Math.floor(limit / 4));
      results.push(...memberResults.map(member => ({
        id: member.id,
        title: member.display_name || 'Unknown User',
        content: `${member.display_name || ''} ${member.email || ''}`,
        type: 'member' as const,
        relevanceScore: 1.0,
        metadata: { role: member.role },
        entityType: 'profiles',
        entityId: member.id,
        searchContent: `${member.display_name || ''} ${member.email || ''}`,
        rank: 1.0
      })));
    }

    // Search certificates
    if (!filters.entityTypes || filters.entityTypes.includes('certificates')) {
      const certResults = await this.searchCertificates(query, Math.floor(limit / 4));
      results.push(...certResults.map(cert => ({
        id: cert.id,
        title: `${cert.course_name} - ${cert.recipient_name}`,
        content: `${cert.course_name} ${cert.recipient_name} ${cert.verification_code}`,
        type: 'certificate' as const,
        relevanceScore: 1.0,
        metadata: { status: cert.status, issue_date: cert.issue_date },
        entityType: 'certificates',
        entityId: cert.id,
        searchContent: `${cert.course_name} ${cert.recipient_name} ${cert.verification_code}`,
        rank: 1.0
      })));
    }

    return results.slice(0, limit);
  }

  private static extractTitle(searchContent: string, entityType: string): string {
    const lines = searchContent.split(' ');
    switch (entityType) {
      case 'teams':
      case 'profiles':
      case 'locations':
        return lines[0] || 'Untitled';
      case 'certificates':
        return lines.slice(0, 2).join(' ') || 'Certificate';
      default:
        return lines[0] || 'Unknown';
    }
  }

  private static mapEntityTypeToSearchType(entityType: string): SearchResult['type'] {
    switch (entityType) {
      case 'teams': return 'team';
      case 'profiles': return 'member';
      case 'certificates': return 'certificate';
      case 'courses': return 'course';
      case 'locations': return 'location';
      default: return 'member';
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

  static async getSuggestions(query: string): Promise<string[]> {
    try {
      if (query.length < 2) return [];

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
      // Only track if search_analytics table exists
      const { error } = await supabase
        .from('search_analytics')
        .insert({
          search_query: query,
          results_count: resultsCount,
          user_id: userId,
          search_timestamp: new Date().toISOString()
        });

      if (error) {
        console.log('Search tracking not available:', error.message);
      }
    } catch (error) {
      console.log('Search tracking not available');
    }
  }

  static async getPopularSearches(limit: number = 10): Promise<PopularSearch[]> {
    try {
      const { data, error } = await supabase
        .from('search_analytics')
        .select('search_query')
        .order('search_timestamp', { ascending: false })
        .limit(limit * 3);

      if (error) return [];

      const queryCount = new Map<string, number>();
      data?.forEach(item => {
        const count = queryCount.get(item.search_query) || 0;
        queryCount.set(item.search_query, count + 1);
      });

      return Array.from(queryCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([query, count]) => ({ query, count }));
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

      if (error) return this.getDefaultAnalytics();

      const pageViews = new Map<string, number>();
      const userActivity = new Map<string, number>();
      
      data?.forEach(pattern => {
        const pageCount = pageViews.get(pattern.page_path) || 0;
        pageViews.set(pattern.page_path, pageCount + 1);
        
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
      return this.getDefaultAnalytics();
    }
  }

  private static getDefaultAnalytics() {
    return {
      totalViews: 0,
      uniqueUsers: 0,
      topPages: [],
      topUsers: []
    };
  }
}
