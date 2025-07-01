# IMPLEMENTATION STANDARDS PROMPT FOR FUTURE DAY IMPLEMENTATIONS

## 🎯 CORE MANDATE: REAL FUCKING FUNCTION ONLY

**ABSOLUTELY NO PLACEHOLDER, FAKE, DEMO, OR MOCK DATA/FUNCTIONALITY**

Use this prompt for ALL future day implementations to ensure consistent, functional, production-ready code.

---

## 📋 IMPLEMENTATION REQUIREMENTS

### 1. DATABASE INTEGRATION - REAL ONLY
```typescript
// ✅ CORRECT - Use actual existing services
import { ComplianceService } from '@/services/compliance/complianceService';
import { ComplianceTierService } from '@/services/compliance/complianceTierService';
import { supabase } from '@/integrations/supabase/client';

// ✅ CORRECT - Real database operations
const records = await ComplianceService.getAllComplianceRecords();
const userTier = await ComplianceTierService.getUserComplianceTier(userId);

// ❌ FORBIDDEN - No fake/mock data
const mockData = { fake: 'data' }; // NEVER DO THIS
const simulatedResponse = generateFakeData(); // NEVER DO THIS
```

### 2. IMPORT PATHS - @/ PATHS ONLY
```typescript
// ✅ CORRECT - Always use @/ paths
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ComplianceService } from '@/services/compliance/complianceService';
import { supabase } from '@/integrations/supabase/client';

// ❌ FORBIDDEN - Never use relative paths
import { Card } from '../../src/components/ui/card'; // NEVER DO THIS
import { Button } from '../../../components/ui/button'; // NEVER DO THIS
```

### 3. EXISTING SERVICES - USE WHAT EXISTS
**Before creating new services, check these existing services:**

#### Compliance Services (src/services/compliance/)
- `complianceService.ts` - Full CRUD compliance operations
- `complianceTierService.ts` - Basic/Robust tier management  
- `complianceRequirementsService.ts` - Requirements management
- `teamMemberComplianceService.ts` - Team compliance operations

#### UI Components (src/components/ui/)
- All shadcn/ui components available
- Use existing components, don't recreate them

#### Database Tables (Check existing schema)
- `profiles` - User profiles with roles and compliance_tier
- `compliance_metrics` - Compliance requirements definitions
- `user_compliance_records` - User compliance status records
- `compliance_documents` - Document storage and verification
- `compliance_actions` - Required actions and deadlines
- `compliance_audit_log` - Audit trail for all changes

### 4. REAL FUNCTIONALITY PATTERNS

#### ✅ Data Loading Pattern
```typescript
const loadRealData = async () => {
  try {
    setLoading(true);
    
    // Use actual service calls
    const data = await ComplianceService.getAllComplianceRecords();
    
    // Process real data
    const processed = data.map(record => {
      // Real calculations only
      return {
        ...record,
        calculatedScore: calculateRealScore(record)
      };
    });
    
    setState(processed);
  } catch (error) {
    console.error('Real error:', error);
    toast.error('Failed to load data');
  } finally {
    setLoading(false);
  }
};
```

#### ✅ CRUD Operations Pattern
```typescript
const handleUpdate = async (id: string, updates: any) => {
  try {
    setProcessing(true);
    
    // Real database update
    await ComplianceService.updateComplianceRecord(
      userId, 
      metricId, 
      updates.value, 
      updates.status, 
      updates.notes
    );
    
    toast.success('Updated successfully');
    
    // Reload real data
    await loadRealData();
    
  } catch (error) {
    console.error('Update error:', error);
    toast.error('Failed to update');
  } finally {
    setProcessing(false);
  }
};
```

#### ✅ Export Real Data Pattern
```typescript
const exportRealData = async () => {
  try {
    // Export actual data, not mock data
    const exportData = {
      generatedAt: new Date().toISOString(),
      data: actualDataFromState, // Real data only
      filters: currentFilters,
      summary: calculateRealSummary(actualDataFromState)
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    
    // Create download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `real-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Real data exported successfully');
  } catch (error) {
    console.error('Export error:', error);
    toast.error('Failed to export data');
  }
};
```

## 🚫 FORBIDDEN PATTERNS

### ❌ NO PLACEHOLDER DATA
```typescript
// NEVER DO THESE:
const mockUsers = [{ id: 'fake', name: 'Demo User' }];
const simulatedMetrics = { fake: 'metrics' };
const placeholderData = generateFakeData();
const demoResponse = { success: true, data: [] };

// Placeholder comments like:
// TODO: Replace with real data
// This would connect to real API
// Simulated for demo purposes
```

### ❌ NO FAKE SERVICES
```typescript
// NEVER CREATE FAKE SERVICES:
class MockComplianceService {
  static async getFakeData() {
    return { fake: 'data' };
  }
}

const simulateAPICall = () => {
  return Promise.resolve({ mock: 'response' });
};
```

### ❌ NO DEMO FUNCTIONALITY
```typescript
// NEVER DO DEMO/FAKE OPERATIONS:
const handleFakeSubmit = () => {
  console.log('This would submit to real API');
  setFakeSuccessMessage('Demo success!');
};

const simulateProcessing = () => {
  setTimeout(() => {
    setFakeResult('Simulated result');
  }, 1000);
};
```

## 🎯 IMPLEMENTATION CHECKLIST

### Before Starting Any Component:
- [ ] Check existing services in `src/services/` 
- [ ] Review existing database tables and schema
- [ ] Identify available UI components in `src/components/ui/`
- [ ] Plan real data flow using existing services

### During Implementation:
- [ ] Use @/ import paths exclusively
- [ ] Call real database services only
- [ ] Handle actual errors, not simulated ones
- [ ] Process real data, never mock/placeholder
- [ ] Export actual data, not demo data
- [ ] Test with real database connections

### Before Completion:
- [ ] Verify all imports use @/ paths
- [ ] Confirm no placeholder/mock/demo code exists
- [ ] Test real database operations work
- [ ] Validate error handling with actual errors
- [ ] Ensure export functions work with real data

## 🔥 ENFORCEMENT STATEMENTS

**"REAL FUCKING FUNCTION ONLY"** - Every line of code must serve a real purpose with real data.

**"NO PLACEHOLDER BULLSHIT"** - If it's not connected to real services, don't write it.

**"ACTUAL DATABASE OR NOTHING"** - All data must come from real Supabase queries.

**"@/ IMPORTS ALWAYS"** - Never change import paths to relative paths.

**"EXISTING SERVICES FIRST"** - Use what's already built before creating new services.

## 📊 SUCCESS CRITERIA

A successful implementation must:
1. ✅ Use only existing real services
2. ✅ Perform actual database operations  
3. ✅ Handle real errors appropriately
4. ✅ Export real data successfully
5. ✅ Use @/ import paths consistently
6. ✅ Integrate with existing database schema
7. ✅ Provide genuine user functionality
8. ✅ Include proper loading states for real operations
9. ✅ Show real-time data updates
10. ✅ Work in production environment

---

**Use this prompt as the foundation for all future day implementations. NO EXCEPTIONS.**

**REAL FUNCTIONALITY IS THE ONLY ACCEPTABLE STANDARD.**