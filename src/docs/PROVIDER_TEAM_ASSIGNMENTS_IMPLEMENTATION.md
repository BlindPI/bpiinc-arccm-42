# Provider Team Assignments Implementation Guide
*Using Existing Table Structure*

## Table Already Exists ✅

The [`provider_team_assignments`](src/docs/schema_results.md) table is already created with the exact structure needed for simplified dashboard relationships. This guide focuses on **implementing the usage** of this existing table.

## Key Insight: Foreign Key Reference Update Needed

**Important Note**: The existing table references [`authorized_providers`](src/docs/schema_results.md) but our dashboard needs to work with [`profiles`](src/docs/schema_results.md) table:

```sql
-- Current FK constraint (needs update):
constraint fk_provider_team_assignments_provider_id 
  foreign KEY (provider_id) references authorized_providers (id)

-- Should reference:
constraint fk_provider_team_assignments_provider_id 
  foreign KEY (provider_id) references profiles (id)
```

## Dashboard Query Implementation

### 1. Provider Dashboard Query
```sql
-- Get all assignments for a specific provider using existing table
SELECT 
  p.id as provider_id,
  p.display_name as provider_name,
  p.role as provider_role,
  pta.assignment_role,
  pta.oversight_level,
  pta.assignment_type,
  pta.status as assignment_status,
  t.id as team_id,
  t.name as team_name,
  t.performance_score,
  t.team_type,
  l.id as location_id,
  l.name as location_name,
  l.status as location_status
FROM profiles p
JOIN provider_team_assignments pta ON p.id = pta.provider_id
JOIN teams t ON pta.team_id = t.id
JOIN locations l ON t.location_id = l.id
WHERE p.id = $1  -- provider_id parameter
  AND pta.status = 'active'
  AND t.status = 'active'
  AND l.status = 'ACTIVE'
ORDER BY pta.assignment_role, t.name;
```

### 2. Location Dashboard Query
```sql
-- Get teams and provider counts for a location
SELECT 
  l.id as location_id,
  l.name as location_name,
  t.id as team_id,
  t.name as team_name,
  t.performance_score,
  t.team_type,
  COUNT(DISTINCT pta.provider_id) as provider_count,
  COUNT(DISTINCT CASE WHEN pta.assignment_role = 'supervisor' THEN pta.provider_id END) as supervisor_count,
  COUNT(DISTINCT CASE WHEN pta.assignment_role = 'coordinator' THEN pta.provider_id END) as coordinator_count,
  COUNT(DISTINCT CASE WHEN pta.oversight_level = 'admin' THEN pta.provider_id END) as admin_count
FROM locations l
LEFT JOIN teams t ON l.id = t.location_id AND t.status = 'active'
LEFT JOIN provider_team_assignments pta ON t.id = pta.team_id AND pta.status = 'active'
WHERE l.id = $1  -- location_id parameter
  AND l.status = 'ACTIVE'
GROUP BY l.id, l.name, t.id, t.name, t.performance_score, t.team_type
ORDER BY t.name;
```

### 3. Team Dashboard Query
```sql
-- Get team details with all assigned providers
SELECT 
  t.id as team_id,
  t.name as team_name,
  t.description,
  t.performance_score,
  t.team_type,
  l.name as location_name,
  p.id as provider_id,
  p.display_name as provider_name,
  p.role as provider_role,
  pta.assignment_role,
  pta.oversight_level,
  pta.assignment_type,
  pta.start_date,
  pta.end_date
FROM teams t
JOIN locations l ON t.location_id = l.id
LEFT JOIN provider_team_assignments pta ON t.id = pta.team_id AND pta.status = 'active'
LEFT JOIN profiles p ON pta.provider_id = p.id AND p.status = 'ACTIVE'
WHERE t.id = $1  -- team_id parameter
  AND t.status = 'active'
  AND l.status = 'ACTIVE'
ORDER BY pta.assignment_role, pta.oversight_level DESC, p.display_name;
```

## TypeScript Service Implementation

