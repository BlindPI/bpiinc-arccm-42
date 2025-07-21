# Simple Dashboard Solution
*Direct, uncomplicated approach using existing tables*

## The Simple Questions

1. **Is user member of Team?** → [`team_members`](src/services/team) table
2. **What is user Role?** → [`profiles.role`](src/docs/schema_results.md) (AP, IC, IP, IT)  
3. **Is Team assigned to Location?** → [`teams.location_id`](src/docs/schema_results.md)

## Simple Dashboard Query

```sql
-- Single query to get everything we need for dashboard
SELECT 
  p.id as user_id,
  p.role as user_role,        -- AP, IC, IP, IT
  p.display_name,
  
  tm.team_id,
  tm.role as team_role,       -- MEMBER, MANAGER, ADMIN
  
  t.name as team_name,
  t.location_id,
  
  l.name as location_name
  
FROM profiles p
JOIN team_members tm ON p.id = tm.user_id
JOIN teams t ON tm.team_id = t.id  
JOIN locations l ON t.location_id = l.id
WHERE p.id = $user_id
  AND tm.status = 'active'
  AND t.status = 'active'
  AND l.status = 'ACTIVE';
```

## Simple Service Implementation

```typescript
// File: src/services/dashboard/simpleDashboardService.ts

export interface UserDashboardData {
  user_id: string;
  user_role: 'AP' | 'IC' | 'IP' | 'IT';
  display_name: string;
  teams: Array<{
    team_id: string;
    team_name: string;
    team_role: string;
    location_id: string;
    location_name: string;
  }>;
}

export class SimpleDashboardService {
  /**
   * Get user's dashboard data - one simple query
   */
  static async getUserDashboardData(userId: string): Promise<UserDashboardData> {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        role,
        display_name,
        team_members!inner(
          team_id,
          role,
          teams!inner(
            id,
            name,
            location_id,
            locations!inner(
              id,
              name
            )
          )
        )
      `)
      .eq('id', userId)
      .eq('team_members.status', 'active')
      .eq('team_members.teams.status', 'active')
      .eq('team_members.teams.locations.status', 'ACTIVE')
      .single();

    if (error || !data) {
      throw new Error(`Failed to get user dashboard data: ${error?.message}`);
    }

    return {
      user_id: data.id,
      user_role: data.role,
      display_name: data.display_name,
      teams: data.team_members?.map((tm: any) => ({
        team_id: tm.teams.id,
        team_name: tm.teams.name,
        team_role: tm.role,
        location_id: tm.teams.location_id,
        location_name: tm.teams.locations.name
      })) || []
    };
  }

  /**
   * Simple role-based dashboard content
   */
  static getDashboardConfig(userRole: string): {
    showLocations: boolean;
    showTeams: boolean;
    showAllUsers: boolean;
    showReports: boolean;
  } {
    switch (userRole) {
      case 'AP': // Authorized Provider
        return {
          showLocations: true,
          showTeams: true,
          showAllUsers: false,
          showReports: true
        };
      case 'IC': // Certified Instructor
        return {
          showLocations: false,
          showTeams: true,
          showAllUsers: false,
          showReports: false
        };
      case 'IP': // Provisinal Instructor
        return {
          showLocations: false,
          showTeams: true,
          showAllUsers: false,
          showReports: false
        };
      case 'IT': // Instructor In Training
        return {
          showLocations: true,
          showTeams: true,
          showAllUsers: true,
          showReports: true
        };
      default:
        return {
          showLocations: false,
          showTeams: false,
          showAllUsers: false,
          showReports: false
        };
    }
  }
}
```

## Simple Dashboard Component

```typescript
// File: src/components/dashboard/SimpleDashboard.tsx

export const SimpleDashboard: React.FC<{ userId: string }> = ({ userId }) => {
  const [dashboardData, setDashboardData] = useState<UserDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const data = await SimpleDashboardService.getUserDashboardData(userId);
        setDashboardData(data);
      } catch (error) {
        console.error('Dashboard load failed:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (!dashboardData) return <div>No data available</div>;

  const config = SimpleDashboardService.getDashboardConfig(dashboardData.user_role);

  return (
    <div className="dashboard">
      <h1>Welcome, {dashboardData.display_name}</h1>
      <p>Role: {dashboardData.user_role}</p>
      
      {/* Show teams user is member of */}
      {config.showTeams && (
        <Card>
          <CardHeader>
            <CardTitle>Your Teams</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.teams.map(team => (
              <div key={team.team_id} className="team-item">
                <h3>{team.team_name}</h3>
                <p>Location: {team.location_name}</p>
                <p>Your Role: {team.team_role}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Show locations if user role allows */}
      {config.showLocations && (
        <LocationsSection teams={dashboardData.teams} />
      )}

      {/* Show reports if user role allows */}
      {config.showReports && (
        <ReportsSection userRole={dashboardData.user_role} />
      )}
    </div>
  );
};
```

## Simple Implementation Steps

### Step 1: Use What Exists (Week 1)
```sql
-- No new tables needed, use existing:
-- ✅ profiles (user_id, role)  
-- ✅ team_members (user_id, team_id, role, status)
-- ✅ teams (id, name, location_id, status)
-- ✅ locations (id, name, status)
```

### Step 2: Simple Dashboard Service (Week 1)
```typescript
// One service, one query, simple logic
// Based on user role → show appropriate data
// No complex migrations, no feature flags
```

### Step 3: Update Dashboard Components (Week 2)
```typescript
// Replace complex dashboard logic with simple role checks
// Show teams user belongs to
// Show locations based on role permissions
```

### Step 4: Clean Up (Week 2)
```typescript
// Remove overcomplicated existing dashboard services
// Keep it simple, extensible
```

## Role-Based Access

### AP (Authorized Provider)
- See: All locations + teams they're member of
- Manage: Teams they're ADMIN/MANAGER in
- Reports: Location-level reports

### IC (Certified Instructor)  
- See: Teams they're member of only
- Manage: Nothing (read-only)
- Reports: None

### IP (Provisional Instructor)
- See: Teams they're member of only  
- Manage: Nothing (read-only)
- Reports: None

### IT (Instructor In Training)
- See: Teams they're member of only
- Manage: Nothing (read-only)
- Reports: All reports

## Why This Is Simple

1. **One Query**: Get user → teams → locations in single query
2. **Role-Based Logic**: Simple switch statement based on user role
3. **No Migrations**: Use existing tables as-is
4. **No Feature Flags**: Straightforward implementation
5. **Extensible**: Easy to add new roles or permissions

## What We Remove

- ❌ Complex [`provider_team_assignments`](src/docs/PROVIDER_TEAM_ASSIGNMENTS_IMPLEMENTATION.md) migration
- ❌ Multiple database functions  
- ❌ Feature flags and hybrid implementations
- ❌ Complex caching strategies
- ❌ Over-engineered validation scripts

## What We Keep

- ✅ Simple role checks: `if (user.role === 'AP')`
- ✅ Basic team membership: `team_members` table
- ✅ Location association: `teams.location_id` 
- ✅ Room to grow: Easy to add new features

**This is fucking simple and it works.**