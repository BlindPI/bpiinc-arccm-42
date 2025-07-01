Day 10 Implementation Plan - Connecting Backend Services & Integration Framework
Overview
Day 10 marks the beginning of Phase 4 (Service Integration) of the 15-day implementation plan. This day focuses on connecting all backend services through centralized integration services, implementing real-time data synchronization, and establishing transaction-based operations that maintain data integrity across the entire compliance management system. These connections will enable the UI components built in Days 1-9 to interact with persistent data and provide real-time updates to users.

Implementation Goals
Implement Core Integration Services

Create centralized ComplianceIntegrationService for coordinating compliance operations
Build transaction-based operation handling with rollback capabilities
Implement unified business logic for status updates, tier management, and recalculation
Deploy Real-time Synchronization System

Create ComplianceRealtimeService for managing live updates
Implement Supabase channel-based subscription mechanisms
Build real-time data propagation patterns for UI components
Establish Backend Service Connections

Connect authentication with compliance operations
Integrate tier management with compliance workflows
Build requirement tracking with real-time updates
Implement Comprehensive Audit Trail

Create transaction logging system
Build user action tracking
Implement change history and rollback capabilities
Detailed Implementation Plan
1. Core Integration Services
1.1 Implement Centralized ComplianceIntegrationService
Create a centralized service to coordinate all compliance operations with transaction support:

// File: src/services/integration/complianceIntegrationService.ts

import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { ComplianceAuditService } from '../audit/complianceAuditService';
import { ComplianceNotificationService } from '../notification/complianceNotificationService';
import { ComplianceRealtimeService } from '../realtime/complianceRealtimeService';

/**
 * ComplianceIntegrationService
 * 
 * Central service for coordinating compliance operations across the system.
 * Handles transactions, ensures data integrity, and maintains audit logs.
 */
export class ComplianceIntegrationService {
  /**
   * Update a requirement's status with transaction support
   */
  static async updateRequirementStatus(
    userId: string,
    requirementId: string,
    status: RequirementStatus,
    metadata: any = {}
  ): Promise<RequirementUpdateResult> {
    // Start a transaction
    const { data: client } = await supabase.rpc('begin_transaction');
    
    try {
      // Update status in database
      const { data: updatedRecord, error } = await supabase
        .from('user_compliance_records')
        .update({
          status,
          updated_at: new Date().toISOString(),
          review_status: status === 'submitted' ? 'pending' : undefined,
          metadata: {
            ...metadata,
            statusHistory: [
              ...(metadata.statusHistory || []),
              {
                status,
                timestamp: new Date().toISOString()
              }
            ]
          }
        })
        .eq('user_id', userId)
        .eq('requirement_id', requirementId)
        .select('*')
        .single();
      
      if (error) throw error;
      
      // Log the status change to audit trail
      await ComplianceAuditService.logStatusChange({
        userId,
        requirementId,
        oldStatus: metadata.previousStatus || 'unknown',
        newStatus: status,
        changedBy: userId,
        metadata
      });
      
      // Recalculate user's compliance stats
      const userComplianceData = await this.recalculateUserCompliance(userId);
      
      // Check if this change affects tier advancement
      const tierAdvancementCheck = await this.checkTierAdvancement(userId);
      
      // Send appropriate notifications
      await this.sendStatusChangeNotifications(userId, requirementId, status, tierAdvancementCheck);
      
      // Commit transaction
      await supabase.rpc('commit_transaction', { client_id: client.id });
      
      // Invalidate relevant queries to update UI
      queryClient.invalidateQueries(['user-requirements', userId]);
      queryClient.invalidateQueries(['compliance-stats', userId]);
      
      // Trigger real-time updates
      ComplianceRealtimeService.broadcastRequirementUpdate(userId, requirementId, {
        type: 'status_update',
        status,
        metadata
      });
      
      return {
        success: true,
        requirement: updatedRecord,
        complianceData: userComplianceData,
        tierAdvancement: tierAdvancementCheck.eligible ? tierAdvancementCheck : null
      };
    } catch (error) {
      // Rollback on error
      await supabase.rpc('rollback_transaction', { client_id: client.id });
      console.error('Failed to update requirement status:', error);
      
      throw new Error(`Failed to update requirement status: ${error.message}`);
    }
  }
  
