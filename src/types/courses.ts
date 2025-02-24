
import type { Database } from "@/integrations/supabase/types";

export type Course = Database['public']['Tables']['courses']['Row'];
export type CourseInsert = Database['public']['Tables']['courses']['Insert'];
export type CourseUpdate = Database['public']['Tables']['courses']['Update'];

export type Location = Database['public']['Tables']['locations']['Row'];
export type LocationInsert = Database['public']['Tables']['locations']['Insert'];
export type LocationUpdate = Database['public']['Tables']['locations']['Update'];

export type CourseOffering = Database['public']['Tables']['course_offerings']['Row'];
export type CourseOfferingInsert = Database['public']['Tables']['course_offerings']['Insert'];
export type CourseOfferingUpdate = Database['public']['Tables']['course_offerings']['Update'];

// Profile type from the profiles table
export type Profile = Database['public']['Tables']['profiles']['Row'];

export type CourseOfferingWithRelations = CourseOffering & {
  courses: Course;
  locations: Location;
  profiles: Profile;
};
