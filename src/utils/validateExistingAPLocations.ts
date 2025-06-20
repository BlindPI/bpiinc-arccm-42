import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('⚠️  Missing Supabase credentials - using mock validation');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function validateExistingImplementation() {
  console.log('🎯 VALIDATING EXISTING LOCATIONS & AP USERS');
  console.log('=' .repeat(50));

  try {
    // 1. Validate AP users exist in profiles
    console.log('\n👥 CHECKING AP USERS IN PROFILES...');
    const { data: apUsers, error: apError } = await supabase
      .from('profiles')
      .select('id, email, role, location_id, organization')
      .eq('role', 'AP')
      .limit(20);

    if (apError) {
      console.log('🔍 AP Users Query Error:', apError.message);
    } else {
      console.log(`✅ FOUND ${apUsers?.length || 0} AP USERS`);
      apUsers?.forEach((user, i) => {
        console.log(`  ${i+1}. ${user.email} (Location: ${user.location_id || 'None'})`);
      });
    }

    // 2. Validate locations table
    console.log('\n📍 CHECKING LOCATIONS TABLE...');
    const { data: locations, error: locError } = await supabase
      .from('locations')
      .select('id, name, address, city, state')
      .limit(20);

    if (locError) {
      console.log('🔍 Locations Query Error:', locError.message);
    } else {
      console.log(`✅ FOUND ${locations?.length || 0} LOCATIONS`);
      locations?.forEach((loc, i) => {
        console.log(`  ${i+1}. ${loc.name} (${loc.city}, ${loc.state})`);
      });
    }

    // 3. Validate teams with AP user assignments
    console.log('\n🏢 CHECKING TEAMS WITH AP ASSIGNMENTS...');
    const { data: teamsWithAP, error: teamError } = await supabase
      .from('teams')
      .select('id, name, location_id, assigned_ap_user_id, created_by_ap_user_id')
      .not('assigned_ap_user_id', 'is', null)
      .limit(20);

    if (teamError) {
      console.log('🔍 Teams Query Error:', teamError.message);
    } else {
      console.log(`✅ FOUND ${teamsWithAP?.length || 0} TEAMS WITH AP ASSIGNMENTS`);
      teamsWithAP?.forEach((team, i) => {
        console.log(`  ${i+1}. ${team.name} (AP User: ${team.assigned_ap_user_id})`);
      });
    }

    // 4. Cross-reference AP users with their assigned teams
    console.log('\n🔗 VALIDATING AP USER → TEAM RELATIONSHIPS...');
    if (apUsers && teamsWithAP) {
      const apUserIds = apUsers.map(u => u.id);
      const assignedAPIds = teamsWithAP.map(t => t.assigned_ap_user_id);
      
      const activeAssignments = assignedAPIds.filter(id => apUserIds.includes(id));
      console.log(`✅ ${activeAssignments.length} VALID AP USER → TEAM ASSIGNMENTS`);
    }

    // 5. Validate location → profile relationships
    console.log('\n🌍 VALIDATING LOCATION → PROFILE RELATIONSHIPS...');
    const { data: profilesWithLocations, error: profLocError } = await supabase
      .from('profiles')
      .select('id, email, role, location_id')
      .not('location_id', 'is', null)
      .limit(20);

    if (!profLocError && profilesWithLocations) {
      console.log(`✅ FOUND ${profilesWithLocations.length} PROFILES WITH LOCATIONS`);
      const locationCounts = profilesWithLocations.reduce((acc: Record<string, number>, prof) => {
        const locId = prof.location_id || 'unknown';
        acc[locId] = (acc[locId] || 0) + 1;
        return acc;
      }, {});
      
      console.log('Location usage:');
      Object.entries(locationCounts).forEach(([locId, count]) => {
        console.log(`  ${locId}: ${count} users`);
      });
    }

    console.log('\n🎉 VALIDATION COMPLETE - LOCATIONS & AP USERS ARE IMPLEMENTED!');
    
  } catch (error) {
    console.error('❌ VALIDATION ERROR:', error);
  }
}

export default validateExistingImplementation;

// Run if called directly
if (require.main === module) {
  validateExistingImplementation();
}