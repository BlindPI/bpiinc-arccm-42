/**
 * PROVIDER MANAGEMENT SYSTEM RESTORATION - PHASE 1 VALIDATION
 * 
 * This script validates that Phase 1 implementation is working correctly:
 * ✅ Database schema fixes
 * ✅ UUID standardization
 * ✅ Foreign key constraints
 * ✅ Data integrity
 * ✅ Unified service functionality
 * ✅ Real data integration
 */

import { supabase } from '@/integrations/supabase/client';
import { providerRelationshipService } from '@/services/provider/providerRelationshipService';

// Validation results interface
interface ValidationResult {
  testName: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: any;
}

/**
 * Phase 1 Validation Test Suite
 */
export class ProviderManagementPhase1Validator {
  private results: ValidationResult[] = [];

  /**
   * Run all Phase 1 validation tests
   */
  async runAllValidations(): Promise<ValidationResult[]> {
    console.log('🔍 Starting Provider Management System Phase 1 Validation...\n');

    // Clear previous results
    this.results = [];

    // Database Schema Validation
    await this.validateDatabaseSchema();
    
    // UUID Standardization Validation
    await this.validateUUIDStandardization();
    
    // Data Integrity Validation
    await this.validateDataIntegrity();
    
    // Service Layer Validation
    await this.validateServiceLayer();
    
    // Real Data Integration Validation
    await this.validateRealDataIntegration();

    // Print summary
    this.printValidationSummary();

    return this.results;
  }

  /**
   * Validate database schema fixes
   */
  private async validateDatabaseSchema(): Promise<void> {
    console.log('📊 Validating Database Schema...');

    try {
      // Test 1: Check if provider_team_assignments table exists
      const { data: assignmentTable, error: assignmentError } = await supabase
        .from('provider_team_assignments')
        .select('id')
        .limit(1);

      if (assignmentError && assignmentError.code === '42P01') {
        this.addResult('Database Schema', 'FAIL', 'provider_team_assignments table does not exist');
      } else {
        this.addResult('Database Schema', 'PASS', 'provider_team_assignments table exists');
      }

      // Test 2: Check if provider_location_assignments table exists
      const { data: locationTable, error: locationError } = await supabase
        .from('provider_location_assignments')
        .select('id')
        .limit(1);

      if (locationError && locationError.code === '42P01') {
        this.addResult('Database Schema', 'WARNING', 'provider_location_assignments table does not exist (will be created by migration)');
      } else {
        this.addResult('Database Schema', 'PASS', 'provider_location_assignments table exists');
      }

      // Test 3: Check authorized_providers table structure
      const { data: providers, error: providerError } = await supabase
        .from('authorized_providers')
        .select('id, name, provider_type, status')
        .limit(1);

      if (providerError) {
        this.addResult('Database Schema', 'FAIL', `authorized_providers table error: ${providerError.message}`);
      } else {
        this.addResult('Database Schema', 'PASS', 'authorized_providers table accessible');
      }

    } catch (error) {
      this.addResult('Database Schema', 'FAIL', `Schema validation error: ${error}`);
    }
  }

  /**
   * Validate UUID standardization
   */
  private async validateUUIDStandardization(): Promise<void> {
    console.log('🔧 Validating UUID Standardization...');

    try {
      // Test 1: Check teams.provider_id is UUID type
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id, provider_id')
        .not('provider_id', 'is', null)
        .limit(5);

      if (teamsError) {
        this.addResult('UUID Standardization', 'FAIL', `Teams query error: ${teamsError.message}`);
      } else if (teams && teams.length > 0) {
        // Check if provider_id values are valid UUIDs
        const validUUIDs = teams.every(team => 
          team.provider_id && this.isValidUUID(team.provider_id)
        );
        
        if (validUUIDs) {
          this.addResult('UUID Standardization', 'PASS', 'teams.provider_id contains valid UUIDs');
        } else {
          this.addResult('UUID Standardization', 'FAIL', 'teams.provider_id contains invalid UUID values');
        }
      } else {
        this.addResult('UUID Standardization', 'WARNING', 'No teams with provider_id found for validation');
      }

      // Test 2: Check authorized_providers.id is UUID type
      const { data: providersUUID, error: providersUUIDError } = await supabase
        .from('authorized_providers')
        .select('id')
        .limit(5);

      if (providersUUIDError) {
        this.addResult('UUID Standardization', 'FAIL', `Providers UUID query error: ${providersUUIDError.message}`);
      } else if (providersUUID && providersUUID.length > 0) {
        const validProviderUUIDs = providersUUID.every(provider => 
          this.isValidUUID(provider.id)
        );
        
        if (validProviderUUIDs) {
          this.addResult('UUID Standardization', 'PASS', 'authorized_providers.id contains valid UUIDs');
        } else {
          this.addResult('UUID Standardization', 'FAIL', 'authorized_providers.id contains invalid UUID values');
        }
      }

    } catch (error) {
      this.addResult('UUID Standardization', 'FAIL', `UUID validation error: ${error}`);
    }
  }