### 1. Dashboard Service
```typescript
export interface DashboardAssignment {
  provider_id: string;
  provider_name: string;
  provider_role: string;
  assignment_role: 'primary' | 'secondary' | 'supervisor' | 'coordinator';
  oversight_level: 'monitor' | 'standard' | 'manage' | 'admin';
  assignment_type: 'ongoing' | 'project_based' | 'temporary';
  assignment_status: string;
  team_id: string;
  team_name: string;
  team_performance: number;
  location_id: string;
  location_name: string;
}

export interface LocationTeamSummary {
  location_id: string;
  location_name: string;
  team_id: string;
  team_name: string;
  team_performance: number;
  team_type: string;
  provider_count: number;
  supervisor_count: number;
  coordinator_count: number;
  admin_count: number;
}

export class DashboardService {
  // Provider Dashboard - get all assignments
  async getProviderDashboard(providerId: string): Promise<DashboardAssignment[]> {
    const { data, error } = await supabase
      .rpc('get_provider_assignments', { provider_id: providerId });
    
    if (error) {
      console.error('Error fetching provider dashboard:', error);
      throw error;
    }
    
    return data || [];
  }

  // Location Dashboard - get teams and provider counts
  async getLocationDashboard(locationId: string): Promise<LocationTeamSummary[]> {
    const { data, error } = await supabase
      .rpc('get_location_teams_summary', { location_id: locationId });
    
    if (error) {
      console.error('Error fetching location dashboard:', error);
      throw error;
    }
    
    return data || [];
  }

  // Team Dashboard - get team details with providers
  async getTeamDashboard(teamId: string): Promise<any[]> {
    const { data, error } = await supabase
      .rpc('get_team_provider_details', { team_id: teamId });
    
    if (error) {
      console.error('Error fetching team dashboard:', error);
      throw error;
    }
    
    return data || [];
  }

  // Simplified assignment management
  async assignProviderToTeam(assignment: {
    provider_id: string;
    team_id: string;
    assignment_role?: string;
    oversight_level?: string;
    assignment_type?: string;
    assigned_by?: string;
  }): Promise<void> {
    const { error } = await supabase
      .from('provider_team_assignments')
      .insert([{
        provider_id: assignment.provider_id,
        team_id: assignment.team_id,
        assignment_role: assignment.assignment_role || 'primary',
        oversight_level: assignment.oversight_level || 'standard',
        assignment_type: assignment.assignment_type || 'ongoing',
        assigned_by: assignment.assigned_by,
        status: 'active'
      }]);

    if (error) {
      console.error('Error assigning provider to team:', error);
      throw error;
    }
  }

  async updateAssignment(assignmentId: string, updates: {
    assignment_role?: string;
    oversight_level?: string;
    assignment_type?: string;
    end_date?: string;
    status?: string;
  }): Promise<void> {
    const { error } = await supabase
      .from('provider_team_assignments')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', assignmentId);

    if (error) {
      console.error('Error updating assignment:', error);
      throw error;
    }
  }

  async deactivateAssignment(assignmentId: string): Promise<void> {
    const { error } = await supabase
      .from('provider_team_assignments')
      .update({ 
        status: 'inactive',
        end_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('id', assignmentId);

    if (error) {
      console.error('Error deactivating assignment:', error);
      throw error;
    }
  }
}
```

