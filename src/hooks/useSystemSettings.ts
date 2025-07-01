
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SystemSettingData {
  id: string;
  category: string;
  key: string;
  value: any;
  description?: string;
  is_public: boolean;
}

export function useSystemSettings() {
  console.log("🔍 DEBUG: useSystemSettings hook called",
    "Timestamp:", new Date().toISOString());
    
  return useQuery({
    queryKey: ['systemSettings'],
    queryFn: async () => {
      try {
        console.log('🔍 DEBUG: useSystemSettings: Fetching system configurations...');
        const startTime = performance.now();
        
        const { data, error } = await supabase
          .from('system_configurations')
          .select('id, category, key, value, description, is_public');

        const duration = performance.now() - startTime;

        if (error) {
          console.error('🔍 DEBUG: useSystemSettings: Error fetching configurations:',
            error.message, error.code);
          throw error;
        }
        
        console.log('🔍 DEBUG: useSystemSettings: Successfully fetched configurations:',
          "Count:", data?.length || 0,
          "Duration:", Math.round(duration) + "ms");
          
        // Transform the data to match expected interface
        return data?.map(config => ({
          id: config.id,
          category: config.category,
          key: config.key,
          value: config.value,
          description: config.description,
          is_public: config.is_public
        })) || [];
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
      .from('system_configurations')
      .select('id, category, key, value, description, is_public');

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error prefetching system settings:', error);
    return [];
  }
}