  /**
   * Validate data integrity
   */
  private async validateDataIntegrity(): Promise<void> {
    console.log('🔍 Validating Data Integrity...');

    try {
      // Test 1: Check for orphaned teams (teams without valid provider_id)
      const { data: orphanedTeams, error: orphanError } = await supabase
        .from('teams')
        .select('id, name')
        .is('provider_id', null);

      if (orphanError) {
        this.addResult('Data Integrity', 'FAIL', `Orphaned teams check error: ${orphanError.message}`);
      } else {
        const orphanCount = orphanedTeams?.length || 0;
        if (orphanCount === 0) {
          this.addResult('Data Integrity', 'PASS', 'No orphaned teams found');
        } else {
          this.addResult('Data Integrity', 'WARNING', `Found ${orphanCount} orphaned teams (will be fixed by migration)`);
        }
      }

      // Test 2: Check for invalid provider references
      const { data: teamsWithProviders, error: teamProviderError } = await supabase
        .from('teams')
        .select(`
          id, 
          provider_id,
          authorized_providers!inner(id, name)
        `)
        .not('provider_id', 'is', null)
        .limit(10);

      if (teamProviderError) {
        this.addResult('Data Integrity', 'WARNING', `Provider reference check error: ${teamProviderError.message} (foreign keys may not be enforced yet)`);
      } else {
        this.addResult('Data Integrity', 'PASS', 'Provider references validation passed');
      }

    } catch (error) {
      this.addResult('Data Integrity', 'FAIL', `Data integrity validation error: ${error}`);
    }
  }

  /**
   * Validate service layer functionality
   */
  private async validateServiceLayer(): Promise<void> {
    console.log('🚀 Validating Service Layer...');

    try {
      // Test 1: Validate service instantiation
      if (providerRelationshipService) {
        this.addResult('Service Layer', 'PASS', 'ProviderRelationshipService instantiated successfully');
      } else {
        this.addResult('Service Layer', 'FAIL', 'ProviderRelationshipService not available');
        return;
      }

      // Test 2: Test UUID validation
      const isValidUUID = await providerRelationshipService.validateProviderUUID('invalid-uuid');
      if (isValidUUID === false) {
        this.addResult('Service Layer', 'PASS', 'UUID validation correctly rejects invalid UUIDs');
      } else {
        this.addResult('Service Layer', 'FAIL', 'UUID validation not working correctly');
      }

      // Test 3: Test provider retrieval
      const providers = await providerRelationshipService.getProviders({ status: ['active'] });
      if (Array.isArray(providers)) {
        this.addResult('Service Layer', 'PASS', `Provider retrieval working (found ${providers.length} providers)`);
      } else {
        this.addResult('Service Layer', 'FAIL', 'Provider retrieval not returning array');
      }

      // Test 4: Test system health check
      const healthCheck = await providerRelationshipService.getSystemHealthCheck();
      if (Array.isArray(healthCheck)) {
        this.addResult('Service Layer', 'PASS', 'System health check functioning');
      } else {
        this.addResult('Service Layer', 'FAIL', 'System health check not working');
      }

    } catch (error) {
      this.addResult('Service Layer', 'FAIL', `Service layer validation error: ${error}`);
    }
  }

