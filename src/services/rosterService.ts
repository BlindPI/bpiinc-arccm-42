
import { supabase } from '@/integrations/supabase/client';
import { CreateRosterData, Roster, RosterStatistics, UpdateRosterData } from '@/types/rosters';

export async function fetchRosters() {
  const { data, error } = await supabase
    .from('rosters')
    .select(`
      *,
      location:location_id(*),
      course:course_id(id, name),
      creator:created_by(display_name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching rosters:', error);
    throw error;
  }

  return data || [];
}

export async function fetchRosterById(rosterId: string) {
  const { data, error } = await supabase
    .from('rosters')
    .select(`
      *,
      location:location_id(*),
      course:course_id(id, name),
      creator:created_by(display_name)
    `)
    .eq('id', rosterId)
    .single();

  if (error) {
    console.error(`Error fetching roster with ID ${rosterId}:`, error);
    throw error;
  }

  return data;
}

export async function fetchRosterCertificates(rosterId: string) {
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('roster_id', rosterId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`Error fetching certificates for roster ${rosterId}:`, error);
    throw error;
  }

  return data || [];
}

export async function fetchRosterStatistics(rosterId: string): Promise<RosterStatistics> {
  const { data, error } = await supabase
    .rpc('get_roster_statistics', { roster_id: rosterId });

  if (error) {
    console.error(`Error fetching statistics for roster ${rosterId}:`, error);
    throw error;
  }

  return data || { total_certificates: 0, active_certificates: 0, expired_certificates: 0, revoked_certificates: 0 };
}

export async function createRoster(rosterData: CreateRosterData): Promise<Roster> {
  const { data, error } = await supabase
    .from('rosters')
    .insert({
      ...rosterData,
      created_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating roster:', error);
    throw error;
  }

  return data;
}

export async function updateRoster(rosterData: UpdateRosterData): Promise<Roster> {
  const { id, ...updateData } = rosterData;
  
  const { data, error } = await supabase
    .from('rosters')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating roster ${id}:`, error);
    throw error;
  }

  return data;
}

export async function archiveRoster(rosterId: string): Promise<void> {
  const { error } = await supabase
    .from('rosters')
    .update({ status: 'ARCHIVED' })
    .eq('id', rosterId);

  if (error) {
    console.error(`Error archiving roster ${rosterId}:`, error);
    throw error;
  }
}

export async function deleteRoster(rosterId: string): Promise<void> {
  // First, remove roster_id references from certificates and requests
  const updateCertificates = supabase
    .from('certificates')
    .update({ roster_id: null })
    .eq('roster_id', rosterId);
  
  const updateRequests = supabase
    .from('certificate_requests')
    .update({ roster_id: null })
    .eq('roster_id', rosterId);

  const [certsResult, requestsResult] = await Promise.all([updateCertificates, updateRequests]);
  
  if (certsResult.error) {
    console.error(`Error removing references from certificates for roster ${rosterId}:`, certsResult.error);
    throw certsResult.error;
  }
  
  if (requestsResult.error) {
    console.error(`Error removing references from requests for roster ${rosterId}:`, requestsResult.error);
    throw requestsResult.error;
  }

  // Then delete the roster
  const { error } = await supabase
    .from('rosters')
    .delete()
    .eq('id', rosterId);

  if (error) {
    console.error(`Error deleting roster ${rosterId}:`, error);
    throw error;
  }
}

export async function searchRosters(query: string) {
  const { data, error } = await supabase
    .from('rosters')
    .select(`
      *,
      location:location_id(id, name),
      course:course_id(id, name),
      creator:created_by(display_name)
    `)
    .or(`name.ilike.%${query}%, description.ilike.%${query}%`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error searching rosters:', error);
    throw error;
  }

  return data || [];
}
