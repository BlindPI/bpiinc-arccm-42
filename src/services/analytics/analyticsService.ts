
import { supabase } from '@/integrations/supabase/client';
import { AnalyticsReport, CertificateTrendData, AnalyticsCache } from '@/types/analytics';

export class AnalyticsService {
  static async getCertificateTrends(days: number = 30, groupBy: string = 'day'): Promise<CertificateTrendData[]> {
    const { data, error } = await supabase.rpc('get_certificate_trend_data', {
      p_days: days,
      p_group_by: groupBy
    });

    if (error) throw error;
    return data || [];
  }

  static async getInstructorPerformanceMetrics(): Promise<any> {
    const { data, error } = await supabase
      .from('instructor_workload_summary')
      .select('*')
      .order('total_hours_all_time', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async getComplianceOverview(): Promise<any> {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('role, compliance_status, status')
      .eq('status', 'ACTIVE');

    if (error) throw error;

    const overview = profiles?.reduce((acc, profile) => {
      const role = profile.role || 'Unknown';
      if (!acc[role]) {
        acc[role] = { total: 0, compliant: 0, non_compliant: 0 };
      }
      acc[role].total++;
      if (profile.compliance_status) {
        acc[role].compliant++;
      } else {
        acc[role].non_compliant++;
      }
      return acc;
    }, {} as Record<string, any>);

    return overview;
  }

  static async getCertificateStatusDistribution(): Promise<any> {
    const { data, error } = await supabase
      .from('certificates')
      .select('status')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const distribution = data?.reduce((acc, cert) => {
      const status = cert.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return distribution;
  }

  static async createReport(report: Partial<AnalyticsReport>): Promise<AnalyticsReport> {
    const { data, error } = await supabase
      .from('analytics_reports')
      .insert(report)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getReports(): Promise<AnalyticsReport[]> {
    const { data, error } = await supabase
      .from('analytics_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async updateReport(id: string, updates: Partial<AnalyticsReport>): Promise<AnalyticsReport> {
    const { data, error } = await supabase
      .from('analytics_reports')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteReport(id: string): Promise<void> {
    const { error } = await supabase
      .from('analytics_reports')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async getCachedData(cacheKey: string): Promise<any> {
    const { data, error } = await supabase
      .from('analytics_cache')
      .select('data, expires_at')
      .eq('cache_key', cacheKey)
      .single();

    if (error || !data) return null;

    // Check if cache is expired
    if (new Date(data.expires_at) < new Date()) {
      await this.invalidateCache(cacheKey);
      return null;
    }

    return data.data;
  }

  static async setCachedData(cacheKey: string, data: any, ttlMinutes: number = 30): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    const { error } = await supabase
      .from('analytics_cache')
      .upsert({
        cache_key: cacheKey,
        data,
        expires_at: expiresAt.toISOString()
      }, { onConflict: 'cache_key' });

    if (error) throw error;
  }

  static async invalidateCache(cacheKey: string): Promise<void> {
    const { error } = await supabase
      .from('analytics_cache')
      .delete()
      .eq('cache_key', cacheKey);

    if (error) throw error;
  }

  static async getTopCourses(limit: number = 10): Promise<any> {
    const { data, error } = await supabase
      .from('certificates')
      .select('course_name')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const courseCounts = data?.reduce((acc, cert) => {
      const courseName = cert.course_name || 'Unknown';
      acc[courseName] = (acc[courseName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(courseCounts || {})
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([course_name, count]) => ({ course_name, count }));
  }
}
