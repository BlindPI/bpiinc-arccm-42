
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HealthMetrics {
  database: {
    status: 'healthy' | 'warning' | 'critical';
    responseTime: string;
    connections: string;
  };
  api: {
    status: 'healthy' | 'warning' | 'critical';
    responseTime: string;
    requestsPerMinute: string;
  };
  storage: {
    status: 'healthy' | 'warning' | 'critical';
    usedSpace: string;
    availableSpace: string;
  };
  functions: {
    status: 'healthy' | 'warning' | 'critical';
    activeCount: string;
    avgExecution: string;
  };
}

export interface SystemStatus {
  overall: 'healthy' | 'warning' | 'critical';
  uptime: string;
  recentAlerts: Array<{
    message: string;
    severity: 'low' | 'medium' | 'high';
    timestamp: string;
  }>;
}

export interface PerformanceMetrics {
  cpu: number;
  memory: number;
  disk: number;
}

export function useSystemHealth() {
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: async () => {
      try {
        // Simulate system health check
        const startTime = Date.now();
        
        // Test database connectivity
        const { error: dbError } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);
        
        const dbResponseTime = Date.now() - startTime;
        
        // Generate mock health data
        const mockHealthMetrics: HealthMetrics = {
          database: {
            status: dbError ? 'critical' : 'healthy',
            responseTime: `${dbResponseTime}ms`,
            connections: '5/100'
          },
          api: {
            status: 'healthy',
            responseTime: '45ms',
            requestsPerMinute: '120'
          },
          storage: {
            status: 'healthy',
            usedSpace: '2.1 GB',
            availableSpace: '47.9 GB'
          },
          functions: {
            status: 'healthy',
            activeCount: '12',
            avgExecution: '120ms'
          }
        };

        const mockSystemStatus: SystemStatus = {
          overall: dbError ? 'warning' : 'healthy',
          uptime: '99.9%',
          recentAlerts: dbError ? [
            {
              message: 'Database connectivity issue detected',
              severity: 'high' as const,
              timestamp: new Date().toISOString()
            }
          ] : []
        };

        const mockPerformanceMetrics: PerformanceMetrics = {
          cpu: Math.floor(Math.random() * 30) + 10,
          memory: Math.floor(Math.random() * 40) + 20,
          disk: Math.floor(Math.random() * 30) + 35
        };

        return {
          healthMetrics: mockHealthMetrics,
          systemStatus: mockSystemStatus,
          performanceMetrics: mockPerformanceMetrics
        };
      } catch (error) {
        console.error('Error fetching system health:', error);
        throw error;
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 15000
  });

  useEffect(() => {
    if (data) {
      setHealthMetrics(data.healthMetrics);
      setSystemStatus(data.systemStatus);
      setPerformanceMetrics(data.performanceMetrics);
    }
  }, [data]);

  const refreshHealthData = async () => {
    await refetch();
  };

  return {
    healthMetrics,
    systemStatus,
    performanceMetrics,
    refreshHealthData,
    isLoading
  };
}
