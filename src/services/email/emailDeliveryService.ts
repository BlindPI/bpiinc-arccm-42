import { supabase } from '@/integrations/supabase/client';

export interface EmailDeliveryAlert {
  id: string;
  alert_type: 'high_bounce_rate' | 'delivery_failure' | 'domain_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metadata: Record<string, any>;
  created_at: string;
  resolved_at?: string;
}

export interface RetryJob {
  id: string;
  certificate_id: string;
  retry_count: number;
  next_retry_at: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
}

export class EmailDeliveryService {
  /**
   * Monitor bounce rates and create alerts for high bounce rates
   */
  static async checkBounceRates(): Promise<void> {
    // Get bounce rates by domain for the last 24 hours
    const { data: domainStats, error } = await supabase.rpc('get_domain_bounce_rates', {
      hours_back: 24
    });

    if (error) {
      console.error('Error checking bounce rates:', error);
      return;
    }

    // Create alerts for domains with high bounce rates
    for (const domain of domainStats || []) {
      if (domain.bounce_rate > 10 && domain.total_emails > 10) {
        await this.createAlert({
          alert_type: 'high_bounce_rate',
          severity: domain.bounce_rate > 20 ? 'critical' : 'high',
          message: `High bounce rate detected for ${domain.domain}: ${domain.bounce_rate.toFixed(1)}%`,
          metadata: {
            domain: domain.domain,
            bounce_rate: domain.bounce_rate,
            total_emails: domain.total_emails,
            bounced_emails: domain.bounced_emails
          }
        });
      }
    }
  }

  /**
   * Create a delivery alert
   */
  static async createAlert(alertData: Omit<EmailDeliveryAlert, 'id' | 'created_at'>): Promise<string> {
    const { data, error } = await supabase
      .from('email_delivery_alerts')
      .insert({
        alert_type: alertData.alert_type,
        severity: alertData.severity,
        message: alertData.message,
        metadata: alertData.metadata
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  /**
   * Get active delivery alerts
   */
  static async getActiveAlerts(): Promise<EmailDeliveryAlert[]> {
    const { data, error } = await supabase
      .from('email_delivery_alerts')
      .select('*')
      .is('resolved_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Resolve an alert
   */
  static async resolveAlert(alertId: string): Promise<void> {
    const { error } = await supabase
      .from('email_delivery_alerts')
      .update({ resolved_at: new Date().toISOString() })
      .eq('id', alertId);

    if (error) throw error;
  }

  /**
   * Schedule retry for failed email delivery
   */
  static async scheduleRetry(certificateId: string, currentAttempts: number = 0): Promise<void> {
    const maxRetries = 3;
    const backoffMinutes = Math.pow(2, currentAttempts) * 30; // 30min, 1hr, 2hr

    if (currentAttempts >= maxRetries) {
      console.log(`Maximum retries reached for certificate ${certificateId}`);
      return;
    }

    const nextRetryAt = new Date();
    nextRetryAt.setMinutes(nextRetryAt.getMinutes() + backoffMinutes);

    const { error } = await supabase
      .from('email_retry_queue')
      .insert({
        certificate_id: certificateId,
        retry_count: currentAttempts + 1,
        next_retry_at: nextRetryAt.toISOString(),
        status: 'pending'
      });

    if (error) {
      console.error('Error scheduling retry:', error);
    }
  }

  /**
   * Get pending retries that are ready to be processed
   */
  static async getPendingRetries(): Promise<RetryJob[]> {
    const { data, error } = await supabase
      .from('email_retry_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('next_retry_at', new Date().toISOString())
      .order('next_retry_at', { ascending: true })
      .limit(50);

    if (error) {
      console.error('Error fetching pending retries:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Process retry queue
   */
  static async processRetryQueue(): Promise<void> {
    const retries = await this.getPendingRetries();
    
    for (const retry of retries) {
      try {
        // Mark as processing
        await supabase
          .from('email_retry_queue')
          .update({ status: 'processing' })
          .eq('id', retry.id);

        // Get certificate data
        const { data: certificate, error: certError } = await supabase
          .from('certificates')
          .select('*')
          .eq('id', retry.certificate_id)
          .single();

        if (certError || !certificate) {
          throw new Error(`Certificate not found: ${retry.certificate_id}`);
        }

        // Call edge function to retry email sending
        const { error: functionError } = await supabase.functions.invoke('send-certificate-email', {
          body: { certificateId: retry.certificate_id, isRetry: true }
        });

        if (functionError) {
          throw functionError;
        }

        // Mark as completed
        await supabase
          .from('email_retry_queue')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', retry.id);

      } catch (error) {
        console.error(`Error processing retry ${retry.id}:`, error);
        
        // If we've reached max retries, mark as failed
        if (retry.retry_count >= 3) {
          await supabase
            .from('email_retry_queue')
            .update({ 
              status: 'failed',
              error_message: error instanceof Error ? error.message : 'Unknown error'
            })
            .eq('id', retry.id);
        } else {
          // Schedule another retry
          await this.scheduleRetry(retry.certificate_id, retry.retry_count);
          
          // Mark current retry as failed
          await supabase
            .from('email_retry_queue')
            .update({ 
              status: 'failed',
              error_message: error instanceof Error ? error.message : 'Unknown error'
            })
            .eq('id', retry.id);
        }
      }
    }
  }

  /**
   * Get delivery statistics for a date range
   */
  static async getDeliveryStats(startDate: Date, endDate: Date) {
    const { data, error } = await supabase
      .from('email_delivery_events')
      .select('event_type, recipient_email, timestamp')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());

    if (error) throw error;

    const stats = {
      total: data.length,
      delivered: data.filter(e => e.event_type === 'delivered').length,
      bounced: data.filter(e => e.event_type === 'bounced').length,
      failed: data.filter(e => e.event_type === 'failed').length,
      pending: data.filter(e => e.event_type === 'sent').length
    };

    return {
      ...stats,
      deliveryRate: stats.total > 0 ? (stats.delivered / stats.total) * 100 : 0,
      bounceRate: stats.total > 0 ? (stats.bounced / stats.total) * 100 : 0
    };
  }

  /**
   * Generate daily delivery report
   */
  static async generateDailyReport(): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await this.getDeliveryStats(yesterday, today);
    
    // Create report entry
    const { error } = await supabase
      .from('email_delivery_reports')
      .insert({
        report_date: yesterday.toISOString().split('T')[0],
        report_type: 'daily',
        stats: stats,
        generated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error generating daily report:', error);
    }

    // Check if we need to create alerts
    if (stats.bounceRate > 10) {
      await this.createAlert({
        alert_type: 'high_bounce_rate',
        severity: stats.bounceRate > 20 ? 'critical' : 'high',
        message: `Daily bounce rate exceeded threshold: ${stats.bounceRate.toFixed(1)}%`,
        metadata: { ...stats, report_date: yesterday.toISOString().split('T')[0] }
      });
    }
  }
}