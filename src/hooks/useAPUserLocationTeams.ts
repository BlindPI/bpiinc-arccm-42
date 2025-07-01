import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { providerRelationshipService } from '@/services/provider/providerRelationshipService';

/**
 * CORRECT AP USER LOCATION & TEAM HOOK
 * 
 * ✅ Uses the WORKING Provider Management approach
 * ✅ Replaces broken queries to non-existent "location_assignments" table  
 * ✅ Uses authorized_providers.primary_location_id (proven working)
 * ✅ Uses providerRelationshipService.getProviderTeamAssignments() (proven working)
 * 
 * This is the EXACT same logic that works in Provider Management!
 */

export interface APUserLocationTeamData {
  provider: any;
  assignedLocation: any | null;
  assignedTeams: any[];
  hasAssignments: boolean;
}

export function useAPUserLocationTeams(userId: string | undefined) {
  return useQuery({
    queryKey: ['ap-user-location-teams', userId],
    queryFn: async (): Promise<APUserLocationTeamData> => {
      if (!userId) {
        throw new Error('User ID is required');
      }

      console.log('🔧 Using CORRECT AP user location/team query (Provider Management style)');
      console.log('✅ NOT querying non-existent "location_assignments" table');
      
      // Step 1: Get provider record using the WORKING approach
      const { data: providerRecord, error: providerError } = await supabase
        .from('authorized_providers')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (providerError) {
        console.error('❌ Provider record error:', providerError);
        throw providerError;
      }
      
      if (!providerRecord) {
        console.log('❌ No provider record found for AP user');
        return {
          provider: null,
          assignedLocation: null,
          assignedTeams: [],
          hasAssignments: false
        };
      }
      
      console.log('✅ Found provider record:', {
        id: providerRecord.id,
        name: providerRecord.name,
        primary_location_id: providerRecord.primary_location_id
      });
      
      // Step 2: Get assigned location using the WORKING approach
      let assignedLocation = null;
      if (providerRecord.primary_location_id) {
        const { data: locationData, error: locationError } = await supabase
          .from('locations')
          .select('id, name, address, city, state')
          .eq('id', providerRecord.primary_location_id)
          .single();
          
        if (!locationError && locationData) {
          assignedLocation = locationData;
          console.log('✅ Found assigned location:', locationData.name);
        }
      }
      
      // Step 3: Get team assignments using the WORKING service
      let assignedTeams = [];
      try {
        const teamAssignments = await providerRelationshipService.getProviderTeamAssignments(providerRecord.id);
        
        if (teamAssignments && teamAssignments.length > 0) {
          assignedTeams = teamAssignments;
          console.log('✅ Found team assignments:', teamAssignments.length);
        } else if (providerRecord.primary_location_id) {
          // Fallback: Get teams from primary location (like Provider Management does)
          console.log('🔍 No direct team assignments, checking location-based teams...');
          
          const { data: locationTeams, error: locationTeamsError } = await supabase
            .from('teams')
            .select(`
              id,
              name,
              description,
              status,
              location_id,
              created_at
            `)
            .eq('location_id', providerRecord.primary_location_id)
            .eq('status', 'active')
            .order('created_at', { ascending: false });
          
          if (!locationTeamsError && locationTeams) {
            // Transform to match team assignment format
            assignedTeams = locationTeams.map(team => ({
              team_id: team.id,
              team_name: team.name,
              location_id: team.location_id,
              status: 'active',
              assignment_role: 'location_provider',
              oversight_level: 'primary',
              start_date: team.created_at,
              member_count: 0, // Will be calculated separately if needed
              performance_score: 0 // Will be calculated separately if needed
            }));
            
            console.log('✅ Found location-based teams:', locationTeams.length);
          }
        }
      } catch (error) {
        console.error('❌ Error getting team assignments:', error);
        // Continue without team data rather than failing
      }
      
      console.log('📋 AP User Data Summary:');
      console.log(`   Provider: ${providerRecord.name}`);
      console.log(`   Location: ${assignedLocation?.name || 'None'}`);
      console.log(`   Teams: ${assignedTeams.length}`);
      
      return {
        provider: providerRecord,
        assignedLocation,
        assignedTeams,
        hasAssignments: !!(assignedLocation || assignedTeams.length > 0)
      };
    },
    enabled: !!userId,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Simplified hook for just getting AP user's assigned location IDs
 * This replaces any broken queries to "location_assignments" table
 */
export function useAPUserLocationIds(userId: string | undefined) {
  return useQuery({
    queryKey: ['ap-user-location-ids', userId],
    queryFn: async (): Promise<string[]> => {
      if (!userId) return [];

      console.log('🔧 Getting AP user location IDs (CORRECT approach)');
      
      // Use the WORKING Provider Management approach
      const { data: providerRecord, error } = await supabase
        .from('authorized_providers')
        .select('primary_location_id')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (error || !providerRecord || !providerRecord.primary_location_id) {
        console.log('❌ No location assignments found for AP user');
        return [];
      }
      
      console.log('✅ Found location assignment:', providerRecord.primary_location_id);
      return [providerRecord.primary_location_id];
    },
    enabled: !!userId,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to get teams for AP user's assigned locations
 * This replaces any broken team queries
 */
export function useAPUserTeams(userId: string | undefined) {
  const { data: locationData } = useAPUserLocationTeams(userId);
  
  return useQuery({
    queryKey: ['ap-user-teams', userId, locationData?.assignedLocation?.id],
    queryFn: async () => {
      if (!locationData?.assignedLocation?.id) {
        return [];
      }

      console.log('🔧 Getting teams for AP user location (CORRECT approach)');
      
      const { data: teams, error } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          description,
          status,
          location_id,
          created_at,
          team_members!inner(id)
        `)
        .eq('location_id', locationData.assignedLocation.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('❌ Error loading teams:', error);
        return [];
      }
      
      // Add member count
      const teamsWithCounts = (teams || []).map(team => ({
        ...team,
        member_count: team.team_members?.length || 0
      }));
      
      console.log('✅ Found teams for AP user:', teamsWithCounts.length);
      return teamsWithCounts;
    },
    enabled: !!locationData?.assignedLocation?.id,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
}