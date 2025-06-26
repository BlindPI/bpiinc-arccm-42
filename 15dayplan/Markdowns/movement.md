🚚 FILE MOVEMENT INSTRUCTIONS FOR 100% PROPER DIRECTORY ORGANIZATION
📊 ANALYSIS SUMMARY
Current Issues Identified:

Components scattered between [15dayplan/components/] and [src/components/]
Services duplicated/misplaced between [15dayplan/services/] and [src/services/]
Missing dialog component ([EvidenceVerificationDialog.tsx] referenced but not found)
Import path issues in staging components
🎯 COMPLETE FILE MOVEMENT PLAN
PHASE 1: MOVE COMPONENTS (15dayplan/components/ → src/components/)
1.1 Admin Components
# Move all admin dashboard components
mv "15dayplan/components/admin/ComplianceAnalyticsDashboard.tsx" "src/components/admin/"
mv "15dayplan/components/admin/ComplianceReviewDashboard.tsx" "src/components/admin/"
mv "15dayplan/components/admin/SecurityAuditDashboard.tsx" "src/components/admin/"
mv "15dayplan/components/admin/SystemHealthDashboard.tsx" "src/components/admin/"
mv "15dayplan/components/admin/UserManagementDashboard.tsx" "src/components/admin/"

bash


1.2 Compliance Components
# Move compliance-specific components
mv "15dayplan/components/compliance/ComplianceProgressDashboard.tsx" "src/components/compliance/"
mv "15dayplan/components/compliance/ExternalLinkRequirement.tsx" "src/components/compliance/"
mv "15dayplan/components/compliance/FileUploadRequirement.tsx" "src/components/compliance/"
mv "15dayplan/components/compliance/FormRequirement.tsx" "src/components/compliance/"
mv "15dayplan/components/compliance/RequirementDetailDrawer.tsx" "src/components/compliance/"
mv "15dayplan/components/compliance/RequirementReviewQueue.tsx" "src/components/compliance/"

bash


1.3 Supporting Components
# Move notification and report components
mv "15dayplan/components/notifications/NotificationCenter.tsx" "src/components/notifications/"
mv "15dayplan/components/reports/ComplianceReportGenerator.tsx" "src/components/reports/"

bash


1.4 Root-Level Components
# Move root-level dialog and dashboard components
mv "15dayplan/TierSwitchDialog.tsx" "src/components/dialogs/" # (Replace existing if newer)
mv "15dayplan/ComplianceAnalyticsDashboard.tsx" "src/components/admin/" # (Check for duplicates)
mv "15dayplan/ComplianceDashboardWithTiers.tsx" "src/components/dashboard/"
mv "15dayplan/ComplianceTierContext.tsx" "src/contexts/"
mv "15dayplan/DashboardContext.tsx" "src/contexts/"
mv "15dayplan/DashboardDataProvider.tsx" "src/providers/"
mv "15dayplan/DashboardUIContext.tsx" "src/contexts/"
mv "15dayplan/FixedRoleBasedDashboard.tsx" "src/components/dashboard/"
mv "15dayplan/ICDashboard.tsx" "src/components/dashboard/role-dashboards/"

bash


1.5 Tier-Specific Components
# Move tier management components
mv "15dayplan/TierAdvancementSection.tsx" "src/components/compliance/"
mv "15dayplan/TierBenefitsOverview.tsx" "src/components/compliance/"
mv "15dayplan/TierComparisonChart.tsx" "src/components/compliance/"
mv "15dayplan/TierRequirementSection.tsx" "src/components/compliance/"
mv "15dayplan/TierStatusHeader.tsx" "src/components/compliance/"

bash


PHASE 2: MOVE SERVICES (15dayplan/services/ → src/services/)
2.1 Notification Services
# Move notification services
mv "15dayplan/services/notifications/notificationService.ts" "src/services/notifications/"
mv "15dayplan/services/notifications/notificationTemplates.ts" "src/services/notifications/"

bash


2.2 Report Services
# Move report services
mv "15dayplan/services/reports/complianceReportService.ts" "src/services/reports/"

bash


2.3 Core Services
# Move core compliance services
mv "15dayplan/complianceTierService.ts" "src/services/compliance/"
mv "15dayplan/complianceRequirementsService.ts" "src/services/compliance/"
mv "15dayplan/initializeComplianceTiers.ts" "src/services/compliance/"

bash


