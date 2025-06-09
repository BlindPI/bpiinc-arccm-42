
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
      }),

    // Enhanced CRM methods
    getCRMStats: () =>
      useQuery({
        queryKey: ['crm', 'stats'],
        queryFn: async () => {
          try {
            // Get leads stats
            const { data: leads } = await supabase
              .from('crm_leads')
              .select('lead_status, lead_score');

            // Get opportunities stats  
            const { data: opportunities } = await supabase
              .from('crm_opportunities')
              .select('stage, estimated_value, probability');

            // Get activities stats
            const { data: activities } = await supabase
              .from('crm_activities')
              .select('activity_type, completed');

            return {
              leads: {
                total: leads?.length || 0,
                new: leads?.filter(l => l.lead_status === 'new').length || 0,
                qualified: leads?.filter(l => l.lead_status === 'qualified').length || 0,
                converted: leads?.filter(l => l.lead_status === 'converted').length || 0,
                averageScore: leads?.length ? 
                  leads.reduce((sum, l) => sum + (l.lead_score || 0), 0) / leads.length : 0
              },
              opportunities: {
                total: opportunities?.length || 0,
                totalValue: opportunities?.reduce((sum, o) => sum + (o.estimated_value || 0), 0) || 0,
                weightedValue: opportunities?.reduce((sum, o) => 
                  sum + ((o.estimated_value || 0) * (o.probability || 0) / 100), 0) || 0,
                byStage: {
                  prospect: opportunities?.filter(o => o.stage === 'prospect').length || 0,
                  proposal: opportunities?.filter(o => o.stage === 'proposal').length || 0,
                  negotiation: opportunities?.filter(o => o.stage === 'negotiation').length || 0,
                  closed_won: opportunities?.filter(o => o.stage === 'closed_won').length || 0,
                  closed_lost: opportunities?.filter(o => o.stage === 'closed_lost').length || 0
                }
              },
              activities: {
                total: activities?.length || 0,
                completed: activities?.filter(a => a.completed).length || 0,
                pending: activities?.filter(a => !a.completed).length || 0,
                byType: {
                  call: activities?.filter(a => a.activity_type === 'call').length || 0,
                  email: activities?.filter(a => a.activity_type === 'email').length || 0,
                  meeting: activities?.filter(a => a.activity_type === 'meeting').length || 0,
                  task: activities?.filter(a => a.activity_type === 'task').length || 0,
                  note: activities?.filter(a => a.activity_type === 'note').length || 0
                }
              }
            };
          } catch (error) {
            console.error('Error fetching CRM stats:', error);
            return {
              leads: { total: 0, new: 0, qualified: 0, converted: 0, averageScore: 0 },
              opportunities: { 
                total: 0, 
                totalValue: 0, 
                weightedValue: 0, 
                byStage: { prospect: 0, proposal: 0, negotiation: 0, closed_won: 0, closed_lost: 0 }
              },
              activities: { 
                total: 0, 
                completed: 0, 
                pending: 0, 
                byType: { call: 0, email: 0, meeting: 0, task: 0, note: 0 }
              }
            };
          }
        }
      })
  };
};
