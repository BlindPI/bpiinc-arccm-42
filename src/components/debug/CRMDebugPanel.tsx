
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CRMService } from '@/services/crm/enhancedCRMService';
import { toast } from 'sonner';
import { Database, TestTube, Trash2, Plus } from 'lucide-react';

const mockData = {
  leads: [
    {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      company_name: 'Acme Corp',
      lead_status: 'new' as const,
      lead_source: 'website' as const,
      lead_score: 75,
      phone: '555-0123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  opportunities: [
    {
      id: '1',
      opportunity_name: 'Enterprise Training Package',
      estimated_value: 50000,
      stage: 'prospect' as const,
      probability: 75,
      opportunity_status: 'open' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  accounts: [
    {
      id: '1',
      account_name: 'Acme Corp',
      account_type: 'prospect',
      industry: 'Technology',
      company_size: '51-200 employees',
      website: 'https://acme.com',
      phone: '+1-555-987-6543',
      account_status: 'active',
      annual_revenue: 1000000
    }
  ],
  contacts: [
    {
      id: '1',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@acme.com',
      phone: '+1-555-234-5678',
      mobile_phone: '+1-555-234-5679',
      title: 'CTO',
      department: 'Engineering',
      account_id: '1',
      contact_status: 'active',
      lead_source: 'referral',
      preferred_contact_method: 'email',
      do_not_call: false,
      do_not_email: false
    }
  ]
};

export const CRMDebugPanel: React.FC = () => {
  const queryClient = useQueryClient();

  const createTestDataMutation = useMutation({
    mutationFn: async () => {
      // Create test lead
      const testLead = await CRMService.createLead({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        company_name: 'Test Company',
        phone: '+1-555-123-4567',
        job_title: 'CEO',
        lead_status: 'new',
        lead_score: 85,
        lead_source: 'website',
        notes: 'Test lead for debugging'
      });

      // Create test account
      const testAccount = await CRMService.createAccount({
        account_name: 'Debug Test Corp',
        account_type: 'prospect',
        industry: 'Technology',
        company_size: '51-200 employees',
        website: 'https://debugtest.com',
        phone: '+1-555-987-6543',
        account_status: 'active',
        annual_revenue: 1000000
      });

      // Create test contact
      const testContact = await CRMService.createContact({
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@debugtest.com',
        phone: '+1-555-234-5678',
        mobile_phone: '+1-555-234-5679',
        title: 'CTO',
        department: 'Engineering',
        account_id: testAccount.id,
        contact_status: 'active',
        lead_source: 'referral',
        preferred_contact_method: 'email',
        do_not_call: false,
        do_not_email: false
      });

      // Create test opportunity
      const testOpportunity = await CRMService.createOpportunity({
        opportunity_name: 'Debug Test Deal',
        account_id: testAccount.id,
        estimated_value: 50000,
        stage: 'prospect',
        probability: 60,
        expected_close_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Test opportunity for debugging',
        opportunity_status: 'open'
      });

      return { testLead, testAccount, testContact, testOpportunity };
    },
    onSuccess: () => {
      toast.success('Test data created successfully');
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      toast.error('Failed to create test data: ' + error.message);
    }
  });

  const clearCacheMutation = useMutation({
    mutationFn: async () => {
      queryClient.clear();
      return true;
    },
    onSuccess: () => {
      toast.success('Cache cleared successfully');
    }
  });

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <TestTube className="h-5 w-5" />
          CRM Debug Panel
        </CardTitle>
        <CardDescription className="text-orange-700">
          Development tools for testing and debugging CRM functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-orange-700 border-orange-300">
            Development Mode
          </Badge>
          <Badge variant="secondary">
            Version 1.0.0
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-orange-800">Test Data</h4>
            <Button
              onClick={() => createTestDataMutation.mutate()}
              disabled={createTestDataMutation.isPending}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              {createTestDataMutation.isPending ? 'Creating...' : 'Create Test Data'}
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-orange-800">Cache Management</h4>
            <Button
              onClick={() => clearCacheMutation.mutate()}
              disabled={clearCacheMutation.isPending}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Query Cache
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t border-orange-200">
          <h4 className="font-medium text-orange-800 mb-2">System Status</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>CRM Service:</span>
              <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
            </div>
            <div className="flex justify-between">
              <span>Type System:</span>
              <Badge variant="default" className="bg-green-100 text-green-800">Unified</Badge>
            </div>
            <div className="flex justify-between">
              <span>Mock Data:</span>
              <Badge variant="secondary">Enabled</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
