import React from 'react';
import { complianceIntegrationStore } from '@/services/integration/ComplianceIntegrationStore';

// Performance tracking interfaces
interface PerformanceMetric {
  componentId: string;
  operationType: 'render' | 'update' | 'mount' | 'unmount' | 'effect';
  startTime: number;
  endTime: number;
  duration: number;
  timestamp: string;
  props?: any;
  metadata?: Record<string, any>;
}

interface ComponentPerformanceStats {
  componentId: string;
  totalRenders: number;
  averageRenderTime: number;
  maxRenderTime: number;
  minRenderTime: number;
  lastRenderTime: number;
  memoryUsage: number;
  reRenderCount: number;
  wastedRenders: number;
  optimizationScore: number;
}

interface PerformanceThresholds {
  renderTimeWarning: number; // ms
  renderTimeCritical: number; // ms
  maxWastedRenders: number;
  memoryWarningMB: number;
  memoryErrorMB: number;
}

interface MemoizationConfig {
  enabled: boolean;
  maxCacheSize: number;
  cacheStrategy: 'lru' | 'fifo' | 'custom';
  dependencyTracking: boolean;
  autoOptimize: boolean;
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  componentId: string;
  message: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestions: string[];
  metadata?: Record<string, any>;
}

// Performance optimization strategies
type OptimizationStrategy = 
  | 'memo'
  | 'useMemo'
  | 'useCallback'
  | 'lazy'
  | 'split'
  | 'virtualize'
  | 'debounce'
  | 'throttle'
  | 'cache';

interface OptimizationRecommendation {
  componentId: string;
  strategy: OptimizationStrategy;
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  expectedImprovement: string;
  implementation: string;
  codeExample?: string;
}

// Main Performance Manager Class
export class ComponentPerformanceManager {
  private static instance: ComponentPerformanceManager;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private componentStats: Map<string, ComponentPerformanceStats> = new Map();
  private alerts: PerformanceAlert[] = [];
  private memoCache: Map<string, any> = new Map();
  private performanceObservers: Map<string, PerformanceObserver> = new Map();
  
  private config: {
    thresholds: PerformanceThresholds;
    memoization: MemoizationConfig;
    enableProfiling: boolean;
    enableRealtimeMonitoring: boolean;
    maxMetricsHistory: number;
  } = {
    thresholds: {
      renderTimeWarning: 16, // 16ms for 60fps
      renderTimeCritical: 33, // 33ms for 30fps
      maxWastedRenders: 5,
      memoryWarningMB: 50,
      memoryErrorMB: 100
    },
    memoization: {
      enabled: true,
      maxCacheSize: 1000,
      cacheStrategy: 'lru',
      dependencyTracking: true,
      autoOptimize: true
    },
    enableProfiling: process.env.NODE_ENV === 'development',
    enableRealtimeMonitoring: true,
    maxMetricsHistory: 100
  };

  private constructor() {
    this.initializePerformanceMonitoring();
  }

  public static getInstance(): ComponentPerformanceManager {
    if (!ComponentPerformanceManager.instance) {
      ComponentPerformanceManager.instance = new ComponentPerformanceManager();
    }
    return ComponentPerformanceManager.instance;
  }

