
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';
import { cacheManager } from '@/services/cache/cacheManager';
import type { 
  InstructorPerformanceMetrics, 
  TeachingLoadReport, 
  ComplianceReport,
  ExecutiveDashboardMetrics,
  ReportSchedule
} from '@/types/reporting';

export function useReportingAnalytics() {
  const queryClient = useQueryClient();

  // Optimized Instructor Performance with caching
  const useInstructorPerformance = (timeRange: string = '6') => {
    return useOptimizedQuery({
      queryKey: ['instructor-performance', timeRange],
      queryFn: async (): Promise<InstructorPerformanceMetrics[]> => {
        const cacheKey = `instructor_performance_${timeRange}`;
        const cached = cacheManager.get(cacheKey);
        
        if (cached) {
          return cached;
        }

        // Batch fetch all required data
        const [instructorsResult, evaluationsResult, certificatesResult] = await Promise.all([
          supabase.from('instructor_workload_summary').select('*'),
          supabase.from('supervisor_evaluations').select('instructor_id, teaching_competency, created_at'),
          supabase.from('certificates').select('instructor_name, created_at').eq('status', 'ACTIVE')
        ]);

        if (instructorsResult.error) throw instructorsResult.error;
        if (evaluationsResult.error) throw evaluationsResult.error;
        if (certificatesResult.error) throw certificatesResult.error;

        const result = instructorsResult.data?.map(instructor => {
          const instructorEvals = evaluationsResult.data?.filter(e => e.instructor_id === instructor.instructor_id) || [];
          const avgRating = instructorEvals.length > 0 
            ? instructorEvals.reduce((sum, e) => sum + e.teaching_competency, 0) / instructorEvals.length 
            : 0;

          const instructorCerts = certificatesResult.data?.filter(c => 
            c.instructor_name?.toLowerCase() === instructor.display_name?.toLowerCase()
          ) || [];

          return {
            instructorId: instructor.instructor_id,
            instructorName: instructor.display_name || 'Unknown',
            role: instructor.role || 'IT',
            totalSessions: instructor.total_sessions_all_time || 0,
            totalHours: instructor.total_hours_all_time || 0,
            averageSessionRating: avgRating,
            studentsCount: instructor.sessions_this_month * 10 || 0,
            certificatesIssued: instructorCerts.length,
            complianceScore: instructor.compliance_percentage || 0,
            monthlyTrend: []
          };
        }) || [];

        // Cache for 5 minutes
        cacheManager.set(cacheKey, result, 300000);
        return result;
      },
      cacheConfig: {
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
      },
      dependencies: ['supervisor-evaluations', 'certificates']
    });
  };

  // Optimized Teaching Load Analysis
  const useTeachingLoadAnalysis = () => {
    return useOptimizedQuery({
      queryKey: ['teaching-load-analysis'],
      queryFn: async (): Promise<TeachingLoadReport[]> => {
        const { data: workloads, error } = await supabase
          .from('instructor_workload_summary')
          .select('*');

        if (error) throw error;

        const avgHours = workloads?.reduce((sum, w) => sum + (w.hours_this_month || 0), 0) / (workloads?.length || 1);

        return workloads?.map(instructor => {
          const currentLoad = instructor.hours_this_month || 0;
          const optimalLoad = 40;
          const utilizationRate = currentLoad / optimalLoad;
          
          let burnoutRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
          let recommendations: string[] = [];

          if (utilizationRate > 1.5) {
            burnoutRisk = 'HIGH';
            recommendations.push('Reduce teaching load', 'Schedule mandatory rest period');
          } else if (utilizationRate > 1.2) {
            burnoutRisk = 'MEDIUM';
            recommendations.push('Monitor closely', 'Consider load redistribution');
          } else if (utilizationRate < 0.5) {
            recommendations.push('Increase utilization', 'Assign additional courses');
          }

          return {
            instructorId: instructor.instructor_id,
            instructorName: instructor.display_name || 'Unknown',
            currentLoad,
            optimalLoad,
            utilizationRate,
            burnoutRisk,
            recommendations
          };
        }) || [];
      },
      cacheConfig: {
        staleTime: 10 * 60 * 1000,
      }
    });
  };

  // Optimized Compliance Report
  const useComplianceReport = () => {
    return useOptimizedQuery({
      queryKey: ['compliance-report'],
      queryFn: async (): Promise<ComplianceReport[]> => {
        // Batch fetch compliance data
        const [instructorsResult, checksResult] = await Promise.all([
          supabase.from('instructor_workload_summary').select('*'),
          supabase.from('instructor_compliance_checks').select('*').order('check_date', { ascending: false })
        ]);

        if (instructorsResult.error) throw instructorsResult.error;
        if (checksResult.error) throw checksResult.error;

        return instructorsResult.data?.map(instructor => {
          const instructorChecks = checksResult.data?.filter(c => c.instructor_id === instructor.instructor_id) || [];
          const recentCheck = instructorChecks[0];
          
          let status: 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT' = 'COMPLIANT';
          if (instructor.compliance_percentage < 70) status = 'NON_COMPLIANT';
          else if (instructor.compliance_percentage < 90) status = 'WARNING';

          return {
            instructorId: instructor.instructor_id,
            instructorName: instructor.display_name || 'Unknown',
            role: instructor.role || 'IT',
            overallScore: instructor.compliance_percentage || 0,
            areas: [
              {
                area: 'Teaching Hours',
                score: Math.min((instructor.hours_this_month || 0) / 20 * 100, 100),
                status: (instructor.hours_this_month || 0) >= 20 ? 'PASS' : 'NEEDS_ATTENTION',
                details: `${instructor.hours_this_month || 0} hours this month`
              },
              {
                area: 'Documentation',
                score: recentCheck?.score || 0,
                status: (recentCheck?.score || 0) >= 80 ? 'PASS' : 'NEEDS_ATTENTION',
                details: recentCheck ? `Last check: ${recentCheck.check_date}` : 'No recent checks'
              }
            ],
            lastAuditDate: recentCheck?.check_date || 'Never',
            nextAuditDue: 'TBD',
            status
          };
        }) || [];
      },
      cacheConfig: {
        staleTime: 15 * 60 * 1000,
      }
    });
  };

  // Executive Dashboard with aggressive caching
  const useExecutiveDashboard = () => {
    return useOptimizedQuery({
      queryKey: ['executive-dashboard'],
      queryFn: async (): Promise<ExecutiveDashboardMetrics> => {
        const cacheKey = 'executive_dashboard';
        const cached = cacheManager.get(cacheKey);
        
        if (cached) {
          return cached;
        }

        // Parallel fetch of all dashboard data
        const [usersResult, instructorsResult, certificatesResult, performanceResult] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('instructor_workload_summary').select('*'),
          supabase.from('certificates').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
          supabase.from('instructor_workload_summary').select('*').limit(5).order('compliance_percentage', { ascending: false })
        ]);

        const totalUsers = usersResult.count || 0;
        const activeInstructors = instructorsResult.data?.length || 0;
        const totalCertificates = certificatesResult.count || 0;
        const avgCompliance = instructorsResult.data?.reduce((sum, i) => sum + (i.compliance_percentage || 0), 0) / Math.max(activeInstructors, 1);

        const result = {
          totalUsers,
          activeInstructors,
          totalCertificates,
          monthlyGrowth: 12.5,
          systemHealth: 'GOOD' as const,
          complianceRate: avgCompliance,
          utilizationRate: 75,
          topPerformers: performanceResult.data?.map(p => ({
            instructorId: p.instructor_id,
            instructorName: p.display_name || 'Unknown',
            role: p.role || 'IT',
            totalSessions: p.total_sessions_all_time || 0,
            totalHours: p.total_hours_all_time || 0,
            averageSessionRating: 0,
            studentsCount: 0,
            certificatesIssued: 0,
            complianceScore: p.compliance_percentage || 0,
            monthlyTrend: []
          })) || [],
          alerts: [
            {
              id: '1',
              type: 'WARNING' as const,
              message: '3 instructors require compliance review',
              timestamp: new Date().toISOString(),
              resolved: false
            }
          ]
        };

        // Cache for 2 minutes due to executive nature
        cacheManager.set(cacheKey, result, 120000);
        return result;
      },
      cacheConfig: {
        staleTime: 2 * 60 * 1000,
        cacheTime: 5 * 60 * 1000,
      }
    });
  };

  // Optimized report generation
  const generateReport = useMutation({
    mutationFn: async ({ type, timeRange }: { type: string; timeRange: string }) => {
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: { type, timeRange }
      });
      
      if (error) throw error;
      
      // Invalidate related cache entries
      cacheManager.invalidatePattern(`${type}_`);
      
      return data;
    },
    onSuccess: () => {
      toast.success('Report generated successfully');
      // Invalidate all reporting queries
      queryClient.invalidateQueries({ queryKey: ['instructor-performance'] });
      queryClient.invalidateQueries({ queryKey: ['teaching-load-analysis'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-report'] });
      queryClient.invalidateQueries({ queryKey: ['executive-dashboard'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to generate report: ${error.message}`);
    }
  });

  return {
    useInstructorPerformance,
    useTeachingLoadAnalysis,
    useComplianceReport,
    useExecutiveDashboard,
    generateReport
  };
}