### 2. Database Functions (PostgreSQL)
```sql
-- Function 1: Get provider assignments
CREATE OR REPLACE FUNCTION get_provider_assignments(provider_id UUID)
RETURNS TABLE (
  provider_id UUID,
  provider_name TEXT,
  provider_role TEXT,
  assignment_role VARCHAR,
  oversight_level VARCHAR,
  assignment_type VARCHAR,
  assignment_status VARCHAR,
  team_id UUID,
  team_name TEXT,
  team_performance NUMERIC,
  location_id UUID,
  location_name TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.display_name,
    p.role,
    pta.assignment_role,
    pta.oversight_level,
    pta.assignment_type,
    pta.status,
    t.id,
    t.name,
    t.performance_score,
    l.id,
    l.name
  FROM profiles p
  JOIN provider_team_assignments pta ON p.id = pta.provider_id
  JOIN teams t ON pta.team_id = t.id
  JOIN locations l ON t.location_id = l.id
  WHERE p.id = provider_id
    AND pta.status = 'active'
    AND t.status = 'active'
    AND l.status = 'ACTIVE'
  ORDER BY pta.assignment_role, t.name;
END;
$$;

-- Function 2: Get location teams summary
CREATE OR REPLACE FUNCTION get_location_teams_summary(location_id UUID)
RETURNS TABLE (
  location_id UUID,
  location_name TEXT,
  team_id UUID,
  team_name TEXT,
  team_performance NUMERIC,
  team_type VARCHAR,
  provider_count BIGINT,
  supervisor_count BIGINT,
  coordinator_count BIGINT,
  admin_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.name,
    t.id,
    t.name,
    t.performance_score,
    t.team_type,
    COUNT(DISTINCT pta.provider_id),
    COUNT(DISTINCT CASE WHEN pta.assignment_role = 'supervisor' THEN pta.provider_id END),
    COUNT(DISTINCT CASE WHEN pta.assignment_role = 'coordinator' THEN pta.provider_id END),
    COUNT(DISTINCT CASE WHEN pta.oversight_level = 'admin' THEN pta.provider_id END)
  FROM locations l
  LEFT JOIN teams t ON l.id = t.location_id AND t.status = 'active'
  LEFT JOIN provider_team_assignments pta ON t.id = pta.team_id AND pta.status = 'active'
  WHERE l.id = location_id
    AND l.status = 'ACTIVE'
  GROUP BY l.id, l.name, t.id, t.name, t.performance_score, t.team_type
  ORDER BY t.name;
END;
$$;

-- Function 3: Get team provider details
CREATE OR REPLACE FUNCTION get_team_provider_details(team_id UUID)
RETURNS TABLE (
  team_id UUID,
  team_name TEXT,
  team_performance NUMERIC,
  location_name TEXT,
  provider_id UUID,
  provider_name TEXT,
  provider_role TEXT,
  assignment_role VARCHAR,
  oversight_level VARCHAR,
  assignment_type VARCHAR,
  start_date DATE,
  end_date DATE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.performance_score,
    l.name,
    p.id,
    p.display_name,
    p.role,
    pta.assignment_role,
    pta.oversight_level,
    pta.assignment_type,
    pta.start_date,
    pta.end_date
  FROM teams t
  JOIN locations l ON t.location_id = l.id
  LEFT JOIN provider_team_assignments pta ON t.id = pta.team_id AND pta.status = 'active'
  LEFT JOIN profiles p ON pta.provider_id = p.id AND p.status = 'ACTIVE'
  WHERE t.id = team_id
    AND t.status = 'active'
    AND l.status = 'ACTIVE'
  ORDER BY pta.assignment_role, pta.oversight_level DESC, p.display_name;
END;
$$;
```

## Migration Strategy from Current Complex Implementation

### 1. Data Population
```sql
-- Migrate existing team_members to provider_team_assignments
INSERT INTO provider_team_assignments (
  provider_id,
  team_id,
  assignment_role,
  oversight_level,
  assignment_type,
  start_date,
  status,
  created_at,
  updated_at
)
SELECT 
  tm.user_id,
  tm.team_id,
  CASE 
    WHEN tm.role = 'ADMIN' THEN 'supervisor'
    WHEN tm.role = 'MANAGER' THEN 'coordinator'
    ELSE 'primary'
  END,
  CASE 
    WHEN tm.role = 'ADMIN' THEN 'admin'
    WHEN tm.role = 'MANAGER' THEN 'manage'
    ELSE 'standard'
  END,
  'ongoing',
  COALESCE(tm.assignment_start_date::date, CURRENT_DATE),
  tm.status,
  tm.created_at,
  tm.updated_at
FROM team_members tm
WHERE tm.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM provider_team_assignments pta 
    WHERE pta.provider_id = tm.user_id 
      AND pta.team_id = tm.team_id
  );
```

### 2. Component Updates
The dashboard components can now use simpler data structures:

```typescript
// Before (complex nested queries)
const dashboardData = await complexMultiJoinQuery();

// After (simple direct relationship)
const assignments = await dashboardService.getProviderDashboard(providerId);
```

## Benefits of Using Existing Table

1. **Zero Migration Time**: Table already exists
2. **Optimized Indexes**: Already created for performance
3. **Established Constraints**: Data integrity already enforced
4. **Simple Implementation**: Direct usage of existing structure

## Next Steps

1. ✅ **Table exists** - Skip creation
2. **Create database functions** for optimized queries
3. **Update dashboard services** to use new relationship pattern
4. **Migrate existing data** from team_members
5. **Update dashboard components** to use simplified data structure
6. **Test performance** improvements