
import { supabase } from '@/integrations/supabase/client';
import { CreateRosterData } from '@/types/courses';

export const createRoster = async (rosterData: CreateRosterData) => {
  try {
    const { data, error } = await supabase
      .from('rosters')
      .insert(rosterData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating roster:', error);
      return { success: false, error, data: null };
    }
    
    return { success: true, data, error: null };
  } catch (error) {
    console.error('Unexpected error creating roster:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown error'),
      data: null 
    };
  }
};
