import { ComplianceTierService } from '@/services/compliance/complianceTierService';
import { ComplianceService } from '@/services/compliance/complianceService';
import { ComplianceRequirementsService } from '@/services/compliance/complianceRequirementsService'; // Added import
import { supabase } from '@/integrations/supabase/client'; // Assuming supabase client is needed for user creation/deletion

console.log("Starting Compliance Integration Tests...");

// --- Helper Functions (for test setup/teardown) ---

async function createTestUser(role: 'IT' | 'IP' | 'IC' | 'AP'): Promise<string> {
  const email = `test-user-${Date.now()}@example.com`;
  const password = `Password123!`;
  const display_name = `Test User ${Date.now().toString().slice(-4)}`;

  const { data: userData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name,
        role: role,
        compliance_tier: 'basic' // Default to basic for new user
      }
    }
  });

  if (signUpError) {
    if (signUpError.message.includes('already registered')) {
      console.warn(`User ${email} already exists. Attempting to retrieve existing user.`);
      const { data: existingUser } = await supabase.from('profiles').select('id').eq('email', email).single();
      if (existingUser) return existingUser.id;
    }
    throw new Error(`Failed to create test user: ${signUpError.message}`);
  }

  if (!userData?.user?.id) {
    throw new Error('User data or user ID is missing after sign-up.');
  }

  console.log(`Created test user: ${display_name} (${userData.user.id}) with role ${role}`);
  return userData.user.id;
}

async function cleanupUser(userId: string) {
  try {
    // Delete from profiles table (assuming RLS allows this for admin or self)
    const { error: profileError } = await supabase.from('profiles').delete().eq('id', userId);
    if (profileError) console.error(`Error deleting profile for user ${userId}:`, profileError.message);

    // Delete associated auth user (requires admin privileges, might fail in client-side tests)
    // Only attempt if running in a privileged environment or if it's a server-side function
    // const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    // if (authError) console.error(`Error deleting auth user ${userId}:`, authError.message);
    
    // Clear compliance records
    await ComplianceService.deleteUserComplianceRecords(userId);

    console.log(`Cleaned up user ${userId}`);
  } catch (error) {
    console.error(`Error during cleanup for user ${userId}:`, error);
  }
}

// --- Test Scenarios ---

/**
 * Scenario 1: New User Basic Tier Assignment
 * Creates a new IT user and assigns them to the 'basic' compliance tier.
 * Verifies that the tier and initial requirements are correctly set.
 */
async function testScenario1_BasicTierAssignment() {
  console.log("\n--- Scenario 1: New User Basic Tier Assignment ---");
  let userId: string | null = null;
  try {
    userId = await createTestUser('IT'); // Create an Instructor Trainee user
    const userRole = 'IT';
    const initialTier = 'basic';

    console.log(`Attempting to assign ${initialTier} tier to user ${userId}...`);
    const assignResult = await ComplianceTierService.assignComplianceTier(userId, userRole, initialTier);

    if (!assignResult.success) {
      console.error(`FAIL: Failed to assign basic tier: ${assignResult.message}`);
      return;
    }
    console.log(`SUCCESS: Assign tier result: ${assignResult.message}`);

    const tierInfo = await ComplianceTierService.getUserComplianceTierInfo(userId);

    if (!tierInfo) {
      console.error("FAIL: Could not retrieve tier info after assignment.");
      return;
    }

    if (tierInfo.tier === initialTier && tierInfo.total_requirements > 0) {
      console.log(`PASS: User ${userId} successfully assigned to ${tierInfo.tier} tier with ${tierInfo.total_requirements} requirements.`);
    } else {
      console.error(`FAIL: User ${userId} tier expected ${initialTier}, got ${tierInfo.tier}. Total requirements: ${tierInfo.total_requirements}.`);
    }

  } catch (error) {
    console.error("Scenario 1 Error:", error);
    console.error("FAIL: Scenario 1 failed due to an unexpected error.");
  } finally {
    if (userId) await cleanupUser(userId);
  }
}

/**
 * Scenario 2: Tier Switching
 * Creates an IT user, assigns 'basic' tier, then switches them to 'robust' tier.
 * Verifies that the tier changes and new requirements are assigned.
 */
async function testScenario2_TierSwitching() {
  console.log("\n--- Scenario 2: Tier Switching ---");
  let userId: string | null = null;
  try {
    userId = await createTestUser('IT');
    const userRole = 'IT';
    
    // Initial assignment to basic tier
    await ComplianceTierService.assignComplianceTier(userId, userRole, 'basic');
    console.log(`User ${userId} initially set to basic tier.`);

    const switchResult = await ComplianceTierService.switchComplianceTier(userId, 'robust');

    if (!switchResult.success) {
      console.error(`FAIL: Failed to switch tier to robust: ${switchResult.message}`);
      return;
    }
    console.log(`SUCCESS: Tier switch result: ${switchResult.message}`);

    const tierInfo = await ComplianceTierService.getUserComplianceTierInfo(userId);

    if (!tierInfo) {
      console.error("FAIL: Could not retrieve tier info after switch.");
      return;
    }

    if (tierInfo.tier === 'robust' && tierInfo.total_requirements > 0) {
      console.log(`PASS: User ${userId} successfully switched to ${tierInfo.tier} tier with ${tierInfo.total_requirements} requirements.`);
    } else {
      console.error(`FAIL: User ${userId} tier expected robust, got ${tierInfo.tier}. Total requirements: ${tierInfo.total_requirements}.`);
    }

  } catch (error) {
    console.error("Scenario 2 Error:", error);
    console.error("FAIL: Scenario 2 failed due to an unexpected error.");
  } finally {
    if (userId) await cleanupUser(userId);
  }
}

