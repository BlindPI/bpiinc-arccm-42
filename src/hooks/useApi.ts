
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const ROLE_HIERARCHY = {
  SA: 100,   // System Administrator (highest)
  AD: 90,    // Administrator
  AP: 80,    // Authorized Provider  
  IT: 70,    // Instructor Trainer
  IC: 60,    // Instructor Candidate
  IP: 50,    // Instructor Provisional
  IN: 40     // Instructor (lowest)
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
        queryFn: () => ({ 
          totalUsers: 150,
          activeCourses: 25,
          totalCertificates: 1200,
          pendingRequests: 8,
          systemHealth: { status: 'ok', message: 'All systems operational' }
        })
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
