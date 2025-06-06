
import { supabase } from '@/integrations/supabase/client';
import { Roster, RosterWithRelations } from '@/types/roster';

export interface RosterStatistics {
  total_certificates: number;
  active_certificates: number;
  expired_certificates: number;
  revoked_certificates: number;
}

export class RosterService {
  static async getAllRosters(): Promise<RosterWithRelations[]> {
    const { data, error } = await supabase
      .from('rosters')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(item => ({
      ...item,
      status: item.status as 'ACTIVE' | 'ARCHIVED' | 'DRAFT',
      course: undefined,
      location: undefined,
      creator: undefined
    }));
  }

  static async getRosterById(id: string): Promise<RosterWithRelations | null> {
    const { data, error } = await supabase
      .from('rosters')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    
    if (!data) return null;
    
    return {
      ...data,
      status: data.status as 'ACTIVE' | 'ARCHIVED' | 'DRAFT',
      course: undefined,
      location: undefined,
      creator: undefined
    };
  }

  static async createRoster(roster: Partial<Roster>): Promise<Roster> {
    const { data, error } = await supabase
      .from('rosters')
      .insert({
        name: roster.name,
        description: roster.description,
        course_id: roster.course_id,
        location_id: roster.location_id,
        issue_date: roster.issue_date,
        created_by: roster.created_by,
        status: roster.status || 'ACTIVE'
      })
      .select()
      .single();

    if (error) throw error;
    
    return {
      ...data,
      status: data.status as 'ACTIVE' | 'ARCHIVED' | 'DRAFT'
    } as Roster;
  }

  static async updateRoster(id: string, updates: Partial<Roster>): Promise<Roster> {
    const { data, error } = await supabase
      .from('rosters')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    return {
      ...data,
      status: data.status as 'ACTIVE' | 'ARCHIVED' | 'DRAFT'
    } as Roster;
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
