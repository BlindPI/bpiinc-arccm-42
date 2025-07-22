export type DayOfWeek = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

export type AvailabilityType = 'available' | 'out_of_office' | 'busy';

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
  { value: 'sunday', label: 'Sunday', short: 'Sun' },
  { value: 'monday', label: 'Monday', short: 'Mon' },
  { value: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { value: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { value: 'thursday', label: 'Thursday', short: 'Thu' },
  { value: 'friday', label: 'Friday', short: 'Fri' },
  { value: 'saturday', label: 'Saturday', short: 'Sat' },
];

export const AVAILABILITY_TYPES: { value: AvailabilityType; label: string; color: string }[] = [
  { value: 'available', label: 'Available', color: 'green' },
  { value: 'out_of_office', label: 'Out of Office', color: 'red' },
  { value: 'busy', label: 'Busy', color: 'yellow' },
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
};