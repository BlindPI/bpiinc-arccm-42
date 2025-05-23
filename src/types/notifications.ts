
export interface Notification {
  id: string;
  user_id?: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'CERTIFICATE_REQUEST' | 'CERTIFICATE_APPROVED' | 'CERTIFICATE_REJECTED' | 'WELCOME' | 'INVITATION';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  category: 'GENERAL' | 'CERTIFICATE' | 'ACCOUNT' | 'SYSTEM' | 'TEST';
  action_url?: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationQueue {
  id: string;
  notification_id: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  category: string;
  created_at: string;
  processed_at?: string;
  error?: string;
  notification?: Notification;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  category: string;
  email_enabled: boolean;
  push_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// src/types/documents.ts
export interface DocumentRequirement {
  id: string;
  from_role: string;
  to_role: string;
  document_type: string;
  is_mandatory: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentSubmission {
  id: string;
  instructor_id: string;
  requirement_id: string;
  document_url: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  expiry_date?: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  notes?: string;
  requirement?: DocumentRequirement;
}