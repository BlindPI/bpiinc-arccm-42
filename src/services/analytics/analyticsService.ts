
import { supabase } from '@/integrations/supabase/client';

export interface CertificateTrend {
  period_start: string;
  total_certificates: number;
  active_certificates: number;
  growth_rate: number;
}

export interface InstructorMetric {
  instructor_id: string;
  display_name: string;
  role: string;
  total_hours_all_time: number;
  total_sessions_all_time: number;
  compliance_percentage: number;
}

export interface ComplianceOverview {
  [role: string]: {
    total: number;
    compliant: number;
    non_compliant: number;
  };
}

export class AnalyticsService {
  static async getCertificateTrends(days: number = 30, groupBy: string = 'day') {
    try {
      const { data, error } = await supabase.rpc('get_certificate_trend_data', {
        p_days: days,
        p_group_by: groupBy
      });

      if (error) throw error;

      return {
        data: data || [],
        success: true
      };
    } catch (error) {
      console.error('Error fetching certificate trends:', error);
      return {
        data: [],
        success: false,
        error
      };
    }
  }

  static async getInstructorMetrics() {
    try {
      const { data, error } = await supabase
        .from('instructor_workload_summary')
        .select('*')
        .order('total_hours_all_time', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching instructor metrics:', error);
      return [];
    }
  }

  static async getComplianceOverview(): Promise<ComplianceOverview> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, compliance_status');

      if (error) throw error;

      const overview: ComplianceOverview = {};
      
      data?.forEach(profile => {
        if (!overview[profile.role]) {
          overview[profile.role] = {
            total: 0,
            compliant: 0,
            non_compliant: 0
          };
        }
        
        overview[profile.role].total++;
        if (profile.compliance_status) {
          overview[profile.role].compliant++;
        } else {
          overview[profile.role].non_compliant++;
        }
      });

      return overview;
    } catch (error) {
      console.error('Error fetching compliance overview:', error);
      return {};
    }
  }

  static async getCertificateStatusDistribution() {
    try {
      const { data, error } = await supabase.rpc('get_certificate_status_counts');

      if (error) throw error;

      const distribution: Record<string, number> = {};
      data?.forEach((item: any) => {
        distribution[item.status] = Number(item.count);
      });

      return distribution;
    } catch (error) {
      console.error('Error fetching certificate distribution:', error);
      return {};
    }
  }

  static async getTopCourses(limit: number = 10) {
    try {
      const { data, error } = await supabase.rpc('get_top_certificate_courses', {
        limit_count: limit
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching top courses:', error);
      return [];
    }
  }
}
