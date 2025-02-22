
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SystemSettings, SupabaseSystemSettings } from "@/types/user-management";
import { useCallback } from "react";

const SYSTEM_SETTINGS_KEY = ['systemSettings'] as const;

async function fetchSystemSettings() {
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
    
    if (!data) {
      return {
        key: 'test_data_enabled',
        value: { enabled: false }
      } as SystemSettings;
    }

    const rawSettings = data as SupabaseSystemSettings;
    return {
      key: rawSettings.key,
      value: {
        enabled: typeof rawSettings.value === 'boolean' ? rawSettings.value : false
      }
    } as SystemSettings;
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

  const prefetchSystemSettings = useCallback(async () => {
    // Only prefetch if we don't already have valid data in the cache
    const existingData = queryClient.getQueryData(SYSTEM_SETTINGS_KEY);
    if (!existingData) {
      await queryClient.prefetchQuery({
        queryKey: SYSTEM_SETTINGS_KEY,
        queryFn: fetchSystemSettings,
      });
    }
  }, [queryClient]);

  const query = useQuery({
    queryKey: SYSTEM_SETTINGS_KEY,
    queryFn: fetchSystemSettings,
    staleTime: 1000 * 60 * 60, // Data stays fresh for 1 hour
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  return {
    ...query,
    prefetchSystemSettings,
  };
}
