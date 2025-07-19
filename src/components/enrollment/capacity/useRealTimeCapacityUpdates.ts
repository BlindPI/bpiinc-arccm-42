import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { SessionData } from './HoverOverlayTypes';

// ============================================================================
// TYPES
// ============================================================================

export interface RealTimeUpdateConfig {
  /** Enable real-time updates */
  enabled?: boolean;
  /** Update interval in milliseconds */
  updateInterval?: number;
  /** Auto-refresh after enrollment actions */
  autoRefreshOnActions?: boolean;
  /** Show update notifications */
  showNotifications?: boolean;
}

export interface UseRealTimeCapacityUpdatesOptions {
  /** Session data to monitor */
  sessions: SessionData[];
  /** Configuration options */
  config?: RealTimeUpdateConfig;
  /** Callback when capacity changes */
  onCapacityChange?: (sessionId: string, newCapacityInfo: any) => void;
  /** Callback when update fails */
  onUpdateError?: (error: string) => void;
}

export interface UseRealTimeCapacityUpdatesReturn {
  /** Manually trigger capacity refresh */
  refreshCapacity: (sessionId?: string) => void;
  /** Invalidate all capacity queries */
  invalidateAllQueries: () => void;
  /** Handle enrollment action completion */
  handleActionComplete: (action: string, sessionId: string, result: any) => void;
  /** Handle enrollment action error */
  handleActionError: (action: string, sessionId: string, error: string) => void;
  /** Current update status */
  isUpdating: boolean;
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

const DEFAULT_CONFIG: Required<RealTimeUpdateConfig> = {
  enabled: true,
  updateInterval: 30000, // 30 seconds
  autoRefreshOnActions: true,
  showNotifications: true
};

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useRealTimeCapacityUpdates({
  sessions,
  config = {},
  onCapacityChange,
  onUpdateError
}: UseRealTimeCapacityUpdatesOptions): UseRealTimeCapacityUpdatesReturn {
  const queryClient = useQueryClient();
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  const isUpdatingRef = useRef(false);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const invalidateCapacityQueries = useCallback((sessionId?: string) => {
    if (sessionId) {
      // Invalidate queries for specific session/roster
      const session = sessions.find(s => s.id === sessionId);
      if (session?.roster_id) {
        queryClient.invalidateQueries({ 
          queryKey: ['roster-capacity-status', session.roster_id] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['roster-capacity-info', session.roster_id] 
        });
      }
    } else {
      // Invalidate all capacity-related queries
      queryClient.invalidateQueries({ 
        queryKey: ['roster-capacity-status'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['roster-capacity-info'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['student-rosters'] 
      });
    }
  }, [queryClient, sessions]);

  const refreshCapacity = useCallback((sessionId?: string) => {
    if (!finalConfig.enabled) return;
    
    isUpdatingRef.current = true;
    
    try {
      invalidateCapacityQueries(sessionId);
      
      if (finalConfig.showNotifications && !sessionId) {
        toast.info('Refreshing capacity data...', {
          duration: 2000
        });
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to refresh capacity data';
      onUpdateError?.(errorMessage);
      
      if (finalConfig.showNotifications) {
        toast.error(errorMessage);
      }
    } finally {
      // Reset updating flag after a short delay
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 1000);
    }
  }, [finalConfig, invalidateCapacityQueries, onUpdateError]);

  // ============================================================================
  // ACTION HANDLERS
  // ============================================================================

  const handleActionComplete = useCallback((action: string, sessionId: string, result: any) => {
    if (!finalConfig.autoRefreshOnActions) return;

    // Refresh capacity data after successful enrollment actions
    if (['enroll', 'waitlist', 'promote'].includes(action)) {
      // Small delay to allow database to update
      setTimeout(() => {
        refreshCapacity(sessionId);
      }, 500);

      // Show success notification
      if (finalConfig.showNotifications) {
        const enrollmentStatus = result?.results?.enrollment?.enrollment_status;
        let message = 'Action completed successfully';
        
        switch (action) {
          case 'enroll':
            message = enrollmentStatus === 'waitlisted' 
              ? 'Student added to waitlist'
              : 'Student enrolled successfully';
            break;
          case 'promote':
            message = 'Student promoted from waitlist';
            break;
          default:
            message = `${action} completed successfully`;
        }

        toast.success(message, {
          description: 'Capacity information updated'
        });
      }

      // Notify about capacity change
      if (result?.results?.capacityUpdate) {
        onCapacityChange?.(sessionId, result.results.capacityUpdate);
      }
    }
  }, [finalConfig, refreshCapacity, onCapacityChange]);

  const handleActionError = useCallback((action: string, sessionId: string, error: string) => {
    onUpdateError?.(error);
    
    if (finalConfig.showNotifications) {
      toast.error(`${action} failed: ${error}`);
    }
  }, [finalConfig, onUpdateError]);

  // ============================================================================
  // PERIODIC UPDATES
  // ============================================================================

  useEffect(() => {
    if (!finalConfig.enabled || finalConfig.updateInterval <= 0) return;

    const scheduleUpdate = () => {
      updateTimeoutRef.current = setTimeout(() => {
        refreshCapacity();
        scheduleUpdate(); // Schedule next update
      }, finalConfig.updateInterval);
    };

    scheduleUpdate();

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [finalConfig.enabled, finalConfig.updateInterval, refreshCapacity]);

  // ============================================================================
  // CLEANUP
  // ============================================================================

  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    refreshCapacity,
    invalidateAllQueries: () => invalidateCapacityQueries(),
    handleActionComplete,
    handleActionError,
    isUpdating: isUpdatingRef.current
  };
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Simplified hook for basic real-time updates
 */
export function useBasicCapacityUpdates(sessions: SessionData[]) {
  return useRealTimeCapacityUpdates({
    sessions,
    config: {
      enabled: true,
      updateInterval: 60000, // 1 minute
      autoRefreshOnActions: true,
      showNotifications: false
    }
  });
}

/**
 * Hook for high-frequency updates (for admin dashboards)
 */
export function useHighFrequencyCapacityUpdates(sessions: SessionData[]) {
  return useRealTimeCapacityUpdates({
    sessions,
    config: {
      enabled: true,
      updateInterval: 15000, // 15 seconds
      autoRefreshOnActions: true,
      showNotifications: true
    }
  });
}

export default useRealTimeCapacityUpdates;