import { supabase } from '@/integrations/supabase/client';

export interface APCertificateVisibilityDiagnostic {
  issue_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  affected_count: number;
  details: string;
  sample_data?: any;
  suggested_fix: string;
}

/**
 * Comprehensive diagnostic for AP role certificate visibility issues
 * Checks multiple potential sources of the problem:
 * 1. Location-based filtering inconsistencies
 * 2. Missing AP user location assignments
 * 3. Certificate location_id mismatches
 * 4. RLS policy issues
 * 5. Missing team member linkage in submissions
 */
export async function diagnoseAPCertificateVisibility(userId?: string): Promise<{
  diagnostics: APCertificateVisibilityDiagnostic[];
  summary: {
    total_issues: number;
    critical_issues: number;
    dashboard_count: number;
    actual_visible_count: number;
    location_assignments: number;
    certificate_location_coverage: number;
  };
}> {
  const diagnostics: APCertificateVisibilityDiagnostic[] = [];
  
  try {
    console.log('🔍 DIAGNOSTIC: Starting AP certificate visibility analysis...');

    // Get current user profile if not provided
    let currentUserId = userId;
    if (!currentUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      currentUserId = user?.id;
    }

    if (!currentUserId) {
      throw new Error('No user ID available for diagnosis');
    }

    // Get user profile and ensure they're AP role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUserId)
      .single();

    if (profileError || !profile) {
      throw new Error('Failed to get user profile');
    }

    if (profile.role !== 'AP') {
      diagnostics.push({
        issue_type: 'non_ap_user',
        severity: 'critical',
        affected_count: 1,
        details: `User has role '${profile.role}' but AP role is required for this diagnosis`,
        suggested_fix: 'This diagnostic is specifically for AP role users'
      });
      
      return {
        diagnostics,
        summary: {
          total_issues: diagnostics.length,
          critical_issues: diagnostics.filter(d => d.severity === 'critical').length,
          dashboard_count: 0,
          actual_visible_count: 0,
          location_assignments: 0,
          certificate_location_coverage: 0
        }
      };
    }

    console.log(`📋 DIAGNOSTIC: Analyzing AP user: ${profile.display_name} (${profile.email})`);

    // 1. Check AP user location assignments
    const { data: locationAssignments, error: assignmentsError } = await supabase
      .from('provider_location_assignments')
      .select(`
        *,
        location:locations(id, name, city, state, status)
      `)
      .eq('user_id', currentUserId);

    if (assignmentsError) {
      diagnostics.push({
        issue_type: 'location_assignment_query_error',
        severity: 'critical',
        affected_count: 0,
        details: `Failed to query location assignments: ${assignmentsError.message}`,
        suggested_fix: 'Check RLS policies for provider_location_assignments table'
      });
    }

    const validLocationIds = locationAssignments?.map(a => a.location_id) || [];
    console.log(`📍 DIAGNOSTIC: Found ${validLocationIds.length} location assignments:`, validLocationIds);

    if (validLocationIds.length === 0) {
      diagnostics.push({
        issue_type: 'no_location_assignments',
        severity: 'critical',
        affected_count: 0,
        details: 'AP user has no location assignments, cannot see any certificates',
        suggested_fix: 'Assign locations to this AP user in provider_location_assignments table'
      });
    }

    // 2. Get dashboard certificate count (what user sees in dashboard)
    let dashboardCount = 0;
    if (validLocationIds.length > 0) {
      // Check multiple approaches for counting certificates
      const { count: directCount } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .in('location_id', validLocationIds)
        .eq('status', 'ACTIVE');

      dashboardCount = directCount || 0;
      console.log(`📊 DIAGNOSTIC: Dashboard certificate count (direct location match): ${dashboardCount}`);
    }

    // 3. Check actual visible certificates in certificate management views
    let actualVisibleCertificates = [];
    if (validLocationIds.length > 0) {
      const { data: visibleCerts, error: visibleError } = await supabase
        .from('certificates')
        .select(`
          *,
          location:locations(name, city, state),
          profiles!certificates_issued_by_fkey(display_name, email)
        `)
        .in('location_id', validLocationIds)
        .eq('status', 'ACTIVE')
        .limit(10);

      if (visibleError) {
        diagnostics.push({
          issue_type: 'certificate_visibility_query_error',
          severity: 'high',
          affected_count: 0,
          details: `Failed to query visible certificates: ${visibleError.message}`,
          suggested_fix: 'Check RLS policies for certificates table'
        });
      } else {
        actualVisibleCertificates = visibleCerts || [];
        console.log(`👁️ DIAGNOSTIC: Actually visible certificates: ${actualVisibleCertificates.length}`);
      }
    }

    // 4. Check for certificate requests (pending, approved, etc.)
    let certificateRequests = [];
    if (validLocationIds.length > 0) {
      const { data: requests, error: requestsError } = await supabase
        .from('certificate_requests')
        .select(`
          *,
          location:locations(name, city, state),
          profiles!certificate_requests_user_id_fkey(display_name, email)
        `)
        .in('location_id', validLocationIds)
        .limit(10);

      if (requestsError) {
        diagnostics.push({
          issue_type: 'certificate_requests_query_error',
          severity: 'high',
          affected_count: 0,
          details: `Failed to query certificate requests: ${requestsError.message}`,
          suggested_fix: 'Check RLS policies for certificate_requests table'
        });
      } else {
        certificateRequests = requests || [];
        console.log(`📋 DIAGNOSTIC: Certificate requests found: ${certificateRequests.length}`);
      }
    }

    // 5. Check for roster submissions and team member linkage
    let rosterSubmissions = [];
    if (validLocationIds.length > 0) {
      const { data: rosters, error: rostersError } = await supabase
        .from('certificate_rosters')
        .select(`
          *,
          location:locations(name, city, state),
          profiles!certificate_rosters_uploaded_by_fkey(display_name, email),
          team:teams(name, location_id)
        `)
        .in('location_id', validLocationIds)
        .limit(10);

      if (rostersError) {
        diagnostics.push({
          issue_type: 'roster_submissions_query_error',
          severity: 'medium',
          affected_count: 0,
          details: `Failed to query roster submissions: ${rostersError.message}`,
          suggested_fix: 'Check RLS policies for certificate_rosters table'
        });
      } else {
        rosterSubmissions = rosters || [];
        console.log(`📄 DIAGNOSTIC: Roster submissions found: ${rosterSubmissions.length}`);
      }
    }

    // 6. Check location ID consistency across tables
    const locationConsistencyCheck = await checkLocationIdConsistency(validLocationIds);
    if (locationConsistencyCheck.length > 0) {
      diagnostics.push(...locationConsistencyCheck);
    }

    // 7. Check team member linkage for batch submissions
    const teamLinkageCheck = await checkTeamMemberLinkage(validLocationIds);
    if (teamLinkageCheck.length > 0) {
      diagnostics.push(...teamLinkageCheck);
    }

    // 8. Analyze count discrepancies
    if (dashboardCount > 0 && actualVisibleCertificates.length === 0) {
      diagnostics.push({
        issue_type: 'dashboard_vs_visibility_mismatch',
        severity: 'critical',
        affected_count: dashboardCount,
        details: `Dashboard shows ${dashboardCount} certificates but certificate management shows 0. This indicates a filtering or RLS issue.`,
        sample_data: {
          dashboard_count: dashboardCount,
          visible_count: actualVisibleCertificates.length,
          location_assignments: validLocationIds
        },
        suggested_fix: 'Check RLS policies and ensure certificate queries use same location filtering as dashboard'
      });
    }

    // 9. Check for missing team member attribution in certificates
    const certificatesWithoutSubmitter = actualVisibleCertificates.filter(cert => 
      !cert.issued_by || !cert.profiles?.display_name
    );
    
    if (certificatesWithoutSubmitter.length > 0) {
      diagnostics.push({
        issue_type: 'missing_team_member_attribution',
        severity: 'medium',
        affected_count: certificatesWithoutSubmitter.length,
        details: `${certificatesWithoutSubmitter.length} certificates lack clear linkage to team member who submitted them`,
        sample_data: certificatesWithoutSubmitter.slice(0, 3).map(c => ({
          id: c.id,
          recipient_name: c.recipient_name,
          issued_by: c.issued_by,
          batch_id: c.batch_id
        })),
        suggested_fix: 'Ensure issued_by field is populated during certificate generation and batch uploads'
      });
    }

    // Calculate summary metrics
    const summary = {
      total_issues: diagnostics.length,
      critical_issues: diagnostics.filter(d => d.severity === 'critical').length,
      dashboard_count: dashboardCount,
      actual_visible_count: actualVisibleCertificates.length,
      location_assignments: validLocationIds.length,
      certificate_location_coverage: validLocationIds.length > 0 ? 
        (actualVisibleCertificates.length / dashboardCount) * 100 : 0
    };

    console.log('📊 DIAGNOSTIC SUMMARY:', summary);
    
    return { diagnostics, summary };

  } catch (error) {
    console.error('❌ DIAGNOSTIC ERROR:', error);
    diagnostics.push({
      issue_type: 'diagnostic_error',
      severity: 'critical',
      affected_count: 0,
      details: `Diagnostic failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      suggested_fix: 'Check console for detailed error information'
    });
    
    return {
      diagnostics,
      summary: {
        total_issues: diagnostics.length,
        critical_issues: diagnostics.length,
        dashboard_count: 0,
        actual_visible_count: 0,
        location_assignments: 0,
        certificate_location_coverage: 0
      }
    };
  }
}

async function checkLocationIdConsistency(locationIds: string[]): Promise<APCertificateVisibilityDiagnostic[]> {
  const diagnostics: APCertificateVisibilityDiagnostic[] = [];
  
  if (locationIds.length === 0) return diagnostics;

  try {
    // Check if certificates exist with orphaned location_ids
    const { data: orphanedCerts, error } = await supabase
      .from('certificates')
      .select('id, location_id, recipient_name')
      .not('location_id', 'in', `(${locationIds.join(',')})`)
      .eq('status', 'ACTIVE')
      .limit(5);

    if (!error && orphanedCerts && orphanedCerts.length > 0) {
      diagnostics.push({
        issue_type: 'orphaned_certificate_locations',
        severity: 'medium',
        affected_count: orphanedCerts.length,
        details: `Found certificates with location_ids not in AP user's assigned locations`,
        sample_data: orphanedCerts,
        suggested_fix: 'Check if these certificates should be visible or if location assignments are missing'
      });
    }
  } catch (error) {
    console.error('Location consistency check failed:', error);
  }

  return diagnostics;
}

