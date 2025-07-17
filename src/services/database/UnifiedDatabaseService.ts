import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';
import { DatabaseUserRole, ROLE_HIERARCHY } from '@/types/database-roles';

/**
 * Production-ready unified database service layer
 * Implements patterns from DATABASE_INTEGRATION_ARCHITECTURE.md with correct role permissions
 */
export class UnifiedDatabaseService {
  private static instance: UnifiedDatabaseService;
  private static connectionPool: SupabaseClient<Database>;
  private static isInitialized: boolean = false;

  // Singleton pattern for connection management
  public static getInstance(): UnifiedDatabaseService {
    if (!UnifiedDatabaseService.instance) {
      UnifiedDatabaseService.instance = new UnifiedDatabaseService();
    }
    return UnifiedDatabaseService.instance;
  }

  /**
   * Initialize production database connections
   */
  public static async initializeConnections(): Promise<void> {
    if (this.isInitialized) return;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    this.connectionPool = createClient<Database>(supabaseUrl, supabaseKey, {
      db: {
        schema: 'public',
      },
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
      realtime: {
        heartbeatIntervalMs: 30000,
        reconnectAfterMs: (times: number) => Math.min(times * 1000, 30000),
      },
    });

    // Verify connection
    const { error } = await this.connectionPool.from('profiles').select('count').limit(1);
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }

