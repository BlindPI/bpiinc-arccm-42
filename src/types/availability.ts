export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, etc.

export type AvailabilityType = 'available' | 'out_of_office' | 'busy' | 'tentative';

export type RecurringPattern = 'weekly' | 'monthly' | 'none';

export interface UserAvailabilitySlot {
  id?: string;
  user_id: string;
  day_of_week: DayOfWeek;
  start_time: string; // HH:MM:SS format
  end_time: string; // HH:MM:SS format
  availability_type: AvailabilityType;
  recurring_pattern: RecurringPattern;
  effective_date: string; // YYYY-MM-DD format
  expiry_date?: string; // YYYY-MM-DD format
  time_slot_duration: number; // minutes
  notes?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Enhanced interface for role-based availability data
export interface AvailabilityUser {
  user_id: string;
  display_name: string;
  email: string;
  role: string;
  availability_slots: UserAvailabilitySlot[];
}

// Display modes for role-based availability views
export type AvailabilityDisplayMode = 'own' | 'team';

// View modes for availability calendar
export type AvailabilityViewMode = 'list' | 'calendar' | 'summary';

export interface AvailabilityFormData {
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  availability_type: AvailabilityType;
  recurring_pattern: RecurringPattern;
  effective_date: string;
  expiry_date?: string;
  time_slot_duration: number;
  notes?: string;
}

export interface WeeklySchedule {
  [key: string]: UserAvailabilitySlot[];
}

export const DAYS_OF_WEEK: { value: DayOfWeek; label: string; short: string }[] = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

export const AVAILABILITY_TYPES: { value: AvailabilityType; label: string; color: string }[] = [
  { value: 'available', label: 'Available', color: 'green' },
  { value: 'busy', label: 'Busy', color: 'yellow' },
  { value: 'out_of_office', label: 'Out of Office', color: 'red' },
  { value: 'tentative', label: 'Tentative', color: 'blue' },
];

export const RECURRING_PATTERNS: { value: RecurringPattern; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'none', label: 'One-time' },
];

export const TIME_SLOT_DURATIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
];

export const DEFAULT_AVAILABILITY_SETTINGS = {
  time_slot_duration: 60,
  recurring_pattern: 'weekly' as RecurringPattern,
  availability_type: 'available' as AvailabilityType,
  effective_date: new Date().toISOString().split('T')[0],
  is_active: true,
  day_of_week: 1 as DayOfWeek, // Default to Monday
};