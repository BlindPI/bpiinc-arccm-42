
// Add the missing code to fix the build error
import { supabase } from '@/integrations/supabase/client';
import { CreateRosterData, UpdateRosterData } from '@/types/roster';
import { toast } from 'sonner';

/**
 * Creates a new roster
 */
export const createRoster = async (data: CreateRosterData) => {
  try {
    // Ensure status is set if not provided
    const rosterData = {
      ...data,
      status: data.status || 'ACTIVE'
    };
    
    const { data: roster, error } = await supabase
      .from('rosters')
      .insert(rosterData)
      .select()
      .single();
      
    if (error) throw error;
    
    return { success: true, data: roster };
  } catch (error: any) {
    console.error('Error creating roster:', error);
    toast.error(`Failed to create roster: ${error.message}`);
    return { success: false, error };
  }
};

/**
 * Updates an existing roster
 */
export const updateRoster = async (id: string, data: UpdateRosterData) => {
  try {
    const { data: updatedRoster, error } = await supabase
      .from('rosters')
      .update(data)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    return { success: true, data: updatedRoster };
  } catch (error: any) {
    console.error('Error updating roster:', error);
    toast.error(`Failed to update roster: ${error.message}`);
    return { success: false, error };
  }
};

/**
 * Deletes a roster by ID
 */
export const deleteRoster = async (id: string) => {
  try {
    const { error } = await supabase
      .from('rosters')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting roster:', error);
    toast.error(`Failed to delete roster: ${error.message}`);
    return { success: false, error };
  }
};

/**
 * Gets a roster by ID with related data
 */
export const getRosterById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('rosters')
      .select(`
        *,
        course:course_id (*),
        location:location_id (*),
        creator:created_by (id, display_name, email)
      `)
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching roster:', error);
    return { success: false, error };
  }
};

/**
 * Gets all rosters with relationship data
 */
export const getAllRosters = async () => {
  try {
    const { data, error } = await supabase
      .from('rosters')
      .select(`
        *,
        course:course_id (*),
        location:location_id (*),
        creator:created_by (id, display_name, email)
      `)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching rosters:', error);
    return { success: false, error };
  }
};

/**
 * Gets all certificates for a roster
 */
export const getRosterCertificates = async (rosterId: string) => {
  try {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('roster_id', rosterId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching roster certificates:', error);
    return { success: false, error };
  }
};
