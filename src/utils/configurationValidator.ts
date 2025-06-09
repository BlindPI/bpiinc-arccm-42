
export interface ConfigValidation {
  isValid: boolean;
  errors: string[];
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

export function logConfigurationStatus() {
  const validation = validateSupabaseConfiguration();
  if (!validation.isValid) {
    console.error('Configuration errors:', validation.errors);
  } else {
    console.log('Supabase configuration is valid');
  }
}
