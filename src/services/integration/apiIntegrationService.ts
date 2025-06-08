
import { supabase } from '@/integrations/supabase/client';
import { ApiIntegration, WebhookEvent } from '@/types/analytics';

export class ApiIntegrationService {
  static async createIntegration(integration: Omit<ApiIntegration, 'id' | 'created_at' | 'updated_at'>): Promise<ApiIntegration> {
    const { data, error } = await supabase
      .from('api_integrations')
      .insert(integration)
      .select()
      .single();

    if (error) throw error;
    return data as ApiIntegration;
  }

  static async getIntegrations(): Promise<ApiIntegration[]> {
    const { data, error } = await supabase
      .from('api_integrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ApiIntegration[];
  }

  static async updateIntegration(id: string, updates: Partial<ApiIntegration>): Promise<ApiIntegration> {
    const { data, error } = await supabase
      .from('api_integrations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ApiIntegration;
  }

  static async deleteIntegration(id: string): Promise<void> {
    const { error } = await supabase
      .from('api_integrations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async testIntegration(id: string): Promise<boolean> {
    try {
      const { data: integration, error } = await supabase
        .from('api_integrations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Create test webhook event using actual database schema
      await this.createWebhookEvent(id, 'test', { message: 'Test event' });
      
      return true;
    } catch (error) {
      console.error('Integration test failed:', error);
      return false;
    }
  }

  static async createWebhookEvent(
    integrationId: string,
    eventType: string,
    payload: Record<string, any>
  ): Promise<WebhookEvent> {
    const { data, error } = await supabase
      .from('webhook_events')
      .insert({
        event_type: eventType,
        payload: payload,
        integration_id: integrationId,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      event_type: data.event_type,
      event_data: typeof data.payload === 'object' ? data.payload as Record<string, any> : {},
      source_integration_id: data.integration_id,
      processed: data.status === 'completed',
      created_at: data.created_at,
      processed_at: data.sent_at,
      error_message: data.response_body && data.response_status && data.response_status >= 400 ? data.response_body : undefined
    };
  }

  static async getWebhookEvents(integrationId?: string): Promise<WebhookEvent[]> {
    let query = supabase
      .from('webhook_events')
      .select('*')
      .order('created_at', { ascending: false });

    if (integrationId) {
      query = query.eq('integration_id', integrationId);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    return (data || []).map(item => ({
      id: item.id,
      event_type: item.event_type,
      event_data: typeof item.payload === 'object' ? item.payload as Record<string, any> : {},
      source_integration_id: item.integration_id,
      processed: item.status === 'completed',
      created_at: item.created_at,
      processed_at: item.sent_at,
      error_message: item.response_body && item.response_status && item.response_status >= 400 ? item.response_body : undefined
    }));
  }

  static async retryWebhookEvent(eventId: string): Promise<WebhookEvent> {
    const { data, error } = await supabase
      .from('webhook_events')
      .update({
        status: 'pending',
        response_body: null,
        response_status: null,
        retry_count: 0
      })
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      event_type: data.event_type,
      event_data: typeof data.payload === 'object' ? data.payload as Record<string, any> : {},
      source_integration_id: data.integration_id,
      processed: data.status === 'completed',
      created_at: data.created_at,
      processed_at: data.sent_at,
      error_message: data.response_body && data.response_status && data.response_status >= 400 ? data.response_body : undefined
    };
  }

  static async getWebhookStats(): Promise<any> {
    const { data, error } = await supabase
      .from('webhook_events')
      .select('status, created_at')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) throw error;

    const stats = data?.reduce((acc, event) => {
      const status = event.status === 'completed' ? 'processed' : 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return stats;
  }

  // Webhook event handlers for different entity types
  static async triggerCertificateWebhook(certificateId: string, action: string): Promise<void> {
    const integrations = await this.getActiveWebhookIntegrations();
    
    for (const integration of integrations) {
      if (integration.configuration.events?.includes('certificate')) {
        await this.createWebhookEvent(integration.id, `certificate.${action}`, {
          certificate_id: certificateId,
          action,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  static async triggerUserWebhook(userId: string, action: string): Promise<void> {
    const integrations = await this.getActiveWebhookIntegrations();
    
    for (const integration of integrations) {
      if (integration.configuration.events?.includes('user')) {
        await this.createWebhookEvent(integration.id, `user.${action}`, {
          user_id: userId,
          action,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  private static async getActiveWebhookIntegrations(): Promise<ApiIntegration[]> {
    const { data, error } = await supabase
      .from('api_integrations')
      .select('*')
      .eq('is_active', true)
      .eq('integration_type', 'webhook');

    if (error) throw error;
    return (data || []) as ApiIntegration[];
  }
}