  /**
   * Switch a user's compliance tier with transaction support
   */
  static async switchUserTier(
    userId: string,
    newTier: string,
    metadata: any = {}
  ): Promise<TierSwitchResult> {
    // Start a transaction
    const { data: client } = await supabase.rpc('begin_transaction');
    
    try {
      // Get current tier first
      const { data: currentUserData, error: fetchError } = await supabase
        .from('user_compliance_tiers')
        .select('tier')
        .eq('user_id', userId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const oldTier = currentUserData.tier;
      
      // Update tier in database
      const { data: updatedTier, error } = await supabase
        .from('user_compliance_tiers')
        .update({
          tier: newTier,
          updated_at: new Date().toISOString(),
          tier_history: supabase.rpc('append_tier_history', {
            current_history: currentUserData.tier_history || [],
            new_entry: {
              from: oldTier,
              to: newTier,
              timestamp: new Date().toISOString(),
              reason: metadata.reason || 'manual_switch'
            }
          })
        })
        .eq('user_id', userId)
        .select('*')
        .single();
      
      if (error) throw error;
      
      // Log the tier change to audit trail
      await ComplianceAuditService.logTierChange({
        userId,
        oldTier,
        newTier,
        changedBy: metadata.initiatedBy || userId,
        reason: metadata.reason || 'manual_switch',
        metadata
      });
      
      // Update requirements based on new tier
      await this.updateRequirementsForTier(userId, newTier, oldTier);
      
      // Recalculate compliance after tier change
      const userComplianceData = await this.recalculateUserCompliance(userId);
      
      // Send tier change notifications
      await ComplianceNotificationService.sendTierChangeNotification(
        userId,
        oldTier,
        newTier,
        metadata
      );
      
      // Commit transaction
      await supabase.rpc('commit_transaction', { client_id: client.id });
      
      // Invalidate relevant queries to update UI
      queryClient.invalidateQueries(['user-tier', userId]);
      queryClient.invalidateQueries(['user-requirements', userId]);
      queryClient.invalidateQueries(['compliance-stats', userId]);
      
      // Trigger real-time updates
      ComplianceRealtimeService.broadcastTierUpdate(userId, {
        type: 'tier_change',
        oldTier,
        newTier,
        metadata
      });
      
      return {
        success: true,
        oldTier,
        newTier,
        tierData: updatedTier,
        complianceData: userComplianceData
      };
    } catch (error) {
      // Rollback on error
      await supabase.rpc('rollback_transaction', { client_id: client.id });
      console.error('Failed to switch user tier:', error);
      
      throw new Error(`Failed to switch user tier: ${error.message}`);
    }
  }
  
  /**
   * Recalculate a user's compliance metrics
   */
  static async recalculateUserCompliance(userId: string): Promise<UserComplianceData> {
    try {
      // Get all user requirements
      const { data: requirements, error } = await supabase
        .from('user_compliance_records')
        .select(`
          id,
          requirement_id,
          status,
          created_at,
          updated_at,
          compliance_requirements (
            name,
            requirement_type,
            category,
            difficulty,
            points
          )
        `)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // Calculate stats
      const totalRequirements = requirements.length;
      const completedRequirements = requirements.filter(r => r.status === 'approved').length;
      const inProgressRequirements = requirements.filter(r => 
        ['draft', 'in_progress', 'submitted', 'revision_required'].includes(r.status)
      ).length;
      const pendingRequirements = requirements.filter(r => r.status === 'pending').length;
      
      const totalPoints = requirements.reduce((sum, req) => sum + (req.compliance_requirements.points || 0), 0);
      const earnedPoints = requirements
        .filter(r => r.status === 'approved')
        .reduce((sum, req) => sum + (req.compliance_requirements.points || 0), 0);
      
      const completionPercentage = totalRequirements > 0 
        ? (completedRequirements / totalRequirements) * 100 
        : 0;
      
      // Update compliance stats in database
      const { data: updatedStats, error: updateError } = await supabase
        .from('user_compliance_stats')
        .upsert({
          user_id: userId,
          total_requirements: totalRequirements,
          completed_requirements: completedRequirements,
          in_progress_requirements: inProgressRequirements,
          pending_requirements: pendingRequirements,
          completion_percentage: completionPercentage,
          total_points: totalPoints,
          earned_points: earnedPoints,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      return {
        userId,
        stats: updatedStats,
        lastCalculated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to recalculate user compliance:', error);
      throw new Error(`Failed to recalculate user compliance: ${error.message}`);
    }
  }
  
  /**
   * Check if a user is eligible for tier advancement
   */
  static async checkTierAdvancement(userId: string): Promise<TierAdvancementCheck> {
    try {
      // Get user's current tier
      const { data: userData, error: userError } = await supabase
        .from('user_compliance_tiers')
        .select('tier')
        .eq('user_id', userId)
        .single();
      
      if (userError) throw userError;
      
      const currentTier = userData.tier;
      
      // Get tier advancement criteria
      const { data: tierData, error: tierError } = await supabase
        .from('compliance_tiers')
        .select('*')
        .eq('name', currentTier)
        .single();
      
      if (tierError) throw tierError;
      
      // Get next tier if available
      const { data: nextTiers, error: nextTierError } = await supabase
        .from('compliance_tiers')
        .select('*')
        .gt('level', tierData.level)
        .order('level', { ascending: true })
        .limit(1);
      
      if (nextTierError) throw nextTierError;
      
      // If no next tier exists, user is at highest tier
      if (!nextTiers || nextTiers.length === 0) {
        return {
          userId,
          currentTier,
          eligible: false,
          nextTier: null,
          requirements: {
            current: 0,
            required: 0
          },
          message: "You are at the highest tier level"
        };
      }
      
      const nextTier = nextTiers[0];
      
      // Get user's compliance stats
      const { data: stats, error: statsError } = await supabase
        .from('user_compliance_stats')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (statsError) throw statsError;
      
      // Check advancement criteria
      const requiredCompletionPercentage = nextTier.advancement_criteria.completion_percentage || 0;
      const requiredPoints = nextTier.advancement_criteria.minimum_points || 0;
      
      const eligible = 
        stats.completion_percentage >= requiredCompletionPercentage &&
        stats.earned_points >= requiredPoints;
      
      return {
        userId,
        currentTier,
        eligible,
        nextTier: nextTier.name,
        requirements: {
          current: {
            completionPercentage: stats.completion_percentage,
            points: stats.earned_points
          },
          required: {
            completionPercentage: requiredCompletionPercentage,
            points: requiredPoints
          }
        },
        message: eligible 
          ? `You are eligible to advance to ${nextTier.name}!` 
          : `You need ${requiredCompletionPercentage}% completion and ${requiredPoints} points to advance to ${nextTier.name}`
      };
    } catch (error) {
      console.error('Failed to check tier advancement:', error);
      return {
        userId,
        currentTier: 'unknown',
        eligible: false,
        nextTier: null,
        requirements: {
          current: 0,
          required: 0
        },
        message: `Error checking tier advancement: ${error.message}`
      };
    }
  }
  
  /**
   * Update requirements based on tier change
   */
  private static async updateRequirementsForTier(
    userId: string,
    newTier: string,
    oldTier: string
  ): Promise<void> {
    try {
      // Get requirements for the new tier
      const { data: tierRequirements, error } = await supabase
        .from('compliance_requirements')
        .select('*')
        .eq('applicable_tier', newTier);
      
      if (error) throw error;
      
      // For each requirement in the new tier, ensure it exists for the user
      for (const requirement of tierRequirements) {
        const { data: existingRecord, error: checkError } = await supabase
          .from('user_compliance_records')
          .select('id')
          .eq('user_id', userId)
          .eq('requirement_id', requirement.id)
          .maybeSingle();
        
        if (checkError) throw checkError;
        
        // If requirement doesn't exist, create it
        if (!existingRecord) {
          await supabase
            .from('user_compliance_records')
            .insert({
              user_id: userId,
              requirement_id: requirement.id,
              status: 'pending',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              metadata: {
                source: 'tier_change',
                oldTier,
                newTier
              }
            });
        }
      }
      
      // Mark requirements from old tier as legacy if they aren't in new tier
      const { data: oldTierRequirements } = await supabase
        .from('compliance_requirements')
        .select('id')
        .eq('applicable_tier', oldTier);
      
      if (oldTierRequirements) {
        const oldReqIds = oldTierRequirements.map(r => r.id);
        const newReqIds = tierRequirements.map(r => r.id);
        
        // Find requirements only in old tier
        const legacyReqIds = oldReqIds.filter(id => !newReqIds.includes(id));
        
        if (legacyReqIds.length > 0) {
          // Mark these as legacy
          await supabase
            .from('user_compliance_records')
            .update({
              metadata: {
                legacy: true,
                legacyDate: new Date().toISOString(),
                reason: 'tier_change',
                oldTier,
                newTier
              }
            })
            .eq('user_id', userId)
            .in('requirement_id', legacyReqIds);
        }
      }
    } catch (error) {
      console.error('Failed to update requirements for tier:', error);
      throw new Error(`Failed to update requirements for tier: ${error.message}`);
    }
  }
  
  /**
   * Send notifications for status changes
   */
  private static async sendStatusChangeNotifications(
    userId: string,
    requirementId: string,
    status: RequirementStatus,
    tierAdvancementCheck: TierAdvancementCheck
  ): Promise<void> {
    try {
      // Get requirement details
      const { data: requirement } = await supabase
        .from('compliance_requirements')
        .select('name')
        .eq('id', requirementId)
        .single();
      
      const requirementName = requirement?.name || 'Requirement';
      
      // Send status-specific notifications
      switch (status) {
        case 'submitted':
          await ComplianceNotificationService.send({
            userId,
            type: 'requirement_submitted',
            title: 'Requirement Submitted',
            message: `Your ${requirementName} has been submitted for review.`,
            actionUrl: `/requirements/${requirementId}`
          });
          break;
          
        case 'approved':
          await ComplianceNotificationService.send({
            userId,
            type: 'requirement_approved',
            title: 'Requirement Approved',
            message: `Your ${requirementName} has been approved.`,
            actionUrl: `/requirements/${requirementId}`
          });
          
          // If this approval makes user eligible for tier advancement, notify
          if (tierAdvancementCheck.eligible) {
            await ComplianceNotificationService.send({
              userId,
              type: 'tier_advancement_eligible',
              title: 'Tier Advancement Available',
              message: `You are now eligible to advance to ${tierAdvancementCheck.nextTier}!`,
              actionUrl: '/tiers/advancement',
              priority: 'high'
            });
          }
          break;
          
        case 'revision_required':
          await ComplianceNotificationService.send({
            userId,
            type: 'revision_required',
            title: 'Revision Required',
            message: `Your ${requirementName} requires revision.`,
            actionUrl: `/requirements/${requirementId}`,
            priority: 'medium'
          });
          break;
      }
    } catch (error) {
      console.error('Failed to send status change notifications:', error);
      // Don't throw - this is a non-critical operation
    }
  }
}

typescript



1.2 Implement Transaction Management System
Create utilities to handle database transactions consistently:

// File: src/utils/transactionManager.ts

import { supabase } from '@/lib/supabase';

export interface TransactionResult<T> {
  success: boolean;
  data?: T;
  error?: any;
}

/**
 * TransactionManager provides utilities for handling database transactions
 * with proper error handling and rollback support.
 */
export class TransactionManager {
  /**
   * Execute a series of database operations within a transaction
   */
  static async executeTransaction<T>(
    operations: (client: any) => Promise<T>
  ): Promise<TransactionResult<T>> {
    // Start transaction
    const { data: client, error: beginError } = await supabase.rpc('begin_transaction');
    
    if (beginError) {
      console.error('Failed to begin transaction:', beginError);
      return {
        success: false,
        error: beginError
      };
    }
    
    try {
      // Execute operations within transaction
      const result = await operations(client);
      
      // Commit transaction
      await supabase.rpc('commit_transaction', { client_id: client.id });
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      // Rollback on error
      await supabase.rpc('rollback_transaction', { client_id: client.id });
      
      console.error('Transaction failed, rolled back:', error);
      
      return {
        success: false,
        error
      };
    }
  }
  
  /**
   * Create a savepoint within a transaction
   */
  static async createSavepoint(client: any, savepointName: string): Promise<boolean> {
    try {
      await supabase.rpc('create_savepoint', {
        client_id: client.id,
        savepoint_name: savepointName
      });
      return true;
    } catch (error) {
      console.error(`Failed to create savepoint ${savepointName}:`, error);
      return false;
    }
  }
  
  /**
   * Rollback to a savepoint within a transaction
   */
  static async rollbackToSavepoint(client: any, savepointName: string): Promise<boolean> {
    try {
      await supabase.rpc('rollback_to_savepoint', {
        client_id: client.id,
        savepoint_name: savepointName
      });
      return true;
    } catch (error) {
      console.error(`Failed to rollback to savepoint ${savepointName}:`, error);
      return false;
    }
  }
  
  /**
   * Release a savepoint within a transaction
   */
  static async releaseSavepoint(client: any, savepointName: string): Promise<boolean> {
    try {
      await supabase.rpc('release_savepoint', {
        client_id: client.id,
        savepoint_name: savepointName
      });
      return true;
    } catch (error) {
      console.error(`Failed to release savepoint ${savepointName}:`, error);
      return false;
    }
  }
}

typescript



2. Real-time Synchronization System
2.1 Implement ComplianceRealtimeService
Create a comprehensive real-time service to manage WebSocket connections and data synchronization:

// File: src/services/realtime/complianceRealtimeService.ts

import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';

type SubscriptionCallback = (payload: any) => void;
type ChannelEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

/**
 * ComplianceRealtimeService
 * 
 * Manages real-time connections and synchronization between UI components
 * and the database using Supabase's real-time channels.
 */
export class ComplianceRealtimeService {
  private static activeChannels: Map<string, any> = new Map();
  private static subscriptions: Map<string, Set<SubscriptionCallback>> = new Map();
  
  /**
   * Subscribe to real-time updates for a user's requirements
   */
  static subscribeToUserRequirements(
    userId: string,
    callback: SubscriptionCallback
  ): () => void {
    const channelKey = `user-requirements-${userId}`;
    
    // Create subscription set if it doesn't exist
    if (!this.subscriptions.has(channelKey)) {
      this.subscriptions.set(channelKey, new Set());
    }
    
    // Add callback to subscribers
    this.subscriptions.get(channelKey)!.add(callback);
    
    // Create channel if it doesn't exist
    if (!this.activeChannels.has(channelKey)) {
      const channel = supabase
        .channel(channelKey)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'user_compliance_records',
          filter: `user_id=eq.${userId}`
        }, (payload) => {
          // Notify all subscribers
          const subscribers = this.subscriptions.get(channelKey) || new Set();
          subscribers.forEach(cb => cb(payload));
          
          // Invalidate related queries
          queryClient.invalidateQueries(['user-requirements', userId]);
        })
        .subscribe();
      
      this.activeChannels.set(channelKey, channel);
    }
    
    // Return unsubscribe function
    return () => {
      const subscribers = this.subscriptions.get(channelKey);
      
      if (subscribers) {
        subscribers.delete(callback);
        
        // If no subscribers left, remove channel
        if (subscribers.size === 0) {
          const channel = this.activeChannels.get(channelKey);
          if (channel) {
            supabase.removeChannel(channel);
            this.activeChannels.delete(channelKey);
          }
          
          this.subscriptions.delete(channelKey);
        }
      }
    };
  }
  
  /**
   * Subscribe to real-time updates for a specific requirement
   */
  static subscribeToRequirement(
    requirementId: string,
    callback: SubscriptionCallback
  ): () => void {
    const channelKey = `requirement-${requirementId}`;
    
    // Create subscription set if it doesn't exist
    if (!this.subscriptions.has(channelKey)) {
      this.subscriptions.set(channelKey, new Set());
    }
    
    // Add callback to subscribers
    this.subscriptions.get(channelKey)!.add(callback);
    
    // Create channel if it doesn't exist
    if (!this.activeChannels.has(channelKey)) {
      const channel = supabase
        .channel(channelKey)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'user_compliance_records',
          filter: `requirement_id=eq.${requirementId}`
        }, (payload) => {
          // Notify all subscribers
          const subscribers = this.subscriptions.get(channelKey) || new Set();
          subscribers.forEach(cb => cb(payload));
          
          // Invalidate related queries
          queryClient.invalidateQueries(['requirement', requirementId]);
        })
        .subscribe();
      
      this.activeChannels.set(channelKey, channel);
    }
    
    // Return unsubscribe function
    return () => {
      const subscribers = this.subscriptions.get(channelKey);
      
      if (subscribers) {
        subscribers.delete(callback);
        
        // If no subscribers left, remove channel
        if (subscribers.size === 0) {
          const channel = this.activeChannels.get(channelKey);
          if (channel) {
            supabase.removeChannel(channel);
            this.activeChannels.delete(channelKey);
          }
          
          this.subscriptions.delete(channelKey);
        }
      }
    };
  }
  
