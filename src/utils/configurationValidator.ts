
export interface ConfigurationValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export const validateSupabaseConfiguration = (): ConfigurationValidation => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if Supabase URL is configured
  const supabaseUrl = 'https://seaxchrsbldrppupupbw.supabase.co';
  if (!supabaseUrl || supabaseUrl === 'your-project-url') {
    errors.push('Supabase URL is not configured properly');
  }

  // Check if Supabase anon key is configured
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlYXhjaHJzYmxkcnBwdXB1cGJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMTUyMDMsImV4cCI6MjA1OTc5MTIwM30._3sOX2_EkBFp4mzC0_MjBkAlAHxHWitsMShszmLITOQ';
  if (!supabaseKey || supabaseKey === 'your-anon-key') {
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
