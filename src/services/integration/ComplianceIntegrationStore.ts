import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ComplianceService, UserComplianceRecord } from '@/services/compliance/complianceService';
import { ComplianceRequirementsService } from '@/services/compliance/complianceRequirementsService';
import { ComplianceTierService } from '@/services/compliance/complianceTierService';

// Integration State Types
interface IntegrationState {
  // Global compliance data
  userComplianceRecords: UserComplianceRecord[];
  complianceRequirements: any[];
  complianceTiers: any[];
  
  // Real-time sync status
  syncStatus: 'idle' | 'syncing' | 'error' | 'offline';
  lastSyncTime: string | null;
  syncErrors: string[];
  
  // Component state management
  componentStates: Record<string, any>;
  sharedData: Record<string, any>;
  
  // Conflict resolution
  conflictQueue: ConflictItem[];
  isResolvingConflicts: boolean;
  
  // Performance tracking
  performanceMetrics: PerformanceMetrics;
  
  // Real-time subscriptions
  activeSubscriptions: Map<string, any>;
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
  
  // User context
  currentUserId: string | null;
  currentUserRole: 'AP' | 'IC' | 'IP' | 'IT' | null;
  currentUserTier: 'basic' | 'robust' | null;
}

interface ConflictItem {
  id: string;
  type: 'data_conflict' | 'state_conflict' | 'version_conflict';
  component: string;
  timestamp: string;
  localData: any;
  remoteData: any;
  resolution?: 'local' | 'remote' | 'merge' | 'manual';
  metadata?: Record<string, any>;
}

interface PerformanceMetrics {
  componentRenderTimes: Record<string, number[]>;
  stateUpdateTimes: Record<string, number[]>;
  syncPerformance: {
    averageTime: number;
    successRate: number;
    errorCount: number;
  };
  memoryUsage: {
    stateSize: number;
    componentCount: number;
    subscriptionCount: number;
  };
}

// Global store instance
class ComplianceIntegrationStore {
  private state: IntegrationState;
  private listeners: Set<() => void>;

  constructor() {
    this.state = {
      userComplianceRecords: [],
      complianceRequirements: [],
      complianceTiers: [],
      syncStatus: 'idle',
      lastSyncTime: null,
      syncErrors: [],
      componentStates: {},
      sharedData: {},
      conflictQueue: [],
      isResolvingConflicts: false,
      performanceMetrics: {
        componentRenderTimes: {},
        stateUpdateTimes: {},
        syncPerformance: {
          averageTime: 0,
          successRate: 100,
          errorCount: 0
        },
        memoryUsage: {
          stateSize: 0,
          componentCount: 0,
          subscriptionCount: 0
        }
      },
      activeSubscriptions: new Map(),
      isLoading: false,
      error: null,
      currentUserId: null,
      currentUserRole: null,
      currentUserTier: null
    };
    
    this.listeners = new Set();
  }

  // State management
  getState(): IntegrationState {
    return { ...this.state };
  }

  setState(updater: (state: IntegrationState) => void): void {
    const newState = { ...this.state };
    updater(newState);
    this.state = newState;
    this.notifyListeners();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  // Initialization
  async initialize(userId: string, role: 'AP' | 'IC' | 'IP' | 'IT', tier: 'basic' | 'robust'): Promise<void> {
    this.setState((state) => {
      state.currentUserId = userId;
      state.currentUserRole = role;
      state.currentUserTier = tier;
      state.isLoading = true;
      state.error = null;
    });

    try {
      await this.loadUserComplianceData(userId);
      this.startRealTimeSync();
      
      this.setState((state) => {
        state.isLoading = false;
        state.lastSyncTime = new Date().toISOString();
      });
    } catch (error) {
      console.error('Failed to initialize integration store:', error);
      this.setState((state) => {
        state.isLoading = false;
        state.error = 'Failed to initialize compliance integration';
      });
    }
  }

  cleanup(): void {
    this.stopRealTimeSync();
    this.setState((state) => {
      state.activeSubscriptions.clear();
      state.componentStates = {};
      state.sharedData = {};
      state.conflictQueue = [];
      state.currentUserId = null;
      state.currentUserRole = null;
      state.currentUserTier = null;
    });
  }

  // Data management
  async loadUserComplianceData(userId: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      this.setState((state) => {
        state.syncStatus = 'syncing';
      });

      // Load user compliance records
      const userRecords = await ComplianceService.getUserComplianceRecords(userId);
      
      // Load compliance requirements templates
      const requirements = ComplianceRequirementsService.getAllRoleTemplates();
      
      // Load tier information
      const tierInfo = await ComplianceTierService.getUserComplianceTierInfo(userId);

      this.setState((state) => {
        state.userComplianceRecords = userRecords;
        state.complianceRequirements = requirements;
        state.complianceTiers = tierInfo ? [tierInfo] : [];
        state.syncStatus = 'idle';
        state.lastSyncTime = new Date().toISOString();
      });

      // Track performance
      const loadTime = Date.now() - startTime;
      this.trackStateUpdate('loadUserComplianceData', loadTime);

    } catch (error) {
      console.error('Failed to load compliance data:', error);
      this.setState((state) => {
        state.syncStatus = 'error';
        state.error = 'Failed to load compliance data';
      });
      this.addSyncError(`Failed to load data: ${error}`);
    }
  }