  /**
   * Subscribe to tier changes for a user
   */
  static subscribeToTierChanges(
    userId: string,
    callback: SubscriptionCallback
  ): () => void {
    const channelKey = `user-tier-${userId}`;
    
    // Create subscription set if it doesn't exist
    if (!this.subscriptions.has(channelKey)) {
      this.subscriptions.set(channelKey, new Set());
    }
    
    // Add callback to subscribers
    this.subscriptions.get(channelKey)!.add(callback);
    
    // Create channel if it doesn't exist
    if (!this.activeChannels.has(channelKey)) {
      const channel = supabase
        .channel(channelKey)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_compliance_tiers',
          filter: `user_id=eq.${userId}`
        }, (payload) => {
          // Notify all subscribers
          const subscribers = this.subscriptions.get(channelKey) || new Set();
          subscribers.forEach(cb => cb(payload));
          
          // Invalidate related queries
          queryClient.invalidateQueries(['user-tier', userId]);
        })
        .subscribe();
      
      this.activeChannels.set(channelKey, channel);
    }
    
    // Return unsubscribe function
    return () => {
      const subscribers = this.subscriptions.get(channelKey);
      
      if (subscribers) {
        subscribers.delete(callback);
        
        // If no subscribers left, remove channel
        if (subscribers.size === 0) {
          const channel = this.activeChannels.get(channelKey);
          if (channel) {
            supabase.removeChannel(channel);
            this.activeChannels.delete(channelKey);
          }
          
          this.subscriptions.delete(channelKey);
        }
      }
    };
  }
  
  /**
   * Subscribe to compliance statistics changes
   */
  static subscribeToComplianceStats(
    userId: string,
    callback: SubscriptionCallback
  ): () => void {
    const channelKey = `compliance-stats-${userId}`;
    
    // Create subscription set if it doesn't exist
    if (!this.subscriptions.has(channelKey)) {
      this.subscriptions.set(channelKey, new Set());
    }
    
    // Add callback to subscribers
    this.subscriptions.get(channelKey)!.add(callback);
    
    // Create channel if it doesn't exist
    if (!this.activeChannels.has(channelKey)) {
      const channel = supabase
        .channel(channelKey)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'user_compliance_stats',
          filter: `user_id=eq.${userId}`
        }, (payload) => {
          // Notify all subscribers
          const subscribers = this.subscriptions.get(channelKey) || new Set();
          subscribers.forEach(cb => cb(payload));
          
          // Invalidate related queries
          queryClient.invalidateQueries(['compliance-stats', userId]);
        })
        .subscribe();
      
      this.activeChannels.set(channelKey, channel);
    }
    
    // Return unsubscribe function
    return () => {
      const subscribers = this.subscriptions.get(channelKey);
      
      if (subscribers) {
        subscribers.delete(callback);
        
        // If no subscribers left, remove channel
        if (subscribers.size === 0) {
          const channel = this.activeChannels.get(channelKey);
          if (channel) {
            supabase.removeChannel(channel);
            this.activeChannels.delete(channelKey);
          }
          
          this.subscriptions.delete(channelKey);
        }
      }
    };
  }
  
  /**
   * Broadcast a requirement update to all subscribers
   */
  static broadcastRequirementUpdate(
    userId: string,
    requirementId: string,
    payload: any
  ): void {
    // Notify user requirements subscribers
    const userReqSubscribers = this.subscriptions.get(`user-requirements-${userId}`);
    if (userReqSubscribers) {
      userReqSubscribers.forEach(cb => cb({
        type: 'broadcast',
        table: 'user_compliance_records',
        schema: 'public',
        event: 'UPDATE',
        new: {
          user_id: userId,
          requirement_id: requirementId,
          ...payload
        }
      }));
    }
    
    // Notify specific requirement subscribers
    const reqSubscribers = this.subscriptions.get(`requirement-${requirementId}`);
    if (reqSubscribers) {
      reqSubscribers.forEach(cb => cb({
        type: 'broadcast',
        table: 'user_compliance_records',
        schema: 'public',
        event: 'UPDATE',
        new: {
          user_id: userId,
          requirement_id: requirementId,
          ...payload
        }
      }));
    }
  }
  
  /**
   * Broadcast a tier update to all subscribers
   */
  static broadcastTierUpdate(
    userId: string,
    payload: any
  ): void {
    // Notify tier subscribers
    const tierSubscribers = this.subscriptions.get(`user-tier-${userId}`);
    if (tierSubscribers) {
      tierSubscribers.forEach(cb => cb({
        type: 'broadcast',
        table: 'user_compliance_tiers',
        schema: 'public',
        event: 'UPDATE',
        new: {
          user_id: userId,
          ...payload
        }
      }));
    }
  }
  
  /**
   * Subscribe to presence updates to track online users
   */
  static subscribeToPresence(
    channelName: string,
    callback: (presence: any) => void
  ): () => void {
    const channelKey = `presence-${channelName}`;
    
    // Create channel if it doesn't exist
    if (!this.activeChannels.has(channelKey)) {
      const channel = supabase
        .channel(channelKey)
        .on('presence', { event: 'sync' }, () => {
          const presenceState = channel.presenceState();
          callback(presenceState);
        })
        .subscribe();
      
      this.activeChannels.set(channelKey, channel);
    }
    
    // Return unsubscribe function
    return () => {
      const channel = this.activeChannels.get(channelKey);
      if (channel) {
        supabase.removeChannel(channel);
        this.activeChannels.delete(channelKey);
      }
    };
  }
  
  /**
   * Track user presence
   */
  static trackPresence(
    channelName: string,
    userId: string,
    userInfo: any = {}
  ): () => void {
    const channelKey = `presence-${channelName}`;
    
    // Get or create channel
    let channel = this.activeChannels.get(channelKey);
    
    if (!channel) {
      channel = supabase
        .channel(channelKey)
        .on('presence', { event: 'sync' }, () => {
          // Handle presence sync
        })
        .subscribe();
      
      this.activeChannels.set(channelKey, channel);
    }
    
    // Track user
    channel.track({
      user_id: userId,
      online_at: new Date().toISOString(),
      ...userInfo
    });
    
    // Return untrack function
    return () => {
      channel.untrack();
    };
  }
  
  /**
   * Close all active channels
   */
  static closeAllChannels(): void {
    this.activeChannels.forEach(channel => {
      supabase.removeChannel(channel);
    });
    
    this.activeChannels.clear();
    this.subscriptions.clear();
  }
}

