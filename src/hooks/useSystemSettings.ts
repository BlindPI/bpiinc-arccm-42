
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Separate fetch function that can be used independently
async function fetchSystemSettings() {
  console.log('Fetching system settings...');
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('key', 'test_data_enabled');

    if (error) {
      console.error('Error fetching system settings:', error);
      throw error;
    }

    console.log('System settings fetch result:', data);
    return data?.[0] ?? null;
  } catch (error) {
    console.error('Failed to fetch system settings:', error);
    toast.error('Error loading system settings');
    throw error;
  }
}

// Direct fetch function that doesn't use React Query
export async function prefetchSystemSettings() {
  return await fetchSystemSettings();
}

// Hook for components that need reactive system settings
export function useSystemSettings() {
  return useQuery({
    queryKey: ['system_settings', 'test_data_enabled'],
    queryFn: fetchSystemSettings,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 30000), // Exponential backoff
  });
}
