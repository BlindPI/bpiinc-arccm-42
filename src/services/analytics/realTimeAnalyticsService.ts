
import { supabase } from '@/integrations/supabase/client';
import type { 
  TeamPerformanceMetrics, 
  LocationHeatmapData, 
  ComplianceRiskScore,
  CrossTeamAnalytics,
  ExecutiveDashboardData
} from '@/types/analytics';

export class RealTimeAnalyticsService {
  static async getTeamPerformanceMetrics(
    teamId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<TeamPerformanceMetrics[]> {
    try {
      let query = supabase
        .from('team_performance_metrics')
        .select('*')
        .order('metric_period_start', { ascending: false });

      if (teamId) {
        query = query.eq('team_id', teamId);
      }

      if (startDate) {
        query = query.gte('metric_period_start', startDate.toISOString().split('T')[0]);
      }

      if (endDate) {
        query = query.lte('metric_period_end', endDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching team performance metrics:', error);
      return [];
    }
  }

  static async calculateAndStoreTeamMetrics(teamId: string): Promise<TeamPerformanceMetrics | null> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Last 30 days

      // Calculate metrics using the database function
      const { data: metrics, error } = await supabase.rpc('calculate_team_performance_metrics', {
        p_team_id: teamId,
        p_start_date: startDate.toISOString().split('T')[0],
        p_end_date: endDate.toISOString().split('T')[0]
      });

      if (error) throw error;

      // Store the calculated metrics
      const { data: storedMetrics, error: storeError } = await supabase
        .from('team_performance_metrics')
        .upsert({
          team_id: teamId,
          metric_period_start: startDate.toISOString().split('T')[0],
          metric_period_end: endDate.toISOString().split('T')[0],
          certificates_issued: metrics.certificates_issued,
          courses_conducted: metrics.courses_conducted,
          average_satisfaction_score: metrics.average_satisfaction_score,
          compliance_score: metrics.compliance_score,
          member_retention_rate: metrics.member_retention_rate,
          training_hours_delivered: metrics.training_hours_delivered
        })
        .select()
        .single();

      if (storeError) throw storeError;
      return storedMetrics;
    } catch (error) {
      console.error('Error calculating team metrics:', error);
      return null;
    }
  }

  static async getLocationHeatmapData(): Promise<LocationHeatmapData[]> {
    try {
      const { data, error } = await supabase
        .from('location_performance_heatmaps')
        .select(`
          *,
          locations(name)
        `)
        .order('performance_score', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        ...item,
        location_name: (item.locations as any)?.name || 'Unknown Location'
      }));
    } catch (error) {
      console.error('Error fetching location heatmap data:', error);
      return [];
    }
  }

  static async generateLocationHeatmap(): Promise<LocationHeatmapData[]> {
    try {
      const { data: locations, error: locError } = await supabase
        .from('locations')
        .select('*');

      if (locError) throw locError;

      const heatmapData: LocationHeatmapData[] = [];
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      for (const location of locations || []) {
        // Calculate performance metrics for this location
        const { data: teams } = await supabase
          .from('teams')
          .select('performance_score')
          .eq('location_id', location.id);

        const avgPerformance = teams?.length 
          ? teams.reduce((sum, t) => sum + (t.performance_score || 0), 0) / teams.length
          : 0;

        // Calculate compliance rating
        const { data: riskScores } = await supabase
          .from('compliance_risk_scores')
          .select('risk_score')
          .eq('entity_type', 'location')
          .eq('entity_id', location.id);

        const complianceRating = riskScores?.length
          ? 100 - (riskScores[0].risk_score || 0)
          : 85;

        const heatmapEntry = {
          location_id: location.id,
          analysis_period_start: startDate.toISOString().split('T')[0],
          analysis_period_end: endDate.toISOString().split('T')[0],
          performance_score: avgPerformance,
          activity_density: teams?.length || 0,
          compliance_rating: complianceRating,
          risk_factors: [],
          heat_intensity: Math.min(avgPerformance / 100, 1)
        };

        const { data: stored, error: storeError } = await supabase
          .from('location_performance_heatmaps')
          .upsert(heatmapEntry)
          .select()
          .single();

        if (!storeError && stored) {
          heatmapData.push({
            ...stored,
            location_name: location.name
          });
        }
      }

      return heatmapData;
    } catch (error) {
      console.error('Error generating location heatmap:', error);
      return [];
    }
  }

  static async getComplianceRiskScores(
    entityType?: 'user' | 'team' | 'location'
  ): Promise<ComplianceRiskScore[]> {
    try {
      let query = supabase
        .from('compliance_risk_scores')
        .select('*')
        .order('risk_score', { ascending: false });

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Enrich with entity names
      const enrichedData = await Promise.all(
        (data || []).map(async (score) => {
          let entityName = 'Unknown';
          
          if (score.entity_type === 'user') {
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('id', score.entity_id)
              .single();
            entityName = profile?.display_name || 'Unknown User';
          } else if (score.entity_type === 'team') {
            const { data: team } = await supabase
              .from('teams')
              .select('name')
              .eq('id', score.entity_id)
              .single();
            entityName = team?.name || 'Unknown Team';
          } else if (score.entity_type === 'location') {
            const { data: location } = await supabase
              .from('locations')
              .select('name')
              .eq('id', score.entity_id)
              .single();
            entityName = location?.name || 'Unknown Location';
          }

          return {
            ...score,
            entity_name: entityName
          };
        })
      );

      return enrichedData;
    } catch (error) {
      console.error('Error fetching compliance risk scores:', error);
      return [];
    }
  }

  static async calculateComplianceRisk(
    entityType: 'user' | 'team' | 'location',
    entityId: string
  ): Promise<ComplianceRiskScore | null> {
    try {
      // Calculate risk score using database function
      const { data: riskScore, error } = await supabase.rpc('calculate_compliance_risk_score', {
        p_entity_type: entityType,
        p_entity_id: entityId
      });

      if (error) throw error;

      const riskLevel = riskScore >= 75 ? 'critical' : 
                       riskScore >= 50 ? 'high' : 
                       riskScore >= 25 ? 'medium' : 'low';

      // Store the calculated risk score
      const { data: stored, error: storeError } = await supabase
        .from('compliance_risk_scores')
        .upsert({
          entity_type: entityType,
          entity_id: entityId,
          risk_score: riskScore,
          risk_level: riskLevel,
          risk_factors: { calculated: true },
          mitigation_recommendations: this.generateMitigationRecommendations(riskLevel),
          next_assessment_due: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
        .select()
        .single();

      if (storeError) throw storeError;
      return stored;
    } catch (error) {
      console.error('Error calculating compliance risk:', error);
      return null;
    }
  }

  static async getCrossTeamAnalytics(): Promise<CrossTeamAnalytics[]> {
    try {
      const { data, error } = await supabase
        .from('cross_team_analytics')
        .select('*')
        .order('analysis_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching cross-team analytics:', error);
      return [];
    }
  }

  static async generateCrossTeamComparison(): Promise<CrossTeamAnalytics | null> {
    try {
      const { data: teams, error } = await supabase
        .from('teams')
        .select('id, name, performance_score')
        .eq('status', 'active');

      if (error) throw error;

      const teamComparisons = {};
      const performanceRankings = (teams || [])
        .sort((a, b) => (b.performance_score || 0) - (a.performance_score || 0))
        .map((team, index) => ({
          rank: index + 1,
          team_id: team.id,
          team_name: team.name,
          performance_score: team.performance_score || 0
        }));

      const recommendations = this.generateImprovementRecommendations(performanceRankings);

      const { data: stored, error: storeError } = await supabase
        .from('cross_team_analytics')
        .insert({
          analysis_date: new Date().toISOString().split('T')[0],
          comparison_type: 'performance_ranking',
          team_comparisons: teamComparisons,
          performance_rankings: performanceRankings,
          improvement_recommendations: recommendations
        })
        .select()
        .single();

      if (storeError) throw storeError;
      return stored;
    } catch (error) {
      console.error('Error generating cross-team comparison:', error);
      return null;
    }
  }

  static async getExecutiveDashboardData(): Promise<ExecutiveDashboardData> {
    try {
      const [teams, members, heatmap, risks] = await Promise.all([
        supabase.from('teams').select('*', { count: 'exact' }).eq('status', 'active'),
        supabase.from('team_members').select('*', { count: 'exact' }),
        this.getLocationHeatmapData(),
        this.getComplianceRiskScores()
      ]);

      const topPerforming = await this.getTeamPerformanceMetrics();
      const sortedPerforming = topPerforming
        .sort((a, b) => b.compliance_score - a.compliance_score)
        .slice(0, 5);

      const avgCompliance = risks.length > 0 
        ? risks.reduce((sum, r) => sum + (100 - r.risk_score), 0) / risks.length
        : 85;

      const avgPerformance = heatmap.length > 0
        ? heatmap.reduce((sum, h) => sum + h.performance_score, 0) / heatmap.length
        : 75;

      return {
        totalTeams: teams.count || 0,
        activeMembers: members.count || 0,
        complianceScore: avgCompliance,
        performanceIndex: avgPerformance,
        topPerformingTeams: sortedPerforming,
        riskAlerts: risks.filter(r => r.risk_level === 'high' || r.risk_level === 'critical'),
        recentTrends: [],
        locationHeatmap: heatmap
      };
    } catch (error) {
      console.error('Error fetching executive dashboard data:', error);
      return {
        totalTeams: 0,
        activeMembers: 0,
        complianceScore: 0,
        performanceIndex: 0,
        topPerformingTeams: [],
        riskAlerts: [],
        recentTrends: [],
        locationHeatmap: []
      };
    }
  }

  private static generateMitigationRecommendations(riskLevel: string): string[] {
    const recommendations = {
      critical: [
        'Immediate intervention required',
        'Schedule emergency compliance review',
        'Implement additional oversight measures'
      ],
      high: [
        'Prioritize compliance training',
        'Increase monitoring frequency',
        'Review current procedures'
      ],
      medium: [
        'Monitor closely',
        'Schedule routine compliance check',
        'Provide additional resources'
      ],
      low: [
        'Continue current practices',
        'Maintain regular monitoring',
        'Document best practices'
      ]
    };

    return recommendations[riskLevel as keyof typeof recommendations] || [];
  }

  private static generateImprovementRecommendations(rankings: any[]): string[] {
    const recommendations = [];
    
    if (rankings.length > 0) {
      const bottomPerformers = rankings.slice(-3);
      
      for (const performer of bottomPerformers) {
        if (performer.performance_score < 70) {
          recommendations.push(`${performer.team_name}: Focus on compliance and training delivery`);
        }
      }
    }

    return recommendations;
  }
}

export const realTimeAnalyticsService = new RealTimeAnalyticsService();
