
import type { CRMContact } from '@/services/crm/enhancedCRMService';
import type { Contact } from '@/types/crm';

// Helper function to safely convert string to union type
function validateContactMethod(method: string | undefined): 'email' | 'phone' | 'mobile' {
  if (method === 'email' || method === 'phone' || method === 'mobile') {
    return method;
  }
  return 'email'; // Default fallback
}

function validateContactStatus(status: string): 'active' | 'inactive' {
  if (status === 'active' || status === 'inactive') {
    return status;
  }
  return 'active'; // Default fallback
}

// Convert CRMContact to Contact type with proper type validation
export const convertCRMContactToContact = (crmContact: CRMContact): Contact => ({
  id: crmContact.id,
  first_name: crmContact.first_name,
  last_name: crmContact.last_name,
  email: crmContact.email,
  phone: crmContact.phone,
  mobile_phone: crmContact.mobile_phone,
  title: crmContact.title,
  department: crmContact.department,
  account_id: crmContact.account_id,
  contact_status: validateContactStatus(crmContact.contact_status),
  converted_from_lead_id: crmContact.converted_from_lead_id,
  lead_source: crmContact.lead_source,
  preferred_contact_method: validateContactMethod(crmContact.preferred_contact_method),
  do_not_call: crmContact.do_not_call || false,
  do_not_email: crmContact.do_not_email || false,
  notes: crmContact.notes,
  last_activity_date: crmContact.last_activity_date,
  created_at: crmContact.created_at,
  updated_at: crmContact.updated_at,
  created_by: crmContact.created_by
});
