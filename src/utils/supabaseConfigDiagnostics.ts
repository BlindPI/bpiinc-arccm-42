// Supabase Configuration Diagnostics
// Run this to diagnose authentication configuration issues

export interface SupabaseConfigDiagnostic {
  timestamp: string;
  urlSource: 'environment' | 'hardcoded';
  keySource: 'environment' | 'hardcoded';
  urlValue: string;
  keyPrefix: string;
  keyProject: string | null;
  urlProject: string | null;
  configurationMatch: boolean;
  recommendations: string[];
}

export function diagnoseSupabaseConfig(): SupabaseConfigDiagnostic {
  console.log('🔧 SUPABASE DIAGNOSTICS: Starting configuration analysis...');
  
  // Get current configuration
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const hardcodedUrl = 'https://seaxchrsbldrppupupbw.supabase.co';
  const hardcodedKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBia2hlcXNsY3Brc3R4bG5vc3VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMzMzI4NjQsImV4cCI6MjA0ODkwODg2NH0.PinSilVSD_GSK_VBpd_gLvqcufnNgGLXpeCq_xLZNAw';
  
  // Determine what's being used
  const actualUrl = envUrl || hardcodedUrl;
  const actualKey = envKey || hardcodedKey;
  
  // Extract project IDs
  const urlProject = actualUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || null;
  
  // Decode JWT to get project from key
  let keyProject: string | null = null;
  try {
    const payload = JSON.parse(atob(actualKey.split('.')[1]));
    keyProject = payload.ref || null;
  } catch (error) {
    console.error('🔧 SUPABASE DIAGNOSTICS: Failed to decode JWT:', error);
  }
  
  const configurationMatch = urlProject === keyProject;
  
  const recommendations: string[] = [];
  
  if (!envUrl) {
    recommendations.push('Set VITE_SUPABASE_URL in .env file');
  }
  
  if (!envKey) {
    recommendations.push('Set VITE_SUPABASE_ANON_KEY in .env file');
  }
  
  if (!configurationMatch) {
    recommendations.push(`URL project (${urlProject}) does not match key project (${keyProject})`);
    recommendations.push('Get matching URL and key from Supabase dashboard');
  }
  
  if (actualKey === hardcodedKey) {
    recommendations.push('Using hardcoded API key - update with your project key');
  }
  
  const diagnostic: SupabaseConfigDiagnostic = {
    timestamp: new Date().toISOString(),
    urlSource: envUrl ? 'environment' : 'hardcoded',
    keySource: envKey ? 'environment' : 'hardcoded',
    urlValue: actualUrl,
    keyPrefix: actualKey.substring(0, 20) + '...',
    keyProject,
    urlProject,
    configurationMatch,
    recommendations
  };
  
  console.log('🔧 SUPABASE DIAGNOSTICS: Analysis complete');
  console.log('🔧 URL Project:', urlProject);
  console.log('🔧 Key Project:', keyProject);
  console.log('🔧 Configuration Match:', configurationMatch);
  console.log('🔧 Recommendations:', recommendations);
  
  return diagnostic;
}

// Quick fix function
export function getCorrectSupabaseConfig() {
  const diagnostic = diagnoseSupabaseConfig();
  
  console.log('🔧 SUPABASE FIX: Configuration recommendations:');
  
  if (!diagnostic.configurationMatch) {
    console.log('❌ CRITICAL: URL and API key are from different projects!');
    console.log('🔧 Current URL project:', diagnostic.urlProject);
    console.log('🔧 Current key project:', diagnostic.keyProject);
    console.log('');
    console.log('🎯 SOLUTION: Update your .env file with matching credentials:');
    console.log('');
    console.log('# Option 1: Use the URL project credentials');
    console.log(`VITE_SUPABASE_URL=https://${diagnostic.urlProject}.supabase.co`);
    console.log('VITE_SUPABASE_ANON_KEY=<get-anon-key-for-this-project>');
    console.log('');
    console.log('# Option 2: Use the key project credentials');
    console.log(`VITE_SUPABASE_URL=https://${diagnostic.keyProject}.supabase.co`);
    console.log(`VITE_SUPABASE_ANON_KEY=${diagnostic.keyPrefix}...`);
    console.log('');
    console.log('🔗 Get correct values from: https://supabase.com/dashboard');
  } else {
    console.log('✅ Configuration appears to match');
  }
  
  return diagnostic;
}

// Browser console helper
if (typeof window !== 'undefined') {
  (window as any).diagnoseSupabase = diagnoseSupabaseConfig;
  (window as any).fixSupabaseConfig = getCorrectSupabaseConfig;
  console.log('🔧 SUPABASE DIAGNOSTICS: Run window.diagnoseSupabase() or window.fixSupabaseConfig() in console');
}