/**
 * DIAGNOSTIC UTILITY: Team Member Count Analysis
 * 
 * This utility specifically diagnoses why team member counts are showing as 0
 * and provides fixes to properly calculate member counts.
 */

import { supabase } from '@/integrations/supabase/client';

export interface MemberCountDiagnostic {
  team_id: string;
  team_name: string;
  expected_member_count: number;
  actual_member_count: number;
  issue_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  suggested_fix: string;
  sample_members?: any[];
}

export async function diagnoseMemberCountIssues(providerId?: string): Promise<MemberCountDiagnostic[]> {
  const diagnostics: MemberCountDiagnostic[] = [];
  
  try {
    console.log('🔍 MEMBER COUNT DIAGNOSTIC: Starting analysis...');
    
    // Get teams for the provider
    let teamQuery = supabase
      .from('provider_team_assignments')
      .select(`
        team_id,
        teams!inner(
          id,
          name,
          status,
          location_id
        )
      `)
      .eq('status', 'active');
      
    if (providerId) {
      teamQuery = teamQuery.eq('provider_id', providerId);
    }
    
    const { data: teamAssignments, error: teamError } = await teamQuery.limit(10);
    
    if (teamError) {
      console.error('🚨 MEMBER COUNT DIAGNOSTIC: Error fetching teams:', teamError);
      return [];
    }
    
    if (!teamAssignments || teamAssignments.length === 0) {
      console.log('🚨 MEMBER COUNT DIAGNOSTIC: No team assignments found');
      return [{
        team_id: 'none',
        team_name: 'No teams found',
        expected_member_count: 0,
        actual_member_count: 0,
        issue_type: 'no_team_assignments',
        severity: 'high',
        details: providerId ? `Provider ${providerId} has no active team assignments` : 'No active team assignments found in system',
        suggested_fix: 'Create team assignments for the provider, or check if assignments exist but are inactive'
      }];
    }
    
    console.log(`📊 MEMBER COUNT DIAGNOSTIC: Analyzing ${teamAssignments.length} teams...`);
    
    for (const assignment of teamAssignments) {
      const teamId = assignment.team_id;
      const teamName = assignment.teams.name;
      
      console.log(`🔍 MEMBER COUNT DIAGNOSTIC: Analyzing team "${teamName}" (${teamId})`);
      
      // Get actual member count from team_members table
      const { data: activeMembers, error: activeMemberError } = await supabase
        .from('team_members')
        .select('id, user_id, status, role, created_at')
        .eq('team_id', teamId)
        .eq('status', 'active');
      
      const actualMemberCount = activeMembers?.length || 0;
      
      // Get all members (including inactive) to see if status filtering is the issue
      const { data: allMembers, error: allMemberError } = await supabase
        .from('team_members')
        .select('id, user_id, status, role, created_at')
        .eq('team_id', teamId);
      
      const totalMemberCount = allMembers?.length || 0;
      
      console.log(`📊 MEMBER COUNT DIAGNOSTIC: Team "${teamName}": ${actualMemberCount} active / ${totalMemberCount} total members`);
      
      // Determine issue type and severity
      if (actualMemberCount === 0 && totalMemberCount === 0) {
        diagnostics.push({
          team_id: teamId,
          team_name: teamName,
          expected_member_count: 1, // Teams should have at least 1 member
          actual_member_count: 0,
          issue_type: 'no_members_in_table',
          severity: 'critical',
          details: `Team "${teamName}" has no members in team_members table at all`,
          suggested_fix: 'Add members to team_members table, or check if members are stored in a different table/field'
        });
      } else if (actualMemberCount === 0 && totalMemberCount > 0) {
        const inactiveMembers = allMembers?.filter(m => m.status !== 'active') || [];
        diagnostics.push({
          team_id: teamId,
          team_name: teamName,
          expected_member_count: totalMemberCount,
          actual_member_count: 0,
          issue_type: 'all_members_inactive',
          severity: 'high',
          details: `Team "${teamName}" has ${totalMemberCount} members but all are inactive (statuses: ${inactiveMembers.map(m => m.status).join(', ')})`,
          suggested_fix: 'Update member statuses to "active", or adjust status filtering in queries',
          sample_members: inactiveMembers.slice(0, 3)
        });
      } else if (actualMemberCount > 0) {
        // Team has members - this is good!
        console.log(`✅ MEMBER COUNT DIAGNOSTIC: Team "${teamName}" has ${actualMemberCount} active members - OK`);
      }
    }
    
    // Check for hardcoded zero values in service layer
    console.log('🔍 MEMBER COUNT DIAGNOSTIC: Checking for hardcoded zero values...');
    
    // This is more of a code analysis, but we can flag it as an issue
    diagnostics.push({
      team_id: 'service_layer',
      team_name: 'ProviderRelationshipService',
      expected_member_count: -1, // Unknown
      actual_member_count: 0,
      issue_type: 'hardcoded_zero_values',
      severity: 'critical',
      details: 'ProviderRelationshipService.getProviderTeamAssignments() hardcodes member_count to 0 instead of calculating from team_members table',
      suggested_fix: 'Update service to calculate actual member count from team_members table in the query or post-processing'
    });
    
    console.log(`✅ MEMBER COUNT DIAGNOSTIC: Analysis complete. Found ${diagnostics.length} issues.`);
    return diagnostics;
    
  } catch (error) {
    console.error('🚨 MEMBER COUNT DIAGNOSTIC ERROR:', error);
    return [{
      team_id: 'error',
      team_name: 'Diagnostic Error',
      expected_member_count: 0,
      actual_member_count: 0,
      issue_type: 'diagnostic_error',
      severity: 'critical',
      details: `Failed to run member count diagnostic: ${error.message}`,
      suggested_fix: 'Check database connectivity and table permissions'
    }];
  }
}

export async function generateMemberCountFixQuery(teamId: string): Promise<string> {
  // Generate query to properly calculate member count for a team
  return `
-- Member Count Fix Query for Team: ${teamId}
-- Use this to get the correct member count

SELECT 
  t.id as team_id,
  t.name as team_name,
  COUNT(tm.id) FILTER (WHERE tm.status = 'active') as active_member_count,
  COUNT(tm.id) as total_member_count,
  ARRAY_AGG(
    CASE WHEN tm.status = 'active'
    THEN json_build_object('user_id', tm.user_id, 'role', tm.role, 'created_at', tm.created_at)
    ELSE NULL END
  ) FILTER (WHERE tm.status = 'active') as active_members
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.team_id
WHERE t.id = '${teamId}'
GROUP BY t.id, t.name;
`;
}

export async function fixHardcodedMemberCounts(): Promise<{
  query: string;
  description: string;
}> {
  return {
    query: `
-- Updated Query for ProviderRelationshipService.getProviderTeamAssignments()
-- Replace the hardcoded member_count: 0 with this:

SELECT 
  pta.*,
  t.id,
  t.name,
  t.team_type,
  t.status,
  t.performance_score,
  COALESCE(member_stats.active_count, 0) as member_count,
  l.name as location_name
FROM provider_team_assignments pta
INNER JOIN teams t ON pta.team_id = t.id
LEFT JOIN locations l ON t.location_id = l.id
LEFT JOIN (
  SELECT 
    team_id,
    COUNT(*) FILTER (WHERE status = 'active') as active_count
  FROM team_members 
  GROUP BY team_id
) member_stats ON t.id = member_stats.team_id
WHERE pta.provider_id = $1
ORDER BY pta.created_at DESC;
`,
    description: 'This query properly calculates member_count from team_members table instead of hardcoding to 0'
  };
}