/**
 * TEAM MEMBER COUNT DIAGNOSTIC UTILITY
 * 
 * Diagnoses discrepancies between dashboard and team management member counts
 * Validates the hypothesis of double counting in provider KPI calculation
 */

import { supabase } from '@/integrations/supabase/client';

export interface MemberCountDiagnostic {
  issue_type: 'member_count_discrepancy' | 'double_counting' | 'data_source_mismatch';
  severity: 'critical' | 'high' | 'medium' | 'low';
  detected: boolean;
  description: string;
  expected_count: number;
  actual_dashboard_count: number;
  actual_team_count: number;
  provider_id: string;
  team_assignments: any[];
  location_teams: any[];
  debugging_details: {
    primary_location_member_count: number;
    assigned_teams_member_count: number;
    overlapping_teams: string[];
    calculation_method: string;
  };
  recommendations: string[];
}

export async function diagnoseMemberCountDiscrepancy(providerId: string): Promise<MemberCountDiagnostic[]> {
  const diagnostics: MemberCountDiagnostic[] = [];
  
  try {
    console.log(`🔍 MEMBER COUNT DIAGNOSTIC: Starting analysis for provider ${providerId}`);
    
    // Step 1: Get provider's primary location
    const { data: provider, error: providerError } = await supabase
      .from('authorized_providers')
      .select('primary_location_id, name')
      .eq('id', providerId)
      .single();
    
    if (providerError || !provider) {
      diagnostics.push({
        issue_type: 'data_source_mismatch',
        severity: 'critical',
        detected: true,
        description: 'Provider not found or invalid provider ID',
        expected_count: 0,
        actual_dashboard_count: 0,
        actual_team_count: 0,
        provider_id: providerId,
        team_assignments: [],
        location_teams: [],
        debugging_details: {
          primary_location_member_count: 0,
          assigned_teams_member_count: 0,
          overlapping_teams: [],
          calculation_method: 'provider_not_found'
        },
        recommendations: ['Verify provider ID exists in authorized_providers table']
      });
      return diagnostics;
    }
    
    console.log(`🔍 Provider: ${provider.name}, Primary Location: ${provider.primary_location_id}`);
    
    // Step 2: Get team assignments for this provider
    const { data: teamAssignments, error: assignError } = await supabase
      .from('provider_team_assignments')
      .select(`
        team_id,
        assignment_role,
        status,
        teams!inner(
          id,
          name,
          location_id,
          status
        )
      `)
      .eq('provider_id', providerId)
      .eq('status', 'active');
    
    if (assignError) {
      console.error('🚨 Error fetching team assignments:', assignError);
    }
    
    const assignments = teamAssignments || [];
    console.log(`🔍 Found ${assignments.length} team assignments`);
    
    // Step 3: Get teams at provider's primary location
    let locationTeams: any[] = [];
    if (provider.primary_location_id) {
      const { data: locTeams, error: locError } = await supabase
        .from('teams')
        .select('id, name, location_id, status')
        .eq('location_id', provider.primary_location_id)
        .eq('status', 'active');
      
      if (locError) {
        console.error('🚨 Error fetching location teams:', locError);
      } else {
        locationTeams = locTeams || [];
      }
    }
    
    console.log(`🔍 Found ${locationTeams.length} teams at primary location`);
    
    // Step 4: Identify overlapping teams (teams that appear in both lists)
    const assignedTeamIds = assignments.map(a => a.team_id);
    const locationTeamIds = locationTeams.map(t => t.id);
    const overlappingTeamIds = assignedTeamIds.filter(id => locationTeamIds.includes(id));
    
    console.log(`🔍 Overlapping teams (counted twice): ${overlappingTeamIds.length}`, overlappingTeamIds);
    
    // Step 5: Count members using the SAME method as dashboard (simulate double counting)
    let primaryLocationMemberCount = 0;
    let assignedTeamsMemberCount = 0;
    
    // Count 1: Members from teams at primary location
    if (locationTeamIds.length > 0) {
      const { count: locMemberCount, error: locMemberError } = await supabase
        .from('team_members')
        .select('id', { count: 'exact' })
        .in('team_id', locationTeamIds)
        .eq('status', 'active');
      
      primaryLocationMemberCount = locMemberCount || 0;
      console.log(`🔍 Primary location member count: ${primaryLocationMemberCount}`);
    }
    
    // Count 2: Members from assigned teams (this creates double counting)
    if (assignedTeamIds.length > 0) {
      const { count: assignedMemberCount, error: assignedMemberError } = await supabase
        .from('team_members')
        .select('id', { count: 'exact' })
        .in('team_id', assignedTeamIds)
        .eq('status', 'active');
      
      assignedTeamsMemberCount = assignedMemberCount || 0;
      console.log(`🔍 Assigned teams member count: ${assignedTeamsMemberCount}`);
    }
    
    // Step 6: Calculate dashboard count (simulating the buggy algorithm)
    const dashboardCount = primaryLocationMemberCount + assignedTeamsMemberCount;
    console.log(`🔍 Dashboard count (double counting): ${dashboardCount}`);
    
    // Step 7: Calculate correct count (unique teams only)
    const allUniqueTeamIds = Array.from(new Set([...locationTeamIds, ...assignedTeamIds]));
    let correctMemberCount = 0;
    
    if (allUniqueTeamIds.length > 0) {
      const { count: uniqueMemberCount, error: uniqueError } = await supabase
        .from('team_members')
        .select('id', { count: 'exact' })
        .in('team_id', allUniqueTeamIds)
        .eq('status', 'active');
      
      correctMemberCount = uniqueMemberCount || 0;
      console.log(`🔍 Correct member count (unique teams): ${correctMemberCount}`);
    }
    
    // Step 8: Analyze results
    const hasDoubleCountingIssue = overlappingTeamIds.length > 0 && dashboardCount > correctMemberCount;
    
    if (hasDoubleCountingIssue) {
      diagnostics.push({
        issue_type: 'double_counting',
        severity: 'critical',
        detected: true,
        description: `Dashboard shows ${dashboardCount} members but actual count is ${correctMemberCount}. ${overlappingTeamIds.length} teams are being counted twice.`,
        expected_count: correctMemberCount,
        actual_dashboard_count: dashboardCount,
        actual_team_count: correctMemberCount,
        provider_id: providerId,
        team_assignments: assignments,
        location_teams: locationTeams,
        debugging_details: {
          primary_location_member_count: primaryLocationMemberCount,
          assigned_teams_member_count: assignedTeamsMemberCount,
          overlapping_teams: overlappingTeamIds,
          calculation_method: 'additive_double_counting'
        },
        recommendations: [
          'Fix providerRelationshipService.calculateRealProviderKPIs() to avoid double counting',
          'Use Set to deduplicate team IDs before counting members',
          'Remove line 1233: memberCount += assignedMembers',
          'Count members from unique teams only'
        ]
      });
    }
    
    // Step 9: Check for other discrepancies
    if (dashboardCount !== correctMemberCount && !hasDoubleCountingIssue) {
      diagnostics.push({
        issue_type: 'member_count_discrepancy',
        severity: 'high',
        detected: true,
        description: `Member count mismatch without obvious double counting. Dashboard: ${dashboardCount}, Actual: ${correctMemberCount}`,
        expected_count: correctMemberCount,
        actual_dashboard_count: dashboardCount,
        actual_team_count: correctMemberCount,
        provider_id: providerId,
        team_assignments: assignments,
        location_teams: locationTeams,
        debugging_details: {
          primary_location_member_count: primaryLocationMemberCount,
          assigned_teams_member_count: assignedTeamsMemberCount,
          overlapping_teams: overlappingTeamIds,
          calculation_method: 'unknown_discrepancy'
        },
        recommendations: [
          'Investigate data source inconsistencies',
          'Check team member status filtering',
          'Verify team assignment table integrity'
        ]
      });
    }
    
    // Step 10: Success case
    if (!hasDoubleCountingIssue && dashboardCount === correctMemberCount) {
      diagnostics.push({
        issue_type: 'member_count_discrepancy',
        severity: 'low',
        detected: false,
        description: `Member counts are consistent. Dashboard: ${dashboardCount}, Team management: ${correctMemberCount}`,
        expected_count: correctMemberCount,
        actual_dashboard_count: dashboardCount,
        actual_team_count: correctMemberCount,
        provider_id: providerId,
        team_assignments: assignments,
        location_teams: locationTeams,
        debugging_details: {
          primary_location_member_count: primaryLocationMemberCount,
          assigned_teams_member_count: assignedTeamsMemberCount,
          overlapping_teams: overlappingTeamIds,
          calculation_method: 'consistent'
        },
        recommendations: ['No action needed - counts are consistent']
      });
    }
    
    console.log(`✅ MEMBER COUNT DIAGNOSTIC: Analysis complete, found ${diagnostics.length} findings`);
    return diagnostics;
    
  } catch (error) {
    console.error('🚨 MEMBER COUNT DIAGNOSTIC: Error during analysis:', error);
    
    diagnostics.push({
      issue_type: 'data_source_mismatch',
      severity: 'critical',
      detected: true,
      description: `Diagnostic analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      expected_count: 0,
      actual_dashboard_count: 0,
      actual_team_count: 0,
      provider_id: providerId,
      team_assignments: [],
      location_teams: [],
      debugging_details: {
        primary_location_member_count: 0,
        assigned_teams_member_count: 0,
        overlapping_teams: [],
        calculation_method: 'diagnostic_failed'
      },
      recommendations: ['Fix diagnostic utility errors', 'Check database connectivity']
    });
    
    return diagnostics;
  }
}

export async function logMemberCountDiagnosticResults(diagnostics: MemberCountDiagnostic[]): Promise<void> {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 MEMBER COUNT DIAGNOSTIC RESULTS');
  console.log('='.repeat(80));
  
  diagnostics.forEach((diagnostic, index) => {
    console.log(`\n📋 Finding ${index + 1}:`);
    console.log(`   Issue Type: ${diagnostic.issue_type}`);
    console.log(`   Severity: ${diagnostic.severity}`);
    console.log(`   Detected: ${diagnostic.detected ? '❌ YES' : '✅ NO'}`);
    console.log(`   Description: ${diagnostic.description}`);
    
    if (diagnostic.detected) {
      console.log(`   Expected Count: ${diagnostic.expected_count}`);
      console.log(`   Dashboard Count: ${diagnostic.actual_dashboard_count}`);
      console.log(`   Team Mgmt Count: ${diagnostic.actual_team_count}`);
      
      console.log(`\n   🔧 Debugging Details:`);
      console.log(`      Primary location members: ${diagnostic.debugging_details.primary_location_member_count}`);
      console.log(`      Assigned teams members: ${diagnostic.debugging_details.assigned_teams_member_count}`);
      console.log(`      Overlapping teams: ${diagnostic.debugging_details.overlapping_teams.length}`);
      console.log(`      Calculation method: ${diagnostic.debugging_details.calculation_method}`);
      
      if (diagnostic.debugging_details.overlapping_teams.length > 0) {
        console.log(`      Teams counted twice: ${diagnostic.debugging_details.overlapping_teams.join(', ')}`);
      }
      
      console.log(`\n   💡 Recommendations:`);
      diagnostic.recommendations.forEach((rec, i) => {
        console.log(`      ${i + 1}. ${rec}`);
      });
    }
  });
  
  console.log('\n' + '='.repeat(80));
  
  // Summary
  const criticalIssues = diagnostics.filter(d => d.detected && d.severity === 'critical');
  const highIssues = diagnostics.filter(d => d.detected && d.severity === 'high');
  
  if (criticalIssues.length > 0) {
    console.log(`🚨 CRITICAL: ${criticalIssues.length} critical member count issues detected`);
  }
  if (highIssues.length > 0) {
    console.log(`⚠️  HIGH: ${highIssues.length} high priority member count issues detected`);
  }
  if (criticalIssues.length === 0 && highIssues.length === 0) {
    console.log(`✅ SUCCESS: No critical member count issues detected`);
  }
}