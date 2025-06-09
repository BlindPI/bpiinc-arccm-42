
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ConsolidatedCRMService } from '@/services/crm/consolidatedCRMService';
import { toast } from 'sonner';
import type { Lead, Contact, Account, Opportunity, Activity, DateRange } from '@/types/crm';

/**
 * Unified CRM Hook - Phase 4 Implementation
 * Provides a single interface for all CRM operations
 */
export function useConsolidatedCRM() {
  const queryClient = useQueryClient();

  // ================ LEAD OPERATIONS ================
  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['crm-leads'],
    queryFn: () => ConsolidatedCRMService.getLeads()
  });

  const createLeadMutation = useMutation({
    mutationFn: (leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) =>
      ConsolidatedCRMService.createLead(leadData),
    onSuccess: () => {
      toast.success('Lead created successfully');
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
    },
    onError: (error) => {
      toast.error('Failed to create lead: ' + error.message);
    }
  });

  // ================ CONTACT OPERATIONS ================
  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ['crm-contacts'],
    queryFn: () => ConsolidatedCRMService.getContacts()
  });

  const createContactMutation = useMutation({
    mutationFn: (contactData: Omit<Contact, 'id' | 'created_at' | 'updated_at'>) =>
      ConsolidatedCRMService.createContact(contactData),
    onSuccess: () => {
      toast.success('Contact created successfully');
      queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
    },
    onError: (error) => {
      toast.error('Failed to create contact: ' + error.message);
    }
  });

  // ================ ACCOUNT OPERATIONS ================
  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['crm-accounts'],
    queryFn: () => ConsolidatedCRMService.getAccounts()
  });

  const createAccountMutation = useMutation({
    mutationFn: (accountData: Omit<Account, 'id' | 'created_at' | 'updated_at'>) =>
      ConsolidatedCRMService.createAccount(accountData),
    onSuccess: () => {
      toast.success('Account created successfully');
      queryClient.invalidateQueries({ queryKey: ['crm-accounts'] });
    },
    onError: (error) => {
      toast.error('Failed to create account: ' + error.message);
    }
  });

  // ================ OPPORTUNITY OPERATIONS ================
  const { data: opportunities = [], isLoading: opportunitiesLoading } = useQuery({
    queryKey: ['crm-opportunities'],
    queryFn: () => ConsolidatedCRMService.getOpportunities()
  });

  const createOpportunityMutation = useMutation({
    mutationFn: (opportunityData: Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>) =>
      ConsolidatedCRMService.createOpportunity(opportunityData),
    onSuccess: () => {
      toast.success('Opportunity created successfully');
      queryClient.invalidateQueries({ queryKey: ['crm-opportunities'] });
    },
    onError: (error) => {
      toast.error('Failed to create opportunity: ' + error.message);
    }
  });

  // ================ ACTIVITY OPERATIONS ================
  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ['crm-activities'],
    queryFn: () => ConsolidatedCRMService.getActivities()
  });

  const createActivityMutation = useMutation({
    mutationFn: (activityData: Omit<Activity, 'id' | 'created_at' | 'updated_at'>) =>
      ConsolidatedCRMService.createActivity(activityData),
    onSuccess: () => {
      toast.success('Activity created successfully');
      queryClient.invalidateQueries({ queryKey: ['crm-activities'] });
    },
    onError: (error) => {
      toast.error('Failed to create activity: ' + error.message);
    }
  });

  // ================ ANALYTICS ================
  const { data: crmStats } = useQuery({
    queryKey: ['crm-stats'],
    queryFn: () => ConsolidatedCRMService.getCRMStats()
  });

  const getRevenueMetrics = (dateRange: DateRange) => {
    return useQuery({
      queryKey: ['crm-revenue-metrics', dateRange],
      queryFn: () => ConsolidatedCRMService.getRevenueMetrics(dateRange)
    });
  };

  // ================ ASSIGNMENT RULES ================
  const { data: assignmentRules = [] } = useQuery({
    queryKey: ['crm-assignment-rules'],
    queryFn: () => ConsolidatedCRMService.getAssignmentRules()
  });

  const createAssignmentRuleMutation = useMutation({
    mutationFn: ConsolidatedCRMService.createAssignmentRule,
    onSuccess: () => {
      toast.success('Assignment rule created successfully');
      queryClient.invalidateQueries({ queryKey: ['crm-assignment-rules'] });
    },
    onError: (error) => {
      toast.error('Failed to create assignment rule: ' + error.message);
    }
  });

  // ================ CONSOLIDATED INTERFACE ================
  return {
    // Data
    leads,
    contacts,
    accounts,
    opportunities,
    activities,
    assignmentRules,
    crmStats,
    
    // Loading states
    isLoading: leadsLoading || contactsLoading || accountsLoading || opportunitiesLoading || activitiesLoading,
    
    // Mutations
    createLead: createLeadMutation.mutate,
    createContact: createContactMutation.mutate,
    createAccount: createAccountMutation.mutate,
    createOpportunity: createOpportunityMutation.mutate,
    createActivity: createActivityMutation.mutate,
    createAssignmentRule: createAssignmentRuleMutation.mutate,
    
    // Analytics functions
    getRevenueMetrics,
    
    // Mutation states
    mutations: {
      lead: createLeadMutation,
      contact: createContactMutation,
      account: createAccountMutation,
      opportunity: createOpportunityMutation,
      activity: createActivityMutation,
      assignmentRule: createAssignmentRuleMutation
    }
  };
}
