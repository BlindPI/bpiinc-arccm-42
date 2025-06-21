import { supabase } from '@/integrations/supabase/client';

export interface DiagnosticResult {
  category: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: any;
}

export class ProviderTeamManagementDiagnostics {
  private results: DiagnosticResult[] = [];

  private addResult(category: string, test: string, status: 'PASS' | 'FAIL' | 'WARNING', message: string, details?: any) {
    this.results.push({ category, test, status, message, details });
    console.log(`[${status}] ${category} - ${test}: ${message}`, details || '');
  }

  async runAllDiagnostics(): Promise<DiagnosticResult[]> {
    console.log('🔍 Starting Provider Team Management Diagnostics...\n');
    
    await this.checkDatabaseTables();
    await this.checkDatabaseFunctions();
    await this.checkDataIntegrity();
    await this.checkProviderRelationshipService();
    await this.checkProviderTeamAssignments();
    
    console.log('\n📊 Diagnostics Summary:');
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARNING').length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    
    return this.results;
  }

  private async checkDatabaseTables() {
    console.log('\n🗄️  Checking Database Tables...');
    
    const requiredTables = [
      'profiles',
      'teams',
      'team_members',
      'locations',
      'providers',
      'authorized_providers',
      'ap_user_location_assignments',
      'provider_team_assignments',
      'provider_training_capabilities',
      'provider_team_performance'
    ];

    for (const table of requiredTables) {
      try {
        const { data, error } = await supabase
          .from(table as any)
          .select('*')
          .limit(1);
        
        if (error) {
          this.addResult('Database Tables', table, 'FAIL', `Table does not exist or is not accessible: ${error.message}`);
        } else {
          this.addResult('Database Tables', table, 'PASS', 'Table exists and is accessible');
        }
      } catch (err: any) {
        this.addResult('Database Tables', table, 'FAIL', `Error accessing table: ${err.message}`);
      }
    }
  }

  private async checkDatabaseFunctions() {
    console.log('\n⚙️  Checking Database Functions...');
    
    const requiredFunctions = [
      'get_available_ap_users_for_location',
      'get_ap_user_assignments',
      'assign_ap_user_to_location',
      'assign_provider_to_team',
      'get_provider_team_assignments',
      'record_provider_team_performance'
    ];

    for (const func of requiredFunctions) {
      try {
        // Test function existence by calling with null parameters
        const { data, error } = await supabase.rpc(func as any, {});
        
        if (error && error.message.includes('function') && error.message.includes('does not exist')) {
          this.addResult('Database Functions', func, 'FAIL', 'Function does not exist');
        } else {
          this.addResult('Database Functions', func, 'PASS', 'Function exists');
        }
      } catch (err: any) {
        if (err.message.includes('function') && err.message.includes('does not exist')) {
          this.addResult('Database Functions', func, 'FAIL', 'Function does not exist');
        } else {
          this.addResult('Database Functions', func, 'WARNING', `Function exists but may have parameter issues: ${err.message}`);
        }
      }
    }
  }

  private async checkDataIntegrity() {
    console.log('\n🔗 Checking Data Integrity...');
    
    try {
      // Check for AP users
      const { data: apUsers, error: apError } = await supabase
        .from('profiles')
        .select('id, display_name, email, role')
        .eq('role', 'AP')
        .eq('status', 'ACTIVE');
      
      if (apError) {
        this.addResult('Data Integrity', 'AP Users', 'FAIL', `Error fetching AP users: ${apError.message}`);
      } else {
        this.addResult('Data Integrity', 'AP Users', apUsers.length > 0 ? 'PASS' : 'WARNING', 
          `Found ${apUsers.length} AP users`, { count: apUsers.length });
      }

      // Check for teams
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name, status')
        .eq('status', 'active');
      
      if (teamsError) {
        this.addResult('Data Integrity', 'Teams', 'FAIL', `Error fetching teams: ${teamsError.message}`);
      } else {
        this.addResult('Data Integrity', 'Teams', teams.length > 0 ? 'PASS' : 'WARNING', 
          `Found ${teams.length} active teams`, { count: teams.length });
      }

      // Check for locations
      const { data: locations, error: locError } = await supabase
        .from('locations')
        .select('id, name');
      
      if (locError) {
        this.addResult('Data Integrity', 'Locations', 'FAIL', `Error fetching locations: ${locError.message}`);
      } else {
        this.addResult('Data Integrity', 'Locations', locations.length > 0 ? 'PASS' : 'WARNING', 
          `Found ${locations.length} locations`, { count: locations.length });
      }

      // Check for providers
      const { data: providers, error: provError } = await supabase
        .from('providers')
        .select('id, name, status');
      
      if (provError) {
        this.addResult('Data Integrity', 'Providers', 'FAIL', `Error fetching providers: ${provError.message}`);
      } else {
        this.addResult('Data Integrity', 'Providers', providers.length > 0 ? 'PASS' : 'WARNING', 
          `Found ${providers.length} providers`, { count: providers.length });
      }

    } catch (err: any) {
      this.addResult('Data Integrity', 'General', 'FAIL', `Unexpected error: ${err.message}`);
    }
  }

