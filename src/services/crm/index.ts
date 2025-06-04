// CRM Services Export Index
// Comprehensive Sales CRM for Assured Response

// Core CRM Services
export { crmLeadService, CRMLeadService } from './crmLeadService';
export { crmOpportunityService, CRMOpportunityService } from './crmOpportunityService';
export { crmActivityService, CRMActivityService } from './crmActivityService';
export { crmRevenueService, CRMRevenueService } from './crmRevenueService';
export { crmEmailCampaignService, CRMEmailCampaignService } from './crmEmailCampaignService';
export { crmDashboardService, CRMDashboardService } from './crmDashboardService';

// Re-export all CRM types for convenience
export * from '@/types/crm';

// Import services for object creation
import { crmLeadService } from './crmLeadService';
import { crmOpportunityService } from './crmOpportunityService';
import { crmActivityService } from './crmActivityService';
import { crmRevenueService } from './crmRevenueService';
import { crmEmailCampaignService } from './crmEmailCampaignService';
import { crmDashboardService } from './crmDashboardService';

// Service instances for direct use
export const crmServices = {
  leads: crmLeadService,
  opportunities: crmOpportunityService,
  activities: crmActivityService,
  revenue: crmRevenueService,
  emailCampaigns: crmEmailCampaignService,
  dashboard: crmDashboardService
};

// Import classes for object creation
import { CRMLeadService } from './crmLeadService';
import { CRMOpportunityService } from './crmOpportunityService';
import { CRMActivityService } from './crmActivityService';
import { CRMRevenueService } from './crmRevenueService';
import { CRMEmailCampaignService } from './crmEmailCampaignService';
import { CRMDashboardService } from './crmDashboardService';

// Service classes for instantiation if needed
export const CRMServiceClasses = {
  LeadService: CRMLeadService,
  OpportunityService: CRMOpportunityService,
  ActivityService: CRMActivityService,
  RevenueService: CRMRevenueService,
  EmailCampaignService: CRMEmailCampaignService,
  DashboardService: CRMDashboardService
};