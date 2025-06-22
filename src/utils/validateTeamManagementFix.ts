/**
 * TEAM MANAGEMENT NULL ACCESS FIX VALIDATION
 * 
 * This utility validates that the team management system can handle
 * users with null profile fields without crashing.
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  getSafeUserEmail, 
  getSafeUserPhone, 
  getSafeUserDisplayName, 
  hasValidEmail, 
  hasValidPhone,
  makeSafeTeamMember,
  safeProfileSearchFilter
} from './fixNullProfileAccessPatterns';

export interface TestResult {
  test: string;
  passed: boolean;
  error?: string;
  details?: any;
}

/**
 * Test safe access utilities with null values
 */
export function testSafeAccessUtilities(): TestResult[] {
  const results: TestResult[] = [];
  
  // Test with null user object
  try {
    const nullUser = null;
    const safeEmail = getSafeUserEmail(nullUser);
    const safePhone = getSafeUserPhone(nullUser);
    const safeName = getSafeUserDisplayName(nullUser);
    
    results.push({
      test: 'Safe access with null user object',
      passed: safeEmail === null && safePhone === null && safeName === 'Unknown User',
      details: { safeEmail, safePhone, safeName }
    });
  } catch (error: any) {
    results.push({
      test: 'Safe access with null user object',
      passed: false,
      error: error.message
    });
  }
  
  // Test with user having null fields
  try {
    const userWithNullFields = {
      id: 'test-123',
      email: null,
      phone: null,
      display_name: null,
      role: 'AP',
      status: 'active'
    };
    
    const safeEmail = getSafeUserEmail(userWithNullFields);
    const safePhone = getSafeUserPhone(userWithNullFields);
    const safeName = getSafeUserDisplayName(userWithNullFields);
    const hasEmail = hasValidEmail(userWithNullFields);
    const hasPhone = hasValidPhone(userWithNullFields);
    
    results.push({
      test: 'Safe access with null profile fields',
      passed: safeEmail === null && safePhone === null && safeName === 'Unknown User' && !hasEmail && !hasPhone,
      details: { safeEmail, safePhone, safeName, hasEmail, hasPhone }
    });
  } catch (error: any) {
    results.push({
      test: 'Safe access with null profile fields',
      passed: false,
      error: error.message
    });
  }
  
  // Test search filtering with null fields
  try {
    const usersWithNullFields = [
      { id: '1', email: null, phone: null, display_name: 'John Doe' },
      { id: '2', email: 'test@example.com', phone: null, display_name: null },
      { id: '3', email: null, phone: '555-1234', display_name: null }
    ];
    
    const searchResults = usersWithNullFields.filter(user => 
      safeProfileSearchFilter(user, 'john', ['email', 'display_name', 'phone'])
    );
    
    results.push({
      test: 'Safe search filtering with null fields',
      passed: searchResults.length === 1 && searchResults[0].id === '1',
      details: { searchResults }
    });
  } catch (error: any) {
    results.push({
      test: 'Safe search filtering with null fields',
      passed: false,
      error: error.message
    });
  }
  
  // Test team member transformation
  try {
    const teamMemberWithNullUser = {
      id: 'member-123',
      user_id: 'user-123',
      role: 'member',
      status: 'active',
      user: {
        id: 'user-123',
        email: null,
        phone: null,
        display_name: null,
        role: 'AP',
        status: 'active'
      }
    };
    
    const safeMember = makeSafeTeamMember(teamMemberWithNullUser);
    
    results.push({
      test: 'Safe team member transformation',
      passed: safeMember.safe_display_name === 'Unknown User' && 
              safeMember.safe_email === 'No email' &&
              safeMember.safe_phone === 'No phone' &&
              !safeMember.has_email &&
              !safeMember.has_phone,
      details: { safeMember }
    });
  } catch (error: any) {
    results.push({
      test: 'Safe team member transformation',
      passed: false,
      error: error.message
    });
  }
  
  return results;
}

/**
 * Test database queries for null field handling
 */
