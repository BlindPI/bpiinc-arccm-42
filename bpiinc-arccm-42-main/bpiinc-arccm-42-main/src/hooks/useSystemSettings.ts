
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SystemSetting } from "@/types/supabase-schema";
import { toast } from "sonner";

export interface SupabaseSystemSettings {
  key: string;
  value: any;
  description?: string;
}

export function useSystemSettings() {
  console.log("🔍 DEBUG: useSystemSettings hook called",
    "Timestamp:", new Date().toISOString());
    
  return useQuery({
    queryKey: ['systemSettings'],
    queryFn: async () => {
      try {
        console.log('🔍 DEBUG: useSystemSettings: Fetching system settings...');
        const startTime = performance.now();
        
        const { data, error } = await supabase
          .from('system_settings')
          .select('*');

        const duration = performance.now() - startTime;

        if (error) {
          console.error('🔍 DEBUG: useSystemSettings: Error fetching settings:',
            error.message, error.code);
          throw error;
        }
        
        console.log('🔍 DEBUG: useSystemSettings: Successfully fetched settings:',
          "Count:", data?.length || 0,
          "Duration:", Math.round(duration) + "ms");
          
        // Transform the array of settings into a more usable format
        return data as SystemSetting[];
      } catch (error) {
        console.error('🔍 DEBUG: useSystemSettings: Unexpected error:', error);
        toast.error('Failed to load system settings');
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 1,
  });
}

export async function prefetchSystemSettings() {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*');

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error prefetching system settings:', error);
    return [];
  }
}
