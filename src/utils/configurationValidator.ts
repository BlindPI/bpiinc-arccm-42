
export interface ConfigurationValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export const validateSupabaseConfiguration = (): ConfigurationValidation => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if Supabase URL is configured
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl === 'your-project-url' || supabaseUrl === 'https://your-project-id.supabase.co') {
    errors.push('Supabase URL is not configured properly');
  }

  // Check if Supabase anon key is configured
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseKey || supabaseKey === 'your-anon-key' || supabaseKey === 'your-anon-key-here') {
    errors.push('Supabase anon key is not configured properly');
  }

  // Check if we're in development mode with proper configuration
  if (import.meta.env.DEV && errors.length === 0) {
    warnings.push('Running in development mode with live Supabase configuration');
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
    console.log('✅ Supabase configuration is valid');
    if (validation.warnings.length > 0) {
      validation.warnings.forEach(warning => console.warn('⚠️', warning));
    }
  } else {
    console.error('❌ Supabase configuration errors:');
    validation.errors.forEach(error => console.error('  -', error));
  }
};