typescript



2.2 Create Real-time Update Hooks
Implement React hooks for easy real-time data access in components:

// File: src/hooks/useComplianceRealtimeUpdates.ts

import { useState, useEffect } from 'react';
import { ComplianceRealtimeService } from '@/services/realtime/complianceRealtimeService';

/**
 * Hook for subscribing to real-time requirement updates
 */
export function useRequirementRealtimeUpdates(
  requirementId: string,
  initialData?: any
) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    // Initial load if no data provided
    if (!initialData) {
      // Fetch initial data
      setLoading(true);
      fetch(`/api/requirements/${requirementId}`)
        .then(res => res.json())
        .then(result => {
          setData(result);
          setLoading(false);
        })
        .catch(err => {
          setError(err);
          setLoading(false);
        });
    }
    
    // Subscribe to real-time updates
    const unsubscribe = ComplianceRealtimeService.subscribeToRequirement(
      requirementId,
      (payload) => {
        if (payload.new) {
          setData(current => ({
            ...current,
            ...payload.new
          }));
        }
      }
    );
    
    return () => {
      unsubscribe();
    };
  }, [requirementId, initialData]);
  
  return { data, loading, error };
}

/**
 * Hook for subscribing to a user's real-time requirement updates
 */
export function useUserRequirementsRealtimeUpdates(
  userId: string,
  initialData?: any[]
) {
  const [data, setData] = useState(initialData || []);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    // Initial load if no data provided
    if (!initialData) {
      // Fetch initial data
      setLoading(true);
      fetch(`/api/users/${userId}/requirements`)
        .then(res => res.json())
        .then(result => {
          setData(result);
          setLoading(false);
        })
        .catch(err => {
          setError(err);
          setLoading(false);
        });
    }
    
    // Subscribe to real-time updates
    const unsubscribe = ComplianceRealtimeService.subscribeToUserRequirements(
      userId,
      (payload) => {
        if (payload.eventType === 'INSERT') {
          setData(current => [...current, payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          setData(current => 
            current.map(item => 
              item.id === payload.new.id ? { ...item, ...payload.new } : item
            )
          );
        } else if (payload.eventType === 'DELETE') {
          setData(current => 
            current.filter(item => item.id !== payload.old.id)
          );
        }
      }
    );
    
    return () => {
      unsubscribe();
    };
  }, [userId, initialData]);
  
  return { data, loading, error };
}

