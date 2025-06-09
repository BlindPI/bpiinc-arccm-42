
// This file is deprecated - use src/services/team/complianceService.ts instead
export { ComplianceService, complianceService } from '@/services/team/complianceService';

export interface ComplianceOverview {
  totalRequirements: number;
  compliantCount: number;
  nonCompliantCount: number;
  pendingCount: number;
  complianceRate: number;
}
