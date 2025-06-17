// Simple debug script for provider certificate visibility
// Run this in browser console: window.debugProviderCertificates()

window.debugProviderCertificates = async function() {
  console.log('🔍 Starting Provider Certificate Debug...');
  
  try {
    // Import supabase client
    const { supabase } = await import('/src/integrations/supabase/client.js');
    
    // 1. Find Kevin Geem in authorized_providers
    console.log('1. Looking for Kevin Geem in authorized_providers...');
    const { data: providers, error: providerError } = await supabase
      .from('authorized_providers')
      .select(`
        *,
        profiles!authorized_providers_user_id_fkey(
          id,
          display_name,
          email,
          role
        ),
        locations!authorized_providers_primary_location_id_fkey(
          id,
          name,
          city,
          state
        )
      `);
    
    if (providerError) {
      console.error('❌ Error fetching providers:', providerError);
      return;
    }
    
    console.log('📋 All providers found:', providers);
    
    const kevinProvider = providers.find(p => 
      p.name?.toLowerCase().includes('kevin') || 
      p.profiles?.display_name?.toLowerCase().includes('kevin')
    );
    
    if (!kevinProvider) {
      console.log('❌ Kevin Geem not found as authorized provider');
      
      // Check if he exists in profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .ilike('display_name', '%kevin%');
      
      console.log('👤 Kevin in profiles:', profiles);
      return;
    }
    
    console.log('✅ Found Kevin as provider:', kevinProvider);
    
    // 2. Check his team assignments
    console.log('2. Checking team assignments...');
    const { data: assignments, error: assignError } = await supabase
      .from('provider_team_assignments')
      .select(`
        *,
        teams!provider_team_assignments_team_id_fkey(
          id,
          name,
          location_id,
          status,
          locations!teams_location_id_fkey(name, city, state)
        )
      `)
      .eq('provider_id', kevinProvider.id);
    
    if (assignError) {
      console.error('❌ Error fetching assignments:', assignError);
    } else {
      console.log('📋 Team assignments:', assignments);
    }
    
    // 3. Check for Barrie First Aid and CPR team
    console.log('3. Looking for Barrie First Aid and CPR team...');
    const { data: barrieTeam, error: teamError } = await supabase
      .from('teams')
      .select(`
        *,
        locations!teams_location_id_fkey(name, city, state)
      `)
      .ilike('name', '%barrie%');
    
    if (teamError) {
      console.error('❌ Error fetching Barrie team:', teamError);
    } else {
      console.log('🏢 Barrie teams found:', barrieTeam);
    }
    
    // 4. Check certificates for Barrie location/team
    if (barrieTeam && barrieTeam.length > 0) {
      console.log('4. Checking certificates for Barrie team...');
      
      const barrieTeamIds = barrieTeam.map(t => t.id);
      const barrieLocationIds = barrieTeam.map(t => t.location_id).filter(Boolean);
      
      // Check certificates by team
      const { data: certsByTeam, error: teamCertError } = await supabase
        .from('certificates')
        .select(`
          *,
          profiles!certificates_user_id_fkey(display_name, email),
          teams!certificates_team_id_fkey(name),
          locations!certificates_location_id_fkey(name, city, state)
        `)
        .in('team_id', barrieTeamIds);
      
      if (teamCertError) {
        console.error('❌ Error fetching certificates by team:', teamCertError);
      } else {
        console.log('📜 Certificates by team:', certsByTeam);
      }
      
      // Check certificates by location
      if (barrieLocationIds.length > 0) {
        const { data: certsByLocation, error: locationCertError } = await supabase
          .from('certificates')
          .select(`
            *,
            profiles!certificates_user_id_fkey(display_name, email),
            teams!certificates_team_id_fkey(name),
            locations!certificates_location_id_fkey(name, city, state)
          `)
          .in('location_id', barrieLocationIds);
        
        if (locationCertError) {
          console.error('❌ Error fetching certificates by location:', locationCertError);
        } else {
          console.log('📍 Certificates by location:', certsByLocation);
        }
      }
    }
    
    // 5. Check what the provider service is actually querying
    console.log('5. Testing provider service queries...');
    
    if (kevinProvider) {
      try {
        // Test the actual provider location KPIs function
        const { data: kpis, error: kpiError } = await supabase.rpc('get_provider_location_kpis', {
          p_provider_id: kevinProvider.id
        });
        
        if (kpiError) {
          console.error('❌ Error from get_provider_location_kpis:', kpiError);
        } else {
          console.log('📊 Provider KPIs result:', kpis);
        }
      } catch (err) {
        console.error('❌ Exception calling provider KPIs:', err);
      }
    }
    
    console.log('✅ Debug completed!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
};

console.log('🚀 Provider debug function loaded. Run: window.debugProviderCertificates()');