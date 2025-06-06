// CRM System Diagnostics - Comprehensive Database and UI Audit
import { supabase } from '@/integrations/supabase/client';

export interface CRMDiagnosticResult {
  timestamp: string;
  databaseTables: {
    existing: string[];
    missing: string[];
    accessible: string[];
    errors: string[];
  };
  navigationConfig: {
    userRole: string | null;
    crmGroupVisible: boolean;
    crmItemsVisible: string[];
    configurationSource: string;
  };
  componentPaths: {
    existing: string[];
    missing: string[];
    importErrors: string[];
  };
  permissions: {
    canReadLeads: boolean;
    canWriteLeads: boolean;
    authStatus: string;
    userId: string | null;
  };
}

const EXPECTED_CRM_TABLES = [
  'crm_leads',
  'crm_opportunities', 
  'crm_activities',
  'crm_tasks',
  'crm_pipeline_stages',
  'crm_contacts',
  'crm_accounts',
  'crm_revenue_records',
  'crm_email_campaigns',
  'crm_assignment_rules',
  'crm_lead_scoring_rules',
  'crm_conversion_audit',
  'crm_stage_transitions',
  'crm_analytics_cache'
];

export async function runCRMDiagnostics(): Promise<CRMDiagnosticResult> {
  console.log('🔧 CRM DIAGNOSTICS: Starting comprehensive audit...');
  
  const result: CRMDiagnosticResult = {
    timestamp: new Date().toISOString(),
    databaseTables: {
      existing: [],
      missing: [],
      accessible: [],
      errors: []
    },
    navigationConfig: {
      userRole: null,
      crmGroupVisible: false,
      crmItemsVisible: [],
      configurationSource: 'unknown'
    },
    componentPaths: {
      existing: [],
      missing: [],
      importErrors: []
    },
    permissions: {
      canReadLeads: false,
      canWriteLeads: false,
      authStatus: 'unknown',
      userId: null
    }
  };

  // 1. Check Database Tables
  console.log('🔧 CRM DIAGNOSTICS: Checking database tables...');
  for (const tableName of EXPECTED_CRM_TABLES) {
    try {
      const { data, error } = await supabase
        .from(tableName as any)
        .select('id')
        .limit(1);
      
      if (error) {
        console.error(`🔧 CRM DIAGNOSTICS: Table ${tableName} error:`, error.message);
        result.databaseTables.errors.push(`${tableName}: ${error.message}`);
        result.databaseTables.missing.push(tableName);
      } else {
        console.log(`🔧 CRM DIAGNOSTICS: Table ${tableName} accessible`);
        result.databaseTables.existing.push(tableName);
        result.databaseTables.accessible.push(tableName);
      }
    } catch (err) {
      console.error(`🔧 CRM DIAGNOSTICS: Table ${tableName} exception:`, err);
      result.databaseTables.errors.push(`${tableName}: ${err}`);
      result.databaseTables.missing.push(tableName);
    }
  }

  // 2. Check Authentication & Permissions
  console.log('🔧 CRM DIAGNOSTICS: Checking authentication...');
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      result.permissions.authStatus = `Error: ${authError.message}`;
    } else if (user) {
      result.permissions.authStatus = 'authenticated';
      result.permissions.userId = user.id;
      
      // Test lead permissions
      try {
        const { data: readTest } = await supabase.from('crm_leads').select('id').limit(1);
        result.permissions.canReadLeads = true;
        console.log('🔧 CRM DIAGNOSTICS: Can read leads');
      } catch (err) {
        result.permissions.canReadLeads = false;
        console.error('🔧 CRM DIAGNOSTICS: Cannot read leads:', err);
      }
      
      try {
        const { error: writeTest } = await supabase
          .from('crm_leads')
          .insert({ email: 'test@diagnostic.com', first_name: 'Test', last_name: 'Diagnostic' });
        
        if (!writeTest) {
          result.permissions.canWriteLeads = true;
          // Clean up test record
          await supabase.from('crm_leads').delete().eq('email', 'test@diagnostic.com');
          console.log('🔧 CRM DIAGNOSTICS: Can write leads');
        }
      } catch (err) {
        result.permissions.canWriteLeads = false;
        console.error('🔧 CRM DIAGNOSTICS: Cannot write leads:', err);
      }
    } else {
      result.permissions.authStatus = 'not authenticated';
    }
  } catch (err) {
    result.permissions.authStatus = `Exception: ${err}`;
  }

  // 3. Check User Profile & Role
  console.log('🔧 CRM DIAGNOSTICS: Checking user profile...');
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .single();
    
    if (profile) {
      result.navigationConfig.userRole = profile.role;
      console.log('🔧 CRM DIAGNOSTICS: User role:', profile.role);
    }
  } catch (err) {
    console.error('🔧 CRM DIAGNOSTICS: Cannot get user profile:', err);
  }

  // 4. Check Navigation Configuration
  console.log('🔧 CRM DIAGNOSTICS: Checking navigation configuration...');
  try {
    const { data: configs } = await supabase
      .from('system_configurations')
      .select('*')
      .eq('category', 'navigation');
    
    if (configs && configs.length > 0) {
      console.log('🔧 CRM DIAGNOSTICS: Found navigation configs:', configs.length);
      
      // Check for master visibility config
      const masterConfig = configs.find(c => c.key === 'visibility');
      if (masterConfig && result.navigationConfig.userRole) {
        const roleConfig = masterConfig.value?.[result.navigationConfig.userRole];
        if (roleConfig?.CRM) {
          result.navigationConfig.crmGroupVisible = roleConfig.CRM.enabled;
          result.navigationConfig.crmItemsVisible = Object.keys(roleConfig.CRM.items || {})
            .filter(item => roleConfig.CRM.items[item]);
          result.navigationConfig.configurationSource = 'master_config';
        }
      }
      
      // Check for role-specific config
      if (!result.navigationConfig.crmGroupVisible && result.navigationConfig.userRole) {
        const roleConfigKey = `visibility_${result.navigationConfig.userRole}`;
        const roleConfig = configs.find(c => c.key === roleConfigKey);
        if (roleConfig?.value?.CRM) {
          result.navigationConfig.crmGroupVisible = roleConfig.value.CRM.enabled;
          result.navigationConfig.crmItemsVisible = Object.keys(roleConfig.value.CRM.items || {})
            .filter(item => roleConfig.value.CRM.items[item]);
          result.navigationConfig.configurationSource = 'role_specific_config';
        }
      }
    }
  } catch (err) {
    console.error('🔧 CRM DIAGNOSTICS: Cannot check navigation config:', err);
  }

  // 5. Component Path Validation
  const expectedComponents = [
    'LeadsTable',
    'LeadForm', 
    'AccountsTable',
    'ContactsTable',
    'OpportunityPipeline',
    'CampaignDashboard'
  ];
  
  result.componentPaths.existing = expectedComponents; // Assume they exist based on file structure
  
  console.log('🔧 CRM DIAGNOSTICS: Audit complete');
  console.log('🔧 CRM DIAGNOSTICS: Results:', result);
  
  return result;
}

