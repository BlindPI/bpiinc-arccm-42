
import { Course } from './courses';
import { Location } from './supabase-schema';
import { Certificate } from './certificates';

export interface Roster {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'PROCESSING';
  location_id: string | null;
  course_id: string | null;
  issue_date: string | null;
  metadata: Record<string, any>;
  certificate_count: number;
  description: string | null;
}

export interface RosterWithRelations extends Roster {
  location?: Location;
  course?: Course;
  creator_name?: string;
  certificates?: Certificate[];
}

export interface RosterStatistics {
  total_certificates: number;
  active_certificates: number;
  expired_certificates: number;
  revoked_certificates: number;
}

export interface RosterFilters {
  search: string;
  status: 'all' | 'ACTIVE' | 'ARCHIVED' | 'PROCESSING';
  dateRange: { from: string | null; to: string | null };
  courseId: string | null;
  locationId: string | null;
  createdBy: string | null;
}

export interface CreateRosterData {
  name: string;
  location_id?: string | null;
  course_id?: string | null;
  issue_date?: string | null;
  description?: string | null;
  metadata?: Record<string, any>;
}

export interface UpdateRosterData {
  id: string;
  name?: string;
  status?: 'ACTIVE' | 'ARCHIVED' | 'PROCESSING';
  location_id?: string | null;
  course_id?: string | null;
  issue_date?: string | null;
  description?: string | null;
  metadata?: Record<string, any>;
}
