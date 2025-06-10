
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building, 
  Mail, 
  Phone, 
  Globe, 
  Users, 
  DollarSign,
  Edit,
  Trash2
} from 'lucide-react';
import { EnhancedCRMService } from '@/services/crm/enhancedCRMService';
import { formatCurrency, formatDate } from '@/lib/utils';

interface AccountProfileProps {
  accountId: string;
  onEdit?: (accountId: string) => void;
  onDelete?: (accountId: string) => void;
}

export function AccountProfile({ accountId, onEdit, onDelete }: AccountProfileProps) {
  const { data: account, isLoading: accountLoading } = useQuery({
    queryKey: ['crm-account', accountId],
    queryFn: () => EnhancedCRMService.getAccountWithContacts(accountId)
  });

  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ['crm-contacts', accountId],
    queryFn: () => EnhancedCRMService.getContacts({ accountId })
  });

  const { data: opportunities = [], isLoading: opportunitiesLoading } = useQuery({
    queryKey: ['crm-opportunities', accountId],
    queryFn: () => EnhancedCRMService.getOpportunities({ accountId })
  });

  if (accountLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-20 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-40 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Account not found</p>
      </div>
    );
  }

  const totalOpportunityValue = opportunities.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0);

  return (
    <div className="space-y-6">
      {/* Account Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{account.account_name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={account.account_status === 'active' ? 'default' : 'secondary'}>
                    {account.account_status}
                  </Badge>
                  <Badge variant="outline">{account.account_type}</Badge>
                  {account.industry && (
                    <Badge variant="outline">{account.industry}</Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={() => onEdit(accountId)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button variant="outline" size="sm" onClick={() => onDelete(accountId)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Contact Information */}
            <div>
              <h3 className="font-semibold mb-3">Contact Information</h3>
              <div className="space-y-2">
                {account.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{account.phone}</span>
                  </div>
                )}
                {account.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={account.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {account.website}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Business Information */}
            <div>
              <h3 className="font-semibold mb-3">Business Information</h3>
              <div className="space-y-2">
                {account.company_size && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Company Size:</span> {account.company_size}
                  </div>
                )}
                {account.annual_revenue && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Annual Revenue:</span> {formatCurrency(account.annual_revenue)}
                  </div>
                )}
                <div className="text-sm">
                  <span className="text-muted-foreground">Created:</span> {formatDate(account.created_at)}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div>
              <h3 className="font-semibold mb-3">Quick Stats</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{contacts.length} Contacts</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{opportunities.length} Opportunities</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Pipeline Value:</span> {formatCurrency(totalOpportunityValue)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Related Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Contacts ({contacts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contactsLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : contacts.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No contacts found</p>
            ) : (
              <div className="space-y-3">
                {contacts.slice(0, 5).map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{contact.first_name} {contact.last_name}</p>
                      <p className="text-sm text-muted-foreground">{contact.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{contact.email}</span>
                      </div>
                    </div>
                    <Badge variant={contact.contact_status === 'active' ? 'default' : 'secondary'}>
                      {contact.contact_status}
                    </Badge>
                  </div>
                ))}
                {contacts.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center">
                    +{contacts.length - 5} more contacts
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Opportunities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Opportunities ({opportunities.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {opportunitiesLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : opportunities.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No opportunities found</p>
            ) : (
              <div className="space-y-3">
                {opportunities.slice(0, 5).map((opportunity) => (
                  <div key={opportunity.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{opportunity.opportunity_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(opportunity.estimated_value)}
                      </p>
                      {opportunity.expected_close_date && (
                        <p className="text-xs text-muted-foreground">
                          Expected: {formatDate(opportunity.expected_close_date)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{opportunity.stage}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {opportunity.probability}% probability
                      </p>
                    </div>
                  </div>
                ))}
                {opportunities.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center">
                    +{opportunities.length - 5} more opportunities
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
