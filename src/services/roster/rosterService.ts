
import { supabase } from '@/integrations/supabase/client';

export interface Roster {
  id: string;
  name: string;
  description?: string;
  course_id?: string;
  location_id?: string;
  instructor_name?: string;
  issue_date?: string;
  certificate_count: number;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface RosterStatistics {
  total_certificates: number;
  active_certificates: number;
  expired_certificates: number;
  revoked_certificates: number;
}

export class RosterService {
  static async getAllRosters(): Promise<Roster[]> {
    const { data, error } = await supabase
      .from('rosters')
      .select(`
        *,
        courses(name),
        locations(name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getRosterById(id: string): Promise<Roster | null> {
    const { data, error } = await supabase
      .from('rosters')
      .select(`
        *,
        courses(name),
        locations(name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async createRoster(roster: Partial<Roster>): Promise<Roster> {
    const { data, error } = await supabase
      .from('rosters')
      .insert({
        name: roster.name,
        description: roster.description,
        course_id: roster.course_id,
        location_id: roster.location_id,
        instructor_name: roster.instructor_name,
        issue_date: roster.issue_date,
        created_by: roster.created_by
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateRoster(id: string, updates: Partial<Roster>): Promise<Roster> {
    const { data, error } = await supabase
      .from('rosters')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteRoster(id: string): Promise<void> {
    const { error } = await supabase
      .from('rosters')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async getRosterStatistics(rosterId: string): Promise<RosterStatistics> {
    const { data, error } = await supabase.rpc('get_roster_statistics', {
      roster_id: rosterId
    });

    if (error) throw error;
    
    return data?.[0] || {
      total_certificates: 0,
      active_certificates: 0,
      expired_certificates: 0,
      revoked_certificates: 0
    };
  }

  static async getRosterCertificates(rosterId: string) {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('roster_id', rosterId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}
