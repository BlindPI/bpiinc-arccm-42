
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { CRMService } from '@/services/crm/crmService';
import { useAuth } from '@/contexts/AuthContext';

export function CRMDebugPanel() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const createTestLead = useMutation({
    mutationFn: () => CRMService.createLead({
      first_name: "Test",
      last_name: "Lead",
      email: "test.lead@example.com",
      lead_source: "website",
      lead_status: "new",
      lead_score: 0
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
    },
    onError: (error) => {
      console.error("Error creating test lead:", error);
    }
  });

  const createTestContact = useMutation({
    mutationFn: () => CRMService.createContact({
      first_name: "Test",
      last_name: "Contact",
      email: "test.contact@example.com",
      contact_status: "active"
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
    },
    onError: (error) => {
      console.error("Error creating test contact:", error);
    }
  });

  const createTestAccount = useMutation({
    mutationFn: () => CRMService.createAccount({
      account_name: "Test Account",
      account_type: "prospect",
      account_status: "active"
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-accounts'] });
    },
    onError: (error) => {
      console.error("Error creating test account:", error);
    }
  });

  const createTestOpportunity = useMutation({
    mutationFn: () => CRMService.createOpportunity({
      opportunity_name: "Test Training Opportunity",
      account_id: "test-account",
      estimated_value: 25000,
      stage: "prospect",
      probability: 50,
      expected_close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      description: "Corporate safety training opportunity",
      opportunity_status: "open",
      created_by: user?.id || 'debug-user'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-opportunities'] });
    },
    onError: (error) => {
      console.error("Error creating test opportunity:", error);
    }
  });

  const createTestActivity = useMutation({
    mutationFn: () => CRMService.createActivity({
      activity_type: "call",
      subject: "Test Call Activity",
      activity_date: new Date().toISOString(),
      completed: false
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-activities'] });
    },
    onError: (error) => {
      console.error("Error creating test activity:", error);
    }
  });

  return (
    <div className="space-y-4 p-4 border rounded-md">
      <h3 className="text-lg font-semibold">CRM Debug Panel</h3>
      <p className="text-sm text-muted-foreground">Quick actions for testing CRM functionality</p>
      <div className="grid grid-cols-2 gap-4">
        <Button onClick={() => createTestLead.mutate()} disabled={createTestLead.isPending}>
          {createTestLead.isPending ? "Creating..." : "Create Test Lead"}
        </Button>
        <Button onClick={() => createTestContact.mutate()} disabled={createTestContact.isPending}>
          {createTestContact.isPending ? "Creating..." : "Create Test Contact"}
        </Button>
        <Button onClick={() => createTestAccount.mutate()} disabled={createTestAccount.isPending}>
          {createTestAccount.isPending ? "Creating..." : "Create Test Account"}
        </Button>
        <Button onClick={() => createTestOpportunity.mutate()} disabled={createTestOpportunity.isPending}>
          {createTestOpportunity.isPending ? "Creating..." : "Create Test Opportunity"}
        </Button>
        <Button onClick={() => createTestActivity.mutate()} disabled={createTestActivity.isPending}>
          {createTestActivity.isPending ? "Creating..." : "Create Test Activity"}
        </Button>
      </div>
    </div>
  );
}
