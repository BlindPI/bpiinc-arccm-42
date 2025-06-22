/**
 * MEMBER COUNT FIX VALIDATION SCRIPT
 * 
 * Validates that the dashboard now shows the correct member count (no double counting)
 * Compares dashboard count with team management count to ensure consistency
 */

import { supabase } from '@/integrations/supabase/client';
import { diagnoseMemberCountDiscrepancy, logMemberCountDiagnosticResults } from './diagnoseMemberCount';
import { providerRelationshipService } from '@/services/provider/providerRelationshipService';

export interface MemberCountValidation {
  provider_id: string;
  provider_name: string;
  before_fix: {
    dashboard_count: number;
    team_mgmt_count: number;
    discrepancy: number;
  };
  after_fix: {
    dashboard_count: number;
    team_mgmt_count: number;
    discrepancy: number;
  };
  fix_successful: boolean;
  validation_details: {
    unique_teams: string[];
    overlapping_teams_eliminated: number;
    calculation_method: string;
  };
}

async function getCurrentAPUserProviderId(): Promise<string | null> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Find their provider record
    const { data: provider, error } = await supabase
      .from('authorized_providers')
      .select('id, name')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !provider) {
      console.log('🔍 No provider found for current user, trying admin approach...');
      
      // For admin users, get the first active provider
      const { data: providers, error: adminError } = await supabase
        .from('authorized_providers')
        .select('id, name')
        .eq('status', 'active')
        .limit(1);

      if (!adminError && providers && providers.length > 0) {
        return providers[0].id;
      }
      return null;
    }

    return provider.id;
  } catch (error) {
    console.error('Error getting provider ID:', error);
    return null;
  }
}

async function getTeamManagementMemberCount(providerId: string): Promise<number> {
  try {
    // Get the provider's team assignments (same method as team management UI)
    const assignments = await providerRelationshipService.getProviderTeamAssignments(providerId);
    
    if (!assignments || assignments.length === 0) {
      return 0;
    }

    // Sum up member counts from all assigned teams
    const totalMembers = assignments.reduce((sum, assignment) => {
      return sum + (assignment.member_count || 0);
    }, 0);

    console.log(`🔍 Team Management Count: ${totalMembers} members from ${assignments.length} teams`);
    return totalMembers;
  } catch (error) {
    console.error('Error getting team management count:', error);
    return 0;
  }
}

async function getDashboardMemberCount(providerId: string): Promise<number> {
  try {
    // Use the same method as dashboard (after fix)
    const kpis = await providerRelationshipService.getProviderLocationKPIs(providerId);
    const count = kpis.teamMembersManaged || 0;
    
    console.log(`🔍 Dashboard Count: ${count} members (after fix)`);
    return count;
  } catch (error) {
    console.error('Error getting dashboard count:', error);
    return 0;
  }
}

