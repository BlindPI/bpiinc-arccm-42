
import { supabase } from '@/integrations/supabase/client';

export interface ProviderPerformanceMetrics {
  providerId: string;
  providerName: string;
  period: string;
  metrics: {
    totalTeams: number;
    activeInstructors: number;
    certificatesIssued: number;
    complianceScore: number;
    customerSatisfaction: number;
    responseTime: number;
    completionRate: number;
  };
  trends: {
    teamGrowth: number;
    certificationTrend: number;
    complianceImprovement: number;
  };
  benchmarks: {
    industryAverage: number;
    topPerformer: number;
    targetGoal: number;
  };
}

export interface AnalyticsDashboard {
  overview: {
    totalProviders: number;
    totalTeams: number;
    totalCertificates: number;
    averageCompliance: number;
  };
  topPerformers: ProviderPerformanceMetrics[];
  riskProviders: ProviderPerformanceMetrics[];
  trends: {
    monthly: Array<{ month: string; value: number }>;
    weekly: Array<{ week: string; value: number }>;
  };
  alerts: Array<{
    id: string;
    type: 'compliance' | 'performance' | 'capacity';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    providerId?: string;
    actionRequired: boolean;
  }>;
}

export class ProviderAnalyticsService {
  static async getProviderPerformanceMetrics(
    providerId: string, 
    period: '30d' | '90d' | '1y' = '30d'
  ): Promise<ProviderPerformanceMetrics> {
    const startDate = this.getStartDate(period);
    
    // Get provider basic info
    const { data: provider, error: providerError } = await supabase
      .from('authorized_providers')
      .select('*')
      .eq('id', parseInt(providerId))
      .single();

    if (providerError || !provider) {
      throw new Error('Provider not found');
    }

    // Get teams count
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id')
      .eq('provider_id', parseInt(providerId));

    if (teamsError) throw teamsError;

    // Get instructors count
    const { data: instructors, error: instructorsError } = await supabase
      .from('instructors')
      .select('id')
      .eq('provider_id', parseInt(providerId))
      .eq('status', 'ACTIVE');

    if (instructorsError) throw instructorsError;

    // Get certificates issued
    const { data: certificates, error: certificatesError } = await supabase
      .from('certificates')
      .select('id')
      .gte('created_at', startDate)
      .in('location_id', [provider.primary_location_id].filter(Boolean));

    if (certificatesError) throw certificatesError;

    // Calculate metrics
    const metrics = {
      totalTeams: teams?.length || 0,
      activeInstructors: instructors?.length || 0,
      certificatesIssued: certificates?.length || 0,
      complianceScore: provider.compliance_score || 0,
      customerSatisfaction: await this.calculateSatisfactionScore(providerId),
      responseTime: await this.calculateResponseTime(providerId),
      completionRate: await this.calculateCompletionRate(providerId)
    };

    // Calculate trends (simplified)
    const trends = {
      teamGrowth: await this.calculateGrowthRate(providerId, 'teams', period),
      certificationTrend: await this.calculateGrowthRate(providerId, 'certificates', period),
      complianceImprovement: await this.calculateComplianceImprovement(providerId, period)
    };

    // Get industry benchmarks
    const benchmarks = await this.getIndustryBenchmarks();

    return {
      providerId,
      providerName: provider.name,
      period,
      metrics,
      trends,
      benchmarks
    };
  }

  static async getAnalyticsDashboard(): Promise<AnalyticsDashboard> {
    // Get overview metrics
    const [providersResult, teamsResult, certificatesResult] = await Promise.all([
      supabase.from('authorized_providers').select('id, compliance_score').eq('status', 'APPROVED'),
      supabase.from('teams').select('id'),
      supabase.from('certificates').select('id').eq('status', 'ACTIVE')
    ]);

    const providers = providersResult.data || [];
    const teams = teamsResult.data || [];
    const certificates = certificatesResult.data || [];

    const overview = {
      totalProviders: providers.length,
      totalTeams: teams.length,
      totalCertificates: certificates.length,
      averageCompliance: providers.reduce((sum, p) => sum + (p.compliance_score || 0), 0) / (providers.length || 1)
    };

    // Get top and risk performers
    const performancePromises = providers.slice(0, 10).map(p => 
      this.getProviderPerformanceMetrics(p.id.toString(), '30d')
    );
    
    const allPerformance = await Promise.all(performancePromises);
    
    const topPerformers = allPerformance
      .sort((a, b) => b.metrics.complianceScore - a.metrics.complianceScore)
      .slice(0, 5);
    
    const riskProviders = allPerformance
      .filter(p => p.metrics.complianceScore < 70 || p.metrics.completionRate < 80)
      .slice(0, 5);

    // Generate trend data
    const trends = {
      monthly: await this.getMonthlyTrends(12),
      weekly: await this.getWeeklyTrends(12)
    };

    // Generate alerts
    const alerts = await this.generateSystemAlerts();

    return {
      overview,
      topPerformers,
      riskProviders,
      trends,
      alerts
    };
  }

  private static getStartDate(period: string): string {
    const now = new Date();
    switch (period) {
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      case '1y':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  private static async calculateSatisfactionScore(providerId: string): Promise<number> {
    // Simplified calculation - in real implementation, would query feedback/ratings
    return Math.random() * 20 + 80; // 80-100 range
  }

  private static async calculateResponseTime(providerId: string): Promise<number> {
    // Simplified calculation - in real implementation, would calculate from ticket/request data
    return Math.random() * 24 + 1; // 1-25 hours
  }

  private static async calculateCompletionRate(providerId: string): Promise<number> {
    // Simplified calculation - in real implementation, would calculate from course completions
    return Math.random() * 20 + 80; // 80-100%
  }

  private static async calculateGrowthRate(providerId: string, metric: string, period: string): Promise<number> {
    // Simplified calculation - would compare current vs previous period
    return (Math.random() - 0.5) * 40; // -20% to +20%
  }

  private static async calculateComplianceImprovement(providerId: string, period: string): Promise<number> {
    // Simplified calculation
    return (Math.random() - 0.3) * 20; // -6% to +14%
  }

  private static async getIndustryBenchmarks() {
    return {
      industryAverage: 75,
      topPerformer: 95,
      targetGoal: 85
    };
  }

  private static async getMonthlyTrends(months: number) {
    const trends = [];
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      trends.push({
        month: date.toISOString().slice(0, 7),
        value: Math.random() * 100 + 200
      });
    }
    return trends;
  }

  private static async getWeeklyTrends(weeks: number) {
    const trends = [];
    for (let i = weeks - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i * 7);
      trends.push({
        week: `Week ${i + 1}`,
        value: Math.random() * 50 + 100
      });
    }
    return trends;
  }

  private static async generateSystemAlerts() {
    return [
      {
        id: '1',
        type: 'compliance' as const,
        severity: 'high' as const,
        message: 'Provider compliance score below threshold (65%)',
        providerId: '1',
        actionRequired: true
      },
      {
        id: '2',
        type: 'performance' as const,
        severity: 'medium' as const,
        message: 'Decreased certificate issuance rate detected',
        actionRequired: false
      },
      {
        id: '3',
        type: 'capacity' as const,
        severity: 'low' as const,
        message: 'Team capacity utilization below optimal',
        providerId: '2',
        actionRequired: false
      }
    ];
  }
}
