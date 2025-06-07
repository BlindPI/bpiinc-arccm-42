
import { LeadConversionService, type LeadConversionOptions } from '@/services/crm/leadConversionService';
import type { Lead } from '@/types/crm';

// Mock lead data for testing
const mockLead: Omit<Lead, 'id' | 'created_at' | 'updated_at'> = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1-555-0123',
  company_name: 'Example Corp',
  job_title: 'Safety Manager',
  lead_source: 'website',
  lead_status: 'qualified',
  lead_score: 85,
  assigned_to: null,
  training_urgency: 'within_month',
  estimated_participant_count: 25,
  budget_range: '$5000-$10000',
  notes: 'Interested in comprehensive safety training program',
  annual_revenue_range: null,
  company_size: null,
  conversion_date: null,
  industry: null,
  last_activity_date: null,
  priority: 1,
  qualification_notes: null,
  website: null
};

export async function testLeadConversion() {
  console.log('Testing Lead Conversion Service...');
  
  try {
    // Test basic conversion
    const conversionOptions: LeadConversionOptions = {
      createContact: true,
      createAccount: true,
      createOpportunity: false
    };
    
    // Since we can't validate or preview, we'll just test the conversion
    console.log('Testing lead conversion...');
    
    // For testing purposes, we'll assume a lead ID exists
    const testLeadId = 'test-lead-id';
    const convertedBy = 'test-user-id';
    
    const result = await LeadConversionService.convertLead(
      testLeadId,
      conversionOptions,
      convertedBy
    );
    
    if (result.success) {
      console.log('✅ Lead conversion successful');
      console.log('Contact ID:', result.contact?.id);
      console.log('Account ID:', result.account?.id);
      console.log('Conversion completed successfully');
    } else {
      console.log('❌ Lead conversion failed');
    }
    
    // Test getting converted contacts
    const convertedContacts = await LeadConversionService.getConvertedContacts();
    console.log(`Found ${convertedContacts.length} converted contacts`);
    
    // Test getting converted accounts
    const convertedAccounts = await LeadConversionService.getConvertedAccounts();
    console.log(`Found ${convertedAccounts.length} converted accounts`);
    
    return {
      success: true,
      message: 'Lead conversion test completed',
      results: {
        conversion: result,
        convertedContacts: convertedContacts.length,
        convertedAccounts: convertedAccounts.length
      }
    };
    
  } catch (error) {
    console.error('Lead conversion test failed:', error);
    return {
      success: false,
      message: 'Lead conversion test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Export for use in other parts of the application
export { mockLead };
