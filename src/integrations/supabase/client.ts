
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Get configuration from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate that environment variables are set
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error('❌ CRITICAL: Missing Supabase environment variables');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
  console.error('Check .env.example for the correct format');
  throw new Error('Missing required Supabase configuration');
}

// Validate URL format
if (!SUPABASE_URL.includes('.supabase.co')) {
  console.error('❌ CRITICAL: Invalid Supabase URL format');
  console.error('Expected format: https://your-project-id.supabase.co');
  throw new Error('Invalid Supabase URL configuration');
}

// Validate API key format (basic JWT structure check)
if (!SUPABASE_PUBLISHABLE_KEY.startsWith('eyJ')) {
  console.error('❌ CRITICAL: Invalid Supabase API key format');
  console.error('API key should start with "eyJ" (JWT format)');
  throw new Error('Invalid Supabase API key configuration');
}

console.log('✅ Supabase configuration validated successfully');
console.log(`🔗 Project URL: ${SUPABASE_URL}`);
console.log(`🔑 API Key: ${SUPABASE_PUBLISHABLE_KEY.substring(0, 20)}...`);

// Create Supabase client with proper auth configuration
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Export the URL and key for use in RPC calls
export const SUPABASE_PUBLIC_URL = SUPABASE_URL;
export const SUPABASE_PUBLIC_KEY = SUPABASE_PUBLISHABLE_KEY;
