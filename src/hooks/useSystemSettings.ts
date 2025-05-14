
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
  return useQuery({
    queryKey: ['systemSettings'],
    queryFn: async () => {
      try {
        console.log('Fetching system settings...');
        const { data, error } = await supabase
          .from('system_settings')
          .select('*');

        if (error) {
          console.error('Error fetching system settings:', error);
          throw error;
        }
        
        console.log('Successfully fetched system settings:', data);
        // Transform the array of settings into a more usable format
        return data as SystemSetting[];
      } catch (error) {
        console.error('Error fetching system settings:', error);
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
