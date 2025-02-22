
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SystemSettings, SupabaseSystemSettings } from "@/types/user-management";

const SYSTEM_SETTINGS_KEY = ['systemSettings'] as const;

async function fetchSystemSettings() {
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
}

export function useSystemSettings() {
  const queryClient = useQueryClient();

  // This is used to prefetch system settings
  const prefetchSystemSettings = async () => {
    await queryClient.prefetchQuery({
      queryKey: SYSTEM_SETTINGS_KEY,
      queryFn: fetchSystemSettings,
    });
  };

  const query = useQuery({
    queryKey: SYSTEM_SETTINGS_KEY,
    queryFn: fetchSystemSettings,
    staleTime: Infinity, // Data never goes stale automatically
    gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return {
    ...query,
    prefetchSystemSettings,
  };
}