export default diagnoseAPCertificateVisibility;

async function checkTeamMemberLinkage(locationIds: string[]): Promise<APCertificateVisibilityDiagnostic[]> {
  const diagnostics: APCertificateVisibilityDiagnostic[] = [];
  
  if (locationIds.length === 0) return diagnostics;

  try {
    // Check for batch submissions without clear team member linkage
    const { data: batchSubmissions, error } = await supabase
      .from('certificates')
      .select(`
        batch_id,
        issued_by,
        profiles!certificates_issued_by_fkey(display_name, email)
      `)
      .in('location_id', locationIds)
      .not('batch_id', 'is', null)
      .limit(10);

    if (!error && batchSubmissions) {
      const submissionsWithoutProfile = batchSubmissions.filter(s => !s.profiles?.display_name);
      
      if (submissionsWithoutProfile.length > 0) {
        diagnostics.push({
          issue_type: 'batch_submissions_missing_team_linkage',
          severity: 'medium',
          affected_count: submissionsWithoutProfile.length,
          details: `Batch submissions lack clear linkage to team member who uploaded them`,
          sample_data: submissionsWithoutProfile.slice(0, 3),
          suggested_fix: 'Ensure batch upload process populates issued_by field with uploader profile'
        });
      }
    }
  } catch (error) {
    console.error('Team member linkage check failed:', error);
  }

  return diagnostics;
}

