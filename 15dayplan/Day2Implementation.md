# Day 2 Implementation Plan - Tier Switching UI and Analytics

## Overview

Day 2 focuses on implementing the user interface components for tier management, enhancing dashboards with tier-specific information, and implementing analytics to track tier-related metrics. This builds on the Day 1 implementation which established the core dual-tier compliance system.

## Implementation Goals

1. **Implement Tier Switching UI Components**
   - Complete the TierSwitchDialog implementation
   - Create tier comparison visualization components
   - Implement tier benefits overview UI

2. **Enhance Dashboards with Tier-Specific Information**
   - Update the main dashboard to show tier-specific requirements
   - Add tier status indicators and progress tracking
   - Create tier-specific requirement grouping and filtering

3. **Implement Tier-Specific Analytics**
   - Add tier distribution metrics to the analytics dashboard
   - Create time-to-completion tracking by tier
   - Implement tier comparison analytics

## Detailed Implementation Plan

### 1. Tier Switching UI Components

#### 1.1 Complete TierSwitchDialog Implementation

The TierSwitchDialog component (from Currentplan1.5.md) provides a multi-step process for users to:
- Compare tiers (basic vs. robust)
- See the impact of switching
- Confirm the switch with a reason
- Process the switch

Implementation tasks:
- Connect the TierSwitchDialog to the ComplianceTierService
- Implement the `loadImpactAnalysis()` function to fetch real impact data
- Connect the dialog to the tier switch validation hook (useTierSwitchValidation)
- Add real-time updates for the switch process

```typescript
// Implementation example for loadImpactAnalysis
const loadImpactAnalysis = async () => {
  try {
    const validation = await ComplianceTierService.validateTierSwitch(
      userId,
      targetTier!
    );
    
    setImpactData(validation.impact);
    setAllowedToSwitch(validation.allowed);
    
    if (!validation.allowed) {
      setValidationErrors([validation.reason]);
    }
  } catch (error) {
    console.error('Failed to load impact analysis:', error);
    toast.error('Unable to analyze tier switch impact');
  }
};
```

#### 1.2 Create Tier Comparison Component

Enhance the tier comparison table to show detailed differences between tiers:

```typescript
function EnhancedTierComparisonTable({ currentTier, targetTier, role }) {
  const { data } = useComplianceTierComparison(role);
  
  // Get templates for current and target tiers
  const currentTemplate = data?.[currentTier];
  const targetTemplate = data?.[targetTier];
  
  // Calculate differences
  const differences = calculateTierDifferences(currentTemplate, targetTemplate);
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Tier Comparison</h3>
      
      {/* Tier comparison table with highlights */}
      <table className="w-full border-collapse">
        {/* Table content */}
      </table>
      
      {/* Key differences summary */}
      <div className="mt-4 p-4 bg-blue-50 rounded-md">
        <h4 className="font-medium text-blue-700">Key Differences</h4>
        <ul className="mt-2 space-y-2">
          {differences.map((diff, i) => (
            <li key={i} className="flex items-start">
              <ArrowRight className="h-5 w-5 mr-2 text-blue-500" />
              <span>{diff}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

#### 1.3 Implement Tier Benefits Overview

Create a component to highlight the benefits of each tier:

```typescript
function TierBenefitsOverview({ tier, role }) {
  const benefits = getTierBenefits(tier, role);
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">
        {tier === 'basic' ? 'Essential Tier' : 'Comprehensive Tier'} Benefits
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {benefits.map((benefit, i) => (
          <div key={i} className="flex items-start p-3 bg-white rounded-md shadow-sm">
            <div className="mr-3 p-2 rounded-full bg-blue-50">
              {benefit.icon}
            </div>
            <div>
              <h4 className="font-medium">{benefit.title}</h4>
              <p className="text-sm text-gray-600">{benefit.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2. Enhance Dashboards with Tier-Specific Information

#### 2.1 Update Main Dashboard with Tier Information

Modify the dashboard to show tier-specific requirement sections:

```typescript
function EnhancedComplianceDashboard({ userId, role, tier }) {
  // Fetch all tier-specific data
  const { data: tierInfo } = useComplianceTier(userId);
  const { data: requirements } = useComplianceRequirements(userId, role, tier);
  
  // Group requirements by tier-specific categories
  const tierSpecificGroups = groupRequirementsByTierCategories(requirements, tier);
  
  return (
    <div className="space-y-8">
      {/* Tier status header */}
      <TierStatusHeader tierInfo={tierInfo} />
      
      {/* Tier-specific requirement groups */}
      {Object.entries(tierSpecificGroups).map(([category, reqs]) => (
        <TierRequirementSection 
          key={category}
          title={category}
          requirements={reqs}
          tier={tier}
        />
      ))}
      
      {/* Tier advancement section (only for basic tier) */}
      {tier === 'basic' && (
        <TierAdvancementSection 
          canAdvance={tierInfo?.can_advance_tier}
          blockedReason={tierInfo?.advancement_blocked_reason}
          onRequestAdvancement={() => setTierSwitchDialogOpen(true)}
        />
      )}
    </div>
  );
}
```

#### 2.2 Add Tier Status Indicators

Create a component to display the current tier status and progress:

```typescript
function TierStatusHeader({ tierInfo }) {
  const { tier, role, completion_percentage, completed_requirements, requirements_count } = tierInfo || {};
  
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white rounded-lg shadow-sm">
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-bold">
            {tier === 'basic' ? 'Essential' : 'Comprehensive'} Compliance Tier
          </h2>
          <Badge variant={tier === 'basic' ? 'default' : 'secondary'}>
            {role} Role
          </Badge>
        </div>
        <p className="text-sm text-gray-500">
          {getTierDescription(tier, role)}
        </p>
      </div>
      
      <div className="mt-4 md:mt-0 flex flex-col items-end">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-sm font-medium">
            {completed_requirements}/{requirements_count} Requirements
          </span>
          <span className="text-lg font-bold">{completion_percentage}%</span>
        </div>
        <Progress value={completion_percentage} className="w-64" />
      </div>
    </div>
  );
}
```

#### 2.3 Create Tier-Specific Requirement Grouping

Implement a component to group and display requirements by tier-specific categories:

```typescript
function TierRequirementSection({ title, requirements, tier }) {
  const tierSpecificDisplay = getTierSpecificDisplay(tier, title);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-2">
          {tierSpecificDisplay.icon}
          <CardTitle>{tierSpecificDisplay.title}</CardTitle>
        </div>
        <CardDescription>{tierSpecificDisplay.description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {requirements.map(req => (
            <RequirementCard 
              key={req.id}
              requirement={req}
              tierSpecific={tierSpecificDisplay.highlighting}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

### 3. Implement Tier-Specific Analytics

#### 3.1 Add Tier Distribution Analytics

Enhance the ComplianceAnalyticsDashboard with tier distribution metrics:

```typescript
function TierDistributionChart({ data }) {
  // Prepare data for visualization
  const tierData = [
    { name: 'Basic Tier', value: data.basic_count, color: '#3B82F6' },
    { name: 'Robust Tier', value: data.robust_count, color: '#8B5CF6' }
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tier Distribution</CardTitle>
        <CardDescription>Organization-wide tier adoption</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={tierData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {tierData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

#### 3.2 Create Time-to-Completion by Tier Analytics

Add a component to visualize completion times by tier:

```typescript
function TierCompletionTimeChart({ timeData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Average Completion Time by Tier</CardTitle>
        <CardDescription>Days to complete all requirements</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={timeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar name="Average Days" dataKey="value" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

#### 3.3 Implement Tier Comparison Analytics

Create a component to compare metrics across tiers:

```typescript
function TierMetricsComparisonChart({ metricsData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tier Performance Comparison</CardTitle>
        <CardDescription>Key metrics by tier</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart outerRadius={90} data={metricsData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" />
            <PolarRadiusAxis />
            <Radar 
              name="Basic Tier" 
              dataKey="basic" 
              stroke="#3B82F6" 
              fill="#3B82F6" 
              fillOpacity={0.2} 
            />
            <Radar 
              name="Robust Tier" 
              dataKey="robust" 
              stroke="#8B5CF6" 
              fill="#8B5CF6"
              fillOpacity={0.2} 
            />
            <Legend />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

## Integration Points

To complete the Day 2 implementation, the following integration points need to be addressed:

1. **Backend Services Integration**
   - Connect TierSwitchDialog to ComplianceTierService
   - Implement validation logic for tier switching
   - Add tier-specific filters to requirement retrieval

2. **UI Component Integration**
   - Add TierSwitchDialog to main dashboard
   - Integrate tier status header with the dashboard
   - Add tier-specific analytics components to the analytics dashboard

3. **Data Flow Integration**
   - Ensure real-time updates when tier changes
   - Update UI when requirements change due to tier switch
   - Refresh analytics when tier distribution changes

## Testing Plan

1. **Tier Switching Tests**
   - Test validation logic for all roles
   - Test tier switch from basic to robust
   - Test tier switch from robust to basic
   - Test switching with pending requirements

2. **UI Component Tests**
   - Verify tier-specific requirements display correctly
   - Test tier status indicators update properly
   - Verify tier analytics show correct data

3. **Data Flow Tests**
   - Verify real-time updates after tier changes
   - Test data consistency after tier switches
   - Verify metrics update correctly after tier changes

## Implementation Sequence

1. Start with TierSwitchDialog implementation
2. Add tier status indicators to the dashboard
3. Implement tier-specific requirement grouping
4. Add tier distribution analytics
5. Implement tier comparison analytics
6. Complete integration and testing

## Expected Outcomes

After Day 2 implementation, users will be able to:
- View their current tier status clearly
- Compare tiers and understand the differences
- Switch between tiers with proper validation
- View tier-specific requirements and progress
- Access analytics that show tier-related metrics

The system will provide a seamless experience for managing the dual-tier compliance system, with appropriate UI feedback and analytics to guide users through the process.