export async function validateMemberCountFix(): Promise<MemberCountValidation | null> {
  console.log('🚀 VALIDATING MEMBER COUNT FIX...\n');
  
  try {
    // Step 1: Get current user's provider ID
    const providerId = await getCurrentAPUserProviderId();
    if (!providerId) {
      console.error('❌ Cannot validate - no provider found for current user');
      return null;
    }

    console.log(`🔍 Validating fix for provider: ${providerId}`);

    // Step 2: Get provider name
    const { data: provider } = await supabase
      .from('authorized_providers')
      .select('name')
      .eq('id', providerId)
      .single();

    const providerName = provider?.name || 'Unknown Provider';

    // Step 3: Simulate "before fix" scenario (we can't actually run the old code)
    // But we can detect if there WOULD have been double counting
    const diagnostics = await diagnoseMemberCountDiscrepancy(providerId);
    const doubleCountingIssue = diagnostics.find(d => d.issue_type === 'double_counting' && d.detected);

    // Step 4: Get current counts (after fix)
    const dashboardCount = await getDashboardMemberCount(providerId);
    const teamMgmtCount = await getTeamManagementMemberCount(providerId);

    // Step 5: Analyze results
    const currentDiscrepancy = Math.abs(dashboardCount - teamMgmtCount);
    const fixSuccessful = currentDiscrepancy === 0;

    console.log('\n📊 VALIDATION RESULTS:');
    console.log(`   Provider: ${providerName} (${providerId})`);
    console.log(`   Dashboard Count: ${dashboardCount}`);
    console.log(`   Team Mgmt Count: ${teamMgmtCount}`);
    console.log(`   Discrepancy: ${currentDiscrepancy}`);
    console.log(`   Fix Successful: ${fixSuccessful ? '✅ YES' : '❌ NO'}`);

    if (doubleCountingIssue) {
      console.log(`\n🔍 BEFORE FIX (simulated from diagnostic):`);
      console.log(`   Would have shown: ${doubleCountingIssue.actual_dashboard_count} (double counted)`);
      console.log(`   Overlapping teams: ${doubleCountingIssue.debugging_details.overlapping_teams.length}`);
      console.log(`   Primary location count: ${doubleCountingIssue.debugging_details.primary_location_member_count}`);
      console.log(`   Assigned teams count: ${doubleCountingIssue.debugging_details.assigned_teams_member_count}`);
    }

    const validation: MemberCountValidation = {
      provider_id: providerId,
      provider_name: providerName,
      before_fix: {
        dashboard_count: doubleCountingIssue?.actual_dashboard_count || dashboardCount,
        team_mgmt_count: doubleCountingIssue?.expected_count || teamMgmtCount,
        discrepancy: doubleCountingIssue ? Math.abs(doubleCountingIssue.actual_dashboard_count - doubleCountingIssue.expected_count) : 0
      },
      after_fix: {
        dashboard_count: dashboardCount,
        team_mgmt_count: teamMgmtCount,
        discrepancy: currentDiscrepancy
      },
      fix_successful: fixSuccessful,
      validation_details: {
        unique_teams: doubleCountingIssue?.debugging_details.overlapping_teams || [],
        overlapping_teams_eliminated: doubleCountingIssue?.debugging_details.overlapping_teams.length || 0,
        calculation_method: 'deduplicated_team_ids'
      }
    };

    return validation;

  } catch (error) {
    console.error('🚨 VALIDATION FAILED:', error);
    return null;
  }
}

export async function runMemberCountFixValidation(): Promise<void> {
  console.log('🎯 MEMBER COUNT FIX VALIDATION\n');
  console.log('='.repeat(60));
  
  const validation = await validateMemberCountFix();
  
  if (!validation) {
    console.log('❌ VALIDATION FAILED - Unable to run validation');
    return;
  }

  console.log('\n📋 VALIDATION SUMMARY:');
  console.log('='.repeat(60));
  console.log(`Provider: ${validation.provider_name}`);
  console.log(`Provider ID: ${validation.provider_id}`);
  
  console.log(`\n📊 BEFORE FIX:`);
  console.log(`   Dashboard: ${validation.before_fix.dashboard_count} members`);
  console.log(`   Team Mgmt: ${validation.before_fix.team_mgmt_count} members`);
  console.log(`   Discrepancy: ${validation.before_fix.discrepancy} members`);
  
  console.log(`\n📊 AFTER FIX:`);
  console.log(`   Dashboard: ${validation.after_fix.dashboard_count} members`);
  console.log(`   Team Mgmt: ${validation.after_fix.team_mgmt_count} members`);
  console.log(`   Discrepancy: ${validation.after_fix.discrepancy} members`);
  
  console.log(`\n🔧 FIX DETAILS:`);
  console.log(`   Teams eliminated from double counting: ${validation.validation_details.overlapping_teams_eliminated}`);
  console.log(`   Calculation method: ${validation.validation_details.calculation_method}`);
  
  if (validation.fix_successful) {
    console.log(`\n✅ SUCCESS: Member count fix validated successfully!`);
    console.log(`   Dashboard and team management now show consistent counts`);
    if (validation.before_fix.discrepancy > 0) {
      console.log(`   Fixed discrepancy of ${validation.before_fix.discrepancy} members`);
    }
  } else {
    console.log(`\n❌ ISSUE: Fix validation failed`);
    console.log(`   Dashboard still shows different count than team management`);
    console.log(`   Current discrepancy: ${validation.after_fix.discrepancy} members`);
  }

  console.log('\n' + '='.repeat(60));
}

// Auto-run if called directly
if (require.main === module) {
  runMemberCountFixValidation()
    .then(() => {
      console.log('🎯 VALIDATION COMPLETE');
    })
    .catch(error => {
      console.error('💥 VALIDATION CRASHED:', error);
    });
}