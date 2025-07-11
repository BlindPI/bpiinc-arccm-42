// Type definitions that match the actual Supabase schema
export type UserRole = 'SA' | 'AD' | 'AP' | 'IT' | 'IC' | 'IP' | 'IN';

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

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
export type AssignmentType = 'round_robin' | 'load_balanced' | 'criteria_based';

// Basic Profile interface
export interface Profile {
  id: string;
  email?: string;
  display_name?: string;
  phone?: string;
  organization?: string;
  job_title?: string;
  role: UserRole;
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  compliance_status?: boolean;
  created_at: string;
  updated_at: string;
}

// Extended Profile with additional fields
export interface ExtendedProfile extends Profile {
  last_login?: string;
  total_hours?: number;
  compliance_score?: number;
  bio?: string;
}

// Location interface matching actual schema
export interface Location {
  id: string;
  name: string;
  address?: string;
  city?: string;
  province?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  email?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

// Lead interface
export interface Lead {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company_name?: string;
  job_title?: string;
  lead_source: LeadSource;
  lead_status: LeadStatus;
  lead_score: number;
  lead_type?: LeadType;
  training_urgency?: TrainingUrgency;
  preferred_training_format?: PreferredTrainingFormat;
  estimated_participant_count?: number;
  budget_range?: string;
  notes?: string;
  assigned_to?: string;
  conversion_date?: string;
  created_at: string;
  updated_at: string;
}

// Contact interface matching CRM schema
export interface Contact {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  title?: string;
  department?: string;
  contact_status: ContactStatus;
  account_id?: string;
  lead_source?: string;
  converted_from_lead_id?: string;
  lead_conversion_date?: string;
  preferred_contact_method?: PreferredContactMethod;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Account interface matching CRM schema
export interface Account {
  id: string;
  account_name: string;
  account_type: AccountType;
  account_status: AccountStatus;
  industry?: string;
  company_size?: string;
  website?: string;
  phone?: string;
  annual_revenue?: number;
  billing_address?: string;
  billing_city?: string;
  billing_state?: string;
  billing_country?: string;
  billing_postal_code?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_country?: string;
  shipping_postal_code?: string;
  primary_contact_id?: string;
  parent_account_id?: string;
  converted_from_lead_id?: string;
  lead_conversion_date?: string;
  assigned_to?: string;
  tier?: string;
  priority?: number;
  health_score?: number;
  last_activity_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Certificate Request interface that matches the actual database table
export interface CertificateRequest {
  id: string;
  user_id?: string;
  reviewer_id?: string;
  status: string;
  recipient_name: string;
  email?: string;
  recipient_email?: string;
  phone?: string;
  company?: string;
  course_name: string;
  instructor_name?: string;
  instructor_level?: string;
  first_aid_level?: string;
  cpr_level?: string;
  issue_date: string;
  expiry_date: string;
  assessment_status?: string;
  rejection_reason?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  location_id?: string;
  roster_id?: string;
  batch_id?: string;
  batch_name?: string;
  length?: number;
  generation_attempts?: number;
  generation_error?: string;
  last_generation_attempt?: string;
  notes?: string;
  // Enhanced score tracking fields
  practical_score?: number;
  written_score?: number;
  total_score?: number;
  completion_date?: string;
  online_completion_date?: string;
  practical_completion_date?: string;
  pass_threshold?: number;
  calculated_status?: 'AUTO_PASS' | 'AUTO_FAIL' | 'MANUAL_REVIEW' | 'PENDING_SCORES';
  // Thinkific integration fields
  thinkific_course_id?: string;
  thinkific_enrollment_id?: string;
  last_score_sync?: string;
  // Score weighting configuration
  practical_weight?: number;
  written_weight?: number;
  requires_both_scores?: boolean;
  created_at: string;
  updated_at: string;
}

// Type guard functions
export function isValidUserRole(role: string): role is UserRole {
  return ['SA', 'AD', 'AP', 'IT', 'IC', 'IP', 'IN'].includes(role);
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

export function isValidCampaignStatus(status: string): status is CampaignStatus {
  return ['draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled'].includes(status);
}

export function isValidAssignmentType(type: string): type is AssignmentType {
  return ['round_robin', 'load_balanced', 'criteria_based'].includes(type);
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

export function safeCampaignStatus(status: string): CampaignStatus {
  return isValidCampaignStatus(status) ? status : 'draft';
}

export function safeAssignmentType(type: string): AssignmentType {
  return isValidAssignmentType(type) ? type : 'round_robin';
}

// Enhanced certificate status types
export type CertificateCalculatedStatus = 'AUTO_PASS' | 'AUTO_FAIL' | 'MANUAL_REVIEW' | 'PENDING_SCORES';

// Thinkific integration types
export interface ThinkificCourseData {
  course_id: string;
  course_name: string;
  enrollment_id: string;
  completion_status: 'completed' | 'in_progress' | 'not_started';
  completion_date?: string;
  score?: number;
  last_accessed?: string;
}

export interface ScoreThresholds {
  passThreshold: number;
  conditionalMin: number;
  requiresBothScores: boolean;
  practicalWeight: number;
  writtenWeight: number;
}

export interface StudentScores {
  practical?: number;
  written?: number;
  total?: number;
}

export interface EnhancedCertificateRequest extends CertificateRequest {
  // Additional computed fields for UI display
  isScoreComplete: boolean;
  passFailStatus: 'PASS' | 'FAIL' | 'CONDITIONAL' | 'PENDING';
  scoreProgress: number; // 0-100 percentage
  thinkificData?: ThinkificCourseData;
  validationErrors: ValidationError[];
  hasCourseMismatch?: boolean;
}

export interface ValidationError {
  type: string;
  message: string;
  field?: string;
  details?: any;
}

export interface ScoreDisplayConfig {
  showProgressBars: boolean;
  showIndividualScores: boolean;
  showThresholds: boolean;
  colorCodeByStatus: boolean;
  enableScoreEditing: boolean;
}

// Type guards for enhanced types
export function isValidCalculatedStatus(status: string): status is CertificateCalculatedStatus {
  return ['AUTO_PASS', 'AUTO_FAIL', 'MANUAL_REVIEW', 'PENDING_SCORES'].includes(status);
}

export function safeCalculatedStatus(status: string): CertificateCalculatedStatus {
  return isValidCalculatedStatus(status) ? status : 'PENDING_SCORES';
}

// Score calculation utilities
export function calculateWeightedScore(practical: number, written: number, practicalWeight: number = 0.5): number {
  return (practical * practicalWeight) + (written * (1 - practicalWeight));
}

export function determinePassFailStatus(
  practicalScore?: number,
  writtenScore?: number,
  threshold: number = 80,
  requiresBoth: boolean = true
): CertificateCalculatedStatus {
  if (!practicalScore && !writtenScore) {
    return 'PENDING_SCORES';
  }
  
  if (practicalScore && writtenScore) {
    const totalScore = calculateWeightedScore(practicalScore, writtenScore);
    if (totalScore >= threshold) {
      if (requiresBoth && (practicalScore < threshold || writtenScore < threshold)) {
        return 'MANUAL_REVIEW';
      }
      return 'AUTO_PASS';
    }
    return 'AUTO_FAIL';
  }
  
  return 'PENDING_SCORES';
}