PHASE 3: MOVE HOOKS (15dayplan/hooks/ → src/hooks/)
# Move custom hooks
mv "15dayplan/hooks/useComplianceRequirements.ts" "src/hooks/"
mv "15dayplan/hooks/useComplianceTier.ts" "src/hooks/"

# Move root-level hooks
mv "15dayplan/useComplianceRealtimeUpdates.ts" "src/hooks/"
mv "15dayplan/useComplianceRequirements.ts" "src/hooks/" # (Check for duplicates)
mv "15dayplan/useComplianceTier.ts" "src/hooks/" # (Check for duplicates)
mv "15dayplan/useDashboardUI.ts" "src/hooks/"

bash


PHASE 4: MOVE CONTEXTS (15dayplan/contexts/ → src/contexts/)
# Move context providers
mv "15dayplan/contexts/AuthContext.tsx" "src/contexts/" # (Check if duplicate)

bash


PHASE 5: MOVE TEMPLATES AND UTILITIES
5.1 Template Files
# Move requirement templates
mv "15dayplan/completeRequirementTemplates.ts" "src/services/compliance/"

bash


5.2 Test Files
# Move test files to appropriate test directory
mv "15dayplan/TierComponentsIntegrationTest.tsx" "src/test/integration/"

bash


PHASE 6: DATABASE AND CONFIG FILES
6.1 Database Migration
# Move database schema to appropriate location
mv "15dayplan/20250624_dual_tier_compliance_system.sql" "src/migrations/" # or "database/migrations/"

bash


⚠️ CRITICAL ACTIONS REQUIRED
6.1 MISSING FILE CREATION
EvidenceVerificationDialog.tsx is referenced in VS Code tabs but doesn't exist:

# This file needs to be created in:
# src/components/dialogs/EvidenceVerificationDialog.tsx
# (Check markdown documentation for implementation details)

bash


6.2 DUPLICATE RESOLUTION
Before moving, check for existing files in destination:

# Check these potential duplicates:
- TierSwitchDialog.tsx (exists in both locations)
- ComplianceAnalyticsDashboard.tsx (may exist in both)
- useComplianceRequirements.ts (may exist in both)
- useComplianceTier.ts (may exist in both)

bash


6.3 IMPORT PATH CORRECTIONS
After file movements, update import paths in:

// Fix in TierSwitchDialog.tsx (lines 47-48):
// FROM: import { ComplianceTierService } from './complianceTierService';
// TO:   import { ComplianceTierService } from '@/services/compliance/complianceTierService';

// Update in FixedRoleBasedDashboard.tsx (line 23):
// Verify path: import { TierSwitchDialog } from '@/components/dialogs/TierSwitchDialog';

typescript


🧹 CLEANUP ACTIONS
7.1 Remove Empty Directories
# After moves, remove empty directories:
rmdir "15dayplan/components/admin" 2>nul
rmdir "15dayplan/components/compliance" 2>nul
rmdir "15dayplan/components/notifications" 2>nul
rmdir "15dayplan/components/reports" 2>nul
rmdir "15dayplan/components/ui" 2>nul
rmdir "15dayplan/components" 2>nul
rmdir "15dayplan/services/notifications" 2>nul
rmdir "15dayplan/services/reports" 2>nul
rmdir "15dayplan/services" 2>nul
rmdir "15dayplan/hooks" 2>nul
rmdir "15dayplan/contexts" 2>nul

bash


7.2 Keep Documentation
# KEEP these directories - they contain valuable documentation:
# 15dayplan/Markdowns/ (implementation documentation)
# 15dayplan/CompleteRequirementTemplates.md
# 15dayplan/ComplianceRequirementsServiceImplementation.md

bash


🎯 EXECUTION ORDER
Backup First: Create backup of current state
Check Duplicates: Verify which version is newer/correct
Move Services: Start with services (fewer dependencies)
Move Components: Move components after services
Update Imports: Fix all import paths
Test Build: Verify no compilation errors
Cleanup: Remove empty directories
✅ FINAL RESULT
After completion, all production code will be properly organized in [src/] directory with:

All components in appropriate [src/components/] subdirectories
All services in appropriate [src/services/] subdirectories
All hooks in [src/hooks/]
All contexts in [src/contexts/]
Database migrations in [src/migrations/]
Documentation preserved in [15dayplan/Markdowns/]
This will achieve 100% proper directory organization for the dual-tier compliance system.