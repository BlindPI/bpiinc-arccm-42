
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext"; // Import useAuth to access user
import { toast } from "sonner";

export interface SupabaseSystemSettings {
  key: string;
  value: any;
  description?: string;
}

export function useSystemSettings() {
  const { user } = useAuth(); // Get the authenticated user
  return useQuery({
    queryKey: ['systemSettings'],
    queryFn: async () => {
      if (!user) {
          console.warn('useSystemSettings: No user authenticated');
          return null;
      }
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
        return data as SupabaseSystemSettings[]; // Use the defined interface
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
