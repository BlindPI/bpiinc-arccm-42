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

// Helper function to safely convert Json to ValidationRule[]
function parseValidationRules(rules: any): ValidationRule[] | undefined {
  if (!rules) return undefined;
  
  try {
    if (Array.isArray(rules)) {
      return rules.filter(rule => 
        rule && typeof rule === 'object' && 
        'type' in rule && 'value' in rule && 'message' in rule
      ) as ValidationRule[];
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export class ConfigurationManager {
  static async getConfiguration(category: string, key: string): Promise<any> {
    console.log('🔍 ConfigurationManager.getConfiguration called:', { category, key });
    
    const { data, error } = await supabase
      .from('system_configurations')
      .select('value')
      .eq('category', category)
      .eq('key', key)
      .single();

    if (error) {
      console.error('🔍 ConfigurationManager.getConfiguration error:', error);
      throw error;
    }
    
    console.log('🔍 ConfigurationManager.getConfiguration result:', data);
    return data.value;
  }

  static async getAllConfigurations(): Promise<SystemConfiguration[]> {
    console.log('🔍 ConfigurationManager.getAllConfigurations called');
    
    const { data, error } = await supabase
      .from('system_configurations')
      .select('*')
      .order('category, key');

    if (error) {
      console.error('🔍 ConfigurationManager.getAllConfigurations error:', error);
      throw error;
    }
    
    console.log('🔍 ConfigurationManager.getAllConfigurations result count:', data?.length);
    console.log('🔍 ConfigurationManager: Available configurations:', data?.map(c => `${c.category}.${c.key}`));
    
    return data.map(config => ({
      id: config.id,
      category: config.category,
      key: config.key,
      value: config.value,
      dataType: config.data_type as any,
      description: config.description || undefined,
      isPublic: config.is_public,
      requiresRestart: config.requires_restart,
      validationRules: parseValidationRules(config.validation_rules)
    }));
  }

  static async updateConfiguration(
    category: string,
    key: string,
    value: any,
    changedBy: string,
    reason?: string
  ): Promise<void> {
    console.log('🔍 ConfigurationManager.updateConfiguration called:', { category, key, value, changedBy, reason });

    // FIXED: Enhanced validation for navigation configurations
    if (category === 'navigation' && key.startsWith('visibility_')) {
      const validationResult = this.validateNavigationConfiguration(value);
      if (!validationResult.valid) {
        throw new Error(`Invalid navigation configuration: ${validationResult.message}`);
      }
    }

    // CRITICAL: Delete any conflicting old configurations first
    if (category === 'navigation' && key.startsWith('visibility_')) {
      console.log('🔍 ConfigurationManager: Cleaning up conflicting configurations');
      
      // Delete the old nested 'visibility' config if it exists
      await supabase
        .from('system_configurations')
        .delete()
        .eq('category', 'navigation')
        .eq('key', 'visibility');
        
      console.log('🔍 ConfigurationManager: Cleaned up old visibility config');
    }

    // Check if configuration exists
    const { data: existing } = await supabase
      .from('system_configurations')
      .select('id, value')
      .eq('category', category)
      .eq('key', key)
      .single();

    if (existing) {
      console.log('🔍 Updating existing configuration');
      
      // Update existing configuration
      const { error } = await supabase
        .from('system_configurations')
        .update({ 
          value, 
          updated_at: new Date().toISOString() 
        })
        .eq('category', category)
        .eq('key', key);

      if (error) {
        console.error('🔍 Error updating configuration:', error);
        throw error;
      }

      // Log change in audit table
      await this.auditConfigurationChange(
        existing.id, 
        existing.value, 
        value, 
        changedBy, 
        reason
      );
    } else {
      console.log('🔍 Creating new configuration');
      
      // Create new configuration
      const { data: newConfig, error } = await supabase
        .from('system_configurations')
        .insert({
          category,
          key,
          value,
          data_type: this.inferDataType(value),
          description: this.generateDescription(category, key),
          is_public: false,
          requires_restart: false,
          created_by: changedBy
        })
        .select()
        .single();

      if (error) {
        console.error('🔍 Error creating configuration:', error);
        throw error;
      }

      // Log creation in audit table
      await this.auditConfigurationChange(
        newConfig.id, 
        null, 
        value, 
        changedBy, 
        reason || 'Created new configuration'
      );
    }

    console.log('🔍 Configuration updated successfully');
  }

  // ENHANCED: Strict navigation configuration validation
  static validateNavigationConfiguration(value: any): ValidationResult {
    if (!value || typeof value !== 'object') {
      return { valid: false, message: 'Configuration must be an object' };
    }

    // Ensure Dashboard exists and is enabled
    if (!value.Dashboard || !value.Dashboard.enabled) {
      return { valid: false, message: 'Dashboard group must be enabled for core navigation' };
    }

    if (!value.Dashboard.items?.Dashboard || !value.Dashboard.items?.Profile) {
      return { valid: false, message: 'Dashboard and Profile items must be enabled' };
    }

    // Validate structure of each group
    for (const [groupName, groupConfig] of Object.entries(value)) {
      if (typeof groupConfig !== 'object' || groupConfig === null) {
        return { valid: false, message: `Group ${groupName} must be an object` };
      }

      const config = groupConfig as any;
      if (typeof config.enabled !== 'boolean') {
        return { valid: false, message: `Group ${groupName} must have a boolean 'enabled' property` };
      }

      if (config.items && typeof config.items !== 'object') {
        return { valid: false, message: `Group ${groupName} items must be an object` };
      }

      // Validate all item values are booleans
      if (config.items) {
        for (const [itemName, itemValue] of Object.entries(config.items)) {
          if (typeof itemValue !== 'boolean') {
            return { valid: false, message: `Item ${itemName} in group ${groupName} must be a boolean` };
          }
        }
      }
    }

    return { valid: true };
  }

  static inferDataType(value: any): string {
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    return 'string';
  }

  static generateDescription(category: string, key: string): string {
    if (category === 'navigation' && key.startsWith('visibility_')) {
      const role = key.replace('visibility_', '').toUpperCase();
      return `Navigation visibility settings for ${role} role`;
    }
    return `Configuration for ${key}`;
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

    if (!config) {
      // For new configurations, validate based on category
      if (category === 'navigation') {
        return this.validateNavigationConfiguration(value);
      }
      return { valid: true };
    }

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
        validationRules: parseValidationRules(config.validation_rules)
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
    try {
      const { error } = await supabase
        .from('configuration_audit_log')
        .insert({
          configuration_id: configurationId,
          old_value: oldValue,
          new_value: newValue,
          changed_by: changedBy,
          change_reason: reason
        });

      if (error) {
        console.error('🔍 Error logging configuration change:', error);
        // Don't throw here as it's just audit logging
      }
    } catch (error) {
      console.error('🔍 Unexpected error in audit logging:', error);
    }
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
    // Convert validation rules to JSON format for database storage
    const validationRulesJson = config.validationRules ? 
      JSON.parse(JSON.stringify(config.validationRules)) : null;

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
        validation_rules: validationRulesJson
      }, {
        onConflict: 'category,key'
      });

    if (error) throw error;
  }

  static async clearNavigationCache(): Promise<void> {
    console.log('🔍 ConfigurationManager.clearNavigationCache called');
    // This method can be used to force cache clearing if needed
    // The actual cache clearing is handled by the React Query invalidation in the hooks
  }
}