export async function testDatabaseQueries(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  // Test profiles query with null fields
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, phone, display_name, role, status')
      .eq('role', 'AP')
      .limit(5);
    
    if (error) throw error;
    
    // Test safe access on real data
    const processedProfiles = profiles?.map(profile => ({
      ...profile,
      safe_email: getSafeUserEmail(profile),
      safe_phone: getSafeUserPhone(profile),
      safe_display_name: getSafeUserDisplayName(profile),
      has_email: hasValidEmail(profile),
      has_phone: hasValidPhone(profile)
    })) || [];
    
    results.push({
      test: 'Database profiles query with safe access',
      passed: true,
      details: { 
        profileCount: profiles?.length || 0,
        nullEmails: profiles?.filter(p => p.email === null).length || 0,
        nullPhones: profiles?.filter(p => p.phone === null).length || 0,
        processedProfiles
      }
    });
  } catch (error: any) {
    results.push({
      test: 'Database profiles query with safe access',
      passed: false,
      error: error.message
    });
  }
  
  // Test team members query with null fields
  try {
    const { data: teamMembers, error } = await supabase
      .from('team_members')
      .select(`
        *,
        user:profiles(
          id,
          email,
          display_name,
          phone,
          role,
          status
        )
      `)
      .limit(5);
    
    if (error) throw error;
    
    // Test safe processing of team members
    const safeTeamMembers = teamMembers?.map(makeSafeTeamMember) || [];
    
    results.push({
      test: 'Database team members query with safe processing',
      passed: true,
      details: { 
        memberCount: teamMembers?.length || 0,
        safeTeamMembers
      }
    });
  } catch (error: any) {
    results.push({
      test: 'Database team members query with safe processing',
      passed: false,
      error: error.message
    });
  }
  
  return results;
}

/**
 * Simulate the error scenario and test fix
 */
export function simulateNullPhoneError(): TestResult {
  try {
    // Simulate the original error scenario
    const teamMember = {
      id: 'member-123',
      user: null // This would cause the original error
    };
    
    // Try to access phone (this would throw the original error)
    // const phone = teamMember.user.phone; // This would throw "Cannot read properties of null (reading 'phone')"
    
    // Test our safe access instead
    const safePhone = getSafeUserPhone(teamMember.user);
    const hasPhone = hasValidPhone(teamMember.user);
    
    return {
      test: 'Simulate and fix null phone access error',
      passed: safePhone === null && hasPhone === false,
      details: { safePhone, hasPhone }
    };
  } catch (error: any) {
    return {
      test: 'Simulate and fix null phone access error',
      passed: false,
      error: error.message
    };
  }
}

/**
 * Run comprehensive validation
 */
export async function validateTeamManagementFix(): Promise<{
  passed: boolean;
  results: TestResult[];
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
  };
}> {
  console.log('🔍 Validating team management null access fixes...\n');
  
  const allResults: TestResult[] = [];
  
  // Test safe access utilities
  const utilityResults = testSafeAccessUtilities();
  allResults.push(...utilityResults);
  
  // Test database queries
  const dbResults = await testDatabaseQueries();
  allResults.push(...dbResults);
  
  // Test error simulation
  const simulationResult = simulateNullPhoneError();
  allResults.push(simulationResult);
  
  const summary = {
    totalTests: allResults.length,
    passedTests: allResults.filter(r => r.passed).length,
    failedTests: allResults.filter(r => !r.passed).length
  };
  
  const passed = summary.failedTests === 0;
  
  // Log results
  console.log('📊 VALIDATION RESULTS:');
  console.log(`  Total Tests: ${summary.totalTests}`);
  console.log(`  ✅ Passed: ${summary.passedTests}`);
  console.log(`  ❌ Failed: ${summary.failedTests}`);
  console.log(`  Overall: ${passed ? '✅ PASSED' : '❌ FAILED'}\n`);
  
  allResults.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.test}`);
    if (!result.passed && result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  return { passed, results: allResults, summary };
}

export default {
  testSafeAccessUtilities,
  testDatabaseQueries,
  simulateNullPhoneError,
  validateTeamManagementFix
};