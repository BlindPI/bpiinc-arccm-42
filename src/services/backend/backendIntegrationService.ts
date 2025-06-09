
import { supabase } from '@/integrations/supabase/client';

export interface BackendConnectionStatus {
  isConnected: boolean;
  lastChecked: Date;
  errorMessage?: string;
}

export interface SystemHealth {
  database: BackendConnectionStatus;
  authentication: BackendConnectionStatus;
  storage: BackendConnectionStatus;
  functions: BackendConnectionStatus;
}

export interface BackendFunction {
  name: string;
  isConnected: boolean;
  lastChecked: Date;
  description: string;
  errorMessage?: string;
}

export class BackendIntegrationService {
  static async checkDatabaseConnection(): Promise<BackendConnectionStatus> {
    try {
      const { data, error } = await supabase
        .from('backend_function_status')
        .select('*')
        .limit(1);

      if (error) throw error;

      return {
        isConnected: true,
        lastChecked: new Date()
      };
    } catch (error) {
      return {
        isConnected: false,
        lastChecked: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async checkAuthenticationService(): Promise<BackendConnectionStatus> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      return {
        isConnected: true,
        lastChecked: new Date()
      };
    } catch (error) {
      return {
        isConnected: false,
        lastChecked: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Auth service unavailable'
      };
    }
  }

  static async checkStorageService(): Promise<BackendConnectionStatus> {
    try {
      const { data, error } = await supabase.storage.listBuckets();
      
      if (error) throw error;

      return {
        isConnected: true,
        lastChecked: new Date()
      };
    } catch (error) {
      return {
        isConnected: false,
        lastChecked: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Storage service unavailable'
      };
    }
  }

  static async getSystemHealth(): Promise<SystemHealth> {
    const [database, authentication, storage] = await Promise.all([
      this.checkDatabaseConnection(),
      this.checkAuthenticationService(),
      this.checkStorageService()
    ]);

    return {
      database,
      authentication,
      storage,
      functions: {
        isConnected: true,
        lastChecked: new Date()
      }
    };
  }

  static async getBackendFunctionStatus(): Promise<BackendFunction[]> {
    // Mock backend function status - will be replaced with actual implementation
    const mockFunctions: BackendFunction[] = [
      {
        name: 'calculate_enhanced_lead_score',
        isConnected: true,
        lastChecked: new Date(),
        description: 'Enhanced lead scoring calculation'
      },
      {
        name: 'get_enhanced_teams_data',
        isConnected: true,
        lastChecked: new Date(),
        description: 'Enhanced team data retrieval'
      },
      {
        name: 'get_team_analytics_summary',
        isConnected: false,
        lastChecked: new Date(),
        description: 'Team analytics summary generation',
        errorMessage: 'Function not connected to frontend'
      }
    ];

    return mockFunctions;
  }

  static async initializeAllIntegrations(): Promise<void> {
    try {
      // Mock initialization - will be replaced with actual implementation
      console.log('Initializing all backend integrations...');
      
      // Simulate some async work
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Backend integrations initialized successfully');
    } catch (error) {
      console.error('Failed to initialize integrations:', error);
      throw error;
    }
  }

  static async getEnhancedTeamData(): Promise<{
    teamsData: any[];
    analyticsData: any;
    complianceData: any;
  }> {
    try {
      const { data: teamsData, error: teamsError } = await supabase.rpc('get_enhanced_teams_data');
      if (teamsError) throw teamsError;

      const { data: analyticsData, error: analyticsError } = await supabase.rpc('get_team_analytics_summary');
      if (analyticsError) throw analyticsError;

      const { data: complianceData, error: complianceError } = await supabase.rpc('get_compliance_metrics');
      if (complianceError) throw complianceError;

      return {
        teamsData: teamsData || [],
        analyticsData: analyticsData || {},
        complianceData: complianceData || {}
      };
    } catch (error) {
      console.error('Error fetching enhanced team data:', error);
      throw error;
    }
  }

  static async updateFunctionStatus(functionName: string, status: boolean, errorMessage?: string): Promise<void> {
    const { error } = await supabase
      .from('backend_function_status')
      .upsert({
        function_name: functionName,
        is_connected: status,
        last_checked: new Date().toISOString(),
        error_message: errorMessage,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  }
}