/**
 * Hook for subscribing to tier changes
 */
export function useTierRealtimeUpdates(
  userId: string,
  initialData?: any
) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    // Initial load if no data provided
    if (!initialData) {
      // Fetch initial data
      setLoading(true);
      fetch(`/api/users/${userId}/tier`)
        .then(res => res.json())
        .then(result => {
          setData(result);
          setLoading(false);
        })
        .catch(err => {
          setError(err);
          setLoading(false);
        });
    }
    
    // Subscribe to real-time updates
    const unsubscribe = ComplianceRealtimeService.subscribeToTierChanges(
      userId,
      (payload) => {
        if (payload.new) {
          setData(payload.new);
        }
      }
    );
    
    return () => {
      unsubscribe();
    };
  }, [userId, initialData]);
  
  return { data, loading, error };
}

/**
 * Hook for tracking online users
 */
export function useOnlineUsers(channelName: string) {
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  
  useEffect(() => {
    const unsubscribe = ComplianceRealtimeService.subscribeToPresence(
      channelName,
      (presence) => {
        // Convert presence state to array of users
        const users = Object.values(presence).flat();
        setOnlineUsers(users);
      }
    );
    
    return () => {
      unsubscribe();
    };
  }, [channelName]);
  
  return onlineUsers;
}

/**
 * Hook for tracking own presence
 */
export function useTrackPresence(
  channelName: string,
  userId: string,
  userInfo: any = {}
) {
  useEffect(() => {
    const untrack = ComplianceRealtimeService.trackPresence(
      channelName,
      userId,
      userInfo
    );
    
    return () => {
      untrack();
    };
  }, [channelName, userId, userInfo]);
}

typescript



3. Backend Service Connections
3.1 Implement User Authentication Integration
Connect authentication service with compliance operations:

// File: src/services/integration/authComplianceIntegration.ts

import { supabase } from '@/lib/supabase';
import { ComplianceIntegrationService } from './complianceIntegrationService';
import { ComplianceAuditService } from '../audit/complianceAuditService';

/**
 * AuthComplianceIntegration
 * 
 * Integrates user authentication with compliance operations.
 * Handles user provisioning, role assignments, and compliance tier initialization.
 */
