import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type CalendarIntegration = Database['public']['Tables']['external_calendar_integrations']['Row'];
type CalendarSyncEvent = Database['public']['Tables']['calendar_sync_events']['Row'];
type CalendarOperation = Database['public']['Tables']['calendar_operations']['Row'];

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  status: 'confirmed' | 'tentative' | 'cancelled';
}

export interface CalendarSyncResult {
  success: boolean;
  imported: number;
  exported: number;
  conflicts: number;
  errors: string[];
}

export class CalendarSyncService {
  /**
   * Get user's calendar integrations
   */
  static async getIntegrations(userId: string): Promise<CalendarIntegration[]> {
    const { data, error } = await supabase
      .from('external_calendar_integrations')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  }

  /**
   * Create or update calendar integration
   */
  static async saveIntegration(integration: Partial<CalendarIntegration>): Promise<CalendarIntegration> {
    const { data, error } = await supabase
      .from('external_calendar_integrations')
      .upsert(integration as any)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Remove calendar integration
   */
  static async removeIntegration(integrationId: string): Promise<void> {
    const { error } = await supabase
      .from('external_calendar_integrations')
      .delete()
      .eq('id', integrationId);

    if (error) throw error;
  }

  /**
   * Get sync events for an integration
   */
  static async getSyncEvents(integrationId: string): Promise<CalendarSyncEvent[]> {
    const { data, error } = await supabase
      .from('calendar_sync_events')
      .select('*')
      .eq('integration_id', integrationId)
      .order('last_synced_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Create sync event record
   */
  static async createSyncEvent(syncEvent: Partial<CalendarSyncEvent>): Promise<CalendarSyncEvent> {
    const { data, error } = await supabase
      .from('calendar_sync_events')
      .insert(syncEvent as any)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update sync event status
   */
  static async updateSyncEvent(eventId: string, updates: Partial<CalendarSyncEvent>): Promise<void> {
    const { error } = await supabase
      .from('calendar_sync_events')
      .update(updates)
      .eq('id', eventId);

    if (error) throw error;
  }

  /**
   * Sync availability with external calendar
   */
  static async syncAvailability(integrationId: string): Promise<CalendarSyncResult> {
    try {
      // Get integration details
      const { data: integration, error: integrationError } = await supabase
        .from('external_calendar_integrations')
        .select('*')
        .eq('id', integrationId)
        .single();

      if (integrationError) throw integrationError;

      if (!integration.sync_enabled) {
        throw new Error('Sync is disabled for this integration');
      }

      // Check if tokens are still valid
      if (integration.token_expires_at && new Date(integration.token_expires_at) < new Date()) {
        throw new Error('Access token expired');
      }

      // Start sync operation via edge function
      const { data: syncResult, error: syncError } = await supabase.functions.invoke('calendar-sync', {
        body: {
          integration_id: integrationId,
          operation: 'sync_availability'
        }
      });

      if (syncError) throw syncError;

      // Update last sync timestamp
      await this.updateIntegration(integrationId, {
        last_sync_at: new Date().toISOString(),
        sync_status: 'active'
      });

      return syncResult as CalendarSyncResult;
    } catch (error) {
      // Update integration with error status
      await this.updateIntegration(integrationId, {
        sync_status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown sync error'
      });
      throw error;
    }
  }

  /**
   * Update integration details
   */
  static async updateIntegration(integrationId: string, updates: Partial<CalendarIntegration>): Promise<void> {
    const { error } = await supabase
      .from('external_calendar_integrations')
      .update(updates)
      .eq('id', integrationId);

    if (error) throw error;
  }

  /**
   * Get calendar operations history
   */
  static async getOperations(userId: string): Promise<CalendarOperation[]> {
    const { data, error } = await supabase
      .from('calendar_operations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Create calendar operation
   */
  static async createOperation(operation: Partial<CalendarOperation>): Promise<CalendarOperation> {
    const { data, error } = await supabase
      .from('calendar_operations')
      .insert(operation as any)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Export availability to ICS file
   */
  static async exportToICS(userId: string, options: {
    startDate: string;
    endDate: string;
    includeAvailable?: boolean;
    includeBooked?: boolean;
  }): Promise<{ url: string; filename: string }> {
    const { data, error } = await supabase.functions.invoke('export-calendar', {
      body: {
        user_id: userId,
        ...options
      }
    });

    if (error) throw error;
    return data;
  }

  /**
   * Import ICS file
   */
  static async importFromICS(userId: string, file: File): Promise<CalendarOperation> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', userId);

    const { data, error } = await supabase.functions.invoke('import-calendar', {
      body: formData
    });

    if (error) throw error;
    return data;
  }

  /**
   * Refresh access token for integration
   */
  static async refreshToken(integrationId: string): Promise<void> {
    const { error } = await supabase.functions.invoke('refresh-calendar-token', {
      body: { integration_id: integrationId }
    });

    if (error) throw error;
  }

  /**
   * Test calendar connection
   */
  static async testConnection(integrationId: string): Promise<{ success: boolean; error?: string }> {
    const { data, error } = await supabase.functions.invoke('test-calendar-connection', {
      body: { integration_id: integrationId }
    });

    if (error) return { success: false, error: error.message };
    return data;
  }

  /**
   * Get calendar conflicts
   */
  static async getConflicts(userId: string): Promise<CalendarSyncEvent[]> {
    const { data, error } = await supabase
      .from('calendar_sync_events')
      .select(`
        *,
        integration:external_calendar_integrations(*)
      `)
      .eq('sync_status', 'conflict')
      .eq('external_calendar_integrations.user_id', userId);

    if (error) throw error;
    return data || [];
  }

  /**
   * Resolve calendar conflict
   */
  static async resolveConflict(eventId: string, resolution: 'keep_external' | 'keep_internal' | 'merge'): Promise<void> {
    const { error } = await supabase.functions.invoke('resolve-calendar-conflict', {
      body: {
        event_id: eventId,
        resolution
      }
    });

    if (error) throw error;
  }
}