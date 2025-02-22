
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SystemSettings, SupabaseSystemSettings } from "@/types/user-management";

export function useSystemSettings() {
  return useQuery({
    queryKey: ['systemSettings'],
    queryFn: async () => {
      console.log('Fetching system settings');
      
      try {
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
      } catch (error) {
        console.error('Unexpected error in system settings fetch:', error);
        return {
          key: 'test_data_enabled',
          value: { enabled: false }
        } as SystemSettings;
      }
    },
    staleTime: 1000 * 60 * 5, // Keep data fresh for 5 minutes
    gcTime: 1000 * 60 * 15, // Keep in garbage collection for 15 minutes
    refetchOnMount: false, // Prevent refetch on mount
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    retry: 1, // Only retry once on failure
    retryDelay: 1000, // Wait 1 second before retrying
  });
}