  async updateComplianceRecord(recordId: string, updates: Partial<UserComplianceRecord>): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Optimistic update
      this.setState((state) => {
        const recordIndex = state.userComplianceRecords.findIndex(r => r.id === recordId);
        if (recordIndex !== -1) {
          state.userComplianceRecords[recordIndex] = {
            ...state.userComplianceRecords[recordIndex],
            ...updates,
            updated_at: new Date().toISOString()
          };
        }
      });

      // Sync with backend
      if (this.state.currentUserId && updates.compliance_status) {
        await ComplianceService.updateComplianceRecord(
          this.state.currentUserId,
          updates.compliance_metrics?.name || 'unknown',
          null, // current_value
          updates.compliance_status,
          '' // notes
        );
      }

      // Track performance
      const updateTime = Date.now() - startTime;
      this.trackStateUpdate('updateComplianceRecord', updateTime);

    } catch (error) {
      console.error('Failed to update compliance record:', error);
      
      // Revert optimistic update
      if (this.state.currentUserId) {
        await this.loadUserComplianceData(this.state.currentUserId);
      }
      
      // Add conflict for manual resolution
      this.addConflict({
        type: 'data_conflict',
        component: 'ComplianceRecord',
        localData: updates,
        remoteData: null,
        metadata: { recordId, error: error?.toString() }
      });
    }
  }

  async refreshAllData(): Promise<void> {
    if (this.state.currentUserId) {
      await this.loadUserComplianceData(this.state.currentUserId);
    }
  }

  // Component state management
  registerComponent(componentId: string, initialState: any): void {
    this.setState((state) => {
      state.componentStates[componentId] = {
        ...initialState,
        _registeredAt: new Date().toISOString(),
        _renderCount: 0
      };
      state.performanceMetrics.memoryUsage.componentCount++;
    });
  }

  updateComponentState(componentId: string, updates: any): void {
    const startTime = Date.now();
    
    this.setState((state) => {
      if (state.componentStates[componentId]) {
        state.componentStates[componentId] = {
          ...state.componentStates[componentId],
          ...updates,
          _lastUpdated: new Date().toISOString()
        };
      }
    });

    const updateTime = Date.now() - startTime;
    this.trackStateUpdate(`component:${componentId}`, updateTime);
  }

  getComponentState(componentId: string): any {
    return this.state.componentStates[componentId] || null;
  }

  unregisterComponent(componentId: string): void {
    this.setState((state) => {
      delete state.componentStates[componentId];
      state.performanceMetrics.memoryUsage.componentCount--;
    });
  }

  // Shared data management
  setSharedData(key: string, data: any): void {
    this.setState((state) => {
      state.sharedData[key] = {
        data,
        _setAt: new Date().toISOString()
      };
    });
  }

  getSharedData(key: string): any {
    const sharedItem = this.state.sharedData[key];
    return sharedItem ? sharedItem.data : null;
  }

  removeSharedData(key: string): void {
    this.setState((state) => {
      delete state.sharedData[key];
    });
  }

  // Real-time synchronization
  startRealTimeSync(): void {
    const userId = this.state.currentUserId;
    if (!userId) return;

    // Create real-time subscription for user compliance records
    const complianceSubscription = supabase
      .channel(`compliance-integration-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_compliance_records',
        filter: `user_id=eq.${userId}`
      }, async (payload) => {
        console.log('Real-time compliance update:', payload);
        
        // Handle different event types
        switch (payload.eventType) {
          case 'INSERT':
            this.setState((state) => {
              state.userComplianceRecords.push(payload.new as UserComplianceRecord);
            });
            break;
          case 'UPDATE':
            this.setState((state) => {
              const index = state.userComplianceRecords.findIndex(r => r.id === payload.new.id);
              if (index !== -1) {
                // Check for conflicts
                const localRecord = state.userComplianceRecords[index];
                const remoteRecord = payload.new as UserComplianceRecord;
                
                if (localRecord.updated_at !== remoteRecord.updated_at) {
                  // Potential conflict detected
                  this.addConflict({
                    type: 'version_conflict',
                    component: 'UserComplianceRecord',
                    localData: localRecord,
                    remoteData: remoteRecord,
                    metadata: { recordId: payload.new.id }
                  });
                } else {
                  state.userComplianceRecords[index] = remoteRecord;
                }
              }
            });
            break;
          case 'DELETE':
            this.setState((state) => {
              state.userComplianceRecords = state.userComplianceRecords.filter(r => r.id !== payload.old.id);
            });
            break;
        }
        
        this.setState((state) => {
          state.lastSyncTime = new Date().toISOString();
        });
      })
      .subscribe();

    // Store subscription
    this.setState((state) => {
      state.activeSubscriptions.set('compliance', complianceSubscription);
      state.performanceMetrics.memoryUsage.subscriptionCount++;
    });
  }

  stopRealTimeSync(): void {
    const subscriptions = this.state.activeSubscriptions;
    subscriptions.forEach((subscription) => {
      supabase.removeChannel(subscription);
    });
    
    this.setState((state) => {
      state.activeSubscriptions.clear();
      state.performanceMetrics.memoryUsage.subscriptionCount = 0;
    });
  }

  async forceSyncNow(): Promise<void> {
    const userId = this.state.currentUserId;
    if (userId) {
      await this.loadUserComplianceData(userId);
    }
  }

  // Conflict resolution
  addConflict(conflict: Omit<ConflictItem, 'id' | 'timestamp'>): void {
    this.setState((state) => {
      state.conflictQueue.push({
        ...conflict,
        id: `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString()
      });
    });
  }

  async resolveConflict(conflictId: string, resolution: ConflictItem['resolution'], mergedData?: any): Promise<void> {
    this.setState((state) => {
      state.isResolvingConflicts = true;
    });

    try {
      const conflict = this.state.conflictQueue.find(c => c.id === conflictId);
      if (!conflict) return;

      let resolvedData;
      switch (resolution) {
        case 'local':
          resolvedData = conflict.localData;
          break;
        case 'remote':
          resolvedData = conflict.remoteData;
          break;
        case 'merge':
          resolvedData = mergedData || { ...conflict.remoteData, ...conflict.localData };
          break;
        case 'manual':
          resolvedData = mergedData;
          break;
      }

      // Apply resolution based on conflict type
      if (conflict.type === 'data_conflict' && conflict.component === 'ComplianceRecord') {
        await this.updateComplianceRecord(conflict.metadata?.recordId, resolvedData);
      }

      // Remove resolved conflict
      this.setState((state) => {
        state.conflictQueue = state.conflictQueue.filter(c => c.id !== conflictId);
      });

    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    } finally {
      this.setState((state) => {
        state.isResolvingConflicts = false;
      });
    }
  }

  clearConflicts(): void {
    this.setState((state) => {
      state.conflictQueue = [];
    });
  }

  // Performance tracking
  trackComponentRender(componentId: string, renderTime: number): void {
    this.setState((state) => {
      if (!state.performanceMetrics.componentRenderTimes[componentId]) {
        state.performanceMetrics.componentRenderTimes[componentId] = [];
      }
      const times = state.performanceMetrics.componentRenderTimes[componentId] as number[];
      times.push(renderTime);
      
      // Keep only last 50 measurements
      if (times.length > 50) {
        times.shift();
      }
    });
  }

  trackStateUpdate(stateKey: string, updateTime: number): void {
    this.setState((state) => {
      if (!state.performanceMetrics.stateUpdateTimes[stateKey]) {
        state.performanceMetrics.stateUpdateTimes[stateKey] = [];
      }
      const times = state.performanceMetrics.stateUpdateTimes[stateKey] as number[];
      times.push(updateTime);
      
      // Keep only last 50 measurements
      if (times.length > 50) {
        times.shift();
      }
    });
  }

  getPerformanceReport(): any {
    const metrics = this.state.performanceMetrics;
    
    // Calculate averages
    const avgRenderTimes: Record<string, number> = {};
    Object.entries(metrics.componentRenderTimes).forEach(([component, times]) => {
      const timeArray = times as number[];
      avgRenderTimes[component] = timeArray.reduce((sum, time) => sum + time, 0) / timeArray.length;
    });

    const avgUpdateTimes: Record<string, number> = {};
    Object.entries(metrics.stateUpdateTimes).forEach(([key, times]) => {
      const timeArray = times as number[];
      avgUpdateTimes[key] = timeArray.reduce((sum, time) => sum + time, 0) / timeArray.length;
    });

    return {
      ...metrics,
      averageRenderTimes: avgRenderTimes,
      averageUpdateTimes: avgUpdateTimes,
      totalStateSize: JSON.stringify(this.state).length
    };
  }

  // Error handling
  setError(error: string | null): void {
    this.setState((state) => {
      state.error = error;
    });
  }

  clearError(): void {
    this.setState((state) => {
      state.error = null;
    });
  }

  addSyncError(error: string): void {
    this.setState((state) => {
      state.syncErrors.push(`${new Date().toISOString()}: ${error}`);
      
      // Keep only last 20 errors
      if (state.syncErrors.length > 20) {
        state.syncErrors.shift();
      }
    });
  }

  clearSyncErrors(): void {
    this.setState((state) => {
      state.syncErrors = [];
    });
  }
}