/**
 * Generate a fix plan based on the diagnostics
 */
export function generateAPCertificateVisibilityFixPlan(diagnostics: APCertificateVisibilityDiagnostic[]): string[] {
  const fixes = [];
  
  const criticalIssues = diagnostics.filter(d => d.severity === 'critical');
  const highIssues = diagnostics.filter(d => d.severity === 'high');
  
  if (criticalIssues.length > 0) {
    fixes.push('🚨 CRITICAL FIXES REQUIRED:');
    criticalIssues.forEach(issue => {
      fixes.push(`- ${issue.issue_type}: ${issue.suggested_fix}`);
    });
  }
  
  if (highIssues.length > 0) {
    fixes.push('⚠️ HIGH PRIORITY FIXES:');
    highIssues.forEach(issue => {
      fixes.push(`- ${issue.issue_type}: ${issue.suggested_fix}`);
    });
  }
  
  // Add general recommendations
  fixes.push('\n🔧 GENERAL RECOMMENDATIONS:');
  fixes.push('- Ensure RLS policies for certificates table include location-based filtering for AP users');
  fixes.push('- Update certificate management queries to filter by AP user location assignments');
  fixes.push('- Add team member attribution to all certificate generation processes');
  fixes.push('- Implement consistent location_id usage across all certificate-related tables');
  
  return fixes;
}