  private async checkAPUserService() {
    console.log('\n👤 Checking AP User Service...');
    
    try {
      // Test getAPUsers
      const { data: apUsers, error: apError } = await supabase
        .from('profiles')
        .select('id, display_name, email, role, created_at, updated_at, status, phone, organization, job_title')
        .eq('role', 'AP')
        .eq('status', 'ACTIVE')
        .order('display_name');

      if (apError) {
        this.addResult('AP User Service', 'getAPUsers', 'FAIL', `Service method failed: ${apError.message}`);
      } else {
        this.addResult('AP User Service', 'getAPUsers', 'PASS', `Successfully fetched ${apUsers.length} AP users`);
      }

      // Test getAPUserAssignments - check if table exists first
      try {
        const { data: assignments, error: assignError } = await supabase
          .from('ap_user_location_assignments' as any)
          .select('*')
          .limit(1);
        
        if (assignError) {
          this.addResult('AP User Service', 'getAPUserAssignments', 'FAIL', `Table access failed: ${assignError.message}`);
        } else {
          this.addResult('AP User Service', 'getAPUserAssignments', 'PASS', `Assignment table accessible`);
        }
      } catch (err: any) {
        this.addResult('AP User Service', 'getAPUserAssignments', 'FAIL', `Assignment table error: ${err.message}`);
      }

    } catch (err: any) {
      this.addResult('AP User Service', 'General', 'FAIL', `Service error: ${err.message}`);
    }
  }

  private async checkProviderRelationshipService() {
    console.log('\n🤝 Checking Provider Relationship Service...');
  }

  private async checkProviderTeamAssignments() {
    console.log('\n🤝 Checking Provider Team Assignments...');
    
    try {
      // Check provider_team_assignments table
      const { data: assignments, error: assignError } = await supabase
        .from('provider_team_assignments')
        .select('*')
        .limit(5);
      
      if (assignError) {
        this.addResult('Provider Team Assignments', 'Table Access', 'FAIL', `Cannot access assignments table: ${assignError.message}`);
      } else {
        this.addResult('Provider Team Assignments', 'Table Access', 'PASS', `Found ${assignments.length} assignments`);
      }

      // Check provider_training_capabilities table
      const { data: capabilities, error: capError } = await supabase
        .from('provider_training_capabilities')
        .select('*')
        .limit(5);
      
      if (capError) {
        this.addResult('Provider Team Assignments', 'Capabilities Table', 'FAIL', `Cannot access capabilities table: ${capError.message}`);
      } else {
        this.addResult('Provider Team Assignments', 'Capabilities Table', 'PASS', `Found ${capabilities.length} capabilities`);
      }

      // Check provider_team_performance table
      const { data: performance, error: perfError } = await supabase
        .from('provider_team_performance')
        .select('*')
        .limit(5);
      
      if (perfError) {
        this.addResult('Provider Team Assignments', 'Performance Table', 'FAIL', `Cannot access performance table: ${perfError.message}`);
      } else {
        this.addResult('Provider Team Assignments', 'Performance Table', 'PASS', `Found ${performance.length} performance records`);
      }

    } catch (err: any) {
      this.addResult('Provider Team Assignments', 'General', 'FAIL', `Unexpected error: ${err.message}`);
    }
  }

  getFailedTests(): DiagnosticResult[] {
    return this.results.filter(r => r.status === 'FAIL');
  }

  getWarnings(): DiagnosticResult[] {
    return this.results.filter(r => r.status === 'WARNING');
  }

  getAllResults(): DiagnosticResult[] {
    return this.results;
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).ProviderTeamManagementDiagnostics = ProviderTeamManagementDiagnostics;
}

export const providerTeamDiagnostics = new ProviderTeamManagementDiagnostics();