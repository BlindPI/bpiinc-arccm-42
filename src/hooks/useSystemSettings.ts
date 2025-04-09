
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SystemSettings, SupabaseSystemSettings } from "@/types/supabase-schema";

export const prefetchSystemSettings = async (): Promise<SupabaseSystemSettings | undefined> => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('key', 'test_users_enabled')
      .single();
    
    if (error) {
      console.error('Error prefetching system settings:', error);
      return undefined;
    }
    
    return data as SupabaseSystemSettings;
  } catch (error) {
    console.error('Unexpected error prefetching system settings:', error);
    return undefined;
  }
};

export function useSystemSettings() {
  return useQuery({
    queryKey: ['system_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');
      
      if (error) {
        console.error('Error fetching system settings:', error);
        throw error;
      }
      
      return data as SystemSettings[];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}
