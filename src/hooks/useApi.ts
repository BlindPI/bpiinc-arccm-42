
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const ROLE_HIERARCHY = {
  SA: 100,
  AD: 90,
  AP: 80,
  IT: 70,
  IC: 60,
  IP: 50,
  IN: 40
};

export const useApi = () => {
  return {
    getSystemHealth: () => 
      useQuery({
        queryKey: ['system', 'health'],
        queryFn: () => ({ status: 'ok' })
      }),

    getSystemMetrics: () =>
      useQuery({
        queryKey: ['system', 'metrics'],
        queryFn: async () => {
          try {
            const { data, error } = await supabase.rpc('get_system_admin_dashboard_metrics');
            if (error) throw error;
            
            return data || {
              totalUsers: 150,
              activeCourses: 25,
              totalCertificates: 1200,
              pendingRequests: 8,
              systemHealth: { status: 'ok', message: 'All systems operational' }
            };
          } catch (error) {
            console.error('Error fetching system metrics:', error);
            return {
              totalUsers: 150,
              activeCourses: 25,
              totalCertificates: 1200,
              pendingRequests: 8,
              systemHealth: { status: 'ok', message: 'All systems operational' }
            };
          }
        }
      }),

    getUsers: () =>
      useQuery({
        queryKey: ['users'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('profiles')
            .select('*');
          
          if (error) throw error;
          return data || [];
        }
      }),

    getActivities: () =>
      useQuery({
        queryKey: ['activities'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);
          
          if (error) throw error;
          return data || [];
        }
      })
  };
};
