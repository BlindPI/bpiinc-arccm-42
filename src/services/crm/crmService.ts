
import { supabase } from '@/integrations/supabase/client';
import type { Lead, Contact, Account, Opportunity } from '@/types/crm';

// Mock data for development - will be replaced with real Supabase calls
export class CRMService {
  // Leads
  static async getLeads(): Promise<Lead[]> {
    // Mock data that matches the Lead interface from @/types/crm
    return [
      {
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        company_name: 'Acme Corp',
        phone: '+1-555-123-4567',
        job_title: 'CEO',
        lead_status: 'new' as const,
        lead_score: 85,
        lead_source: 'website' as const,
        notes: 'Interested in enterprise training',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  static async createLead(leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<Lead> {
    // Mock implementation
    return {
      id: Date.now().toString(),
      ...leadData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  static async updateLead(id: string, leadData: Partial<Lead>): Promise<Lead> {
    const leads = await this.getLeads();
    const lead = leads.find(l => l.id === id);
    if (!lead) throw new Error('Lead not found');
    
    return {
      ...lead,
      ...leadData,
      updated_at: new Date().toISOString()
    };
  }

  static async deleteLead(id: string): Promise<void> {
    // Mock implementation
    console.log('Deleting lead:', id);
  }

  // Contacts
  static async getContacts(filters?: { account_id?: string; contact_status?: string }): Promise<Contact[]> {
    // Mock data that matches the Contact interface from @/types/crm
    return [
      {
        id: '1',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+1-555-234-5678',
        mobile_phone: '+1-555-234-5679',
        title: 'Training Manager',
        department: 'HR',
        account_id: 'acc1',
        contact_status: 'active' as const,
        converted_from_lead_id: 'lead1',
        lead_source: 'website',
        preferred_contact_method: 'email' as const,
        do_not_call: false,
        do_not_email: false,
        notes: 'Primary contact for training initiatives',
        last_activity_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  static async createContact(contactData: Omit<Contact, 'id' | 'created_at' | 'updated_at'>): Promise<Contact> {
    return {
      id: Date.now().toString(),
      ...contactData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  static async updateContact(id: string, contactData: Partial<Contact>): Promise<Contact> {
    const contacts = await this.getContacts();
    const contact = contacts.find(c => c.id === id);
    if (!contact) throw new Error('Contact not found');
    
    return {
      ...contact,
      ...contactData,
      updated_at: new Date().toISOString()
    };
  }

  static async deleteContact(id: string): Promise<void> {
    console.log('Deleting contact:', id);
  }

  // Accounts
  static async getAccounts(filters?: { account_type?: string; industry?: string; assigned_to?: string }): Promise<Account[]> {
    return [
      {
        id: 'acc1',
        account_name: 'Acme Corporation',
        account_type: 'customer' as const,
        industry: 'Technology',
        company_size: '501-1000 employees',
        website: 'https://acme.com',
        phone: '+1-555-345-6789',
        billing_address: '123 Main St, Suite 100',
        billing_city: 'New York',
        billing_state: 'NY',
        billing_postal_code: '10001',
        billing_country: 'USA',
        account_status: 'active' as const,
        annual_revenue: 5000000,
        notes: 'Key enterprise client',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  static async createAccount(accountData: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<Account> {
    return {
      id: Date.now().toString(),
      ...accountData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  static async updateAccount(id: string, accountData: Partial<Account>): Promise<Account> {
    const accounts = await this.getAccounts();
    const account = accounts.find(a => a.id === id);
    if (!account) throw new Error('Account not found');
    
    return {
      ...account,
      ...accountData,
      updated_at: new Date().toISOString()
    };
  }

  static async deleteAccount(id: string): Promise<void> {
    console.log('Deleting account:', id);
  }

  // Opportunities
  static async getOpportunities(filters?: { stage?: string; opportunity_status?: string; account_id?: string }): Promise<Opportunity[]> {
    return [
      {
        id: '1',
        opportunity_name: 'Enterprise Training Contract',
        account_name: 'Acme Corporation',
        account_id: 'acc1',
        estimated_value: 250000,
        stage: 'proposal',
        probability: 75,
        expected_close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Large scale training implementation',
        opportunity_status: 'open' as const,
        lead_source: 'referral',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  static async createOpportunity(oppData: Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>): Promise<Opportunity> {
    return {
      id: Date.now().toString(),
      ...oppData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  static async updateOpportunity(id: string, oppData: Partial<Opportunity>): Promise<Opportunity> {
    const opportunities = await this.getOpportunities();
    const opportunity = opportunities.find(o => o.id === id);
    if (!opportunity) throw new Error('Opportunity not found');
    
    return {
      ...opportunity,
      ...oppData,
      updated_at: new Date().toISOString()
    };
  }

  static async deleteOpportunity(id: string): Promise<void> {
    console.log('Deleting opportunity:', id);
  }
}
