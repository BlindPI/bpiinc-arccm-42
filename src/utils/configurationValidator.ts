
// Configuration validation utility for production readiness
export interface ConfigurationValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  projectId: string | null;
  environment: string;
}

export function validateSupabaseConfiguration(): ConfigurationValidationResult {
  const result: ConfigurationValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    projectId: null,
    environment: import.meta.env.NODE_ENV || 'development'
  };

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Check if environment variables exist
  if (!url) {
    result.errors.push('VITE_SUPABASE_URL is not set');
    result.isValid = false;
  }

  if (!key) {
    result.errors.push('VITE_SUPABASE_ANON_KEY is not set');
    result.isValid = false;
  }

  if (!result.isValid) {
    return result;
  }

  // Validate URL format
  const urlMatch = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!urlMatch) {
    result.errors.push('Invalid Supabase URL format. Expected: https://your-project-id.supabase.co');
    result.isValid = false;
  } else {
    result.projectId = urlMatch[1];
  }

  // Validate API key format
  if (!key.startsWith('eyJ')) {
    result.errors.push('Invalid API key format. Should be a JWT token starting with "eyJ"');
    result.isValid = false;
  }

  // Extract project ID from JWT
  try {
    const payload = JSON.parse(atob(key.split('.')[1]));
    const keyProjectId = payload.ref;
    
    if (result.projectId && keyProjectId && result.projectId !== keyProjectId) {
      result.errors.push(`Project ID mismatch: URL project (${result.projectId}) != Key project (${keyProjectId})`);
      result.isValid = false;
    }
  } catch (error) {
    result.warnings.push('Could not validate JWT token structure');
  }

  // Production-specific checks
  if (result.environment === 'production') {
    if (url.includes('localhost')) {
      result.warnings.push('Using localhost URL in production environment');
    }
  }

  return result;
}

export function logConfigurationStatus(): void {
  const validation = validateSupabaseConfiguration();
  
  console.log('🔧 Configuration Validation Results:');
  console.log(`Environment: ${validation.environment}`);
  console.log(`Project ID: ${validation.projectId || 'Unknown'}`);
  console.log(`Valid: ${validation.isValid ? '✅' : '❌'}`);
  
  if (validation.errors.length > 0) {
    console.error('❌ Configuration Errors:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
  }
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️ Configuration Warnings:');
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
  
  if (validation.isValid) {
    console.log('✅ Configuration is valid for production');
  } else {
    console.error('❌ Configuration issues must be resolved before production deployment');
  }
}
