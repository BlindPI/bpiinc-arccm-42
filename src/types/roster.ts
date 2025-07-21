
// Basic Roster type
export interface Roster {
  id: string;
  name: string;
  description?: string;
  course_id?: string;
  location_id?: string;
  created_by: string;
  status: 'PENDING' | 'PROCESSED' | 'ACTIVE' | 'ARCHIVED' | 'DRAFT';
  issue_date?: string;
  created_at: string;
  updated_at: string;
  certificate_count: number;
  availability_booking_id?: string;
}

// Student roster member with course assignment
export interface StudentRosterMember {
  id: string;
  roster_id: string;
  student_id: string;
  course_id?: string;
  enrollment_status: 'enrolled' | 'completed' | 'dropped' | 'pending';
  completion_status: 'not_started' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

// Roster with related data from joins
export interface RosterWithRelations extends Roster {
  course?: {
    id: string;
    name: string;
    description?: string;
  };
  location?: {
    id: string;
    name: string;
    address?: string;
    city?: string;
    state_province?: string;
    country?: string;
    postal_code?: string;
  };
  creator?: {
    id: string;
    display_name?: string;
    email?: string;
  };
}

// Props for the RosterDetails component
export interface RosterDetailProps {
  roster: RosterWithRelations;
  onBack: () => void;
  onEdit: (roster: RosterWithRelations) => void;
}

// Data for creating a new roster
export interface CreateRosterData {
  name: string;
  description?: string;
  course_id?: string;
  location_id?: string;
  created_by: string;
  status?: 'PENDING' | 'PROCESSED' | 'ACTIVE' | 'ARCHIVED' | 'DRAFT';
  issue_date?: string;
}

// Data for updating an existing roster
export interface UpdateRosterData {
  name?: string;
  description?: string;
  course_id?: string;
  location_id?: string;
  status?: 'PENDING' | 'PROCESSED' | 'ACTIVE' | 'ARCHIVED' | 'DRAFT';
  issue_date?: string;
}
