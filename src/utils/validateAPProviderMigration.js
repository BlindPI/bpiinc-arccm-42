// Diagnostic script to validate AP Provider Architecture Migration v2
// Run this to identify specific issues after migration

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function validateMigration() {
  console.log('🔍 VALIDATING AP PROVIDER ARCHITECTURE MIGRATION V2')
  console.log('=' .repeat(60))
  
  const issues = []
  
  try {
    // 1. Check if migration_log table exists
    console.log('\n1. Checking migration_log table...')
    try {
      const { data, error } = await supabase
        .from('migration_log')
        .select('*')
        .limit(1)
      
      if (error && error.code === '42P01') {
        issues.push('❌ migration_log table does not exist - final insert in migration failed')
        console.log('❌ migration_log table missing')
      } else {
        console.log('✅ migration_log table exists')
      }
    } catch (err) {
      issues.push('❌ migration_log table does not exist - final insert in migration failed')
      console.log('❌ migration_log table missing')
    }
    
    // 2. Check teams table has new AP user columns
    console.log('\n2. Checking teams table structure...')
    const { data: teamsData, error: teamsError } = await supabase
      .from('teams')
      .select('assigned_ap_user_id, created_by_ap_user_id')
      .limit(1)
    
    if (teamsError) {
      issues.push(`❌ Teams table missing new AP user columns: ${teamsError.message}`)
      console.log('❌ Teams table structure issue')
    } else {
      console.log('✅ Teams table has new AP user columns')
    }
    
    // 3. Check ap_user_location_assignments simplified structure
    console.log('\n3. Checking ap_user_location_assignments structure...')
    const { data: assignmentsData, error: assignmentsError } = await supabase
      .from('ap_user_location_assignments')
      .select('ap_user_id, location_id, status, assigned_by, notes')
      .limit(1)
    
    if (assignmentsError) {
      issues.push(`❌ ap_user_location_assignments structure issue: ${assignmentsError.message}`)
      console.log('❌ ap_user_location_assignments structure issue')
    } else {
      console.log('✅ ap_user_location_assignments has correct structure')
    }
    
    // 4. Check legacy compatibility view
    console.log('\n4. Checking authorized_providers_legacy view...')
    const { data: legacyData, error: legacyError } = await supabase
      .from('authorized_providers_legacy')
      .select('*')
      .limit(1)
    
    if (legacyError) {
      issues.push(`❌ authorized_providers_legacy view missing: ${legacyError.message}`)
      console.log('❌ Legacy compatibility view missing')
    } else {
      console.log('✅ Legacy compatibility view exists')
    }
    
    // 5. Check data migration integrity
    console.log('\n5. Checking data migration integrity...')
    
    // Count AP users
    const { count: apUserCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'AP')
      .eq('status', 'ACTIVE')
    
    // Count location assignments
    const { count: assignmentCount } = await supabase
      .from('ap_user_location_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
    
    // Count teams with direct AP user assignment
    const { count: directTeamCount } = await supabase
      .from('teams')
      .select('*', { count: 'exact', head: true })
      .not('assigned_ap_user_id', 'is', null)
      .eq('status', 'active')
    
    // Count teams still using old provider_id
    const { count: oldTeamCount } = await supabase
      .from('teams')
      .select('*', { count: 'exact', head: true })
      .not('provider_id', 'is', null)
      .eq('status', 'active')
    
    console.log(`   Active AP Users: ${apUserCount}`)
    console.log(`   Active Location Assignments: ${assignmentCount}`)
    console.log(`   Teams with Direct AP Assignment: ${directTeamCount}`)
    console.log(`   Teams still using old provider_id: ${oldTeamCount}`)
    
    if (oldTeamCount > 0) {
      issues.push(`❌ ${oldTeamCount} teams still using old provider_id - data migration incomplete`)
    }
    
    // 6. Test new functions
    console.log('\n6. Testing new functions...')
    
    try {
      const { data: dashboardData, error: dashboardError } = await supabase
        .rpc('get_ap_user_dashboard_direct', { 
          p_ap_user_id: '00000000-0000-0000-0000-000000000000' // dummy UUID
        })
      
      if (dashboardError && !dashboardError.message.includes('does not exist')) {
        issues.push(`❌ get_ap_user_dashboard_direct function issue: ${dashboardError.message}`)
      } else {
        console.log('✅ Dashboard function accessible')
      }
    } catch (err) {
      issues.push(`❌ Function test failed: ${err.message}`)
    }
    
    // 7. Check for orphaned data
    console.log('\n7. Checking for data consistency issues...')
    
    const { data: orphanedTeams, error: orphanError } = await supabase
      .from('teams')
      .select('id, name, assigned_ap_user_id')
      .not('assigned_ap_user_id', 'is', null)
      .eq('status', 'active')
    
    if (orphanedTeams) {
      let orphanCount = 0
      for (const team of orphanedTeams) {
        const { data: apUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', team.assigned_ap_user_id)
          .eq('role', 'AP')
          .eq('status', 'ACTIVE')
          .single()
        
        if (!apUser) {
          orphanCount++
        }
      }
      
      if (orphanCount > 0) {
        issues.push(`❌ ${orphanCount} teams assigned to inactive/non-existent AP users`)
      }
    }
    
    // Summary
    console.log('\n' + '=' .repeat(60))
    console.log('📊 VALIDATION SUMMARY')
    console.log('=' .repeat(60))
    
    if (issues.length === 0) {
      console.log('✅ Migration validation PASSED - No issues found')
    } else {
      console.log(`❌ Migration validation FAILED - ${issues.length} issues found:`)
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`)
      })
    }
    
    return { success: issues.length === 0, issues }
    
  } catch (error) {
    console.error('❌ Validation failed with error:', error.message)
    return { success: false, issues: [`Fatal error: ${error.message}`] }
  }
}

// Run validation
validateMigration()
  .then(result => {
    console.log('\n🏁 Validation complete')
    if (!result.success) {
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('Validation script failed:', error)
    process.exit(1)
  })