// Create global store instance
export const complianceIntegrationStore = new ComplianceIntegrationStore();

// React hooks for integration
export const useIntegrationStore = () => {
  const [state, setState] = React.useState(complianceIntegrationStore.getState());

  React.useEffect(() => {
    const unsubscribe = complianceIntegrationStore.subscribe(() => {
      setState(complianceIntegrationStore.getState());
    });
    return unsubscribe;
  }, []);

  return {
    state,
    actions: {
      initialize: complianceIntegrationStore.initialize.bind(complianceIntegrationStore),
      cleanup: complianceIntegrationStore.cleanup.bind(complianceIntegrationStore),
      loadUserComplianceData: complianceIntegrationStore.loadUserComplianceData.bind(complianceIntegrationStore),
      updateComplianceRecord: complianceIntegrationStore.updateComplianceRecord.bind(complianceIntegrationStore),
      refreshAllData: complianceIntegrationStore.refreshAllData.bind(complianceIntegrationStore),
      registerComponent: complianceIntegrationStore.registerComponent.bind(complianceIntegrationStore),
      updateComponentState: complianceIntegrationStore.updateComponentState.bind(complianceIntegrationStore),
      getComponentState: complianceIntegrationStore.getComponentState.bind(complianceIntegrationStore),
      unregisterComponent: complianceIntegrationStore.unregisterComponent.bind(complianceIntegrationStore),
      setSharedData: complianceIntegrationStore.setSharedData.bind(complianceIntegrationStore),
      getSharedData: complianceIntegrationStore.getSharedData.bind(complianceIntegrationStore),
      removeSharedData: complianceIntegrationStore.removeSharedData.bind(complianceIntegrationStore),
      startRealTimeSync: complianceIntegrationStore.startRealTimeSync.bind(complianceIntegrationStore),
      stopRealTimeSync: complianceIntegrationStore.stopRealTimeSync.bind(complianceIntegrationStore),
      forceSyncNow: complianceIntegrationStore.forceSyncNow.bind(complianceIntegrationStore),
      addConflict: complianceIntegrationStore.addConflict.bind(complianceIntegrationStore),
      resolveConflict: complianceIntegrationStore.resolveConflict.bind(complianceIntegrationStore),
      clearConflicts: complianceIntegrationStore.clearConflicts.bind(complianceIntegrationStore),
      trackComponentRender: complianceIntegrationStore.trackComponentRender.bind(complianceIntegrationStore),
      trackStateUpdate: complianceIntegrationStore.trackStateUpdate.bind(complianceIntegrationStore),
      getPerformanceReport: complianceIntegrationStore.getPerformanceReport.bind(complianceIntegrationStore),
      setError: complianceIntegrationStore.setError.bind(complianceIntegrationStore),
      clearError: complianceIntegrationStore.clearError.bind(complianceIntegrationStore),
      addSyncError: complianceIntegrationStore.addSyncError.bind(complianceIntegrationStore),
      clearSyncErrors: complianceIntegrationStore.clearSyncErrors.bind(complianceIntegrationStore)
    }
  };
};

