
import { supabase } from '@/integrations/supabase/client';

export interface SystemConfiguration {
  id: string;
  category: string;
  key: string;
  value: any;
  dataType: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  isPublic: boolean;
  requiresRestart: boolean;
  validationRules?: ValidationRule[];
}

export interface ValidationRule {
  type: string;
  value: any;
  message: string;
}

export interface ConfigurationExport {
  version: string;
  timestamp: Date;
  configurations: SystemConfiguration[];
  metadata: {
    exportedBy: string;
    environment: string;
  };
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: Array<{ configuration: string; error: string }>;
}

export interface ImportOptions {
  overwriteExisting?: boolean;
  validateOnly?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export class ConfigurationManager {
  static async getConfiguration(category: string, key: string): Promise<any> {
    const { data, error } = await supabase
      .from('system_configurations')
      .select('value')
      .eq('category', category)
      .eq('key', key)
      .single();

    if (error) throw error;
    return data.value;
  }

  static async getAllConfigurations(): Promise<SystemConfiguration[]> {
    const { data, error } = await supabase
      .from('system_configurations')
      .select('*')
      .order('category, key');

    if (error) throw error;
    
    return data.map(config => ({
      id: config.id,
      category: config.category,
      key: config.key,
      value: config.value,
      dataType: config.data_type as any,
      description: config.description || undefined,
      isPublic: config.is_public,
      requiresRestart: config.requires_restart,
      validationRules: config.validation_rules ? 
        (Array.isArray(config.validation_rules) ? config.validation_rules as ValidationRule[] : []) : 
        undefined
    }));
  }

  static async updateConfiguration(
    category: string,
    key: string,
    value: any,
    changedBy: string,
    reason?: string
  ): Promise<void> {
    // Get current value for audit
    const { data: current } = await supabase
      .from('system_configurations')
      .select('value, id')
      .eq('category', category)
      .eq('key', key)
      .single();

    if (!current) throw new Error('Configuration not found');

    // Validate new value
    await this.validateConfiguration(category, key, value);

    // Update configuration
    const { error } = await supabase
      .from('system_configurations')
      .update({ 
        value, 
        updated_at: new Date().toISOString() 
      })
      .eq('category', category)
      .eq('key', key);

    if (error) throw error;

    // Log change in audit table
    await this.auditConfigurationChange(
      current.id, 
      current.value, 
      value, 
      changedBy, 
      reason
    );
  }

  static async validateConfiguration(
    category: string, 
    key: string, 
    value: any
  ): Promise<ValidationResult> {
    const { data: config } = await supabase
      .from('system_configurations')
      .select('data_type, validation_rules')
      .eq('category', category)
      .eq('key', key)
      .single();

    if (!config) throw new Error('Configuration not found');

    // Use the database validation function
    const { data: isValid, error } = await supabase.rpc('validate_configuration_value', {
      p_data_type: config.data_type,
      p_value: value,
      p_validation_rules: config.validation_rules
    });

    if (error) throw error;

    return { valid: isValid };
  }

  static async exportConfiguration(): Promise<ConfigurationExport> {
    const { data: configurations, error } = await supabase
      .from('system_configurations')
      .select('*')
      .order('category, key');

    if (error) throw error;

    const { data: userData } = await supabase.auth.getUser();

    return {
      version: '1.0',
      timestamp: new Date(),
      configurations: configurations.map(config => ({
        id: config.id,
        category: config.category,
        key: config.key,
        value: config.value,
        dataType: config.data_type as any,
        description: config.description || undefined,
        isPublic: config.is_public,
        requiresRestart: config.requires_restart,
        validationRules: config.validation_rules ? 
          (Array.isArray(config.validation_rules) ? config.validation_rules as ValidationRule[] : []) : 
          undefined
      })),
      metadata: {
        exportedBy: userData.user?.email || 'unknown',
        environment: window.location.hostname
      }
    };
  }

  static async importConfiguration(
    configExport: ConfigurationExport,
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    const results: ImportResult = {
      imported: 0,
      skipped: 0,
      errors: []
    };

    for (const config of configExport.configurations) {
      try {
        const exists = await this.configurationExists(config.category, config.key);
        
        if (options.overwriteExisting || !exists) {
          if (!options.validateOnly) {
            await this.upsertConfiguration(config);
          }
          results.imported++;
        } else {
          results.skipped++;
        }
      } catch (error: any) {
        results.errors.push({
          configuration: `${config.category}.${config.key}`,
          error: error.message
        });
      }
    }

    return results;
  }

  private static async auditConfigurationChange(
    configurationId: string,
    oldValue: any,
    newValue: any,
    changedBy: string,
    reason?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('configuration_audit_log')
      .insert({
        configuration_id: configurationId,
        old_value: oldValue,
        new_value: newValue,
        changed_by: changedBy,
        change_reason: reason
      });

    if (error) throw error;
  }

  private static async configurationExists(category: string, key: string): Promise<boolean> {
    const { data } = await supabase
      .from('system_configurations')
      .select('id')
      .eq('category', category)
      .eq('key', key)
      .single();

    return !!data;
  }

  private static async upsertConfiguration(config: SystemConfiguration): Promise<void> {
    const { error } = await supabase
      .from('system_configurations')
      .upsert({
        category: config.category,
        key: config.key,
        value: config.value,
        data_type: config.dataType,
        description: config.description,
        is_public: config.isPublic,
        requires_restart: config.requiresRestart,
        validation_rules: config.validationRules || null
      }, {
        onConflict: 'category,key'
      });

    if (error) throw error;
  }
}