export class AuthComplianceIntegration {
  /**
   * Initialize compliance for a new user
   */
  static async initializeUserCompliance(
    userId: string,
    role: string,
    metadata: any = {}
  ): Promise<UserInitializationResult> {
    try {
      // Start a transaction
      const { data: client } = await supabase.rpc('begin_transaction');
      
      try {
        // 1. Determine initial tier based on role
        const initialTier = await this.determineInitialTier(role);
        
        // 2. Create user compliance tier record
        const { data: tierRecord, error: tierError } = await supabase
          .from('user_compliance_tiers')
          .insert({
            user_id: userId,
            tier: initialTier,
            role,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            metadata: {
              source: 'user_initialization',
              ...metadata
            }
          })
          .select()
          .single();
        
        if (tierError) throw tierError;
        
        // 3. Create initial requirement records
        const { data: requirements } = await supabase
          .from('compliance_requirements')
          .select('*')
          .eq('applicable_tier', initialTier);
        
        if (requirements) {
          const userRequirements = requirements.map(req => ({
            user_id: userId,
            requirement_id: req.id,
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            metadata: {
              source: 'user_initialization',
              initialTier
            }
          }));
          
          const { error: reqError } = await supabase
            .from('user_compliance_records')
            .insert(userRequirements);
          
          if (reqError) throw reqError;
        }
        
        // 4. Initialize compliance statistics
        const { data: statsRecord, error: statsError } = await supabase
          .from('user_compliance_stats')
          .insert({
            user_id: userId,
            total_requirements: requirements?.length || 0,
            completed_requirements: 0,
            in_progress_requirements: 0,
            pending_requirements: requirements?.length || 0,
            completion_percentage: 0,
            total_points: requirements?.reduce((sum, req) => sum + (req.points || 0), 0) || 0,
            earned_points: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (statsError) throw statsError;
        
        // 5. Log initialization to audit trail
        await ComplianceAuditService.logUserInitialization({
          userId,
          role,
          initialTier,
          requirementCount: requirements?.length || 0,
          metadata
        });
        
        // Commit transaction
        await supabase.rpc('commit_transaction', { client_id: client.id });
        
        return {
          success: true,
          userId,
          role,
          tier: tierRecord,
          requirementCount: requirements?.length || 0,
          stats: statsRecord
        };
      } catch (error) {
        // Rollback on error
        await supabase.rpc('rollback_transaction', { client_id: client.id });
        throw error;
      }
    } catch (error) {
      console.error('Failed to initialize user compliance:', error);
      
      return {
        success: false,
        userId,
        role,
        error: `Failed to initialize user compliance: ${error.message}`
      };
    }
  }
  
  /**
   * Handle user role changes and update compliance accordingly
   */
  static async handleUserRoleChange(
    userId: string,
    newRole: string,
    oldRole: string,
    metadata: any = {}
  ): Promise<RoleChangeResult> {
    try {
      // 1. Update role in user compliance tier record
      const { data: tierRecord, error: updateError } = await supabase
        .from('user_compliance_tiers')
        .update({
          role: newRole,
          updated_at: new Date().toISOString(),
          metadata: {
            roleChangeDate: new Date().toISOString(),
            previousRole: oldRole,
            ...metadata
          }
        })
        .eq('user_id', userId)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      // 2. Determine if tier change is needed based on role change
      const shouldChangeTier = await this.shouldChangeTierOnRoleChange(oldRole, newRole);
      
      let result: RoleChangeResult = {
        success: true,
        userId,
        newRole,
        oldRole,
        tierChanged: false
      };
      
      // 3. Change tier if needed
      if (shouldChangeTier) {
        const newTier = await this.determineInitialTier(newRole);
        
        const tierChangeResult = await ComplianceIntegrationService.switchUserTier(
          userId,
          newTier,
          {
            reason: 'role_change',
            previousRole: oldRole,
            newRole,
            ...metadata
          }
        );
        
        result.tierChanged = true;
        result.newTier = newTier;
        result.oldTier = tierChangeResult.oldTier;
      }
      
      // 4. Log role change to audit trail
      await ComplianceAuditService.logRoleChange({
        userId,
        oldRole,
        newRole,
        tierChanged: result.tierChanged,
        newTier: result.newTier,
        metadata
      });
      
      return result;
    } catch (error) {
      console.error('Failed to handle user role change:', error);
      
      return {
        success: false,
        userId,
        newRole,
        oldRole,
        error: `Failed to handle user role change: ${error.message}`
      };
    }
  }
  
  /**
   * Handle user deactivation
   */
  static async handleUserDeactivation(
    userId: string,
    reason: string,
    metadata: any = {}
  ): Promise<DeactivationResult> {
    try {
      // 1. Mark user compliance records as inactive
      const { error: updateError } = await supabase
        .from('user_compliance_records')
        .update({
          status: 'inactive',
          updated_at: new Date().toISOString(),
          metadata: {
            deactivatedAt: new Date().toISOString(),
            deactivationReason: reason,
            ...metadata
          }
        })
        .eq('user_id', userId);
      
      if (updateError) throw updateError;
      
      // 2. Update user compliance tier record
      const { data: tierRecord, error: tierError } = await supabase
        .from('user_compliance_tiers')
        .update({
          status: 'inactive',
          updated_at: new Date().toISOString(),
          metadata: {
            deactivatedAt: new Date().toISOString(),
            deactivationReason: reason,
            ...metadata
          }
        })
        .eq('user_id', userId)
        .select()
        .single();
      
      if (tierError) throw tierError;
      
      // 3. Log deactivation to audit trail
      await ComplianceAuditService.logUserDeactivation({
        userId,
        reason,
        deactivatedAt: new Date().toISOString(),
        metadata
      });
      
      return {
        success: true,
        userId,
        deactivatedAt: new Date().toISOString(),
        reason
      };
    } catch (error) {
      console.error('Failed to handle user deactivation:', error);
      
      return {
        success: false,
        userId,
        error: `Failed to handle user deactivation: ${error.message}`
      };
    }
  }
  
  /**
   * Determine initial tier based on role
   */
  private static async determineInitialTier(role: string): Promise<string> {
    // Get role-based tier mapping
    const { data: roleTierMapping } = await supabase
      .from('role_tier_mappings')
      .select('initial_tier')
      .eq('role', role)
      .single();
    
    if (roleTierMapping?.initial_tier) {
      return roleTierMapping.initial_tier;
    }
    
    // Fallback to default tier if no mapping found
    const { data: defaultTier } = await supabase
      .from('compliance_tiers')
      .select('name')
      .eq('is_default', true)
      .single();
    
    return defaultTier?.name || 'basic';
  }
  
  /**
   * Determine if tier should change based on role change
   */
  private static async shouldChangeTierOnRoleChange(
    oldRole: string,
    newRole: string
  ): Promise<boolean> {
    // Get initial tiers for both roles
    const oldRoleTier = await this.determineInitialTier(oldRole);
    const newRoleTier = await this.determineInitialTier(newRole);
    
    // If initial tiers are different, tier should change
    return oldRoleTier !== newRoleTier;
  }
}

typescript



3.2 Implement API Controller for Integration Services
Create an API controller to expose integration services to the frontend:

// File: src/pages/api/integration/[...path].ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { ComplianceIntegrationService } from '@/services/integration/complianceIntegrationService';
import { AuthComplianceIntegration } from '@/services/integration/authComplianceIntegration';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { path } = req.query;
  const segments = Array.isArray(path) ? path : [path];
  
  // Router for integration endpoints
  try {
    switch (segments[0]) {
      // Requirement operations
      case 'requirements':
        if (segments[1] === 'update-status' && req.method === 'POST') {
          const { userId, requirementId, status, metadata } = req.body;
          
          // Check authorization
          if (session.user.id !== userId && !session.user.roles.includes('admin')) {
            return res.status(403).json({ error: 'Forbidden' });
          }
          
          const result = await ComplianceIntegrationService.updateRequirementStatus(
            userId,
            requirementId,
            status,
            metadata
          );
          
          return res.status(200).json(result);
        }
        break;
      
      // Tier operations
      case 'tiers':
        if (segments[1] === 'switch' && req.method === 'POST') {
          const { userId, newTier, metadata } = req.body;
          
          // Check authorization
          if (session.user.id !== userId && !session.user.roles.includes('admin')) {
            return res.status(403).json({ error: 'Forbidden' });
          }
          
          const result = await ComplianceIntegrationService.switchUserTier(
            userId,
            newTier,
            metadata
          );
          
          return res.status(200).json(result);
        }
        
        if (segments[1] === 'check-advancement' && req.method === 'GET') {
          const userId = req.query.userId as string;
          
          // Check authorization
          if (session.user.id !== userId && !session.user.roles.includes('admin')) {
            return res.status(403).json({ error: 'Forbidden' });
          }
          
          const result = await ComplianceIntegrationService.checkTierAdvancement(userId);
          
          return res.status(200).json(result);
        }
        break;
      
      // User operations
      case 'users':
        if (segments[1] === 'initialize' && req.method === 'POST') {
          const { userId, role, metadata } = req.body;
          
          // Check authorization
          if (!session.user.roles.includes('admin')) {
            return res.status(403).json({ error: 'Forbidden' });
          }
          
          const result = await AuthComplianceIntegration.initializeUserCompliance(
            userId,
            role,
            metadata
          );
          
          return res.status(200).json(result);
        }
        
        if (segments[1] === 'role-change' && req.method === 'POST') {
          const { userId, newRole, oldRole, metadata } = req.body;
          
          // Check authorization
          if (!session.user.roles.includes('admin')) {
            return res.status(403).json({ error: 'Forbidden' });
          }
          
          const result = await AuthComplianceIntegration.handleUserRoleChange(
            userId,
            newRole,
            oldRole,
            metadata
          );
          
          return res.status(200).json(result);
        }
        
        if (segments[1] === 'deactivate' && req.method === 'POST') {
          const { userId, reason, metadata } = req.body;
          
          // Check authorization
          if (!session.user.roles.includes('admin')) {
            return res.status(403).json({ error: 'Forbidden' });
          }
          
          const result = await AuthComplianceIntegration.handleUserDeactivation(
            userId,
            reason,
            metadata
          );
          
          return res.status(200).json(result);
        }
        
        if (segments[1] === 'recalculate' && req.method === 'POST') {
          const { userId } = req.body;
          
          // Check authorization
          if (session.user.id !== userId && !session.user.roles.includes('admin')) {
            return res.status(403).json({ error: 'Forbidden' });
          }
          
          const result = await ComplianceIntegrationService.recalculateUserCompliance(userId);
          
          return res.status(200).json(result);
        }
        break;
      
      default:
        return res.status(404).json({ error: 'Endpoint not found' });
    }
    
    // If we get here, no route matched
    return res.status(404).json({ error: 'Endpoint not found' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

typescript



4. Comprehensive Audit Trail
4.1 Implement Compliance Audit Service
Create a comprehensive audit logging system for compliance operations:

// File: src/services/audit/complianceAuditService.ts

import { supabase } from '@/lib/supabase';

/**
 * ComplianceAuditService
 * 
 * Provides comprehensive audit logging for all compliance operations.
 * Maintains a detailed history of changes, user actions, and system events.
 */
export class ComplianceAuditService {
  /**
   * Log a requirement status change
   */
  static async logStatusChange(params: {
    userId: string;
    requirementId: string;
    oldStatus: string;
    newStatus: string;
    changedBy: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await supabase
        .from('compliance_audit_log')
        .insert({
          event_type: 'requirement_status_change',
          user_id: params.userId,
          performed_by: params.changedBy,
          entity_type: 'requirement',
          entity_id: params.requirementId,
          change_details: {
            oldStatus: params.oldStatus,
            newStatus: params.newStatus
          },
          metadata: params.metadata || {},
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log status change:', error);
      // Don't throw - audit logging should not stop the main operation
    }
  }
  
  /**
   * Log a tier change
   */
  static async logTierChange(params: {
    userId: string;
    oldTier: string;
    newTier: string;
    changedBy: string;
    reason: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await supabase
        .from('compliance_audit_log')
        .insert({
          event_type: 'tier_change',
          user_id: params.userId,
          performed_by: params.changedBy,
          entity_type: 'tier',
          entity_id: params.userId,
          change_details: {
            oldTier: params.oldTier,
            newTier: params.newTier,
            reason: params.reason
          },
          metadata: params.metadata || {},
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log tier change:', error);
      // Don't throw - audit logging should not stop the main operation
    }
  }
  
  /**
   * Log requirement submission
   */
  static async logRequirementSubmission(params: {
    userId: string;
    requirementId: string;
    submissionData: any;
    metadata?: any;
  }): Promise<void> {
    try {
      await supabase
        .from('compliance_audit_log')
        .insert({
          event_type: 'requirement_submission',
          user_id: params.userId,
          performed_by: params.userId,
          entity_type: 'requirement',
          entity_id: params.requirementId,
          change_details: {
            submissionData: params.submissionData
          },
          metadata: params.metadata || {},
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log requirement submission:', error);
      // Don't throw - audit logging should not stop the main operation
    }
  }
  
  /**
   * Log requirement review
   */
  static async logRequirementReview(params: {
    userId: string;
    requirementId: string;
    reviewerId: string;
    decision: 'approved' | 'revision_required' | 'rejected';
    comments?: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await supabase
        .from('compliance_audit_log')
        .insert({
          event_type: 'requirement_review',
          user_id: params.userId,
          performed_by: params.reviewerId,
          entity_type: 'requirement',
          entity_id: params.requirementId,
          change_details: {
            decision: params.decision,
            comments: params.comments
          },
          metadata: params.metadata || {},
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log requirement review:', error);
      // Don't throw - audit logging should not stop the main operation
    }
  }
  
  /**
   * Log user initialization
   */
  static async logUserInitialization(params: {
    userId: string;
    role: string;
    initialTier: string;
    requirementCount: number;
    metadata?: any;
  }): Promise<void> {
    try {
      await supabase
        .from('compliance_audit_log')
        .insert({
          event_type: 'user_initialization',
          user_id: params.userId,
          performed_by: 'system',
          entity_type: 'user',
          entity_id: params.userId,
          change_details: {
            role: params.role,
            initialTier: params.initialTier,
            requirementCount: params.requirementCount
          },
          metadata: params.metadata || {},
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log user initialization:', error);
      // Don't throw - audit logging should not stop the main operation
    }
  }
  
  /**
   * Log role change
   */
  static async logRoleChange(params: {
    userId: string;
    oldRole: string;
    newRole: string;
    tierChanged: boolean;
    newTier?: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await supabase
        .from('compliance_audit_log')
        .insert({
          event_type: 'role_change',
          user_id: params.userId,
          performed_by: 'system',
          entity_type: 'user',
          entity_id: params.userId,
          change_details: {
            oldRole: params.oldRole,
            newRole: params.newRole,
            tierChanged: params.tierChanged,
            newTier: params.newTier
          },
          metadata: params.metadata || {},
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log role change:', error);
      // Don't throw - audit logging should not stop the main operation
    }
  }
  
  /**
   * Log user deactivation
   */
  static async logUserDeactivation(params: {
    userId: string;
    reason: string;
    deactivatedAt: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await supabase
        .from('compliance_audit_log')
        .insert({
          event_type: 'user_deactivation',
          user_id: params.userId,
          performed_by: 'system',
          entity_type: 'user',
          entity_id: params.userId,
          change_details: {
            reason: params.reason,
            deactivatedAt: params.deactivatedAt
          },
          metadata: params.metadata || {},
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log user deactivation:', error);
      // Don't throw - audit logging should not stop the main operation
    }
  }
  
  /**
   * Get audit logs for a user
   */
  static async getUserAuditLogs(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      eventTypes?: string[];
      startDate?: string;
      endDate?: string;
    } = {}
  ) {
    try {
      let query = supabase
        .from('compliance_audit_log')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (options.eventTypes && options.eventTypes.length > 0) {
        query = query.in('event_type', options.eventTypes);
      }
      
      if (options.startDate) {
        query = query.gte('created_at', options.startDate);
      }
      
      if (options.endDate) {
        query = query.lte('created_at', options.endDate);
      }
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
      }
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return {
        logs: data || [],
        count
      };
    } catch (error) {
      console.error('Failed to get user audit logs:', error);
      throw new Error(`Failed to get user audit logs: ${error.message}`);
    }
  }
  
  /**
   * Get audit logs for a requirement
   */
  static async getRequirementAuditLogs(
    requirementId: string,
    options: {
      limit?: number;
      offset?: number;
      eventTypes?: string[];
      startDate?: string;
      endDate?: string;
    } = {}
  ) {
    try {
      let query = supabase
        .from('compliance_audit_log')
        .select('*')
        .eq('entity_type', 'requirement')
        .eq('entity_id', requirementId)
        .order('created_at', { ascending: false });
      
      if (options.eventTypes && options.eventTypes.length > 0) {
        query = query.in('event_type', options.eventTypes);
      }
      
      if (options.startDate) {
        query = query.gte('created_at', options.startDate);
      }
      
      if (options.endDate) {
        query = query.lte('created_at', options.endDate);
      }
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
      }
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return {
        logs: data || [],
        count
      };
    } catch (error) {
      console.error('Failed to get requirement audit logs:', error);
      throw new Error(`Failed to get requirement audit logs: ${error.message}`);
    }
  }
}

typescript



Implementation Checklist
Core Integration Services
[ ] Implement ComplianceIntegrationService with requirement status update methods
[ ] Create transaction-based operations with rollback capabilities
[ ] Build user tier switching functionality
[ ] Implement compliance recalculation methods
[ ] Create tier advancement check logic
[ ] Build notification integration for status changes
Real-time Synchronization System
[ ] Implement ComplianceRealtimeService with Supabase channels
[ ] Create subscription management for various entity types
[ ] Build presence tracking for online user monitoring
[ ] Implement broadcast methods for real-time updates
[ ] Create React hooks for real-time data access in components
[ ] Implement connection state management and recovery
Backend Service Connections
[ ] Implement authentication integration with compliance operations
[ ] Create API controllers for integration services
[ ] Build user initialization and role change handlers
[ ] Implement transaction management utilities
[ ] Create service connections for notification delivery
[ ] Build error handling and logging for service integration
Comprehensive Audit Trail
[ ] Implement ComplianceAuditService for detailed action logging
[ ] Create audit log retrieval methods with filtering options
[ ] Build audit visualization components for admin interfaces
[ ] Implement audit log export capabilities
[ ] Create audit-based analytics for compliance trends
[ ] Implement change history tracking for all entities
Integration Testing
[ ] Test ComplianceIntegrationService with real data
[ ] Verify real-time updates propagate correctly
[ ] Test transaction rollback on failure scenarios
[ ] Verify audit logs capture all relevant operations
[ ] Test API endpoints with authentication
[ ] Verify cross-service integration works correctly
Success Criteria
Core Integration:

Requirement status updates complete with proper validation, audit logs, and notifications
Tier switching operations maintain data integrity and update requirements correctly
Recalculation methods accurately compute user compliance metrics
Transaction management handles errors properly with automatic rollback
Real-time Synchronization:

UI components receive updates within 500ms of database changes
Presence tracking correctly identifies online users
Connection state management handles disconnections and reconnections gracefully
Supabase channels properly manage subscriptions and resources
Backend Service Connections:

Authentication integrates seamlessly with compliance operations
API endpoints properly validate permissions and handle requests
Service-to-service communication maintains consistent data
Error handling captures and logs issues while maintaining system stability
Audit Trail:

All compliance operations generate appropriate audit logs
Audit logs contain sufficient detail for compliance reporting
Historical data is available for all entity changes
Audit visualization provides clear insights into system activity
Next Steps (Days 11-15)
Day 10 completes the integration of backend services through the ComplianceIntegrationService and ComplianceRealtimeService, establishing a solid foundation for the compliance management system. The upcoming days will focus on:

Day 11: Complete API integration and implement advanced data processing pipelines
Day 12: Finalize service orchestration and workflow management
Days 13-15: Comprehensive testing, optimization, and production deployment

Day 10's implementation provides the crucial backbone that connects all previously built UI components with the backend data storage and processing services, enabling a complete, functional compliance management system with real-time capabilities.