
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Search, User, Building, Target, Phone } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { CRMService } from '@/services/crm/crmService';
import { useDebounce } from '@/hooks/useDebounce';

export function CRMGlobalSearch() {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['crm-global-search', debouncedSearchTerm],
    queryFn: () => CRMService.globalSearch(debouncedSearchTerm),
    enabled: debouncedSearchTerm.length >= 2
  });

  const handleSelect = (type: string, item: any) => {
    console.log(`Selected ${type}:`, item);
    setOpen(false);
    setSearchTerm('');
    // Here you would navigate to the selected record or open its detail modal
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'converted': return 'bg-purple-100 text-purple-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'prospect': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[300px] justify-start text-left font-normal"
        >
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          {searchTerm || "Search leads, contacts, accounts..."}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search CRM records..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList className="max-h-[300px]">
            {isLoading && debouncedSearchTerm && (
              <CommandEmpty>Searching...</CommandEmpty>
            )}
            
            {!searchResults && debouncedSearchTerm.length >= 2 && !isLoading && (
              <CommandEmpty>No results found.</CommandEmpty>
            )}

            {searchResults?.leads && searchResults.leads.length > 0 && (
              <CommandGroup heading="Leads">
                {searchResults.leads.map((lead) => (
                  <CommandItem
                    key={lead.id}
                    onSelect={() => handleSelect('lead', lead)}
                    className="flex items-center justify-between p-3"
                  >
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="font-medium">
                          {lead.first_name} {lead.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {lead.email} • {lead.company_name || 'Individual'}
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(lead.lead_status)}>
                      {lead.lead_status}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {searchResults?.contacts && searchResults.contacts.length > 0 && (
              <CommandGroup heading="Contacts">
                {searchResults.contacts.map((contact) => (
                  <CommandItem
                    key={contact.id}
                    onSelect={() => handleSelect('contact', contact)}
                    className="flex items-center justify-between p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-green-600" />
                      <div>
                        <div className="font-medium">
                          {contact.first_name} {contact.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {contact.email} • {contact.title || 'Contact'}
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(contact.contact_status)}>
                      {contact.contact_status}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {searchResults?.accounts && searchResults.accounts.length > 0 && (
              <CommandGroup heading="Accounts">
                {searchResults.accounts.map((account) => (
                  <CommandItem
                    key={account.id}
                    onSelect={() => handleSelect('account', account)}
                    className="flex items-center justify-between p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Building className="h-4 w-4 text-purple-600" />
                      <div>
                        <div className="font-medium">{account.account_name}</div>
                        <div className="text-sm text-gray-500">
                          {account.industry || 'Account'} • {account.account_type}
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(account.account_status)}>
                      {account.account_status}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {searchResults?.opportunities && searchResults.opportunities.length > 0 && (
              <CommandGroup heading="Opportunities">
                {searchResults.opportunities.map((opportunity) => (
                  <CommandItem
                    key={opportunity.id}
                    onSelect={() => handleSelect('opportunity', opportunity)}
                    className="flex items-center justify-between p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Target className="h-4 w-4 text-orange-600" />
                      <div>
                        <div className="font-medium">{opportunity.opportunity_name}</div>
                        <div className="text-sm text-gray-500">
                          ${opportunity.estimated_value?.toLocaleString()} • {opportunity.stage}
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(opportunity.stage)}>
                      {opportunity.stage}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
