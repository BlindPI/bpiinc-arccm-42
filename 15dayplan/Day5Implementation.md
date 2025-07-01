# Day 5 Implementation Plan: Dashboard Data Services & UI Integration

## Overview
For Day 5, we'll focus on connecting dashboard data services and UI components. This includes implementing hooks and context providers that enable real-time dashboard updates and proper tier-based UI configuration. These services will allow the different role-based dashboards to receive the correct data and render with appropriate styling based on the user's compliance tier.

## Implementation Goals
1. Create context providers for sharing tier and requirement data between components
2. Implement data providers that fetch and provide tier and requirement data to dashboards
3. Develop UI helper hooks that provide styling and layout based on tier settings
4. Connect real-time data services to dashboard components
5. Ensure proper typing and fallback values for type safety

## Implementation Steps

### 1. Dashboard Context Implementation
Create a central context to store and share dashboard data:

- File: `src/contexts/DashboardContext.tsx`
- Purpose: Central store for dashboard state (tier info, requirements, etc.)
- Provides: Context provider and consumer hook
- Features:
  - Type-safe interfaces for tier and requirement data
  - Helper methods for requirement filtering and statistics
  - Integration with tier-based configuration

### 2. Dashboard Data Provider Implementation
Create a provider component that fetches and provides data to dashboards:

- File: `src/providers/DashboardDataProvider.tsx`
- Purpose: Combines multiple contexts and fetches data for dashboards
- Provides: A unified provider for dashboard components
- Features:
  - Fetches tier information for the user
  - Fetches requirements relevant to user's role
  - Sets up real-time updates for both
  - Provides UI configuration based on tier

### 3. Dashboard UI Hook Implementation
Create a hook for UI helper functions based on tier:

- File: `src/hooks/useDashboardUI.ts`
- Purpose: Provides UI helper functions and tier-specific styling
- Provides: Helper methods for UI components
- Features:
  - Color theming based on tier
  - Layout selection
  - Feature checking based on tier
  - Text formatting and messaging

### 4. Compliance Requirements Hook Enhancement
Enhance the existing requirements hooks with UI-specific functionality:

- File: `src/hooks/useComplianceRequirements.ts`
- Purpose: Enhanced hooks for fetching compliance data
- Provides: Additional hooks for UI-specific requirements
- Features:
  - Role-specific requirement filtering
  - UI enhancements for requirements (status indicators, etc.)
  - Categorized requirements for dashboard display

### 5. Updating Dashboard Component Implementation
Update the role-based dashboard components to use the new services:

- File: `src/components/dashboard/FixedRoleBasedDashboard.tsx`
- Purpose: Connect the dashboard components to the new data services
- Changes:
  - Wrap role-specific dashboards with DashboardDataProvider
  - Use the new hooks for data and UI
  - Implement proper loading and error states

## Technical Specifications

### Data Flow Architecture
```
ComplianceTierService → useComplianceTier → ComplianceTierContext
                                          ↓
RequirementsService → useUIRequirements → DashboardDataProvider → Dashboard Components
                                          ↑
                      useDashboardUI ← DashboardUIContext
```

### TypeScript Interfaces

```typescript
// UIComplianceTierInfo interface
interface UIComplianceTierInfo {
  id: string;
  userId: string;
  tier: 'basic' | 'robust';
  completion_percentage: number;
  can_advance_tier: boolean;
  next_requirement?: {
    id: string;
    name: string;
    due_date: string;
  };
  created_at: string;
  updated_at: string;
}

// UIRequirement interface
interface UIRequirement {
  id: string;
  name: string;
  description: string;
  category: string;
  tier: 'basic' | 'robust';
  status: 'pending' | 'in_progress' | 'completed' | 'waived';
  due_date?: string;
  completion_date?: string;
  type: 'form' | 'upload' | 'external' | 'mixed';
  assigned_roles: string[];
  metadata?: Record<string, any>;
  
  // UI-specific properties
  isOverdue?: boolean;
  completionPercentage?: number;
  isVisible?: boolean;
}
```

### Hook Signatures

```typescript
// Dashboard UI Hook
function useDashboardUI(): {
  getThemeColor: (key: ThemeColorKey, fallback?: string) => string;
  hasFeature: (featureName: string) => boolean;
  getLayoutClass: (baseClass?: string) => string;
  getTierClasses: (componentType: 'card' | 'header' | 'button' | 'text') => string;
  // ...other UI helper methods
}

// Dashboard Data Hook
function useDashboardData(): {
  userId: string;
  role: string;
  tierInfo: UIComplianceTierInfo | null;
  requirements: UIRequirement[];
  isLoading: boolean;
  error: Error | null;
}

// UI Requirements Hook
function useUIRequirements(userId: string, role: string): {
  data: UIRequirement[] | undefined;
  isLoading: boolean;
  error: Error | null;
}
```

## Testing Plan
1. Verify data fetching in each hook with mock data
2. Test real-time updates using Supabase subscriptions
3. Verify UI rendering based on different tiers
4. Test error handling and loading states
5. Validate type safety throughout the implementation

## Dependencies
- React Context API for state management
- React Query for data fetching
- TypeScript for type safety
- Supabase real-time subscriptions

## Security Considerations
- Ensure proper role-based access to requirements
- Validate user permissions for tier data
- Sanitize any user inputs for filtering or searching

## Expected Outcome
At the end of Day 5, we'll have a fully connected dashboard data layer that:
1. Provides real-time tier and requirement data to dashboards
2. Configures UI components based on the user's tier
3. Enables role-specific dashboard views with appropriate styling
4. Maintains type safety throughout the codebase