
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
        .single();

      if (error) {
        console.error('Error fetching system settings:', error);
        throw error;
      }
      
      console.log('Fetched system settings:', data);
      
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
  });
}
