/**
 * Production-ready Database Integration Layer
 * Implements patterns from DATABASE_INTEGRATION_ARCHITECTURE.md
 */

import UnifiedDatabaseService from './UnifiedDatabaseService';
import OptimizedQueryService from './OptimizedQueryService';
import TransactionManager from './TransactionManager';
import RealtimeSubscriptionService from './RealtimeSubscriptionService';

export { UnifiedDatabaseService, OptimizedQueryService, TransactionManager, RealtimeSubscriptionService };

// Export types and interfaces
export type { SubscriptionConfig } from './RealtimeSubscriptionService';
export type { TransactionStep, TransactionResult } from './TransactionManager';

/**
 * Database Integration Manager
 * Orchestrates all database services and provides unified initialization
 */
export class DatabaseIntegrationManager {
  private static isInitialized: boolean = false;

  /**
   * Initialize all database services for production use
   */
  public static async initialize(): Promise<{
    success: boolean;
    services: Record<string, boolean>;
    errors: string[];
  }> {
    if (this.isInitialized) {
      return { success: true, services: {}, errors: ['Already initialized'] };
    }

    const results = {
      success: false,
      services: {} as Record<string, boolean>,
      errors: [] as string[]
    };

    try {
      // Initialize core database connection
      await UnifiedDatabaseService.initializeConnections();
      results.services['UnifiedDatabaseService'] = true;
      console.log('✅ UnifiedDatabaseService initialized');
    } catch (error: any) {
      results.services['UnifiedDatabaseService'] = false;
      results.errors.push(`UnifiedDatabaseService: ${error.message}`);
    }

    try {
      // Initialize real-time subscriptions
      await RealtimeSubscriptionService.initialize();
      results.services['RealtimeSubscriptionService'] = true;
      console.log('✅ RealtimeSubscriptionService initialized');
    } catch (error: any) {
      results.services['RealtimeSubscriptionService'] = false;
      results.errors.push(`RealtimeSubscriptionService: ${error.message}`);
    }

    // Transaction Manager is stateless, no initialization needed
    results.services['TransactionManager'] = true;
    results.services['OptimizedQueryService'] = true;

    results.success = results.errors.length === 0;
    this.isInitialized = results.success;

    return results;
  }

  /**
   * Comprehensive health check of all database services
   */
  public static async healthCheck(userRole?: import('@/types/database-roles').DatabaseUserRole): Promise<{
    overall: 'healthy' | 'degraded' | 'error';
    services: Record<string, any>;
    summary: {
      totalServices: number;
      healthyServices: number;
      degradedServices: number;
      errorServices: number;
    };
  }> {
    const services: Record<string, any> = {};

    // Check UnifiedDatabaseService
    try {
      services.UnifiedDatabaseService = await UnifiedDatabaseService.healthCheck(userRole);
    } catch (error: any) {
      services.UnifiedDatabaseService = {
        status: 'error',
        error: error.message
      };
    }

    // Check connection stats
    services.ConnectionStats = UnifiedDatabaseService.getConnectionStats();

    // Check real-time subscriptions
    services.RealtimeSubscriptions = RealtimeSubscriptionService.getSubscriptionStats();

    // Check transaction manager
    services.TransactionManager = TransactionManager.getTransactionStats();

    // Calculate summary
    const statuses = Object.values(services).map(s => s.status || 'healthy');
    const summary = {
      totalServices: statuses.length,
      healthyServices: statuses.filter(s => s === 'healthy').length,
      degradedServices: statuses.filter(s => s === 'degraded').length,
      errorServices: statuses.filter(s => s === 'error').length
    };

    // Determine overall status
    let overall: 'healthy' | 'degraded' | 'error' = 'healthy';
    if (summary.errorServices > 0) {
      overall = 'error';
    } else if (summary.degradedServices > 0) {
      overall = 'degraded';
    }

    return {
      overall,
      services,
      summary
    };
  }

  /**
   * Get comprehensive database integration statistics
   */
  public static getIntegrationStats(): {
    initialized: boolean;
    connectionStats: any;
    subscriptionStats: any;
    transactionStats: any;
    timestamp: string;
  } {
    return {
      initialized: this.isInitialized,
      connectionStats: UnifiedDatabaseService.getConnectionStats(),
      subscriptionStats: RealtimeSubscriptionService.getSubscriptionStats(),
      transactionStats: TransactionManager.getTransactionStats(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Shutdown all database services gracefully
   */
  public static async shutdown(): Promise<void> {
    console.log('🔌 Shutting down database integration services...');
    
    // Unsubscribe from all real-time channels
    RealtimeSubscriptionService.unsubscribeAll();
    
    // Clear any active transactions (emergency rollback)
    const transactionStats = TransactionManager.getTransactionStats();
    for (const txnId of transactionStats.transactionIds) {
      await TransactionManager.emergencyRollback(txnId);
    }

    this.isInitialized = false;
    console.log('✅ Database integration services shut down successfully');
  }
}

// Auto-initialize in production
if (typeof window !== 'undefined') {
  DatabaseIntegrationManager.initialize().catch(console.error);
}

export default DatabaseIntegrationManager;