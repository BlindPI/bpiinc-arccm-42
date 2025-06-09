
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
// Remove the ApiClient import since it's causing issues and we're not using it in the certificate functionality

// Define the role hierarchy with numeric values for permission levels
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
    // System endpoints - simplified without ApiClient dependency
    getSystemHealth: () => 
      useQuery({
        queryKey: ['system', 'health'],
        queryFn: () => ({ status: 'ok' }) // Simplified for now
      }),

    getSystemMetrics: () =>
      useQuery({
        queryKey: ['system', 'metrics'],
        queryFn: () => ({ metrics: [] }) // Simplified for now
      }),

    // User management
    getUsers: () =>
      useQuery({
        queryKey: ['users'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          return data;
        }
      }),

    // Analytics - simplified without ApiClient dependency
    getCertificateAnalytics: () =>
      useQuery({
        queryKey: ['analytics', 'certificates'],
        queryFn: () => ({ analytics: [] }) // Simplified for now
      }),

    // Role hierarchy utilities
    getRoleHierarchy: () => ROLE_HIERARCHY,
    
    hasPermission: (userRole: string, requiredRole: string) => {
      const userLevel = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] || 0;
      const requiredLevel = ROLE_HIERARCHY[requiredRole as keyof typeof ROLE_HIERARCHY] || 100;
      return userLevel >= requiredLevel;
    },

    isHigherRole: (role1: string, role2: string) => {
      const level1 = ROLE_HIERARCHY[role1 as keyof typeof ROLE_HIERARCHY] || 0;
      const level2 = ROLE_HIERARCHY[role2 as keyof typeof ROLE_HIERARCHY] || 0;
      return level1 > level2;
    }
  };
};
