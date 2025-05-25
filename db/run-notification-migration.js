/**
 * Notification System Migration Runner
 * 
 * This script runs the SQL migration for the notification system upgrade.
 * It connects to Supabase using environment variables and executes the migration.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if environment variables are set
if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set.');
  console.error('Please set these variables and try again:');
  console.error('  export SUPABASE_URL=your-supabase-url');
  console.error('  export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Path to migration file
const migrationFilePath = path.join(__dirname, '..', 'supabase', 'migrations', '20250525_notification_system_upgrade.sql');

// Main function
async function runMigration() {
  console.log('Starting notification system migration...');
  
  try {
    // Read migration file
    const migrationSQL = fs.readFileSync(migrationFilePath, 'utf8');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute.`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('pgmigrate', { query: statement + ';' });
        
        if (error) {
          console.error(`Error executing statement ${i + 1}:`, error);
          console.error('Statement:', statement);
          
          // Ask if we should continue
          const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
          });
          
          const answer = await new Promise(resolve => {
            readline.question('Continue with migration? (y/n): ', resolve);
          });
          
          readline.close();
          
          if (answer.toLowerCase() !== 'y') {
            console.error('Migration aborted.');
            process.exit(1);
          }
        }
      } catch (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
        console.error('Statement:', statement);
        
        // Ask if we should continue
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        const answer = await new Promise(resolve => {
          readline.question('Continue with migration? (y/n): ', resolve);
        });
        
        readline.close();
        
        if (answer.toLowerCase() !== 'y') {
          console.error('Migration aborted.');
          process.exit(1);
        }
      }
    }
    
    console.log('Migration completed successfully!');
    
    // Verify the migration
    console.log('Verifying migration...');
    
    // Check if notification_types table exists and has data
    const { data: notificationTypes, error: typesError } = await supabase
      .from('notification_types')
      .select('count(*)', { count: 'exact', head: true });
    
    if (typesError) {
      console.error('Error verifying notification_types table:', typesError);
    } else {
      console.log(`notification_types table exists with ${notificationTypes.count} records.`);
    }
    
    // Check if notification_badges table exists
    const { data: badges, error: badgesError } = await supabase
      .from('notification_badges')
      .select('count(*)', { count: 'exact', head: true });
    
    if (badgesError) {
      console.error('Error verifying notification_badges table:', badgesError);
    } else {
      console.log(`notification_badges table exists.`);
    }
    
    // Check if notification_digests table exists
    const { data: digests, error: digestsError } = await supabase
      .from('notification_digests')
      .select('count(*)', { count: 'exact', head: true });
    
    if (digestsError) {
      console.error('Error verifying notification_digests table:', digestsError);
    } else {
      console.log(`notification_digests table exists with ${digests.count} records.`);
    }
    
    console.log('Migration verification completed.');
    console.log('');
    console.log('Next steps:');
    console.log('1. Deploy the updated notification components');
    console.log('2. Deploy the updated edge functions');
    console.log('3. Test the notification system');
    
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});