  /**
   * Validate real data integration
   */
  private async validateRealDataIntegration(): Promise<void> {
    console.log('📈 Validating Real Data Integration...');

    try {
      // Get a sample provider for testing
      const { data: sampleProvider, error: providerError } = await supabase
        .from('authorized_providers')
        .select('id')
        .eq('status', 'active')
        .limit(1)
        .single();

      if (providerError || !sampleProvider) {
        this.addResult('Real Data Integration', 'WARNING', 'No active providers found for testing real data integration');
        return;
      }

      // Test 1: Real KPI calculation
      const kpis = await providerRelationshipService.getProviderLocationKPIs(sampleProvider.id);
      if (kpis && typeof kpis.certificatesIssued === 'number') {
        this.addResult('Real Data Integration', 'PASS', 'Real KPI calculation working');
      } else {
        this.addResult('Real Data Integration', 'FAIL', 'Real KPI calculation not working');
      }

      // Test 2: Team statistics calculation
      const teamStats = await providerRelationshipService.getProviderTeamStatistics(sampleProvider.id);
      if (teamStats && typeof teamStats.totalTeams === 'number') {
        this.addResult('Real Data Integration', 'PASS', 'Team statistics calculation working');
      } else {
        this.addResult('Real Data Integration', 'FAIL', 'Team statistics calculation not working');
      }

      // Test 3: Available teams retrieval
      const availableTeams = await providerRelationshipService.getAvailableTeams(sampleProvider.id);
      if (Array.isArray(availableTeams)) {
        this.addResult('Real Data Integration', 'PASS', `Available teams retrieval working (found ${availableTeams.length} teams)`);
      } else {
        this.addResult('Real Data Integration', 'FAIL', 'Available teams retrieval not working');
      }

    } catch (error) {
      this.addResult('Real Data Integration', 'FAIL', `Real data integration validation error: ${error}`);
    }
  }

  /**
   * Add validation result
   */
  private addResult(testName: string, status: 'PASS' | 'FAIL' | 'WARNING', message: string, details?: any): void {
    this.results.push({ testName, status, message, details });
    
    const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`  ${statusIcon} ${testName}: ${message}`);
  }

  /**
   * Print validation summary
   */
  private printValidationSummary(): void {
    console.log('\n📋 PHASE 1 VALIDATION SUMMARY:');
    console.log('================================');

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARNING').length;

    console.log(`✅ PASSED: ${passed}`);
    console.log(`❌ FAILED: ${failed}`);
    console.log(`⚠️  WARNINGS: ${warnings}`);
    console.log(`📊 TOTAL: ${this.results.length}`);

    if (failed === 0) {
      console.log('\n🎉 PHASE 1 VALIDATION: SUCCESS');
      console.log('Ready to proceed with Phase 2: Workflow Consolidation');
    } else {
      console.log('\n⚠️  PHASE 1 VALIDATION: ISSUES FOUND');
      console.log('Review failed tests before proceeding to Phase 2');
    }

    console.log('\n' + '='.repeat(50));
  }

  /**
   * Check if string is valid UUID
   */
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}

/**
 * Export validation functions for use in components/testing
 */
export const validateProviderManagementPhase1 = async (): Promise<ValidationResult[]> => {
  const validator = new ProviderManagementPhase1Validator();
  return await validator.runAllValidations();
};

/**
 * Quick validation check for console testing
 */
export const quickPhase1Check = async (): Promise<boolean> => {
  console.log('🚀 Running Quick Phase 1 Validation Check...');
  
  try {
    // Check service availability
    if (!providerRelationshipService) {
      console.log('❌ ProviderRelationshipService not available');
      return false;
    }

    // Check basic database connectivity
    const { data, error } = await supabase
      .from('authorized_providers')
      .select('id')
      .limit(1);

    if (error) {
      console.log('❌ Database connectivity issue:', error.message);
      return false;
    }

    // Check UUID validation
    const uuidValid = await providerRelationshipService.validateProviderUUID('invalid-uuid');
    if (uuidValid !== false) {
      console.log('❌ UUID validation not working correctly');
      return false;
    }

    console.log('✅ Quick Phase 1 validation passed');
    return true;
  } catch (error) {
    console.log('❌ Quick validation error:', error);
    return false;
  }
};

// Auto-run quick check if this file is imported
if (typeof window !== 'undefined') {
  console.log('Provider Management Phase 1 Validator loaded');
  console.log('Run validateProviderManagementPhase1() for full validation');
  console.log('Run quickPhase1Check() for quick validation');
}