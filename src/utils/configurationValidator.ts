
export interface ConfigurationValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Export alias for backward compatibility
export type ConfigurationValidationResult = ConfigurationValidation;

export const validateSupabaseConfiguration = (): ConfigurationValidation => {
  const errors: string[] = [];
  const warnings: string[] = [];

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    errors.push('VITE_SUPABASE_URL is not configured');
  }

  if (!supabaseKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is not configured');
  }

  if (supabaseUrl && !supabaseUrl.includes('.supabase.co')) {
    warnings.push('Supabase URL format appears invalid');
  }

  if (supabaseKey && !supabaseKey.startsWith('eyJ')) {
    warnings.push('Supabase API key format appears invalid');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export const logConfigurationStatus = () => {
  const validation = validateSupabaseConfiguration();
  
  if (validation.isValid) {
    console.log('✅ Supabase configuration validated successfully');
  } else {
    console.error('❌ Supabase configuration errors:', validation.errors);
  }
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️ Supabase configuration warnings:', validation.warnings);
  }
};
