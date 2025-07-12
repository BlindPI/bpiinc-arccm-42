import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { ProviderSettingsService } from "@/services/provider/providerSettingsService";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type ProviderSettings = Database['public']['Tables']['provider_settings']['Row'];
type ProviderSettingsUpdate = Database['public']['Tables']['provider_settings']['Update'];

export function useProviderSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: settings,
    isLoading,
    error
  } = useQuery({
    queryKey: ['provider-settings', user?.id],
    queryFn: () => user?.id ? ProviderSettingsService.getOrCreateProviderSettings(user.id) : null,
    enabled: !!user?.id,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (updates: ProviderSettingsUpdate) => {
      if (!user?.id) throw new Error('User not authenticated');
      return ProviderSettingsService.updateProviderSettings(user.id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-settings', user?.id] });
      toast({
        title: "Settings Updated",
        description: "Your provider settings have been saved successfully.",
      });
    },
    onError: (error) => {
      console.error('Error updating provider settings:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateBrandingMutation = useMutation({
    mutationFn: (branding: Parameters<typeof ProviderSettingsService.updateBrandingSettings>[1]) => {
      if (!user?.id) throw new Error('User not authenticated');
      return ProviderSettingsService.updateBrandingSettings(user.id, branding);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-settings', user?.id] });
      toast({
        title: "Branding Updated",
        description: "Your branding settings have been updated.",
      });
    },
    onError: (error) => {
      console.error('Error updating branding:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update branding settings.",
        variant: "destructive",
      });
    },
  });

  const updateSystemPreferencesMutation = useMutation({
    mutationFn: (preferences: Parameters<typeof ProviderSettingsService.updateSystemPreferences>[1]) => {
      if (!user?.id) throw new Error('User not authenticated');
      return ProviderSettingsService.updateSystemPreferences(user.id, preferences);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-settings', user?.id] });
      toast({
        title: "Preferences Updated",
        description: "Your system preferences have been updated.",
      });
    },
    onError: (error) => {
      console.error('Error updating preferences:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update system preferences.",
        variant: "destructive",
      });
    },
  });

  const updateSecurityMutation = useMutation({
    mutationFn: (securitySettings: Parameters<typeof ProviderSettingsService.updateSecuritySettings>[1]) => {
      if (!user?.id) throw new Error('User not authenticated');
      return ProviderSettingsService.updateSecuritySettings(user.id, securitySettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-settings', user?.id] });
      toast({
        title: "Security Settings Updated",
        description: "Your security settings have been updated.",
      });
    },
    onError: (error) => {
      console.error('Error updating security settings:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update security settings.",
        variant: "destructive",
      });
    },
  });

  return {
    settings,
    isLoading,
    error,
    updateSettings: updateSettingsMutation.mutate,
    updateBranding: updateBrandingMutation.mutate,
    updateSystemPreferences: updateSystemPreferencesMutation.mutate,
    updateSecurity: updateSecurityMutation.mutate,
    isUpdating: updateSettingsMutation.isPending || 
                updateBrandingMutation.isPending || 
                updateSystemPreferencesMutation.isPending ||
                updateSecurityMutation.isPending,
  };
}