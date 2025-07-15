import { supabase } from '@/integrations/supabase/client';

export async function findOrCreateStudentProfile(email: string): Promise<string | null> {
  try {
    // First, try to find existing student profile
    const { data: existingProfile } = await supabase
      .from('student_enrollment_profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingProfile) {
      return existingProfile.id;
    }

    // Create new student profile
    const { data: newProfile, error } = await supabase
      .from('student_enrollment_profiles')
      .insert({
        email,
        display_name: email, // Use email as display name initially
        import_date: new Date().toISOString(),
        imported_from: 'BULK_ENROLLMENT'
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating student profile:', error);
      return null;
    }

    return newProfile.id;
  } catch (error) {
    console.error('Error in findOrCreateStudentProfile:', error);
    return null;
  }
}