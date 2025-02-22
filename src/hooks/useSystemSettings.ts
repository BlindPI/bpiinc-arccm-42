
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SystemSettings, SupabaseSystemSettings } from "@/types/user-management";

export function useSystemSettings() {
  return useQuery({
    queryKey: ['systemSettings'],
    queryFn: async () => {
      console.log('Fetching system settings');
      
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'test_data_enabled')
        .maybeSingle();

      if (error) {
        console.error('Error fetching system settings:', error);
        return {
          key: 'test_data_enabled',
          value: { enabled: false }
        } as SystemSettings;
      }
      
      console.log('Fetched system settings:', data);
      
      if (!data) {
        console.log('No system settings found, using defaults');
        return {
          key: 'test_data_enabled',
          value: { enabled: false }
        } as SystemSettings;
      }

      const rawSettings = data as SupabaseSystemSettings;
      const settings: SystemSettings = {
        key: rawSettings.key,
        value: {
          enabled: typeof rawSettings.value === 'boolean' ? rawSettings.value : false
        }
      };
      
      console.log('Processed system settings:', settings);
      return settings;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep unused data in cache for 10 minutes
    retry: 2, // Only retry twice
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 30000), // Exponential backoff
  });
}
