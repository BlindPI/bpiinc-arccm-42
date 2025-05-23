/**
 * Database Migration Script
 * 
 * This script runs the SQL migration to add organization and job_title fields to the profiles table.
 * It uses the Supabase JavaScript client to execute the SQL migration.
 * 
 * Usage:
 * 1. Make sure you have the Supabase JavaScript client installed:
 *    npm install @supabase/supabase-js
 * 
 * 2. Set your Supabase URL and service role key as environment variables:
 *    export SUPABASE_URL=your-supabase-url
 *    export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
 * 
 * 3. Run the script:
 *    node run-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set.');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Path to the migration SQL file
const migrationFilePath = path.join(__dirname, 'migrations', '20250523_add_profile_fields.sql');

async function runMigration() {
  try {
    // Read the migration SQL file
    const migrationSql = fs.readFileSync(migrationFilePath, 'utf8');
    
    console.log('Running migration: 20250523_add_profile_fields.sql');
    
    // Execute the SQL migration
    const { error } = await supabase.rpc('pgmigrate', { query: migrationSql });
    
    if (error) {
      throw error;
    }
    
    console.log('Migration completed successfully!');
    
    // Verify the migration by checking if the columns exist
    const { data, error: verifyError } = await supabase
      .from('profiles')
      .select('organization, job_title')
      .limit(1);
    
    if (verifyError) {
      console.warn('Warning: Could not verify migration:', verifyError.message);
    } else {
      console.log('Verification successful: New columns exist in the profiles table.');
    }
    
  } catch (error) {
    console.error('Error running migration:', error.message);
    process.exit(1);
  }
}

// Run the migration
runMigration();