export const useComponentState = (componentId: string, initialState: any = {}) => {
  const { actions } = useIntegrationStore();
  
  React.useEffect(() => {
    actions.registerComponent(componentId, initialState);
    return () => actions.unregisterComponent(componentId);
  }, [componentId, actions, initialState]);

  const state = actions.getComponentState(componentId);
  return [state, (updates: any) => actions.updateComponentState(componentId, updates)] as const;
};

export const useSharedData = (key: string) => {
  const { actions } = useIntegrationStore();
  
  return {
    data: actions.getSharedData(key),
    setData: (data: any) => actions.setSharedData(key, data),
    removeData: () => actions.removeSharedData(key)
  };
};

export const useComplianceSync = (userId: string) => {
  const { state } = useIntegrationStore();

  return {
    records: state.userComplianceRecords,
    status: state.syncStatus,
    lastSync: state.lastSyncTime,
    forceSync: complianceIntegrationStore.forceSyncNow.bind(complianceIntegrationStore),
    error: state.error,
    conflicts: state.conflictQueue
  };
};

// Performance monitoring hook
export const usePerformanceMonitoring = (componentId: string) => {
  const { actions } = useIntegrationStore();
  
  const trackRender = React.useCallback((renderTime: number) => {
    actions.trackComponentRender(componentId, renderTime);
  }, [componentId, actions]);

  return {
    trackRender,
    getReport: actions.getPerformanceReport
  };
};