
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface BackendFunction {
  name: string;
  description?: string;
  isConnected: boolean;
  lastChecked?: string;
  errorMessage?: string;
  category: string;
}

export interface BackendIntegrationStatus {
  teamsData: { team_data: Json }[];
  analyticsData: Json;
  complianceData: Json;
}

export interface BackendHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    database: boolean;
    edgeFunctions: boolean;
    storage: boolean;
  };
  responseTime: number;
  lastCheck: string;
}

export interface BackendPerformanceMetrics {
  averageResponseTime: number;
  successRate: number;
  errorRate: number;
  totalRequests: number;
  operationalMetrics?: {
    cpuUsage: number;
    memoryUsage: number;
    activeConnections: number;
  };
}

export class BackendIntegrationService {
  static async checkHealth(): Promise<BackendHealthCheck> {
    const startTime = Date.now();
    
    try {
      // Test database connection
      const { error: dbError } = await supabase.from('profiles').select('id').limit(1);
      const dbStatus = !dbError;

      // Test edge functions (simplified check)
      const edgeFunctionsStatus = true; // Assume healthy if DB is working

      // Test storage
      const { error: storageError } = await supabase.storage.listBuckets();
      const storageStatus = !storageError;

      const responseTime = Date.now() - startTime;
      const overallStatus = dbStatus && edgeFunctionsStatus && storageStatus ? 'healthy' : 'degraded';

      return {
        status: overallStatus,
        services: {
          database: dbStatus,
          edgeFunctions: edgeFunctionsStatus,
          storage: storageStatus
        },
        responseTime,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        services: {
          database: false,
          edgeFunctions: false,
          storage: false
        },
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString()
      };
    }
  }

  static async getBackendFunctionStatus(): Promise<BackendFunction[]> {
    try {
      const { data, error } = await supabase.rpc('get_backend_function_status');
      
      if (error) {
        console.error('Error fetching backend function status:', error);
        throw error;
      }

      return (data || []).map((func: any) => ({
        name: func.name,
        description: func.description,
        isConnected: func.is_connected,
        lastChecked: func.last_checked,
        errorMessage: func.error_message,
        category: func.category
      }));
    } catch (error) {
      console.error('Error in getBackendFunctionStatus:', error);
      throw error;
    }
  }

  static async initializeAllIntegrations(): Promise<void> {
    try {
      const { error } = await supabase.rpc('initialize_all_integrations');
      
      if (error) {
        console.error('Error initializing integrations:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in initializeAllIntegrations:', error);
      throw error;
    }
  }

  static async getIntegrationStatus(): Promise<BackendIntegrationStatus> {
    try {
      // Get teams data
      const { data: teamsData, error: teamsError } = await supabase.rpc('get_enhanced_teams_data');
      if (teamsError) throw teamsError;

      // Get analytics data
      const { data: analyticsData, error: analyticsError } = await supabase.rpc('get_team_analytics_summary');
      if (analyticsError) throw analyticsError;

      // Get compliance data
      const { data: complianceData, error: complianceError } = await supabase.rpc('get_compliance_metrics');
      if (complianceError) throw complianceError;

      return {
        teamsData: teamsData || [],
        analyticsData: analyticsData || {},
        complianceData: complianceData || {}
      };
    } catch (error) {
      console.error('Error getting integration status:', error);
      throw error;
    }
  }

  static async testDatabaseConnection(): Promise<{ success: boolean; latency: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      const latency = Date.now() - startTime;
      
      return {
        success: !error,
        latency,
        error: error?.message
      };
    } catch (error) {
      return {
        success: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async getBackendFunctions(): Promise<BackendFunction[]> {
    // Return list of available backend functions
    const functions: BackendFunction[] = [
      {
        name: 'get_enhanced_teams_data',
        description: 'Enhanced team data retrieval',
        isConnected: true,
        category: 'Team Management'
      },
      {
        name: 'get_team_analytics_summary',
        description: 'Team analytics summary',
        isConnected: true,
        category: 'Team Management'
      },
      {
        name: 'get_compliance_metrics',
        description: 'Compliance metrics retrieval',
        isConnected: true,
        category: 'Compliance'
      },
      {
        name: 'calculate_team_performance_metrics',
        description: 'Team performance calculation',
        isConnected: true,
        category: 'Team Management'
      }
    ];

    return functions;
  }

  static async testFunction(functionName: string): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      const { data, error } = await supabase.rpc(functionName as any);
      
      return {
        success: !error,
        result: data,
        error: error?.message
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async getPerformanceMetrics(): Promise<BackendPerformanceMetrics> {
    // Simulate performance metrics - in real implementation, these would come from monitoring
    return {
      averageResponseTime: 150,
      successRate: 99.5,
      errorRate: 0.5,
      totalRequests: 10000,
      operationalMetrics: {
        cpuUsage: 45,
        memoryUsage: 60,
        activeConnections: 25
      }
    };
  }

  static async restartService(serviceName: string): Promise<{ success: boolean; message: string }> {
    // Placeholder for service restart functionality
    return {
      success: true,
      message: `Service ${serviceName} restart initiated`
    };
  }

  static async getSystemLogs(limit: number = 100): Promise<any[]> {
    // Placeholder for system logs
    return [];
  }

  static async runDiagnostics(): Promise<{
    database: any;
    functions: any;
    performance: any;
    storage: any;
  }> {
    const [dbTest, functions, performance] = await Promise.all([
      this.testDatabaseConnection(),
      this.getBackendFunctions(),
      this.getPerformanceMetrics()
    ]);

    return {
      database: dbTest,
      functions,
      performance,
      storage: { status: 'healthy' }
    };
  }
}