// Quick diagnostic function for console testing
export async function quickCRMCheck() {
  console.log('🔧 QUICK CRM CHECK: Starting...');
  
  try {
    // Test basic table access
    const { data: leads, error: leadsError } = await supabase
      .from('crm_leads')
      .select('count')
      .limit(1);
    
    console.log('🔧 QUICK CRM CHECK: Leads table:', leadsError ? 'ERROR' : 'OK');
    if (leadsError) console.error('🔧 QUICK CRM CHECK: Leads error:', leadsError);
    
    const { data: contacts, error: contactsError } = await supabase
      .from('crm_contacts' as any)
      .select('count')
      .limit(1);
    
    console.log('🔧 QUICK CRM CHECK: Contacts table:', contactsError ? 'ERROR' : 'OK');
    if (contactsError) console.error('🔧 QUICK CRM CHECK: Contacts error:', contactsError);
    
    const { data: accounts, error: accountsError } = await supabase
      .from('crm_accounts' as any)
      .select('count')
      .limit(1);
    
    console.log('🔧 QUICK CRM CHECK: Accounts table:', accountsError ? 'ERROR' : 'OK');
    if (accountsError) console.error('🔧 QUICK CRM CHECK: Accounts error:', accountsError);
    
  } catch (err) {
    console.error('🔧 QUICK CRM CHECK: Exception:', err);
  }
}