/**
 * Scenario 3: Role Change with Tier Preservation (Conceptual)
 * This scenario is more complex as it would involve a user role change mechanism,
 * which is outside the scope of direct compliance service. However, we can simulate
 * calling `updateUserRoleRequirements` directly.
 * Creates an IT user with robust tier and then "changes" their role to IP with robust tier.
 * Verifies that the requirements update appropriately based on the new role and preserved tier.
 * NOTE: This does NOT update the actual 'role' column in `profiles`, only tests the compliance service logic.
 */
async function testScenario3_RoleChangeWithTier() {
  console.log("\n--- Scenario 3: Role Change with Tier Preservation ---");
  let userId: string | null = null;
  try {
    userId = await createTestUser('IT');
    const initialRole = 'IT';
    const initialTier = 'robust';
    const newRole = 'IP';
    const newTier = 'robust'; // Preserve tier

    // Initialize user with initial role and tier
    await ComplianceTierService.assignComplianceTier(userId, initialRole, initialTier);
    console.log(`User ${userId} initially set to ${initialRole}:${initialTier} compliance.`);

    // Simulate role change in compliance logic
    const updateResult = await ComplianceRequirementsService.updateUserRoleRequirements(
      userId,
      initialRole,
      newRole,
      initialTier,
      newTier
    );
    console.log(`Simulated role change for user ${userId} to ${newRole}:${newTier}.`);

    const tierInfo = await ComplianceTierService.getUserComplianceTierInfo(userId);

    if (!tierInfo) {
      console.error("FAIL: Could not retrieve tier info after simulated role change.");
      return;
    }

    // Verify the tier is preserved and new role's requirements are active
    if (tierInfo.tier === newTier && tierInfo.template_name.includes(newRole) && tierInfo.total_requirements > 0) {
      console.log(`PASS: User ${userId} compliance successfully updated for role ${newRole} with ${tierInfo.tier} tier.`);
      console.log(`Template name: ${tierInfo.template_name}, Total requirements: ${tierInfo.total_requirements}.`);
      
      // Optionally, fetch compliance records to verify specific metric names for IP_ROBUST
      const userRecords = await ComplianceService.getUserComplianceRecords(userId);
      const hasParticipationTraining = userRecords.some(r => r.compliance_metrics?.name.includes('Participation Training') && r.compliance_status !== 'not_applicable');
      const hasPracticalAssessment = userRecords.some(r => r.compliance_metrics?.name.includes('Practical Assessment') && r.compliance_status !== 'not_applicable');

      if (hasParticipationTraining && hasPracticalAssessment) {
        console.log("PASS: User has correct IP_ROBUST specific requirements active.");
      } else {
        console.error("FAIL: User does not have expected IP_ROBUST specific requirements active.");
      }

    } else {
      console.error(`FAIL: User ${userId} compliance template or tier not as expected after simulated role change. Template: ${tierInfo.template_name}, Tier: ${tierInfo.tier}.`);
    }

  } catch (error) {
    console.error("Scenario 3 Error:", error);
    console.error("FAIL: Scenario 3 failed due to an unexpected error.");
  } finally {
    if (userId) await cleanupUser(userId);
  }
}

// --- Run All Tests ---
async function runAllIntegrationTests() {
  console.log("Running all compliance integration tests...");
  await testScenario1_BasicTierAssignment();
  await testScenario2_TierSwitching();
  await testScenario3_RoleChangeWithTier();
  console.log("\nCompliance Integration Tests Finished.");
}

// To run these tests:
// 1. Ensure your Supabase environment is correctly configured (SUPABASE_URL, SUPABASE_ANON_KEY).
// 2. Ensure your local Supabase schema matches the migrations you've run (profiles, compliance_metrics, etc.).
// 3. You might need to adjust RLS policies in Supabase for tests to pass, especially for user creation/deletion by specific roles.
// 4. Execute this file using a Node.js environment or a test runner.
//    Example (if directly executable via Node with TS-Node or Babel): `npx ts-node src/test/complianceIntegrationTests.ts`
//    Or, if part of a Jest/Vitest setup, import and call `runAllIntegrationTests()` from a test file.
//    Make sure to handle authentication (`supabase.auth.signInUserWithPassword`) to get appropriate user sessions if RLS is strict.
//    For client-side components to run these, consider adapting them for a component test framework.

// For simple execution as a script, uncomment the following line (requires proper env setup and execution context)
// runAllIntegrationTests().catch(console.error);

// Export for external test runners
export { runAllIntegrationTests };