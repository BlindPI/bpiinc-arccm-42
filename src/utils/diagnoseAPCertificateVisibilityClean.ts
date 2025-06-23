import { supabase } from '@/integrations/supabase/client';

export interface APCertificateVisibilityIssue {
  issue_type: string;
  severity: 'critical' | 'high' | 'medium';
  details: string;
  affected_count: number;
  sample_data?: any;
  fix_sql?: string;
}

/**
 * Clean diagnostic for AP certificate visibility following Team Management pattern
 * 
 * Flow: AP User -> Location Assignments -> Teams -> Team Members -> Certificate Requests
 * This mirrors the successful Team Management visibility pattern
 */
export async function diagnoseAPCertificateVisibilityClean(): Promise<{
  issues: APCertificateVisibilityIssue[];
  summary: {
    ap_location_assignments: number;
    teams_in_locations: number;
    team_members_count: number;
    certificate_requests_expected: number;
    certificate_requests_visible: number;
  };
}> {
  const issues: APCertificateVisibilityIssue[] = [];
  
  try {
    // Get current AP user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, display_name')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'AP') {
      throw new Error('User is not AP role');
    }

    console.log(`🔍 Diagnosing AP certificate visibility for: ${profile.display_name}`);

    // 1. Get AP user location assignments (same as Team Management)
    const { data: locationAssignments, error: locError } = await supabase
      .from('ap_user_location_assignments')
      .select(`
        location_id,
        locations!inner(id, name, city)
      `)
      .eq('user_id', user.id);

    if (locError) {
      issues.push({
        issue_type: 'location_assignment_query_failed',
        severity: 'critical',
        details: `Cannot query location assignments: ${locError.message}`,
        affected_count: 0,
        fix_sql: 'Check RLS policies for ap_user_location_assignments table'
      });
      return { issues, summary: { ap_location_assignments: 0, teams_in_locations: 0, team_members_count: 0, certificate_requests_expected: 0, certificate_requests_visible: 0 } };
    }

    const assignedLocationIds = locationAssignments?.map(a => a.location_id) || [];
    console.log(`📍 AP user assigned to ${assignedLocationIds.length} locations:`, assignedLocationIds);

    if (assignedLocationIds.length === 0) {
      issues.push({
        issue_type: 'no_location_assignments',
        severity: 'critical',
        details: 'AP user has no location assignments - cannot see any certificates',
        affected_count: 0,
        fix_sql: `INSERT INTO provider_location_assignments (user_id, location_id) VALUES ('${user.id}', 'location-uuid');`
      });
    }

    // 2. Get teams in assigned locations (same as Team Management pattern)
    const { data: teamsInLocations, error: teamsError } = await supabase
      .from('teams')
      .select('id, name, location_id')
      .in('location_id', assignedLocationIds);

    if (teamsError) {
      issues.push({
        issue_type: 'teams_query_failed',
        severity: 'high',
        details: `Cannot query teams in assigned locations: ${teamsError.message}`,
        affected_count: 0
      });
    }

    const teamIds = teamsInLocations?.map(t => t.id) || [];
    console.log(`👥 Found ${teamIds.length} teams in assigned locations:`, teamIds);

    // 3. Get team members from these teams (same as Team Management pattern)
    const { data: teamMembers, error: membersError } = await supabase
      .from('team_members')
      .select(`
        user_id,
        team_id,
        profiles!inner(display_name, email)
      `)
      .in('team_id', teamIds);

    if (membersError) {
      issues.push({
        issue_type: 'team_members_query_failed',
        severity: 'high',
        details: `Cannot query team members: ${membersError.message}`,
        affected_count: 0
      });
    }

    const teamMemberUserIds = teamMembers?.map(tm => tm.user_id) || [];
    console.log(`👤 Found ${teamMemberUserIds.length} team members in assigned locations`);

    // 4. Get certificate requests submitted by these team members
    const { data: expectedCertificateRequests, error: certReqError } = await supabase
      .from('certificate_requests')
      .select(`
        id, 
        recipient_name, 
        course_name, 
        status, 
        user_id,
        location_id,
        created_at,
        profiles!certificate_requests_user_id_fkey(display_name, email)
      `)
      .in('user_id', teamMemberUserIds);

    if (certReqError) {
      issues.push({
        issue_type: 'certificate_requests_query_failed',
        severity: 'critical',
        details: `Cannot query certificate requests: ${certReqError.message}`,
        affected_count: 0,
        fix_sql: `
-- Create RLS policy for AP users to see certificate requests from their team members
CREATE POLICY "ap_users_can_view_team_certificate_requests" ON certificate_requests
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'AP'
    AND EXISTS (
      SELECT 1 FROM provider_location_assignments pla
      JOIN teams t ON t.location_id = pla.location_id
      JOIN team_members tm ON tm.team_id = t.id
      WHERE pla.user_id = auth.uid()
      AND tm.user_id = certificate_requests.user_id
    )
  )
);`
      });
    }

    const expectedCount = expectedCertificateRequests?.length || 0;
    console.log(`📋 Expected certificate requests from team members: ${expectedCount}`);

    // 5. Test current certificate visibility with standard query (what AP user actually sees)
    const { data: visibleCertificateRequests, error: visibleError } = await supabase
      .from('certificate_requests')
      .select('id, recipient_name, course_name, status')
      .limit(100); // Standard query without specific filtering

    const visibleCount = visibleCertificateRequests?.length || 0;
    console.log(`👁️ Actually visible certificate requests: ${visibleCount}`);

    // 6. Check for visibility gap
    if (expectedCount > 0 && visibleCount === 0) {
      issues.push({
        issue_type: 'certificate_requests_visibility_blocked',
        severity: 'critical',
        details: `Expected ${expectedCount} certificate requests from team members, but AP user can see 0. RLS policy likely blocking access.`,
        affected_count: expectedCount,
        sample_data: expectedCertificateRequests?.slice(0, 3),
        fix_sql: `
-- Enable RLS policy for AP users
CREATE POLICY "ap_users_can_view_team_certificate_requests" ON certificate_requests
FOR SELECT USING (
  -- Allow AP users to see requests from team members in their assigned locations
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'AP'
    AND EXISTS (
      SELECT 1 FROM provider_location_assignments pla
      JOIN teams t ON t.location_id = pla.location_id  
      JOIN team_members tm ON tm.team_id = t.id
      WHERE pla.user_id = auth.uid()
      AND tm.user_id = certificate_requests.user_id
    )
  )
);`
      });
    }

    // 7. Check for location_id mismatch in certificate_requests
    if (expectedCertificateRequests) {
      const requestsWithMismatchedLocation = expectedCertificateRequests.filter(req => 
        req.location_id && !assignedLocationIds.includes(req.location_id)
      );

      if (requestsWithMismatchedLocation.length > 0) {
        issues.push({
          issue_type: 'certificate_requests_location_mismatch',
          severity: 'medium',
          details: `${requestsWithMismatchedLocation.length} certificate requests have location_id that doesn't match AP user assignments`,
          affected_count: requestsWithMismatchedLocation.length,
          sample_data: requestsWithMismatchedLocation.slice(0, 3)
        });
      }
    }

    // 8. Check certificates table visibility (generated certificates)
    const { data: certificates, error: certError } = await supabase
      .from('certificates')
      .select('id, recipient_name, course_name, status, location_id, issued_by')
      .in('location_id', assignedLocationIds)
      .limit(50);

    if (certError) {
      issues.push({
        issue_type: 'certificates_query_failed',
        severity: 'high',
        details: `Cannot query generated certificates: ${certError.message}`,
        affected_count: 0,
        fix_sql: `
-- Create RLS policy for AP users to see certificates in their assigned locations
CREATE POLICY "ap_users_can_view_location_certificates" ON certificates
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN provider_location_assignments pla ON pla.user_id = p.id
    WHERE p.id = auth.uid() AND p.role = 'AP'
    AND pla.location_id = certificates.location_id
  )
);`
      });
    }

    const summary = {
      ap_location_assignments: assignedLocationIds.length,
      teams_in_locations: teamIds.length,
      team_members_count: teamMemberUserIds.length,
      certificate_requests_expected: expectedCount,
      certificate_requests_visible: visibleCount
    };

    console.log('📊 Summary:', summary);

    return { issues, summary };

  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    issues.push({
      issue_type: 'diagnostic_error',
      severity: 'critical',
      details: `Diagnostic failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      affected_count: 0
    });

    return { 
      issues, 
      summary: { ap_location_assignments: 0, teams_in_locations: 0, team_members_count: 0, certificate_requests_expected: 0, certificate_requests_visible: 0 }
    };
  }
}

/**
 * Generate SQL migration to fix AP certificate visibility
 */
export function generateAPCertificateVisibilityFix(issues: APCertificateVisibilityIssue[]): string {
  const sqlStatements: string[] = [
    '-- Fix AP Certificate Visibility (Mirror Team Management Pattern)',
    '-- Date: ' + new Date().toISOString(),
    '',
  ];

  // Check if we need RLS policies
  const needsCertificateRequestsPolicy = issues.some(i => i.issue_type === 'certificate_requests_visibility_blocked');
  const needsCertificatesPolicy = issues.some(i => i.issue_type === 'certificates_query_failed');

  if (needsCertificateRequestsPolicy) {
    sqlStatements.push(
      '-- Enable AP users to see certificate requests from team members in assigned locations',
      'DROP POLICY IF EXISTS "ap_users_can_view_team_certificate_requests" ON certificate_requests;',
      '',
      'CREATE POLICY "ap_users_can_view_team_certificate_requests" ON certificate_requests',
      'FOR SELECT USING (',
      '  -- Allow AP users to see requests from team members in their assigned locations',
      '  EXISTS (',
      '    SELECT 1 FROM profiles p',
      '    WHERE p.id = auth.uid() AND p.role = \'AP\'',
      '    AND EXISTS (',
      '      SELECT 1 FROM provider_location_assignments pla',
      '      JOIN teams t ON t.location_id = pla.location_id',
      '      JOIN team_members tm ON tm.team_id = t.id',
      '      WHERE pla.user_id = auth.uid()',
      '      AND tm.user_id = certificate_requests.user_id',
      '    )',
      '  )',
      ');',
      ''
    );
  }

  if (needsCertificatesPolicy) {
    sqlStatements.push(
      '-- Enable AP users to see generated certificates in assigned locations',
      'DROP POLICY IF EXISTS "ap_users_can_view_location_certificates" ON certificates;',
      '',
      'CREATE POLICY "ap_users_can_view_location_certificates" ON certificates',
      'FOR SELECT USING (',
      '  EXISTS (',
      '    SELECT 1 FROM profiles p',
      '    JOIN provider_location_assignments pla ON pla.user_id = p.id',
      '    WHERE p.id = auth.uid() AND p.role = \'AP\'',
      '    AND pla.location_id = certificates.location_id',
      '  )',
      ');',
      ''
    );
  }

  sqlStatements.push(
    '-- Create indexes for performance',
    'CREATE INDEX IF NOT EXISTS idx_certificate_requests_user_id ON certificate_requests(user_id);',
    'CREATE INDEX IF NOT EXISTS idx_certificates_location_id ON certificates(location_id);',
    'CREATE INDEX IF NOT EXISTS idx_provider_location_assignments_user_location ON provider_location_assignments(user_id, location_id);',
    ''
  );

  return sqlStatements.join('\n');
}