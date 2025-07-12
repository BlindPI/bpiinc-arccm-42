import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ProviderSettings = Database['public']['Tables']['provider_settings']['Row'];
type ProviderSettingsInsert = Database['public']['Tables']['provider_settings']['Insert'];
type ProviderSettingsUpdate = Database['public']['Tables']['provider_settings']['Update'];

export class ProviderSettingsService {
  static async getProviderSettings(userId: string): Promise<ProviderSettings | null> {
    const { data, error } = await supabase
      .from('provider_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching provider settings:', error);
      throw error;
    }

    return data;
  }

  static async createProviderSettings(settings: ProviderSettingsInsert): Promise<ProviderSettings> {
    const { data, error } = await supabase
      .from('provider_settings')
      .insert(settings)
      .select()
      .single();

    if (error) {
      console.error('Error creating provider settings:', error);
      throw error;
    }

    return data;
  }

  static async updateProviderSettings(
    userId: string, 
    updates: ProviderSettingsUpdate
  ): Promise<ProviderSettings> {
    const { data, error } = await supabase
      .from('provider_settings')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating provider settings:', error);
      throw error;
    }

    return data;
  }

  static async getOrCreateProviderSettings(userId: string, providerId?: string): Promise<ProviderSettings> {
    let settings = await this.getProviderSettings(userId);
    
    if (!settings) {
      // Create default settings
      settings = await this.createProviderSettings({
        user_id: userId,
        provider_id: providerId || null,
      });
    }

    return settings;
  }

  static async updateBrandingSettings(userId: string, branding: {
    display_name?: string;
    branding_logo_url?: string;
    branding_primary_color?: string;
    branding_secondary_color?: string;
  }): Promise<ProviderSettings> {
    return this.updateProviderSettings(userId, branding);
  }

  static async updateSystemPreferences(userId: string, preferences: {
    dashboard_layout?: any;
    notification_preferences?: any;
    theme_preferences?: any;
    language_preference?: string;
    timezone?: string;
    export_format?: string;
  }): Promise<ProviderSettings> {
    return this.updateProviderSettings(userId, preferences);
  }

  static async updateTeamLocationPreferences(userId: string, preferences: {
    default_assignment_role?: string;
    auto_assignment_enabled?: boolean;
    team_naming_convention?: string;
    location_specific_settings?: any;
    delegation_permissions?: any;
  }): Promise<ProviderSettings> {
    return this.updateProviderSettings(userId, preferences);
  }

  static async updatePerformanceSettings(userId: string, settings: {
    performance_targets?: any;
    reporting_schedule?: string;
    compliance_reminder_days?: number;
    auto_reporting_enabled?: boolean;
  }): Promise<ProviderSettings> {
    return this.updateProviderSettings(userId, settings);
  }

  static async updateSecuritySettings(userId: string, settings: {
    session_timeout_minutes?: number;
    two_factor_enabled?: boolean;
    api_access_enabled?: boolean;
    audit_trail_retention_days?: number;
  }): Promise<ProviderSettings> {
    return this.updateProviderSettings(userId, settings);
  }

  static async updateIntegrationSettings(userId: string, settings: {
    external_integrations?: any;
    workflow_triggers?: any;
    email_templates?: any;
    bulk_operation_limit?: number;
  }): Promise<ProviderSettings> {
    return this.updateProviderSettings(userId, settings);
  }
}