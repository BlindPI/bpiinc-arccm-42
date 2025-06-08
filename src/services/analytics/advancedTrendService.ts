
import { supabase } from '@/integrations/supabase/client';

export interface TrendPoint {
  date: string;
  value: number;
  prediction?: boolean;
}

export interface TrendAnalysis {
  current: number;
  previous: number;
  growth: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
  forecast: TrendPoint[];
  anomalies: string[];
}

export interface PredictiveMetrics {
  teamGrowthForecast: TrendAnalysis;
  complianceRiskScore: number;
  performanceProjection: TrendAnalysis;
  resourceUtilization: TrendAnalysis;
}

export class AdvancedTrendService {
  // Real team growth trend analysis
  static async analyzeTeamGrowthTrend(timeRange: '30d' | '90d' | '1y' = '90d'): Promise<TrendAnalysis> {
    try {
      const days = timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Get actual team member data over time
      const { data: memberHistory, error } = await supabase
        .from('team_members')
        .select('created_at, team_id')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      const dailyGrowth = this.aggregateByDay(memberHistory || [], days);
      const trendAnalysis = this.calculateTrend(dailyGrowth);
      const forecast = this.generateForecast(dailyGrowth, 30); // 30-day forecast

      return {
        current: dailyGrowth[dailyGrowth.length - 1]?.value || 0,
        previous: dailyGrowth[dailyGrowth.length - 8]?.value || 0, // Week ago
        growth: trendAnalysis.growth,
        trend: trendAnalysis.direction,
        confidence: trendAnalysis.confidence,
        forecast,
        anomalies: this.detectAnomalies(dailyGrowth)
      };
    } catch (error) {
      console.error('Error analyzing team growth trend:', error);
      return this.getDefaultTrendAnalysis();
    }
  }

  // Performance trend analysis with real data
  static async analyzePerformanceTrend(): Promise<TrendAnalysis> {
    try {
      const { data: performanceData, error } = await supabase
        .from('team_performance_metrics')
        .select('compliance_score, average_satisfaction_score, metric_period_start')
        .gte('metric_period_start', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .order('metric_period_start', { ascending: true });

      if (error) throw error;

      const performancePoints = (performanceData || []).map(item => ({
        date: item.metric_period_start,
        value: (item.compliance_score + item.average_satisfaction_score) / 2
      }));

      const trendAnalysis = this.calculateTrend(performancePoints);
      const forecast = this.generateForecast(performancePoints, 30);

      return {
        current: performancePoints[performancePoints.length - 1]?.value || 0,
        previous: performancePoints[performancePoints.length - 8]?.value || 0,
        growth: trendAnalysis.growth,
        trend: trendAnalysis.direction,
        confidence: trendAnalysis.confidence,
        forecast,
        anomalies: this.detectAnomalies(performancePoints)
      };
    } catch (error) {
      console.error('Error analyzing performance trend:', error);
      return this.getDefaultTrendAnalysis();
    }
  }

  // Predictive compliance risk scoring
  static async calculateComplianceRiskScore(): Promise<number> {
    try {
      const [issuesData, teamData] = await Promise.all([
        supabase
          .from('compliance_issues')
          .select('severity, status, created_at')
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('teams')
          .select('performance_score, status')
          .eq('status', 'active')
      ]);

      if (issuesData.error || teamData.error) throw new Error('Data fetch failed');

      const issues = issuesData.data || [];
      const teams = teamData.data || [];

      // Calculate risk factors
      const criticalIssues = issues.filter(i => i.severity === 'HIGH').length;
      const openIssues = issues.filter(i => i.status === 'OPEN').length;
      const avgPerformance = teams.reduce((sum, t) => sum + (t.performance_score || 0), 0) / Math.max(teams.length, 1);

      // Risk scoring algorithm
      let riskScore = 0;
      riskScore += criticalIssues * 15; // High severity issues
      riskScore += openIssues * 5; // Open issues
      riskScore += Math.max(0, 80 - avgPerformance); // Performance gap

      return Math.min(100, Math.max(0, riskScore));
    } catch (error) {
      console.error('Error calculating compliance risk score:', error);
      return 25; // Default moderate risk
    }
  }

  // Resource utilization analysis
  static async analyzeResourceUtilization(): Promise<TrendAnalysis> {
    try {
      const { data: utilizationData, error } = await supabase
        .from('instructor_workload_summary')
        .select('hours_this_month, max_capacity, instructor_id, updated_at')
        .not('hours_this_month', 'is', null)
        .order('updated_at', { ascending: true });

      if (error) throw error;

      const utilizationPoints = (utilizationData || []).map(item => {
        const utilization = item.max_capacity > 0 
          ? (item.hours_this_month / item.max_capacity) * 100 
          : 0;
        return {
          date: item.updated_at,
          value: Math.min(100, utilization)
        };
      });

      const avgUtilization = utilizationPoints.reduce((sum, p) => sum + p.value, 0) / Math.max(utilizationPoints.length, 1);
      const trendAnalysis = this.calculateTrend(utilizationPoints);
      const forecast = this.generateForecast(utilizationPoints, 30);

      return {
        current: avgUtilization,
        previous: utilizationPoints[Math.max(0, utilizationPoints.length - 8)]?.value || 0,
        growth: trendAnalysis.growth,
        trend: trendAnalysis.direction,
        confidence: trendAnalysis.confidence,
        forecast,
        anomalies: this.detectAnomalies(utilizationPoints)
      };
    } catch (error) {
      console.error('Error analyzing resource utilization:', error);
      return this.getDefaultTrendAnalysis();
    }
  }

  // Generate comprehensive predictive metrics
  static async generatePredictiveMetrics(): Promise<PredictiveMetrics> {
    const [teamGrowthForecast, complianceRiskScore, performanceProjection, resourceUtilization] = await Promise.all([
      this.analyzeTeamGrowthTrend(),
      this.calculateComplianceRiskScore(),
      this.analyzePerformanceTrend(),
      this.analyzeResourceUtilization()
    ]);

    return {
      teamGrowthForecast,
      complianceRiskScore,
      performanceProjection,
      resourceUtilization
    };
  }

  // Helper methods
  private static aggregateByDay(data: any[], days: number): TrendPoint[] {
    const dailyData: Record<string, number> = {};
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Initialize all days with 0
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dailyData[dateStr] = 0;
    }

    // Count actual data points
    data.forEach(item => {
      const date = new Date(item.created_at).toISOString().split('T')[0];
      if (dailyData.hasOwnProperty(date)) {
        dailyData[date]++;
      }
    });

    return Object.entries(dailyData).map(([date, value]) => ({ date, value }));
  }

