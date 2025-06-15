
import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, User, Building, Target, Phone } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { EnhancedCRMService } from '@/services/crm/enhancedCRMService';
import { CRMService } from '@/services/crm/crmService';

interface SearchResult {
  id: string;
  type: 'lead' | 'contact' | 'account' | 'opportunity';
  title: string;
  subtitle: string;
  status: string;
  data: any;
}

export function CRMGlobalSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);

  const { data: leads = [] } = useQuery({
    queryKey: ['crm-leads'],
    queryFn: () => CRMService.getLeads()
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['crm-contacts'],
    queryFn: () => CRMService.getContacts()
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['crm-accounts'],
    queryFn: () => CRMService.getAccounts()
  });

  const { data: opportunities = [] } = useQuery({
    queryKey: ['crm-opportunities'],
    queryFn: () => CRMService.getOpportunities()
  });

  const searchResults = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];

    const results: SearchResult[] = [];
    const term = searchTerm.toLowerCase();

    // Search leads
    leads.forEach(lead => {
      const matches = 
        lead.first_name?.toLowerCase().includes(term) ||
        lead.last_name?.toLowerCase().includes(term) ||
        lead.email?.toLowerCase().includes(term) ||
        lead.company_name?.toLowerCase().includes(term) ||
        lead.phone?.toLowerCase().includes(term);

      if (matches) {
        results.push({
          id: lead.id,
          type: 'lead',
          title: `${lead.first_name} ${lead.last_name}`,
          subtitle: lead.company_name || lead.email,
          status: lead.lead_status,
          data: lead
        });
      }
    });

    // Search contacts
    contacts.forEach(contact => {
      const matches = 
        contact.first_name?.toLowerCase().includes(term) ||
        contact.last_name?.toLowerCase().includes(term) ||
        contact.email?.toLowerCase().includes(term) ||
        contact.phone?.toLowerCase().includes(term) ||
        contact.title?.toLowerCase().includes(term);

      if (matches) {
        results.push({
          id: contact.id,
          type: 'contact',
          title: `${contact.first_name} ${contact.last_name}`,
          subtitle: contact.title || contact.email,
          status: contact.contact_status,
          data: contact
        });
      }
    });

    // Search accounts
    accounts.forEach(account => {
      const matches = 
        account.account_name?.toLowerCase().includes(term) ||
        account.industry?.toLowerCase().includes(term) ||
        account.website?.toLowerCase().includes(term);

      if (matches) {
        results.push({
          id: account.id,
          type: 'account',
          title: account.account_name,
          subtitle: account.industry || account.account_type,
          status: account.account_status,
          data: account
        });
      }
    });

    // Search opportunities
    opportunities.forEach(opportunity => {
      const matches = 
        opportunity.opportunity_name?.toLowerCase().includes(term) ||
        opportunity.account_name?.toLowerCase().includes(term) ||
        opportunity.description?.toLowerCase().includes(term);

      if (matches) {
        results.push({
          id: opportunity.id,
          type: 'opportunity',
          title: opportunity.opportunity_name,
          subtitle: `$${opportunity.estimated_value?.toLocaleString() || 0}`,
          status: opportunity.stage,
          data: opportunity
        });
      }
    });

    return results.slice(0, 10); // Limit to 10 results
  }, [searchTerm, leads, contacts, accounts, opportunities]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'lead': return <User className="h-4 w-4" />;
      case 'contact': return <Phone className="h-4 w-4" />;
      case 'account': return <Building className="h-4 w-4" />;
      case 'opportunity': return <Target className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  const getStatusColor = (type: string, status: string) => {
    if (type === 'lead') {
      switch (status) {
        case 'new': return 'bg-blue-100 text-blue-800';
        case 'contacted': return 'bg-yellow-100 text-yellow-800';
        case 'qualified': return 'bg-green-100 text-green-800';
        case 'converted': return 'bg-purple-100 text-purple-800';
        case 'lost': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    }
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search leads, contacts, accounts..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowResults(e.target.value.length >= 2);
          }}
          onFocus={() => setShowResults(searchTerm.length >= 2)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          className="pl-10 w-80"
        />
      </div>

      {showResults && searchResults.length > 0 && (
        <Card className="absolute top-full mt-2 w-96 max-h-96 overflow-y-auto z-50 shadow-lg">
          <CardContent className="p-2">
            {searchResults.map((result) => (
              <div
                key={`${result.type}-${result.id}`}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-md cursor-pointer"
                onClick={() => {
                  // Handle result selection
                  console.log('Selected:', result);
                  setShowResults(false);
                  setSearchTerm('');
                }}
              >
                <div className="flex-shrink-0">
                  {getIcon(result.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {result.title}
                    </p>
                    <Badge className={`text-xs ${getStatusColor(result.type, result.status)}`}>
                      {result.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
                  <p className="text-xs text-gray-400 capitalize">{result.type}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {showResults && searchResults.length === 0 && searchTerm.length >= 2 && (
        <Card className="absolute top-full mt-2 w-96 z-50 shadow-lg">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500">No results found for "{searchTerm}"</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
