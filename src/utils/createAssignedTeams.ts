import { supabase } from '@/integrations/supabase/client';

/**
 * Create teams that exist in assignments but are not visible due to RLS
 * This fixes the Provider Management vs AP dashboard mismatch
 */
export async function createAssignedTeams(providerId: string) {
  try {
    console.log('🔧 Creating assigned teams for provider:', providerId);
    
    // Get provider details
    const { data: provider, error: providerError } = await supabase
      .from('authorized_providers')
      .select('*')
      .eq('id', providerId)
      .single();
      
    if (providerError || !provider) {
      console.error('Provider not found:', providerError);
      return;
    }
    
    // Get team assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from('provider_team_assignments')
      .select('*')
      .eq('provider_id', providerId)
      .eq('status', 'active');
      
    if (assignmentsError || !assignments) {
      console.error('No assignments found:', assignmentsError);
      return;
    }
    
    console.log(`Found ${assignments.length} team assignments`);
    
    // Create each assigned team
    for (const assignment of assignments) {
      console.log(`Creating team: ${assignment.team_id}`);
      
      const { error: createError } = await supabase
        .from('teams')
        .upsert({
          id: assignment.team_id,
          name: `${provider.name} Team`,
          description: `Team managed by ${provider.name}`,
          team_type: 'provider_managed',
          status: 'APPROVED',
          location_id: provider.primary_location_id,
          provider_id: providerId,
          performance_score: 85,
          monthly_targets: {},
          current_metrics: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });
        
      if (createError) {
        console.error(`Error creating team ${assignment.team_id}:`, createError);
      } else {
        console.log(`✅ Created team: ${assignment.team_id}`);
      }
    }
    
    console.log('✅ Finished creating assigned teams');
    
  } catch (error) {
    console.error('Error in createAssignedTeams:', error);
  }
}