  private static calculateTrend(data: TrendPoint[]): { growth: number; direction: 'up' | 'down' | 'stable'; confidence: number } {
    if (data.length < 2) return { growth: 0, direction: 'stable', confidence: 0 };

    const recent = data.slice(-7); // Last 7 points
    const previous = data.slice(-14, -7); // Previous 7 points

    const recentAvg = recent.reduce((sum, p) => sum + p.value, 0) / recent.length;
    const previousAvg = previous.reduce((sum, p) => sum + p.value, 0) / Math.max(previous.length, 1);

    const growth = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;
    const direction = Math.abs(growth) < 1 ? 'stable' : growth > 0 ? 'up' : 'down';
    const confidence = Math.min(100, Math.max(0, 100 - Math.abs(growth - Math.round(growth)) * 10));

    return { growth: Math.round(growth * 10) / 10, direction, confidence };
  }

  private static generateForecast(historicalData: TrendPoint[], forecastDays: number): TrendPoint[] {
    if (historicalData.length < 3) return [];

    const lastValue = historicalData[historicalData.length - 1]?.value || 0;
    const trend = this.calculateTrend(historicalData);
    const dailyGrowthRate = trend.growth / 100 / 7; // Daily growth rate

    const forecast: TrendPoint[] = [];
    for (let i = 1; i <= forecastDays; i++) {
      const futureDate = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
      const predictedValue = lastValue * (1 + dailyGrowthRate * i);
      
      forecast.push({
        date: futureDate.toISOString().split('T')[0],
        value: Math.max(0, Math.round(predictedValue * 10) / 10),
        prediction: true
      });
    }

    return forecast;
  }

  private static detectAnomalies(data: TrendPoint[]): string[] {
    const anomalies: string[] = [];
    if (data.length < 5) return anomalies;

    const values = data.map(p => p.value);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length);

    data.forEach((point, index) => {
      if (Math.abs(point.value - mean) > 2 * stdDev) {
        anomalies.push(`Unusual activity detected on ${point.date}`);
      }
    });

    return anomalies.slice(0, 3); // Limit to 3 most recent anomalies
  }

  private static getDefaultTrendAnalysis(): TrendAnalysis {
    return {
      current: 0,
      previous: 0,
      growth: 0,
      trend: 'stable',
      confidence: 0,
      forecast: [],
      anomalies: []
    };
  }
}
