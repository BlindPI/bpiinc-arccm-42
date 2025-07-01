// Updated CertificateRequest interface to match current database schema
export interface CertificateRequest {
  id: string;
  user_id: string | null;
  reviewer_id: string | null;
  course_name: string;
  issue_date: string;
  expiry_date: string;
  status: string;
  recipient_name: string;
  recipient_email: string | null;
  rejection_reason: string | null;
  assessment_status: string | null;
  cpr_level: string | null;
  first_aid_level: string | null;
  company: string | null;
  phone: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  length: number | null;
  created_at: string;
  updated_at: string;
  instructor_name: string | null;
  location_id: string | null;
  batch_id: string | null;
  batch_name: string | null;
  roster_id: string | null;
  instructor_level: string | null;
  email: string | null;
  generation_error: string | null;
  generation_attempts: number | null;
  last_generation_attempt: string | null;
  notes: string | null; // Added new notes field
}