  // Performance monitoring initialization
  private initializePerformanceMonitoring(): void {
    if (!this.config.enableProfiling) return;

    // Set up performance observer for long tasks
    if (typeof PerformanceObserver !== 'undefined') {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.duration > this.config.thresholds.renderTimeCritical) {
            this.addAlert({
              type: 'warning',
              componentId: 'system',
              message: `Long task detected: ${Math.round(entry.duration)}ms`,
              severity: 'high',
              suggestions: [
                'Consider breaking this task into smaller chunks',
                'Use React.memo() for expensive components',
                'Implement virtualization for large lists'
              ]
            });
          }
        });
      });

      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.performanceObservers.set('longtask', longTaskObserver);
      } catch (error) {
        console.warn('Long task observer not supported:', error);
      }
    }

    // Set up memory usage monitoring
    this.startMemoryMonitoring();
  }

  // Core performance tracking methods
  public startTracking(componentId: string, operationType: PerformanceMetric['operationType'], props?: any): string {
    if (!this.config.enableProfiling) return '';

    const trackingId = `${componentId}-${operationType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = performance.now();
    
    // Store initial tracking data
    const metric: Partial<PerformanceMetric> = {
      componentId,
      operationType,
      startTime,
      timestamp: new Date().toISOString(),
      props
    };

    // Store in temporary tracking map
    this.metrics.set(trackingId, [metric as PerformanceMetric]);
    
    return trackingId;
  }

  public endTracking(trackingId: string, metadata?: Record<string, any>): void {
    if (!this.config.enableProfiling || !trackingId) return;

    const endTime = performance.now();
    const storedMetrics = this.metrics.get(trackingId);
    
    if (storedMetrics && storedMetrics.length > 0) {
      const metric = storedMetrics[0];
      metric.endTime = endTime;
      metric.duration = endTime - metric.startTime;
      metric.metadata = metadata;

      // Move to permanent storage
      this.addMetric(metric);
      this.updateComponentStats(metric);
      this.checkPerformanceThresholds(metric);
      
      // Clean up temporary tracking
      this.metrics.delete(trackingId);
    }
  }

  private addMetric(metric: PerformanceMetric): void {
    const componentMetrics = this.metrics.get(metric.componentId) || [];
    componentMetrics.push(metric);
    
    // Keep only recent metrics
    if (componentMetrics.length > this.config.maxMetricsHistory) {
      componentMetrics.shift();
    }
    
    this.metrics.set(metric.componentId, componentMetrics);
    
    // Update integration store
    complianceIntegrationStore.trackComponentRender(metric.componentId, metric.duration);
  }

  private updateComponentStats(metric: PerformanceMetric): void {
    const existingStats = this.componentStats.get(metric.componentId);
    const renderTime = metric.duration;
    
    if (existingStats) {
      existingStats.totalRenders++;
      existingStats.lastRenderTime = renderTime;
      existingStats.averageRenderTime = (existingStats.averageRenderTime * (existingStats.totalRenders - 1) + renderTime) / existingStats.totalRenders;
      existingStats.maxRenderTime = Math.max(existingStats.maxRenderTime, renderTime);
      existingStats.minRenderTime = Math.min(existingStats.minRenderTime, renderTime);
      
      // Check for wasted renders (similar props but re-rendered)
      if (this.isWastedRender(metric)) {
        existingStats.wastedRenders++;
      }
      
      // Calculate optimization score
      existingStats.optimizationScore = this.calculateOptimizationScore(existingStats);
    } else {
      this.componentStats.set(metric.componentId, {
        componentId: metric.componentId,
        totalRenders: 1,
        averageRenderTime: renderTime,
        maxRenderTime: renderTime,
        minRenderTime: renderTime,
        lastRenderTime: renderTime,
        memoryUsage: this.getComponentMemoryUsage(metric.componentId),
        reRenderCount: 1,
        wastedRenders: 0,
        optimizationScore: 100
      });
    }
  }

  private isWastedRender(metric: PerformanceMetric): boolean {
    const componentMetrics = this.metrics.get(metric.componentId) || [];
    if (componentMetrics.length < 2) return false;
    
    const previousMetric = componentMetrics[componentMetrics.length - 2];
    
    // Simple heuristic: if props are similar and render time is significant, it might be wasted
    return (
      JSON.stringify(metric.props) === JSON.stringify(previousMetric.props) &&
      metric.duration > this.config.thresholds.renderTimeWarning
    );
  }

  private calculateOptimizationScore(stats: ComponentPerformanceStats): number {
    let score = 100;
    
    // Deduct points for slow renders
    if (stats.averageRenderTime > this.config.thresholds.renderTimeWarning) {
      score -= 20;
    }
    if (stats.averageRenderTime > this.config.thresholds.renderTimeCritical) {
      score -= 30;
    }
    
    // Deduct points for wasted renders
    const wastedRenderRatio = stats.wastedRenders / stats.totalRenders;
    score -= wastedRenderRatio * 30;
    
    // Deduct points for high memory usage
    if (stats.memoryUsage > this.config.thresholds.memoryWarningMB) {
      score -= 15;
    }
    
    return Math.max(0, Math.round(score));
  }

  private checkPerformanceThresholds(metric: PerformanceMetric): void {
    const { duration, componentId } = metric;
    
    if (duration > this.config.thresholds.renderTimeCritical) {
      this.addAlert({
        type: 'error',
        componentId,
        message: `Critical slow render: ${Math.round(duration)}ms`,
        severity: 'critical',
        suggestions: [
          'Consider using React.memo() to prevent unnecessary re-renders',
          'Break down large components into smaller ones',
          'Use useMemo() for expensive calculations',
          'Implement virtualization for large data sets'
        ],
        metadata: { renderTime: duration, threshold: this.config.thresholds.renderTimeCritical }
      });
    } else if (duration > this.config.thresholds.renderTimeWarning) {
      this.addAlert({
        type: 'warning',
        componentId,
        message: `Slow render detected: ${Math.round(duration)}ms`,
        severity: 'medium',
        suggestions: [
          'Consider optimizing this component',
          'Use React DevTools Profiler to identify bottlenecks',
          'Check for unnecessary prop changes'
        ],
        metadata: { renderTime: duration, threshold: this.config.thresholds.renderTimeWarning }
      });
    }
  }

  private addAlert(alert: Omit<PerformanceAlert, 'id' | 'timestamp'>): void {
    const newAlert: PerformanceAlert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };
    
    this.alerts.unshift(newAlert);
    
    // Keep only recent alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(0, 50);
    }
    
    // Console log for development
    if (this.config.enableProfiling) {
      console.warn(`[Performance ${alert.type}]`, alert.message, {
        component: alert.componentId,
        suggestions: alert.suggestions
      });
    }
  }

  // Memory monitoring
  private startMemoryMonitoring(): void {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        if (memory) {
          const usedMB = memory.usedJSHeapSize / (1024 * 1024);
          
          if (usedMB > this.config.thresholds.memoryErrorMB) {
            this.addAlert({
              type: 'error',
              componentId: 'system',
              message: `High memory usage: ${Math.round(usedMB)}MB`,
              severity: 'critical',
              suggestions: [
                'Check for memory leaks',
                'Clear unused component references',
                'Optimize large data structures',
                'Use React.memo() to prevent object recreation'
              ]
            });
          } else if (usedMB > this.config.thresholds.memoryWarningMB) {
            this.addAlert({
              type: 'warning',
              componentId: 'system',
              message: `Elevated memory usage: ${Math.round(usedMB)}MB`,
              severity: 'medium',
              suggestions: [
                'Monitor memory usage trends',
                'Consider implementing cleanup in useEffect',
                'Review component prop dependencies'
              ]
            });
          }
        }
      }, 30000); // Check every 30 seconds
    }
  }

  private getComponentMemoryUsage(componentId: string): number {
    // Simplified memory estimation
    const componentMetrics = this.metrics.get(componentId) || [];
    return componentMetrics.length * 0.001; // Rough estimate in MB
  }

  // Memoization helpers
  public memoize<T>(key: string, computeFn: () => T, dependencies: any[]): T {
    if (!this.config.memoization.enabled) {
      return computeFn();
    }

    const cacheKey = `${key}-${JSON.stringify(dependencies)}`;
    
    if (this.memoCache.has(cacheKey)) {
      return this.memoCache.get(cacheKey);
    }
    
    const result = computeFn();
    
    // LRU cache management
    if (this.memoCache.size >= this.config.memoization.maxCacheSize) {
      const firstKey = this.memoCache.keys().next().value;
      this.memoCache.delete(firstKey);
    }
    
    this.memoCache.set(cacheKey, result);
    return result;
  }

  // Performance analysis and recommendations
  public generateOptimizationRecommendations(componentId?: string): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    const componentsToAnalyze = componentId 
      ? [componentId]
      : Array.from(this.componentStats.keys());

    componentsToAnalyze.forEach(id => {
      const stats = this.componentStats.get(id);
      if (!stats) return;

      // Slow render recommendations
      if (stats.averageRenderTime > this.config.thresholds.renderTimeWarning) {
        recommendations.push({
          componentId: id,
          strategy: 'memo',
          priority: stats.averageRenderTime > this.config.thresholds.renderTimeCritical ? 'critical' : 'high',
          description: `Component has slow average render time (${Math.round(stats.averageRenderTime)}ms)`,
          expectedImprovement: '20-50% render time reduction',
          implementation: 'Wrap component with React.memo()',
          codeExample: `export default React.memo(${id});`
        });
      }

      // Wasted renders recommendations
      if (stats.wastedRenders > this.config.thresholds.maxWastedRenders) {
        recommendations.push({
          componentId: id,
          strategy: 'useCallback',
          priority: 'medium',
          description: `Component has ${stats.wastedRenders} wasted renders`,
          expectedImprovement: '10-30% fewer re-renders',
          implementation: 'Use useCallback for event handlers',
          codeExample: `const handleClick = useCallback(() => { /* handler */ }, [dependencies]);`
        });
      }

      // High memory usage recommendations
      if (stats.memoryUsage > this.config.thresholds.memoryWarningMB) {
        recommendations.push({
          componentId: id,
          strategy: 'lazy',
          priority: 'medium',
          description: `Component has high memory usage (${Math.round(stats.memoryUsage)}MB)`,
          expectedImprovement: '15-40% memory reduction',
          implementation: 'Use React.lazy() for code splitting',
          codeExample: `const ${id} = React.lazy(() => import('./${id}'));`
        });
      }

      // Low optimization score recommendations
      if (stats.optimizationScore < 70) {
        recommendations.push({
          componentId: id,
          strategy: 'useMemo',
          priority: 'medium',
          description: `Component has low optimization score (${stats.optimizationScore})`,
          expectedImprovement: '10-25% performance improvement',
          implementation: 'Use useMemo for expensive calculations',
          codeExample: `const expensiveValue = useMemo(() => computeExpensiveValue(props), [props.key]);`
        });
      }
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Public API methods
  public getComponentStats(componentId?: string): ComponentPerformanceStats[] {
    if (componentId) {
      const stats = this.componentStats.get(componentId);
      return stats ? [stats] : [];
    }
    return Array.from(this.componentStats.values());
  }

  public getPerformanceAlerts(componentId?: string): PerformanceAlert[] {
    if (componentId) {
      return this.alerts.filter(alert => alert.componentId === componentId);
    }
    return [...this.alerts];
  }

  public getPerformanceReport(): {
    summary: {
      totalComponents: number;
      averageRenderTime: number;
      totalAlerts: number;
      optimizationScore: number;
    };
    slowestComponents: ComponentPerformanceStats[];
    recentAlerts: PerformanceAlert[];
    recommendations: OptimizationRecommendation[];
  } {
    const stats = Array.from(this.componentStats.values());
    const totalComponents = stats.length;
    const averageRenderTime = stats.length > 0 
      ? stats.reduce((sum, stat) => sum + stat.averageRenderTime, 0) / stats.length
      : 0;
    const totalAlerts = this.alerts.length;
    const optimizationScore = stats.length > 0
      ? stats.reduce((sum, stat) => sum + stat.optimizationScore, 0) / stats.length
      : 100;

    return {
      summary: {
        totalComponents,
        averageRenderTime: Math.round(averageRenderTime * 100) / 100,
        totalAlerts,
        optimizationScore: Math.round(optimizationScore)
      },
      slowestComponents: stats
        .sort((a, b) => b.averageRenderTime - a.averageRenderTime)
        .slice(0, 10),
      recentAlerts: this.alerts.slice(0, 10),
      recommendations: this.generateOptimizationRecommendations()
    };
  }

  public clearAlerts(componentId?: string): void {
    if (componentId) {
      this.alerts = this.alerts.filter(alert => alert.componentId !== componentId);
    } else {
      this.alerts = [];
    }
  }

  public clearMetrics(componentId?: string): void {
    if (componentId) {
      this.metrics.delete(componentId);
      this.componentStats.delete(componentId);
    } else {
      this.metrics.clear();
      this.componentStats.clear();
    }
  }

  public updateConfig(newConfig: Partial<typeof this.config>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public cleanup(): void {
    this.performanceObservers.forEach(observer => observer.disconnect());
    this.performanceObservers.clear();
    this.metrics.clear();
    this.componentStats.clear();
    this.alerts = [];
    this.memoCache.clear();
  }
}

// Singleton instance
export const performanceManager = ComponentPerformanceManager.getInstance();

// React hooks for performance monitoring
export const usePerformanceTracking = (componentId: string) => {
  const [stats, setStats] = React.useState<ComponentPerformanceStats | null>(null);
  const [alerts, setAlerts] = React.useState<PerformanceAlert[]>([]);

  React.useEffect(() => {
    const updateStats = () => {
      const componentStats = performanceManager.getComponentStats(componentId);
      setStats(componentStats[0] || null);
      setAlerts(performanceManager.getPerformanceAlerts(componentId));
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [componentId]);

  const startTracking = React.useCallback((operationType: PerformanceMetric['operationType'], props?: any) => {
    return performanceManager.startTracking(componentId, operationType, props);
  }, [componentId]);

  const endTracking = React.useCallback((trackingId: string, metadata?: Record<string, any>) => {
    performanceManager.endTracking(trackingId, metadata);
  }, []);

  return {
    stats,
    alerts,
    startTracking,
    endTracking
  };
};

// HOC for automatic performance tracking
export const withPerformanceTracking = <P extends object>(
  Component: React.ComponentType<P>,
  componentId?: string
) => {
  const WrappedComponent = React.memo((props: P) => {
    const actualComponentId = componentId || Component.displayName || Component.name || 'UnknownComponent';
    const trackingIdRef = React.useRef<string>('');

    // Track render performance
    React.useLayoutEffect(() => {
      trackingIdRef.current = performanceManager.startTracking(actualComponentId, 'render', props);
      
      return () => {
        if (trackingIdRef.current) {
          performanceManager.endTracking(trackingIdRef.current);
        }
      };
    });

    return React.createElement(Component, props);
  });

  WrappedComponent.displayName = `withPerformanceTracking(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Utility function for measuring component performance
export const measurePerformance = async <T>(
  componentId: string,
  operation: () => Promise<T> | T,
  operationType: PerformanceMetric['operationType'] = 'update'
): Promise<T> => {
  const trackingId = performanceManager.startTracking(componentId, operationType);
  
  try {
    const result = await operation();
    performanceManager.endTracking(trackingId);
    return result;
  } catch (error) {
    performanceManager.endTracking(trackingId, { error: error.toString() });
    throw error;
  }
};