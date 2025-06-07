
// Type definitions that match the actual Supabase schema
export type UserRole = 'SA' | 'AD' | 'IT' | 'IC' | 'IP' | 'IN';

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
export type LeadSource = 'website' | 'referral' | 'cold_call' | 'email' | 'social_media' | 'trade_show' | 'other';
export type LeadType = 'individual' | 'corporate';
export type TrainingUrgency = 'immediate' | 'within_month' | 'within_quarter' | 'planning';
export type PreferredTrainingFormat = 'in_person' | 'virtual' | 'hybrid';

export type ContactStatus = 'active' | 'inactive';
export type PreferredContactMethod = 'email' | 'phone' | 'mobile';

export type AccountType = 'prospect' | 'customer' | 'partner' | 'competitor';
export type AccountStatus = 'active' | 'inactive';

export type OpportunityStage = 'prospect' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
export type OpportunityStatus = 'open' | 'closed';

export type ActivityType = 'call' | 'email' | 'meeting' | 'task' | 'note';

// Type guard functions
export function isValidUserRole(role: string): role is UserRole {
  return ['SA', 'AD', 'IT', 'IC', 'IP', 'IN'].includes(role);
}

export function isValidLeadStatus(status: string): status is LeadStatus {
  return ['new', 'contacted', 'qualified', 'converted', 'lost'].includes(status);
}

export function isValidLeadSource(source: string): source is LeadSource {
  return ['website', 'referral', 'cold_call', 'email', 'social_media', 'trade_show', 'other'].includes(source);
}

export function isValidLeadType(type: string): type is LeadType {
  return ['individual', 'corporate'].includes(type);
}

export function isValidTrainingUrgency(urgency: string): urgency is TrainingUrgency {
  return ['immediate', 'within_month', 'within_quarter', 'planning'].includes(urgency);
}

export function isValidPreferredTrainingFormat(format: string): format is PreferredTrainingFormat {
  return ['in_person', 'virtual', 'hybrid'].includes(format);
}

export function isValidContactStatus(status: string): status is ContactStatus {
  return ['active', 'inactive'].includes(status);
}

export function isValidPreferredContactMethod(method: string): method is PreferredContactMethod {
  return ['email', 'phone', 'mobile'].includes(method);
}

export function isValidAccountType(type: string): type is AccountType {
  return ['prospect', 'customer', 'partner', 'competitor'].includes(type);
}

export function isValidAccountStatus(status: string): status is AccountStatus {
  return ['active', 'inactive'].includes(status);
}

export function isValidOpportunityStage(stage: string): stage is OpportunityStage {
  return ['prospect', 'proposal', 'negotiation', 'closed_won', 'closed_lost'].includes(stage);
}

export function isValidOpportunityStatus(status: string): status is OpportunityStatus {
  return ['open', 'closed'].includes(status);
}

export function isValidActivityType(type: string): type is ActivityType {
  return ['call', 'email', 'meeting', 'task', 'note'].includes(type);
}

// Safe casting functions with fallbacks
export function safeUserRole(role: string): UserRole {
  return isValidUserRole(role) ? role : 'IT';
}

export function safeLeadStatus(status: string): LeadStatus {
  return isValidLeadStatus(status) ? status : 'new';
}

export function safeLeadSource(source: string): LeadSource {
  return isValidLeadSource(source) ? source : 'other';
}

export function safeLeadType(type: string): LeadType | undefined {
  return isValidLeadType(type) ? type : undefined;
}

export function safeTrainingUrgency(urgency: string): TrainingUrgency | undefined {
  return isValidTrainingUrgency(urgency) ? urgency : undefined;
}

export function safePreferredTrainingFormat(format: string): PreferredTrainingFormat | undefined {
  return isValidPreferredTrainingFormat(format) ? format : undefined;
}

export function safeContactStatus(status: string): ContactStatus {
  return isValidContactStatus(status) ? status : 'active';
}

export function safePreferredContactMethod(method: string): PreferredContactMethod {
  return isValidPreferredContactMethod(method) ? method : 'email';
}

export function safeAccountType(type: string): AccountType {
  return isValidAccountType(type) ? type : 'prospect';
}

export function safeAccountStatus(status: string): AccountStatus {
  return isValidAccountStatus(status) ? status : 'active';
}

export function safeOpportunityStage(stage: string): OpportunityStage {
  return isValidOpportunityStage(stage) ? stage : 'prospect';
}

export function safeOpportunityStatus(status: string): OpportunityStatus {
  return isValidOpportunityStatus(status) ? status : 'open';
}

export function safeActivityType(type: string): ActivityType {
  return isValidActivityType(type) ? type : 'task';
}
