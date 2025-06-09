
export interface ConfigValidation {
  isValid: boolean;
  errors: string[];
}

export interface ConfigurationValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
  details?: Record<string, any>;
}

export function validateSupabaseConfiguration(): ConfigValidation {
  const errors: string[] = [];
  
  if (!import.meta.env.VITE_SUPABASE_URL) {
    errors.push('Missing VITE_SUPABASE_URL');
  }
  
  if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
    errors.push('Missing VITE_SUPABASE_ANON_KEY');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateProductionReadiness(): ConfigurationValidationResult {
  const validation = validateSupabaseConfiguration();
  const warnings: string[] = [];
  
  if (import.meta.env.DEV) {
    warnings.push('Running in development mode');
  }
  
  return {
    isValid: validation.isValid,
    errors: validation.errors,
    warnings,
    details: {
      environment: import.meta.env.MODE,
      supabaseConfigured: validation.isValid
    }
  };
}

export function logConfigurationStatus() {
  const validation = validateSupabaseConfiguration();
  if (!validation.isValid) {
    console.error('Configuration errors:', validation.errors);
  } else {
    console.log('Supabase configuration is valid');
  }
}
