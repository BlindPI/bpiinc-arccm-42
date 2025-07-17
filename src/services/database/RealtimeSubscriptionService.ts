import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { DatabaseUserRole, ROLE_HIERARCHY } from '@/types/database-roles';
import { Database } from '@/integrations/supabase/types';

type Tables = Database['public']['Tables'];

export interface SubscriptionConfig {
  id: string;
  userId: string;
  userRole: DatabaseUserRole;
  locationId?: string;
  callback: (payload: RealtimePostgresChangesPayload<any>) => void;
  errorHandler?: (error: any) => void;
}

/**
 * Production-ready real-time subscription management service
 * Implements real-time patterns from DATABASE_INTEGRATION_ARCHITECTURE.md
 */
export class RealtimeSubscriptionService {
  private static channels: Map<string, RealtimeChannel> = new Map();
  private static subscriptions: Map<string, SubscriptionConfig> = new Map();
  private static reconnectAttempts: Map<string, number> = new Map();
  private static isInitialized: boolean = false;

  /**
   * Initialize the real-time subscription system
   */
  public static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.isInitialized = true;
    console.log('🔄 Real-time subscription service initialized');
  }

  /**
   * Subscribe to training session updates with role-based filtering
   */
  public static subscribeToTrainingSessions(config: SubscriptionConfig): string {
    const subscriptionId = `training-sessions-${config.userId}`;
    
    const channel = supabase
      .channel(subscriptionId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'training_sessions',
          filter: this.buildRealtimeFilter(config.userRole, config.locationId)
        },
        (payload) => {
          if (this.shouldReceiveUpdate(payload, config)) {
            const enrichedPayload = this.enrichTrainingSessionPayload(payload);
            config.callback(enrichedPayload);
          }
        }
      )
      .subscribe((status) => {
        this.handleSubscriptionStatus(subscriptionId, status, config);
      });

    this.channels.set(subscriptionId, channel);
    this.subscriptions.set(subscriptionId, config);
    
    return subscriptionId;
  }

  /**
   * Subscribe to session enrollment updates
   */
  public static subscribeToSessionEnrollments(config: SubscriptionConfig): string {
    const subscriptionId = `enrollments-${config.userId}`;
    
    const channel = supabase
      .channel(subscriptionId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_enrollments',
          filter: this.buildEnrollmentFilter(config.userRole, config.userId)
        },
        async (payload) => {
          if (this.shouldReceiveUpdate(payload, config)) {
            const enrichedPayload = await this.enrichEnrollmentPayload(payload);
            config.callback(enrichedPayload);
          }
        }
      )
      .subscribe((status) => {
        this.handleSubscriptionStatus(subscriptionId, status, config);
      });

    this.channels.set(subscriptionId, channel);
    this.subscriptions.set(subscriptionId, config);
    
    return subscriptionId;
  }

  /**
   * Subscribe to certificate updates
   */
  public static subscribeToCertificates(config: SubscriptionConfig): string {
    const subscriptionId = `certificates-${config.userId}`;
    
    const channel = supabase
      .channel(subscriptionId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'certificates',
          filter: this.buildCertificateFilter(config.userRole, config.userId)
        },
        (payload) => {
          if (this.shouldReceiveUpdate(payload, config)) {
            const enrichedPayload = this.enrichCertificatePayload(payload);
            config.callback(enrichedPayload);
          }
        }
      )
      .subscribe((status) => {
        this.handleSubscriptionStatus(subscriptionId, status, config);
      });

    this.channels.set(subscriptionId, channel);
    this.subscriptions.set(subscriptionId, config);
    
    return subscriptionId;
  }

  /**
   * Subscribe to team updates
   */
  public static subscribeToTeamUpdates(config: SubscriptionConfig): string {
    const subscriptionId = `teams-${config.userId}`;
    
    const channel = supabase
      .channel(subscriptionId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teams',
          filter: this.buildTeamFilter(config.userRole, config.userId, config.locationId)
        },
        (payload) => {
          if (this.shouldReceiveUpdate(payload, config)) {
            config.callback(payload);
          }
        }
      )
      .subscribe((status) => {
        this.handleSubscriptionStatus(subscriptionId, status, config);
      });

    this.channels.set(subscriptionId, channel);
    this.subscriptions.set(subscriptionId, config);
    
    return subscriptionId;
  }

  /**
   * Subscribe to compliance updates
   */
  public static subscribeToComplianceUpdates(config: SubscriptionConfig): string {
    const subscriptionId = `compliance-${config.userId}`;
    
    const channel = supabase
      .channel(subscriptionId)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${config.userId}`
        },
        (payload) => {
          // Only notify about compliance-related changes
          if (this.isComplianceUpdate(payload)) {
            config.callback(payload);
          }
        }
      )
      .subscribe((status) => {
        this.handleSubscriptionStatus(subscriptionId, status, config);
      });

    this.channels.set(subscriptionId, channel);
    this.subscriptions.set(subscriptionId, config);
    
    return subscriptionId;
  }

  /**
   * Build real-time filter based on user role
   */
  private static buildRealtimeFilter(userRole: DatabaseUserRole, locationId?: string): string | undefined {
    switch (userRole) {
      case 'SA':
        return undefined; // No filter for System Admin
      
      case 'AD':
        return undefined; // Admin sees all (not location-based)
      
      case 'AP':
        return locationId ? `location_id=eq.${locationId}` : undefined;
      
      case 'IC':
      case 'IP':
        return undefined; // Will be filtered client-side
      
      case 'IT':
      case 'IN':
        return undefined; // Will be filtered client-side
      
      default:
        return 'id=eq.00000000-0000-0000-0000-000000000000'; // Block all
    }
  }

  /**
   * Build enrollment-specific filter
   */
  private static buildEnrollmentFilter(userRole: DatabaseUserRole, userId: string): string | undefined {
    if (['IT', 'IN'].includes(userRole)) {
      return `student_id=eq.${userId}`;
    }
    return undefined; // Other roles see all enrollments (filtered client-side)
  }

  /**
   * Build certificate-specific filter
   */
  private static buildCertificateFilter(userRole: DatabaseUserRole, userId: string): string | undefined {
    if (['IT', 'IN', 'IC', 'IP'].includes(userRole)) {
      return `user_id=eq.${userId}`;
    }
    return undefined; // SA, AD, AP see all certificates
  }

  /**
   * Build team-specific filter
   */
  private static buildTeamFilter(userRole: DatabaseUserRole, userId: string, locationId?: string): string | undefined {
    if (userRole === 'AP' && locationId) {
      return `location_id=eq.${locationId}`;
    }
    if (['IC', 'IP', 'IT', 'IN'].includes(userRole)) {
      return `created_by=eq.${userId}`;
    }
    return undefined;
  }

  /**
   * Check if user should receive this update based on role
   */
  private static shouldReceiveUpdate(payload: any, config: SubscriptionConfig): boolean {
    const { userRole, userId, locationId } = config;
    const record = payload.new || payload.old;

    // SA and AD always receive updates
    if (['SA', 'AD'].includes(userRole)) {
      return true;
    }

    // AP role checks
    if (userRole === 'AP') {
      return record.instructor_id === userId || 
             record.created_by === userId || 
             record.issued_by === userId ||
             (locationId && record.location_id === locationId);
    }

    // Instructor roles
    if (['IC', 'IP'].includes(userRole)) {
      return record.instructor_id === userId || record.user_id === userId;
    }

    // Trainee roles
    if (['IT', 'IN'].includes(userRole)) {
      return record.student_id === userId || record.user_id === userId;
    }

    return false;
  }

  /**
   * Enrich training session payload with additional data
   */
  private static enrichTrainingSessionPayload(payload: RealtimePostgresChangesPayload<any>) {
    const record = payload.new || payload.old;
    
    return {
      ...payload,
      enriched: {
        enrollment_percentage: record.current_enrollment ? 
          (record.current_enrollment / record.max_capacity) * 100 : 0,
        is_full: record.current_enrollment >= record.max_capacity,
        spots_remaining: record.max_capacity - (record.current_enrollment || 0)
      }
    };
  }

  /**
   * Enrich enrollment payload with session details
   */
  private static async enrichEnrollmentPayload(payload: RealtimePostgresChangesPayload<any>) {
    const record = payload.new || payload.old;
    
    if (record.session_id) {
      const { data: session } = await supabase
        .from('training_sessions')
        .select('title, session_date, instructor_profiles(display_name)')
        .eq('id', record.session_id)
        .single();
      
      return {
        ...payload,
        session_details: session
      };
    }
    
    return payload;
  }

  /**
   * Enrich certificate payload
   */
  private static enrichCertificatePayload(payload: RealtimePostgresChangesPayload<any>) {
    const record = payload.new || payload.old;
    
    return {
      ...payload,
      enriched: {
        is_new: payload.eventType === 'INSERT',
        is_active: record.status === 'ACTIVE'
      }
    };
  }

  /**
   * Check if this is a compliance-related update
   */
  private static isComplianceUpdate(payload: RealtimePostgresChangesPayload<any>): boolean {
    const complianceFields = ['compliance_tier', 'compliance_score', 'compliance_status'];
    const oldRecord = payload.old || {};
    const newRecord = payload.new || {};
    
    return complianceFields.some(field => oldRecord[field] !== newRecord[field]);
  }

  /**
   * Handle subscription status changes
   */
  private static handleSubscriptionStatus(
    subscriptionId: string, 
    status: string, 
    config: SubscriptionConfig
  ): void {
    console.log(`📡 Subscription ${subscriptionId} status: ${status}`);
    
    if (status === 'SUBSCRIBED') {
      this.reconnectAttempts.delete(subscriptionId);
    } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
      this.handleSubscriptionFailure(subscriptionId, config);
    }
  }

  /**
   * Handle subscription failures with exponential backoff
   */
  private static async handleSubscriptionFailure(
    subscriptionId: string, 
    config: SubscriptionConfig
  ): Promise<void> {
    const attempts = this.reconnectAttempts.get(subscriptionId) || 0;
    this.reconnectAttempts.set(subscriptionId, attempts + 1);
    
    if (attempts >= 5) {
      console.error(`❌ Max reconnection attempts reached for ${subscriptionId}`);
      config.errorHandler?.(new Error('Max reconnection attempts reached'));
      return;
    }
    
    const backoffMs = Math.min(1000 * Math.pow(2, attempts), 30000);
    console.log(`🔄 Reconnecting ${subscriptionId} in ${backoffMs}ms (attempt ${attempts + 1})`);
    
    setTimeout(() => {
      this.reestablishSubscription(subscriptionId, config);
    }, backoffMs);
  }

  /**
   * Reestablish a failed subscription
   */
  private static reestablishSubscription(subscriptionId: string, config: SubscriptionConfig): void {
    this.unsubscribe(subscriptionId);
    
    // Recreate subscription based on type
    if (subscriptionId.includes('training-sessions')) {
      this.subscribeToTrainingSessions(config);
    } else if (subscriptionId.includes('enrollments')) {
      this.subscribeToSessionEnrollments(config);
    } else if (subscriptionId.includes('certificates')) {
      this.subscribeToCertificates(config);
    } else if (subscriptionId.includes('teams')) {
      this.subscribeToTeamUpdates(config);
    } else if (subscriptionId.includes('compliance')) {
      this.subscribeToComplianceUpdates(config);
    }
  }

  /**
   * Handle global reconnection for all subscriptions
   */
  private static handleGlobalReconnection(): void {
    console.log('🔄 Handling global reconnection...');
    
    // Reconnect all active subscriptions
    for (const [subscriptionId, config] of this.subscriptions.entries()) {
      setTimeout(() => {
        this.reestablishSubscription(subscriptionId, config);
      }, Math.random() * 5000); // Stagger reconnections
    }
  }

  /**
   * Unsubscribe from a specific subscription
   */
  public static unsubscribe(subscriptionId: string): void {
    const channel = this.channels.get(subscriptionId);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(subscriptionId);
      this.subscriptions.delete(subscriptionId);
      this.reconnectAttempts.delete(subscriptionId);
      console.log(`🔌 Unsubscribed from ${subscriptionId}`);
    }
  }

  /**
   * Unsubscribe from all subscriptions
   */
  public static unsubscribeAll(): void {
    for (const subscriptionId of this.channels.keys()) {
      this.unsubscribe(subscriptionId);
    }
    console.log('🔌 All subscriptions closed');
  }

  /**
   * Get subscription statistics
   */
  public static getSubscriptionStats(): {
    totalSubscriptions: number;
    activeChannels: number;
    reconnectAttempts: number;
    subscriptionTypes: Record<string, number>;
  } {
    const subscriptionTypes: Record<string, number> = {};
    
    for (const subscriptionId of this.subscriptions.keys()) {
      const type = subscriptionId.split('-')[0];
      subscriptionTypes[type] = (subscriptionTypes[type] || 0) + 1;
    }
    
    return {
      totalSubscriptions: this.subscriptions.size,
      activeChannels: this.channels.size,
      reconnectAttempts: Array.from(this.reconnectAttempts.values()).reduce((sum, attempts) => sum + attempts, 0),
      subscriptionTypes
    };
  }
}

// Auto-initialize on module load
RealtimeSubscriptionService.initialize();

export default RealtimeSubscriptionService;