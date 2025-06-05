import { LeadConversionService, DEFAULT_CONVERSION_OPTIONS } from '@/services/crm/leadConversionService';
import { CRMService } from '@/services/crm/crmService';

/**
 * Test function to verify lead conversion functionality
 * This can be called from the browser console for testing
 */
export async function testLeadConversion() {
  try {
    console.log('🧪 Starting Lead Conversion Test...');

    // Step 1: Create a test lead
    console.log('📝 Creating test lead...');
    const testLead = await CRMService.createLead({
      first_name: 'Test',
      last_name: 'Conversion',
      email: `test-conversion-${Date.now()}@example.com`,
      phone: '555-0123',
      company: 'Test Conversion Company',
      title: 'Test Manager',
      status: 'qualified',
      source: 'website',
      notes: 'Created for conversion testing'
    });

    console.log('✅ Test lead created:', testLead.id);

    // Step 2: Validate conversion eligibility
    console.log('🔍 Validating conversion eligibility...');
    const validation = await LeadConversionService.validateConversion(testLead.id);
    console.log('Validation result:', validation);

    if (!validation.canProceed) {
      console.error('❌ Lead cannot be converted:', validation.errors);
      return { success: false, errors: validation.errors };
    }

    // Step 3: Get conversion preview
    console.log('👀 Getting conversion preview...');
    const preview = await LeadConversionService.getConversionPreview(testLead.id, {
      ...DEFAULT_CONVERSION_OPTIONS,
      opportunityValue: 10000,
      conversionNotes: 'Test conversion from utility function'
    });

    console.log('Preview generated:', {
      contact: !!preview.proposedContact,
      account: !!preview.proposedAccount,
      opportunity: !!preview.proposedOpportunity,
      mappings: preview.dataMapping.length
    });

    // Step 4: Perform conversion
    console.log('🔄 Performing lead conversion...');
    const conversionResult = await LeadConversionService.convertLead(testLead.id, {
      ...DEFAULT_CONVERSION_OPTIONS,
      opportunityValue: 10000,
      conversionNotes: 'Test conversion from utility function'
    });

    console.log('Conversion result:', conversionResult);

    if (conversionResult.success) {
      console.log('🎉 Conversion successful!');
      console.log('Created entities:', {
        contactId: conversionResult.contactId,
        accountId: conversionResult.accountId,
        opportunityId: conversionResult.opportunityId,
        auditId: conversionResult.auditId
      });

      // Step 5: Verify conversion data
      console.log('🔍 Verifying conversion data...');
      const leadWithConversion = await CRMService.getLeadWithConversionData(testLead.id);
      console.log('Lead after conversion:', {
        status: leadWithConversion.status,
        conversionDate: leadWithConversion.conversion_date,
        convertedContactId: leadWithConversion.converted_contact_id,
        convertedAccountId: leadWithConversion.converted_account_id,
        convertedOpportunityId: leadWithConversion.converted_opportunity_id
      });

      // Step 6: Get conversion history
      const conversionHistory = await LeadConversionService.getConversionHistory(testLead.id);
      console.log('Conversion history:', conversionHistory);

      return {
        success: true,
        leadId: testLead.id,
        conversionResult,
        leadAfterConversion: leadWithConversion,
        conversionHistory
      };

    } else {
      console.error('❌ Conversion failed:', conversionResult.errors);
      return { success: false, errors: conversionResult.errors };
    }

  } catch (error) {
    console.error('💥 Test failed with error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Test function to verify database schema
 */
export async function testDatabaseSchema() {
  try {
    console.log('🗄️ Testing database schema...');

    // Test contacts table
    const contacts = await LeadConversionService.getContacts();
    console.log('✅ Contacts table accessible, count:', contacts.length);

    // Test accounts table
    const accounts = await LeadConversionService.getAccounts();
    console.log('✅ Accounts table accessible, count:', accounts.length);

    // Test enhanced CRM stats
    const stats = await CRMService.getEnhancedCRMStats();
    console.log('✅ Enhanced CRM stats:', stats);

    return {
      success: true,
      contactsCount: contacts.length,
      accountsCount: accounts.length,
      stats
    };

  } catch (error) {
    console.error('💥 Database schema test failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Cleanup function to remove test data
 */
export async function cleanupTestData(leadId: string) {
  try {
    console.log('🧹 Cleaning up test data for lead:', leadId);

    // Get lead with conversion data
    const lead = await CRMService.getLeadWithConversionData(leadId);

    // Delete in reverse order to respect foreign key constraints
    if (lead.converted_opportunity_id) {
      await CRMService.deleteOpportunity(lead.converted_opportunity_id);
      console.log('🗑️ Deleted opportunity:', lead.converted_opportunity_id);
    }

    if (lead.converted_contact_id) {
      await CRMService.deleteContact(lead.converted_contact_id);
      console.log('🗑️ Deleted contact:', lead.converted_contact_id);
    }

    if (lead.converted_account_id) {
      await CRMService.deleteAccount(lead.converted_account_id);
      console.log('🗑️ Deleted account:', lead.converted_account_id);
    }

    // Delete the lead
    await CRMService.deleteLead(leadId);
    console.log('🗑️ Deleted lead:', leadId);

    console.log('✅ Cleanup completed successfully');
    return { success: true };

  } catch (error) {
    console.error('💥 Cleanup failed:', error);
    return { success: false, error: error.message };
  }
}

// Make functions available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).testLeadConversion = testLeadConversion;
  (window as any).testDatabaseSchema = testDatabaseSchema;
  (window as any).cleanupTestData = cleanupTestData;
  
  console.log('🔧 Lead conversion test utilities loaded. Available functions:');
  console.log('- testLeadConversion(): Test complete lead conversion workflow');
  console.log('- testDatabaseSchema(): Test database schema and connectivity');
  console.log('- cleanupTestData(leadId): Clean up test data');
}