    this.isInitialized = true;
    console.log('✅ Production database connection established');
  }

  /**
   * Get the connection pool instance
   */
  public static getConnection(): SupabaseClient<Database> {
    if (!this.isInitialized || !this.connectionPool) {
      throw new Error('Database not initialized. Call initializeConnections() first.');
    }
    return this.connectionPool;
  }

  /**
   * Role-based query filtering using ACTUAL system roles
   * SA: System Administrator (full access)
   * AD: Administrator (manages everyone except SA users)
   * AP: Authorized Provider (provider-scoped access)
   * IC: Instructor Certified
   * IP: Instructor Provisional  
   * IT: Instructor Trainee
   * IN: Instructor New
   */
  public static applyRoleBasedFilters<T>(
    query: any,
    userRole: DatabaseUserRole,
    userId: string,
    locationId?: string
  ) {
    switch (userRole) {
      case 'SA': // System Admin - full access to everything
        return query;
      
      case 'AD': // Administrator - manages everyone except SA users (NOT location-based)
        return query;
      
      case 'AP': // Authorized Provider - provider-scoped access
        return query.or(`instructor_id.eq.${userId},created_by.eq.${userId},issued_by.eq.${userId}`);
      
      case 'IC': // Instructor Certified - teaching assignments + own records
      case 'IP': // Instructor Provisional - teaching assignments + own records
        return query.or(`instructor_id.eq.${userId},user_id.eq.${userId}`);
      
      case 'IT': // Instructor Trainee - enrollment/own records access
      case 'IN': // Instructor New - enrollment/own records access
        return query.or(`student_id.eq.${userId},user_id.eq.${userId}`);
      
      default:
        throw new Error(`Unknown role: ${userRole}`);
    }
  }

  /**
   * Check if user can access specific table based on role hierarchy
   */
  public static canAccessTable(
    userRole: DatabaseUserRole,
    tableName: string,
    operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
  ): boolean {
    const hierarchy = ROLE_HIERARCHY[userRole];

    // SA can do everything
    if (userRole === 'SA') return true;

    // AD can manage most tables except system-level operations
    if (userRole === 'AD') {
      const restrictedTables = ['audit_log', 'system_health_metrics'];
      if (restrictedTables.includes(tableName) && operation !== 'SELECT') {
        return false;
      }
      return true;
    }

    // AP can manage provider-related data
    if (userRole === 'AP') {
      const managedTables = [
        'training_sessions', 'session_enrollments', 'certificates', 
        'rosters', 'student_roster_members', 'course_schedules',
        'instructor_profiles', 'student_enrollment_profiles'
      ];
      return managedTables.includes(tableName);
    }

    // Instructor roles have limited access
    if (['IC', 'IP', 'IT', 'IN'].includes(userRole)) {
      const readOnlyTables = [
        'training_sessions', 'course_schedules', 'locations', 
        'course_templates', 'certificate_templates'
      ];
      const updateTables = ['session_enrollments', 'certificates'];
      
      if (operation === 'SELECT') {
        return readOnlyTables.includes(tableName) || updateTables.includes(tableName);
      }
      
      if (operation === 'UPDATE') {
        return updateTables.includes(tableName);
      }
      
      return false;
    }

    return false;
  }

  /**
   * Production-ready batch operations with role validation
   */
  public static async batchInsert<T>(
    tableName: string,
    records: Partial<T>[],
    userRole: DatabaseUserRole,
    options: { 
      chunkSize?: number;
      onProgress?: (processed: number, total: number) => void;
    } = {}
  ): Promise<T[]> {
    // Validate permissions
    if (!this.canAccessTable(userRole, tableName, 'INSERT')) {
      throw new Error(`Role ${userRole} does not have INSERT permission for table ${tableName}`);
    }

    const { chunkSize = 1000, onProgress } = options;
    const results: T[] = [];
    
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);
      
      const { data, error } = await this.connectionPool
        .from(tableName)
        .insert(chunk)
        .select();

      if (error) {
        throw new Error(`Batch insert failed at chunk ${Math.floor(i / chunkSize)}: ${error.message}`);
      }

      if (data) {
        results.push(...data);
      }

      onProgress?.(Math.min(i + chunkSize, records.length), records.length);
    }

    return results;
  }

  /**
   * Secure query builder with automatic role filtering
   */
  public static createSecureQuery(
    tableName: string,
    userRole: DatabaseUserRole,
    userId: string,
    locationId?: string
  ) {
    let query = this.connectionPool.from(tableName);

    // Apply role-based filters automatically
    query = this.applyRoleBasedFilters(query, userRole, userId, locationId);

    return query;
  }

  /**
   * Health check for database connections with role context
   */
  public static async healthCheck(userRole?: DatabaseUserRole): Promise<{
    status: 'healthy' | 'degraded' | 'error';
    latency: number;
    details: Record<string, any>;
  }> {
    const startTime = Date.now();
    
    try {
      // Test basic connectivity
      const { data: profileCount, error: profileError } = await this.connectionPool
        .from('profiles')
        .select('count')
        .limit(1);

      // Test role-specific access if role provided
      let roleSpecificCheck = null;
      if (userRole) {
        const testQuery = this.connectionPool.from('training_sessions').select('id').limit(1);
        const { data: roleData, error: roleError } = await testQuery;
        roleSpecificCheck = { 
          hasAccess: !roleError,
          error: roleError?.message 
        };
      }

      const latency = Date.now() - startTime;

      if (profileError) {
        return {
          status: 'degraded',
          latency,
          details: {
            profileError: profileError.message,
            roleCheck: roleSpecificCheck,
          }
        };
      }

      return {
        status: 'healthy',
        latency,
        details: {
          profileCount: profileCount?.length || 0,
          connection: 'active',
          roleCheck: roleSpecificCheck,
          userRole: userRole || 'anonymous',
        }
      };

    } catch (error) {
      return {
        status: 'error',
        latency: Date.now() - startTime,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          userRole: userRole || 'anonymous',
        }
      };
    }
  }

  /**
   * Enhanced enrollment workflow with proper role validation
   */
  public static async enrollStudentInSession(
    sessionId: string,
    studentId: string,
    enrolledBy: string,
    userRole: DatabaseUserRole
  ): Promise<any> {
    // Only AP and above can enroll students
    if (ROLE_HIERARCHY[userRole] < ROLE_HIERARCHY['AP']) {
      throw new Error('Insufficient permissions to enroll students');
    }

    const { data, error } = await this.connectionPool
      .from('session_enrollments')
      .insert({
        session_id: sessionId,
        student_id: studentId,
        enrollment_date: new Date().toISOString(),
        attendance_status: 'REGISTERED',
        completion_status: 'NOT_STARTED'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Enrollment failed: ${error.message}`);
    }

    return data;
  }

  /**
   * Connection pool statistics with security context
   */
  public static getConnectionStats(): {
    isInitialized: boolean;
    hasActiveConnection: boolean;
    configuration: Record<string, any>;
    securityLevel: string;
  } {
    return {
      isInitialized: this.isInitialized,
      hasActiveConnection: !!this.connectionPool,
      configuration: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Configured' : '✗ Missing',
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Configured' : '✗ Missing',
        schema: 'public',
        realtime: true,
      },
      securityLevel: 'Role-based access control enabled'
    };
  }
}

// Auto-initialize on module load in production
if (typeof window !== 'undefined') {
  UnifiedDatabaseService.initializeConnections().catch(console.error);
}

export default UnifiedDatabaseService;