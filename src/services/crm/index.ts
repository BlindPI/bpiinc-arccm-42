
// Consolidated CRM Services - Phase 4 Export Index

export { ConsolidatedCRMService } from './consolidatedCRMService';
export { CRMService } from './crmService';
export { EnhancedCRMService } from './enhancedCRMService';
export { AccountsService } from './accountsService';
export { ActivitiesService } from './activitiesService';
export { CRMLeadService } from './crmLeadService';

// Re-export the consolidated service as default
export { ConsolidatedCRMService as default } from './consolidatedCRMService';

// Backward compatibility exports
export { ConsolidatedCRMService as UnifiedCRMService } from './consolidatedCRMService';
export { ConsolidatedCRMService as CRMServiceV2 } from './consolidatedCRMService';
