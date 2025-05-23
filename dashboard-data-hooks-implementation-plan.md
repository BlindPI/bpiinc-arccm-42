# Dashboard Data Hooks Implementation Plan

This document outlines a comprehensive implementation plan for three dashboard data hooks in the Assured Response CCM application. Each hook will provide real-time data for role-specific dashboards, replacing the current mock data implementation with robust, secure, and performant data retrieval mechanisms.

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Implementation Overview](#implementation-overview)
3. [Database Schema Design](#database-schema-design)
4. [Data Migration Strategy](#data-migration-strategy)
5. [Hook Implementation Details](#hook-implementation-details)
   - [useAdminDashboardData](#useadmindashboarddata)
   - [useProviderDashboardData](#useproviderdashboarddata)
   - [useInstructorDashboardData](#useinstructordashboarddata)
6. [Access Control & Security](#access-control--security)
7. [Testing Strategy](#testing-strategy)
8. [Performance Optimization](#performance-optimization)
9. [Implementation Timeline](#implementation-timeline)

## Current State Analysis

### Mock Data Audit

The current implementation uses hardcoded mock data in the dashboard components, which presents several limitations:

1. **Static Data**: Dashboard metrics don't reflect actual system state
2. **No Personalization**: All users of the same role see identical data
3. **No Historical Tracking**: Unable to show trends or changes over time
4. **Limited Testing**: Difficult to test dashboard behavior with different data scenarios
5. **Maintenance Burden**: Mock data must be manually updated to reflect system changes

### Database Schema Audit

The current database schema lacks several tables needed for comprehensive dashboard metrics:

1. Missing tables for tracking user engagement and activity
2. Incomplete relationship modeling between entities
3. Insufficient indexing for performance optimization
4. Lack of proper constraints for data integrity
5. No audit logging for compliance tracking

## Implementation Overview

The implementation will follow these high-level steps for each dashboard data hook:

1. Design normalized database schema with proper relationships
2. Create SQL migration scripts for schema changes
3. Develop data migration strategy for existing data
4. Implement data hooks with proper error handling and fallbacks
5. Add access controls based on user roles
6. Create automated tests for data integrity
7. Optimize queries for performance
## Database Schema Design

### Common Tables

```sql
-- Audit logging for all system actions
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    user_id UUID REFERENCES profiles(id),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address VARCHAR(50),
    user_agent TEXT
);

-- User activity tracking
CREATE TABLE user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    activity_date DATE NOT NULL,
    duration_minutes INTEGER,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Metrics tracking for historical data
CREATE TABLE metrics_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    period_start DATE,
    period_end DATE
);
```

### Admin Dashboard Tables

```sql
-- Organization metrics
CREATE TABLE organization_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization VARCHAR(255) NOT NULL,
    user_count INTEGER NOT NULL DEFAULT 0,
    active_certifications INTEGER NOT NULL DEFAULT 0,
    expiring_certifications INTEGER NOT NULL DEFAULT 0,
    compliance_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    revenue_ytd NUMERIC(12,2) NOT NULL DEFAULT 0,
    engagement_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance tracking
CREATE TABLE certification_compliance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization VARCHAR(255) NOT NULL,
    certification_type VARCHAR(100) NOT NULL,
    required_count INTEGER NOT NULL DEFAULT 0,
    compliant_count INTEGER NOT NULL DEFAULT 0,
    compliance_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization, certification_type)
);

-- Approval workflows
CREATE TABLE approval_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    requested_by UUID REFERENCES profiles(id) NOT NULL,
    assigned_to UUID REFERENCES profiles(id),
    organization VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    details JSONB
);
```

### Provider Dashboard Tables

```sql
-- Provider metrics
CREATE TABLE provider_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL,
    active_instructors INTEGER NOT NULL DEFAULT 0,
    total_students INTEGER NOT NULL DEFAULT 0,
    courses_offered INTEGER NOT NULL DEFAULT 0,
    avg_satisfaction NUMERIC(3,2) NOT NULL DEFAULT 0,
    completion_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    revenue_ytd NUMERIC(12,2) NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Instructor qualifications
CREATE TABLE instructor_qualifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instructor_id UUID REFERENCES profiles(id) NOT NULL,
    provider_id UUID NOT NULL,
    qualification_type VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    issued_date DATE NOT NULL,
    expiry_date DATE,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course schedule with conflict detection
CREATE TABLE course_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL,
    provider_id UUID NOT NULL,
    instructor_id UUID REFERENCES profiles(id),
    location_id UUID,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_students INTEGER NOT NULL DEFAULT 20,
    enrolled_students INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a function to check for time conflicts
CREATE OR REPLACE FUNCTION check_instructor_schedule_conflict()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if there are any overlapping schedules for the same instructor
    IF EXISTS (
        SELECT 1 FROM course_schedule
        WHERE
            instructor_id = NEW.instructor_id
            AND id != NEW.id
            AND (
                -- Date ranges overlap
                (start_date, end_date) OVERLAPS (NEW.start_date, NEW.end_date)
                -- Time ranges overlap on the same day
                AND (start_time, end_time) OVERLAPS (NEW.start_time, NEW.end_time)
            )
    ) THEN
        RAISE EXCEPTION 'Schedule conflict detected for instructor';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to check for conflicts before insert or update
CREATE TRIGGER check_instructor_schedule_conflict_trigger
BEFORE INSERT OR UPDATE ON course_schedule
FOR EACH ROW
EXECUTE FUNCTION check_instructor_schedule_conflict();

-- Create an index to speed up conflict checks
CREATE INDEX idx_course_schedule_instructor_dates ON course_schedule (instructor_id, start_date, end_date);
```

### Instructor Dashboard Tables

```sql
-- Teaching effectiveness
CREATE TABLE teaching_effectiveness (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instructor_id UUID REFERENCES profiles(id) NOT NULL,
    course_id UUID NOT NULL,
    session_id UUID NOT NULL,
    students_enrolled INTEGER NOT NULL DEFAULT 0,
    students_completed INTEGER NOT NULL DEFAULT 0,
    completion_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    avg_evaluation_score NUMERIC(3,2) NOT NULL DEFAULT 0,
    teaching_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student evaluations
CREATE TABLE student_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    instructor_id UUID REFERENCES profiles(id) NOT NULL,
    student_id UUID,
    overall_rating INTEGER NOT NULL,
    knowledge_rating INTEGER NOT NULL,
    delivery_rating INTEGER NOT NULL,
    materials_rating INTEGER NOT NULL,
    comments TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT rating_range CHECK (
        overall_rating BETWEEN 1 AND 5 AND
        knowledge_rating BETWEEN 1 AND 5 AND
        delivery_rating BETWEEN 1 AND 5 AND
        materials_rating BETWEEN 1 AND 5
    )
);

## Data Migration Strategy

### Phase 1: Schema Creation

1. Create new tables with temporary names to avoid conflicts
2. Add indexes and constraints to new tables
3. Validate schema design with test data

### Phase 2: Data Migration

1. Extract data from existing tables where applicable
2. Transform data to match new schema
3. Load data into new tables
4. Validate data integrity after migration

### Phase 3: Schema Transition

1. Create database views to maintain backward compatibility
2. Update application code to use new tables
3. Rename tables to their final names
4. Update foreign key constraints

### Migration Scripts

```sql
-- Example migration script for organization metrics
INSERT INTO organization_metrics (
    organization,
    user_count,
    active_certifications,
    expiring_certifications,
    compliance_rate
)
SELECT
    p.organization,
    COUNT(DISTINCT p.id) AS user_count,
    COUNT(DISTINCT CASE WHEN c.status = 'ACTIVE' THEN c.id END) AS active_certifications,
    COUNT(DISTINCT CASE WHEN c.status = 'ACTIVE' AND c.expiry_date < NOW() + INTERVAL '30 days' THEN c.id END) AS expiring_certifications,
    CASE
        WHEN COUNT(DISTINCT CASE WHEN c.status = 'ACTIVE' THEN c.id END) > 0 THEN
            (COUNT(DISTINCT CASE WHEN c.status = 'ACTIVE' AND c.expiry_date > NOW() THEN c.id END)::NUMERIC /
            COUNT(DISTINCT CASE WHEN c.status = 'ACTIVE' THEN c.id END)::NUMERIC) * 100
        ELSE 0
    END AS compliance_rate
FROM
    profiles p
LEFT JOIN
    certificates c ON p.id = c.user_id
WHERE
    p.organization IS NOT NULL
## Hook Implementation Details

### useAdminDashboardData

This hook will provide data for the Administrator dashboard, focusing on organization-wide metrics, compliance status, and approval workflows.

#### Data Requirements

1. **Organization Metrics**
   - User growth (new users over time)
   - Engagement rates (active users, login frequency)
   - Revenue metrics (if applicable)
   - Certification statistics

2. **Compliance Status**
   - Certification expirations
   - Regulatory requirements tracking
   - Compliance rate by certification type

3. **Approval Workflows**
   - Pending approvals with pagination
   - Completed approvals with filtering
   - Approval trends and metrics

#### Implementation

```typescript
export const useAdminDashboardData = () => {
  const { user } = useAuth();
  const [pagination, setPagination] = useState({ page: 0, pageSize: 10 });
  const [filters, setFilters] = useState({ status: 'PENDING', type: 'ALL' });

  // Get the organization for the current user
  const { data: userOrg } = useQuery({
    queryKey: ['userOrganization', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('organization')
        .eq('id', user?.id)
        .single();
      return data?.organization;
    },
    enabled: !!user
  });

  // Fetch organization metrics
  const { data: metrics } = useQuery({
    queryKey: ['adminMetrics', userOrg],
    queryFn: async () => {
      const { data } = await supabase
        .from('organization_metrics')
        .select('*')
        .eq('organization', userOrg)
        .single();
      return data;
    },
    enabled: !!userOrg
  });

  // Fetch compliance status
  const { data: complianceStatus } = useQuery({
    queryKey: ['adminCompliance', userOrg],
    queryFn: async () => {
      const { data } = await supabase
        .from('certification_compliance')
        .select('*')
        .eq('organization', userOrg)
        .order('compliance_rate', { ascending: false });
      return data;
    },
    enabled: !!userOrg
  });

  // Fetch approval workflows with pagination and filtering
  const { data: approvals, isPending: approvalsLoading } = useQuery({
    queryKey: ['adminApprovals', userOrg, pagination, filters],
    queryFn: async () => {
      let query = supabase
        .from('approval_workflows')
        .select('*, profiles!requested_by(display_name)', { count: 'exact' })
        .eq('organization', userOrg)
        .order('created_at', { ascending: false })
        .range(
          pagination.page * pagination.pageSize,
          (pagination.page + 1) * pagination.pageSize - 1
        );
      
      if (filters.status !== 'ALL') {
        query = query.eq('status', filters.status);
      }
      
      if (filters.type !== 'ALL') {
        query = query.eq('workflow_type', filters.type);
      }
      
      const { data, count, error } = await query;
      
      if (error) throw error;
      
      return {
        items: data,
        totalCount: count || 0
      };
    },
    enabled: !!userOrg
  });

  // Fetch historical metrics for trends
  const { data: metricsTrend } = useQuery({
    queryKey: ['adminMetricsTrend', userOrg],
    queryFn: async () => {
      const { data } = await supabase
        .from('metrics_history')
        .select('*')
        .eq('entity_type', 'organization')
        .eq('entity_id', userOrg)
        .order('recorded_at', { ascending: true });
      return data;
    },
### useProviderDashboardData

This hook will provide data for the Provider dashboard, focusing on provider-specific performance metrics, instructor qualifications, and course scheduling.

#### Data Requirements

1. **Provider Performance Metrics**
   - Student outcomes (completion rates, pass rates)
   - Satisfaction scores (student evaluations)
   - Revenue and growth metrics
   - Instructor performance comparison

2. **Instructor Qualification Status**
   - Current qualification levels
   - Expiring qualifications
   - Required training tracking

3. **Course Schedule Management**
   - Upcoming courses with filtering
   - Schedule conflicts detection
   - Enrollment tracking

#### Implementation

```typescript
export const useProviderDashboardData = () => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [instructorFilter, setInstructorFilter] = useState('ALL');

  // Get the provider ID for the current user
  const { data: providerId } = useQuery({
    queryKey: ['providerId', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('authorized_providers')
        .select('id')
        .eq('user_id', user?.id)
        .single();
      return data?.id;
    },
    enabled: !!user
  });

  // Fetch provider metrics
  const { data: metrics } = useQuery({
    queryKey: ['providerMetrics', providerId],
    queryFn: async () => {
      const { data } = await supabase
        .from('provider_metrics')
        .select('*')
        .eq('provider_id', providerId)
        .single();
      return data;
    },
    enabled: !!providerId
  });

  // Fetch instructor qualifications
  const { data: instructorQualifications } = useQuery({
    queryKey: ['instructorQualifications', providerId],
    queryFn: async () => {
      const { data } = await supabase
        .from('instructor_qualifications')
        .select(`
          *,
          profiles:instructor_id(id, display_name, email)
        `)
        .eq('provider_id', providerId)
        .order('expiry_date', { ascending: true });
      
      // Group by instructor
      const grouped = data?.reduce((acc, qual) => {
        const instructorId = qual.instructor_id;
        if (!acc[instructorId]) {
          acc[instructorId] = {
            instructor: qual.profiles,
            qualifications: []
          };
        }
        acc[instructorId].qualifications.push(qual);
        return acc;
      }, {});
      
      return Object.values(grouped || {});
    },
    enabled: !!providerId
  });

  // Fetch course schedule with conflict detection
  const { data: courseSchedule } = useQuery({
    queryKey: ['courseSchedule', providerId, dateRange, instructorFilter],
    queryFn: async () => {
      let query = supabase
        .from('course_schedule')
        .select(`
          *,
          courses:course_id(id, name, description),
          instructors:instructor_id(id, display_name)
        `)
        .eq('provider_id', providerId)
        .order('start_date', { ascending: true });
      
      if (dateRange.start) {
        query = query.gte('start_date', dateRange.start);
      }
      
      if (dateRange.end) {
        query = query.lte('end_date', dateRange.end);
      }
      
      if (instructorFilter !== 'ALL') {
        query = query.eq('instructor_id', instructorFilter);
      }
      
      const { data } = await query;
      
      // Check for scheduling conflicts using the same logic as the database trigger
      const coursesWithConflicts = data?.map(course => {
        const conflicts = data.filter(c =>
          c.id !== course.id &&
          c.instructor_id === course.instructor_id &&
          // Date ranges overlap check (using OVERLAPS logic)
          datesOverlap(c.start_date, c.end_date, course.start_date, course.end_date) &&
          // Time ranges overlap check (using OVERLAPS logic)
          timesOverlap(c.start_time, c.end_time, course.start_time, course.end_time)
        );
        
        return {
          ...course,
          hasConflicts: conflicts.length > 0,
          conflicts
        };
      });
      
      // Helper function to check if date ranges overlap
      function datesOverlap(start1, end1, start2, end2) {
        return (start1 <= end2 && end1 >= start2);
      }
      
      // Helper function to check if time ranges overlap
      function timesOverlap(start1, end1, start2, end2) {
        return (start1 <= end2 && end1 >= start2);
      }
      
      return coursesWithConflicts;
    },
    enabled: !!providerId
  });

### useInstructorDashboardData

This hook will provide data for the Instructor dashboard, focusing on teaching effectiveness, certification maintenance, and career progression.

#### Data Requirements

1. **Teaching Effectiveness Metrics**
   - Completion rates by course
   - Student evaluation scores
   - Performance trends over time
   - Comparison to provider averages

2. **Certification Maintenance**
   - Current certification status
   - Renewal requirements tracking
   - Continuing education progress

3. **Career Progression Visualization**
   - Current role and next steps
   - Requirement completion tracking
   - Timeline estimation

#### Implementation

```typescript
export const useInstructorDashboardData = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [timeframe, setTimeframe] = useState('LAST_6_MONTHS');

  // Fetch teaching effectiveness metrics
  const { data: teachingMetrics } = useQuery({
    queryKey: ['instructorTeachingMetrics', user?.id, timeframe],
    queryFn: async () => {
      // Calculate date range based on timeframe
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case 'LAST_3_MONTHS':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case 'LAST_6_MONTHS':
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case 'LAST_YEAR':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(startDate.getMonth() - 6);
      }
      
      const { data } = await supabase
        .from('teaching_effectiveness')
        .select('*')
        .eq('instructor_id', user?.id)
        .gte('teaching_date', startDate.toISOString())
        .lte('teaching_date', endDate.toISOString())
        .order('teaching_date', { ascending: true });
      
      // Calculate aggregated metrics
      const aggregated = {
        totalSessions: data?.length || 0,
        totalStudents: data?.reduce((sum, item) => sum + item.students_enrolled, 0) || 0,
        avgCompletionRate: data?.reduce((sum, item) => sum + item.completion_rate, 0) / (data?.length || 1) || 0,
        avgEvaluationScore: data?.reduce((sum, item) => sum + item.avg_evaluation_score, 0) / (data?.length || 1) || 0,
        trendData: data?.map(item => ({
          date: item.teaching_date,
          completionRate: item.completion_rate,
          evaluationScore: item.avg_evaluation_score
        })) || []
      };
      
      return {
        detailed: data,
        aggregated
      };
    },
    enabled: !!user?.id
  });

  // Fetch student evaluations
  const { data: studentEvaluations } = useQuery({
    queryKey: ['instructorStudentEvaluations', user?.id, timeframe],
    queryFn: async () => {
      const { data } = await supabase
        .from('student_evaluations')
        .select('*')
        .eq('instructor_id', user?.id)
        .order('submitted_at', { ascending: false });
      
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch certification maintenance requirements
  const { data: certificationMaintenance } = useQuery({
    queryKey: ['instructorCertificationMaintenance', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('certification_maintenance')
        .select('*')
        .eq('instructor_id', user?.id)
        .order('due_date', { ascending: true });
      
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch career progression data
  const { data: careerProgression } = useQuery({
    queryKey: ['instructorCareerProgression', user?.id, profile?.role],
    queryFn: async () => {
      const { data } = await supabase
        .from('career_progression')
        .select('*')
        .eq('instructor_id', user?.id)
        .eq('current_role', profile?.role)
        .single();
      
      // Fetch detailed requirements
      if (data) {
        const { data: requirements } = await supabase
          .from('progression_requirements')
          .select('*')
          .eq('from_role', data.current_role)
          .eq('to_role', data.target_role);
        
        const { data: completed } = await supabase
          .from('completed_requirements')
          .select('requirement_id')
          .eq('instructor_id', user?.id);
        
        const completedIds = completed?.map(c => c.requirement_id) || [];
        
        const requirementsWithStatus = requirements?.map(req => ({
          ...req,
          completed: completedIds.includes(req.id)
## Access Control & Security

### Role-Based Access Control

1. **System-Level Controls**
   - Use Supabase Row-Level Security (RLS) policies to restrict data access
   - Implement function-based policies for complex permission logic
   - Create database views with pre-filtered data for each role

2. **Application-Level Controls**
   - Validate user permissions in React hooks before data fetching
   - Implement custom hooks for permission checking
   - Add middleware to API routes for additional validation

### Example RLS Policies

```sql
-- Organization metrics policy
CREATE POLICY organization_metrics_policy ON organization_metrics
    USING (
        -- System admins can see all organizations
        (auth.uid() IN (SELECT id FROM profiles WHERE role = 'SA'))
        OR
        -- Administrators can only see their own organization
        (organization IN (SELECT organization FROM profiles WHERE id = auth.uid()))
    );

-- Provider metrics policy
CREATE POLICY provider_metrics_policy ON provider_metrics
    USING (
        -- System admins and administrators can see all providers
        (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('SA', 'AD')))
        OR
        -- Providers can only see their own metrics
        (provider_id IN (SELECT id FROM authorized_providers WHERE user_id = auth.uid()))
    );

-- Instructor data policy
CREATE POLICY instructor_data_policy ON teaching_effectiveness
    USING (
        -- System admins can see all data
        (auth.uid() IN (SELECT id FROM profiles WHERE role = 'SA'))
        OR
        -- Administrators can see data for their organization
        (instructor_id IN (
            SELECT p.id FROM profiles p
            WHERE p.organization = (SELECT organization FROM profiles WHERE id = auth.uid())
            AND auth.uid() IN (SELECT id FROM profiles WHERE role = 'AD')
        ))
        OR
        -- Providers can see data for their instructors
        (instructor_id IN (
            SELECT i.user_id FROM instructors i
            JOIN authorized_providers ap ON i.provider_id = ap.id
            WHERE ap.user_id = auth.uid()
        ))
        OR
        -- Instructors can only see their own data
        (instructor_id = auth.uid())
    );
```

### Permission Checking Hook

```typescript
export const usePermissions = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  
  const hasRole = useCallback((roles: string | string[]) => {
    if (!profile?.role) return false;
    
    if (Array.isArray(roles)) {
      return roles.includes(profile.role);
    }
    
    return profile.role === roles;
  }, [profile?.role]);
  
  const canAccessOrganization = useCallback((organizationId: string) => {
    if (!profile) return false;
    
    // System admins can access any organization
    if (profile.role === 'SA') return true;
    
    // Users can only access their own organization
    return profile.organization === organizationId;
  }, [profile]);
  
  const canAccessProviderData = useCallback((providerId: string) => {
    if (!profile) return false;
    
    // System admins can access any provider
    if (profile.role === 'SA') return true;
    
    // Check if user is associated with this provider
    // This would require an additional query to check the relationship
    return true; // Simplified for example
  }, [profile]);
  
## Testing Strategy

### Unit Tests

1. **Hook Testing**
   - Test each hook with mock data responses
   - Verify correct data transformation
   - Test error handling and fallbacks
   - Validate pagination and filtering logic

2. **Component Testing**
   - Test dashboard components with various data scenarios
   - Verify correct rendering of metrics and charts
   - Test loading and error states
   - Validate user interactions

### Integration Tests

1. **Data Flow Testing**
   - Test end-to-end data flow from database to UI
   - Verify correct data filtering based on user role
   - Test data updates and real-time synchronization

2. **Performance Testing**
   - Measure query execution time
   - Test with large datasets
   - Verify pagination performance
   - Test concurrent user scenarios

### Example Test Cases

```typescript
// Hook unit test
describe('useAdminDashboardData', () => {
  it('should return organization metrics', async () => {
    // Mock Supabase responses
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { organization: 'Test Org' } })
            })
          })
        };
      }
      if (table === 'organization_metrics') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { user_count: 100 } })
            })
          })
        };
      }
      // Add more mock implementations for other tables
    });
    
    // Render hook
    const { result, waitForNextUpdate } = renderHook(() => useAdminDashboardData(), {
      wrapper: ({ children }) => (
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </AuthProvider>
      )
    });
    
    // Wait for queries to resolve
    await waitForNextUpdate();
    
    // Assert results
    expect(result.current.metrics).toEqual({ user_count: 100 });
  });
  
  it('should handle errors gracefully', async () => {
    // Mock Supabase error response
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { organization: 'Test Org' } })
            })
          })
        };
      }
      if (table === 'organization_metrics') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ error: new Error('Test error') })
            })
          })
        };
      }
    });
    
    // Render hook
    const { result, waitForNextUpdate } = renderHook(() => useAdminDashboardData(), {
      wrapper: ({ children }) => (
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </AuthProvider>
      )
    });
    
    // Wait for queries to resolve
    await waitForNextUpdate();
    
    // Assert error handling
    expect(result.current.metrics).toBeUndefined();
    expect(result.current.error).toBeDefined();
  });
});

// Component integration test
describe('AdminDashboard', () => {
  it('should render metrics correctly', async () => {
    // Mock hook response
    jest.mock('@/hooks/dashboard/useAdminDashboardData', () => ({
      useAdminDashboardData: () => ({
        metrics: {
          user_count: 100,
          active_certifications: 50,
          expiring_certifications: 5,
          compliance_rate: 95
        },
        complianceStatus: [
          { id: '1', name: 'CPR', complianceRate: 98, status: 'compliant' }
        ],
        approvals: [],
        isLoading: false,
        error: null
      })
    }));
    
    // Render component
    const { getByText } = render(<AdminDashboard />);
    
    // Assert rendered content
    expect(getByText('100')).toBeInTheDocument(); // User count
    expect(getByText('50')).toBeInTheDocument(); // Active certifications
    expect(getByText('5')).toBeInTheDocument(); // Expiring certifications
    expect(getByText('95%')).toBeInTheDocument(); // Compliance rate
    expect(getByText('CPR')).toBeInTheDocument(); // Compliance status
  });
});
```

## Performance Optimization

### Query Optimization

1. **Selective Column Fetching**
   - Only request needed columns in queries
   - Use projection to minimize data transfer
   - Implement view materialization for complex queries

2. **Indexing Strategy**
   - Create indexes for frequently queried columns
   - Use composite indexes for multi-column filters
   - Implement partial indexes for specific query patterns

3. **Pagination and Limiting**
   - Implement cursor-based pagination for large datasets
   - Use appropriate page sizes to balance UX and performance
   - Add limits to all queries to prevent excessive data loading

### Caching Strategy

1. **Client-Side Caching**
   - Configure React Query with appropriate stale times
   - Implement optimistic updates for user actions
   - Use local storage for persistent caching where appropriate

2. **Server-Side Caching**
   - Implement Redis caching for frequently accessed data
   - Use cache invalidation strategies based on data changes
   - Configure appropriate TTL values for different data types

### Example Optimizations

```typescript
// Optimized query with selective columns and pagination
const fetchApprovals = async (organizationId, page, pageSize, filters) => {
  let query = supabase
    .from('approval_workflows')
    .select('id, workflow_type, status, created_at, requested_by', { count: 'exact' })
    .eq('organization', organizationId)
    .order('created_at', { ascending: false })
    .range(
      page * pageSize,
      (page + 1) * pageSize - 1
    );
  
  if (filters.status !== 'ALL') {
    query = query.eq('status', filters.status);
  }
  
  if (filters.type !== 'ALL') {
    query = query.eq('workflow_type', filters.type);
  }
  
  const { data, count, error } = await query;
  
  if (error) throw error;
  
  // Fetch user names in a separate query to avoid expensive joins
  if (data && data.length > 0) {
    const userIds = data.map(item => item.requested_by);
    const { data: users } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds);
    
    // Create a lookup map for efficient access
    const userMap = {};
    users?.forEach(user => {
      userMap[user.id] = user.display_name;
    });
    
    // Enrich the approval data with user names
    data.forEach(item => {
      item.requestedByName = userMap[item.requested_by] || 'Unknown';
    });
  }
  
  return {
    items: data,
    totalCount: count || 0
  };
};

// Optimized React Query configuration
export const useAdminDashboardData = () => {
  // ... other code ...
  
  // Fetch approval workflows with optimized caching
  const { data: approvals, isPending: approvalsLoading } = useQuery({
    queryKey: ['adminApprovals', userOrg, pagination, filters],
    queryFn: () => fetchApprovals(userOrg, pagination.page, pagination.pageSize, filters),
    enabled: !!userOrg,
    staleTime: 5 * 60 * 1000, // 5 minutes
    keepPreviousData: true, // Keep previous page data while loading next page
    retry: (failureCount, error) => {
      // Only retry for network errors, not for permission errors
      if (error.code === 'PGRST301') return false; // Permission denied
      return failureCount < 3;
    }
  });
  
  // ... other code ...
};
```

## Implementation Timeline

### Phase 1: Foundation (Weeks 1-2)

1. **Database Schema Design**
   - Design and review schema with stakeholders
   - Create migration scripts for new tables
   - Set up indexes and constraints

2. **Data Migration Planning**
   - Analyze existing data
   - Design migration strategy
   - Create and test migration scripts

### Phase 2: Core Implementation (Weeks 3-4)

1. **Hook Development**
   - Implement useAdminDashboardData
   - Implement useProviderDashboardData
   - Implement useInstructorDashboardData

2. **Access Control**
   - Implement RLS policies
   - Create permission checking hooks
   - Test security measures

### Phase 3: Integration & Testing (Weeks 5-6)

1. **Dashboard Integration**
   - Update dashboard components to use real data
   - Implement loading and error states
   - Add filtering and pagination controls

2. **Testing**
   - Write unit tests for hooks
   - Create integration tests for components
   - Perform performance testing

### Phase 4: Optimization & Deployment (Weeks 7-8)

1. **Performance Optimization**
   - Analyze query performance
   - Implement caching strategies
   - Optimize data fetching patterns

2. **Deployment**
   - Deploy database changes
   - Roll out application updates
   - Monitor performance and errors
  const canAccessInstructorData = useCallback((instructorId: string) => {
    if (!user || !profile) return false;
    
    // System admins can access any instructor data
    if (profile.role === 'SA') return true;
    
    // Instructors can only access their own data
    if (user.id === instructorId) return true;
    
    // Administrators can access data for instructors in their organization
    // Providers can access data for their instructors
    // This would require additional queries to check these relationships
    return false; // Simplified for example
  }, [user, profile]);
  
  return {
    hasRole,
    canAccessOrganization,
    canAccessProviderData,
    canAccessInstructorData
  };
};
```
        })) || [];
        
        return {
          ...data,
          requirements: requirementsWithStatus
        };
      }
      
      return null;
    },
    enabled: !!user?.id && !!profile?.role
  });

  return {
    teachingMetrics,
    studentEvaluations,
    certificationMaintenance,
    careerProgression,
    timeframe,
    setTimeframe
  };
};
```
  // Fetch student satisfaction data
  const { data: satisfactionData } = useQuery({
    queryKey: ['satisfactionData', providerId],
    queryFn: async () => {
      const { data } = await supabase
        .from('student_evaluations')
        .select(`
          instructor_id,
          AVG(overall_rating) as avg_rating,
          COUNT(*) as evaluation_count
        `)
        .in('instructor_id', instructorQualifications?.map(iq => iq.instructor.id) || [])
        .group('instructor_id');
      
      return data;
    },
    enabled: !!instructorQualifications?.length
  });

  return {
    metrics,
    instructorQualifications,
    courseSchedule,
    satisfactionData,
    dateRange,
    setDateRange,
    instructorFilter,
    setInstructorFilter
  };
};
```
    enabled: !!userOrg
  });

  return {
    metrics,
    complianceStatus,
    approvals: approvals?.items || [],
    totalApprovals: approvals?.totalCount || 0,
    metricsTrend,
    pagination,
    setPagination,
    filters,
    setFilters,
    isLoading: approvalsLoading
  };
};
```
GROUP BY
    p.organization;
```
-- Certification maintenance
CREATE TABLE certification_maintenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instructor_id UUID REFERENCES profiles(id) NOT NULL,
    certification_type VARCHAR(100) NOT NULL,
    requirement_type VARCHAR(50) NOT NULL,
    required_amount INTEGER NOT NULL,
    completed_amount INTEGER NOT NULL DEFAULT 0,
    completion_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Career progression
CREATE TABLE career_progression (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instructor_id UUID REFERENCES profiles(id) NOT NULL,
    current_role VARCHAR(20) NOT NULL,
    target_role VARCHAR(20) NOT NULL,
    progress_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
    requirements_total INTEGER NOT NULL DEFAULT 0,
    requirements_completed INTEGER NOT NULL DEFAULT 0,
    estimated_completion_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```