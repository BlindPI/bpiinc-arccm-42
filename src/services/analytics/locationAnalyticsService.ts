
import { supabase } from '@/integrations/supabase/client';

export interface LocationAnalytics {
  location_id: string;
  location_name: string;
  total_teams: number;
  total_members: number;
  active_certificates: number;
  expiring_certificates: number;
  compliance_score: number;
  performance_metrics: {
    training_completion_rate: number;
    certification_pass_rate: number;
    supervision_compliance: number;
  };
  trends: {
    member_growth: number;
    performance_change: number;
  };
}

export interface CrossLocationComparison {
  metric: string;
  locations: {
    location_id: string;
    location_name: string;
    value: number;
    rank: number;
  }[];
}

export class LocationAnalyticsService {
  async getLocationAnalytics(locationId?: string): Promise<LocationAnalytics[]> {
    try {
      let query = supabase
        .from('locations')
        .select(`
          id,
          name,
          teams(
            id,
            team_members(
              id,
              profiles(id, display_name, role)
            )
          )
        `);

      if (locationId) {
        query = query.eq('id', locationId);
      }

      const { data: locations, error } = await query;
      if (error) throw error;

      const analytics: LocationAnalytics[] = [];

      for (const location of locations || []) {
        const teams = location.teams || [];
        const totalMembers = teams.reduce((sum, team) => sum + (team.team_members?.length || 0), 0);

        // Get certificates for team members
        const memberIds = teams.flatMap(t => t.team_members?.map(m => m.profiles?.id)).filter(Boolean);
        
        const { data: certificates } = await supabase
          .from('certificates')
          .select('status, expiry_date')
          .in('user_id', memberIds);

        const activeCertificates = certificates?.filter(c => c.status === 'ACTIVE').length || 0;
        const expiringCertificates = certificates?.filter(c => {
          const expiryDate = new Date(c.expiry_date);
          const threeMonthsFromNow = new Date();
          threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
          return expiryDate <= threeMonthsFromNow && c.status === 'ACTIVE';
        }).length || 0;

        analytics.push({
          location_id: location.id,
          location_name: location.name,
          total_teams: teams.length,
          total_members: totalMembers,
          active_certificates: activeCertificates,
          expiring_certificates: expiringCertificates,
          compliance_score: this.calculateComplianceScore(activeCertificates, totalMembers),
          performance_metrics: {
            training_completion_rate: Math.random() * 100, // Placeholder
            certification_pass_rate: Math.random() * 100, // Placeholder
            supervision_compliance: Math.random() * 100 // Placeholder
          },
          trends: {
            member_growth: (Math.random() - 0.5) * 20, // Placeholder: -10% to +10%
            performance_change: (Math.random() - 0.5) * 30 // Placeholder: -15% to +15%
          }
        });
      }

      return analytics;
    } catch (error) {
      console.error('Error getting location analytics:', error);
      return [];
    }
  }

  async getCrossLocationComparison(): Promise<CrossLocationComparison[]> {
    try {
      const analytics = await this.getLocationAnalytics();
      
      const comparisons: CrossLocationComparison[] = [
        {
          metric: 'Total Teams',
          locations: this.rankLocations(analytics, 'total_teams')
        },
        {
          metric: 'Total Members',
          locations: this.rankLocations(analytics, 'total_members')
        },
        {
          metric: 'Compliance Score',
          locations: this.rankLocations(analytics, 'compliance_score')
        },
        {
          metric: 'Active Certificates',
          locations: this.rankLocations(analytics, 'active_certificates')
        }
      ];

      return comparisons;
    } catch (error) {
      console.error('Error getting cross-location comparison:', error);
      return [];
    }
  }

  async getLocationPerformanceTrends(locationId: string, period: 'week' | 'month' | 'quarter'): Promise<any[]> {
    try {
      // Get historical performance data for the location
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
      }

      // Query performance metrics over time
      const { data: metrics, error } = await supabase
        .from('analytics_cache')
        .select('*')
        .eq('cache_key', `location_performance_${locationId}`)
        .gte('created_at', startDate.toISOString())
        .order('created_at');

      if (error) throw error;

      return metrics || [];
    } catch (error) {
      console.error('Error getting location performance trends:', error);
      return [];
    }
  }

  async generateLocationReport(locationId: string): Promise<any> {
    try {
      const [analytics, trends, comparison] = await Promise.all([
        this.getLocationAnalytics(locationId),
        this.getLocationPerformanceTrends(locationId, 'month'),
        this.getCrossLocationComparison()
      ]);

      const locationData = analytics[0];
      if (!locationData) {
        throw new Error('Location not found');
      }

      return {
        location: locationData,
        trends,
        benchmarks: comparison.map(c => ({
          metric: c.metric,
          locationRank: c.locations.find(l => l.location_id === locationId)?.rank || 0,
          totalLocations: c.locations.length
        })),
        recommendations: this.generateRecommendations(locationData),
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating location report:', error);
      throw error;
    }
  }

  private calculateComplianceScore(activeCertificates: number, totalMembers: number): number {
    if (totalMembers === 0) return 100;
    return Math.round((activeCertificates / totalMembers) * 100);
  }

  private rankLocations(analytics: LocationAnalytics[], metric: keyof LocationAnalytics): any[] {
    return analytics
      .map(location => ({
        location_id: location.location_id,
        location_name: location.location_name,
        value: typeof location[metric] === 'number' ? location[metric] as number : 0
      }))
      .sort((a, b) => b.value - a.value)
      .map((location, index) => ({
        ...location,
        rank: index + 1
      }));
  }

  private generateRecommendations(locationData: LocationAnalytics): string[] {
    const recommendations: string[] = [];

    if (locationData.compliance_score < 80) {
      recommendations.push('Focus on improving compliance - consider additional training sessions');
    }

    if (locationData.expiring_certificates > locationData.active_certificates * 0.3) {
      recommendations.push('High number of expiring certificates - schedule renewal training');
    }

    if (locationData.total_members < 5) {
      recommendations.push('Consider team expansion to improve operational capacity');
    }

    if (locationData.performance_metrics.training_completion_rate < 70) {
      recommendations.push('Improve training completion rates through better scheduling and incentives');
    }

    return recommendations;
  }
}

export const locationAnalyticsService = new LocationAnalyticsService();
