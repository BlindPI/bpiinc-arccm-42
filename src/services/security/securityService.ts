
import { supabase } from '@/integrations/supabase/client';
import { SecurityEvent, AccessPattern } from '@/types/analytics';

export class SecurityService {
  static async logSecurityEvent(event: Partial<SecurityEvent>): Promise<SecurityEvent> {
    const { data, error } = await supabase
      .from('security_events')
      .insert(event)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getSecurityEvents(
    limit: number = 100,
    severity?: string,
    eventType?: string
  ): Promise<SecurityEvent[]> {
    let query = supabase
      .from('security_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (severity) {
      query = query.eq('severity', severity);
    }

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  static async logAccessPattern(pattern: Partial<AccessPattern>): Promise<AccessPattern> {
    const { data, error } = await supabase
      .from('access_patterns')
      .insert(pattern)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getAccessPatterns(userId?: string, days: number = 7): Promise<AccessPattern[]> {
    let query = supabase
      .from('access_patterns')
      .select('*')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  static async getSecuritySummary(): Promise<any> {
    const [events, patterns] = await Promise.all([
      this.getSecurityEvents(500),
      this.getAccessPatterns(undefined, 7)
    ]);

    const eventsBySeverity = events.reduce((acc, event) => {
      const severity = event.severity || 'INFO';
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topPages = patterns.reduce((acc, pattern) => {
      const page = pattern.page_path;
      acc[page] = (acc[page] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const uniqueUsers = new Set(patterns.map(p => p.user_id).filter(Boolean)).size;

    return {
      eventsBySeverity,
      topPages: Object.entries(topPages)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([page, count]) => ({ page, count })),
      uniqueUsers,
      totalEvents: events.length,
      totalSessions: patterns.length
    };
  }

  static async detectAnomalies(userId?: string): Promise<any[]> {
    const patterns = await this.getAccessPatterns(userId, 30);
    const anomalies: any[] = [];

    // Simple anomaly detection - unusual access patterns
    const userPatterns = patterns.reduce((acc, pattern) => {
      const userId = pattern.user_id || 'anonymous';
      if (!acc[userId]) acc[userId] = [];
      acc[userId].push(pattern);
      return acc;
    }, {} as Record<string, AccessPattern[]>);

    Object.entries(userPatterns).forEach(([userId, userPatterns]) => {
      const avgSessionDuration = userPatterns
        .filter(p => p.duration_seconds)
        .reduce((sum, p) => sum + (p.duration_seconds || 0), 0) / userPatterns.length;

      const longSessions = userPatterns.filter(p => 
        p.duration_seconds && p.duration_seconds > avgSessionDuration * 3
      );

      if (longSessions.length > 0) {
        anomalies.push({
          type: 'long_session',
          user_id: userId,
          description: `User has ${longSessions.length} unusually long sessions`,
          sessions: longSessions.length,
          avg_duration: avgSessionDuration
        });
      }

      // Check for rapid page switching
      const rapidSwitching = userPatterns.filter(p => 
        p.duration_seconds && p.duration_seconds < 5
      );

      if (rapidSwitching.length > 10) {
        anomalies.push({
          type: 'rapid_page_switching',
          user_id: userId,
          description: `User has ${rapidSwitching.length} very short page visits`,
          rapid_switches: rapidSwitching.length
        });
      }
    });

    return anomalies;
  }

  // Helper methods for specific security events
  static async logLoginAttempt(userId: string, success: boolean, ipAddress?: string): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'login_attempt',
      severity: success ? 'INFO' : 'MEDIUM',
      user_id: userId,
      event_data: { success, timestamp: new Date().toISOString() },
      ip_address: ipAddress
    });
  }

  static async logPermissionChange(
    userId: string, 
    targetUserId: string, 
    changes: Record<string, any>
  ): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'permission_change',
      severity: 'HIGH',
      user_id: userId,
      resource_type: 'user',
      resource_id: targetUserId,
      event_data: { changes, timestamp: new Date().toISOString() }
    });
  }

  static async logDataAccess(
    userId: string, 
    resourceType: string, 
    resourceId: string, 
    action: string
  ): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'data_access',
      severity: 'INFO',
      user_id: userId,
      resource_type: resourceType,
      resource_id: resourceId,
      event_data: { action, timestamp: new Date().toISOString() }
    });
  }
}
