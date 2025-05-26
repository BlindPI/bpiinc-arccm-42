
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AuditLogEntry {
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

export class AuditLogService {
  static async logAction(entry: AuditLogEntry): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const auditEntry = {
        action: entry.action,
        entity_type: entry.entity_type,
        entity_id: entry.entity_id,
        user_id: user?.id,
        details: entry.details || {},
        ip_address: entry.ip_address,
        user_agent: entry.user_agent || navigator.userAgent,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('audit_logs')
        .insert(auditEntry);

      if (error) {
        console.error('Failed to log audit entry:', error);
      }
    } catch (error) {
      console.error('Audit logging error:', error);
    }
  }

  static async getCertificateAuditLogs(certificateId: string) {
    const { data, error } = await supabase
      .from('certificate_audit_logs')
      .select(`
        *,
        performed_by_profile:profiles!certificate_audit_logs_performed_by_fkey(display_name)
      `)
      .eq('certificate_id', certificateId)
      .order('performed_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async getUserActivityLogs(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  static async getSystemAuditLogs(filters?: {
    action?: string;
    entity_type?: string;
    date_range?: { start: string; end: string };
  }) {
    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        user_profile:profiles(display_name, email)
      `)
      .order('created_at', { ascending: false });

    if (filters?.action) {
      query = query.eq('action', filters.action);
    }

    if (filters?.entity_type) {
      query = query.eq('entity_type', filters.entity_type);
    }

    if (filters?.date_range) {
      query = query
        .gte('created_at', filters.date_range.start)
        .lte('created_at', filters.date_range.end);
    }

    const { data, error } = await query.limit(100);
    if (error) throw error;
    return data;
  }
}
