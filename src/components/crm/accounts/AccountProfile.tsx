
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  Edit, 
  Globe, 
  Phone, 
  Mail, 
  MapPin, 
  Users, 
  DollarSign,
  Calendar,
  Activity
} from 'lucide-react';
import { CRMService } from '@/services/crm/enhancedCRMService';
import type { Account } from '@/types/crm';
import { formatCurrency, formatDate } from '@/lib/utils';

interface AccountProfileProps {
  account: Account;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

const accountTypeColors = {
  prospect: 'bg-blue-100 text-blue-800',
  customer: 'bg-green-100 text-green-800',
  partner: 'bg-purple-100 text-purple-800',
  competitor: 'bg-red-100 text-red-800'
};

const accountStatusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800'
};

export const AccountProfile: React.FC<AccountProfileProps> = ({
  account,
  isOpen,
  onClose,
  onEdit
}) => {
  // Get related data for the account
  const { data: relatedContacts } = useQuery({
    queryKey: ['contacts', account.id],
    queryFn: () => CRMService.getContacts({ account_id: account.id }),
    enabled: isOpen
  });

  const { data: relatedOpportunities } = useQuery({
    queryKey: ['opportunities', account.id],
    queryFn: () => CRMService.getOpportunities({ account_id: account.id }),
    enabled: isOpen
  });

  const totalOpportunityValue = relatedOpportunities?.reduce(
    (sum, opp) => sum + (opp.estimated_value || 0), 
    0
  ) || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Building2 className="h-6 w-6" />
            {account.account_name}
            <div className="flex items-center gap-2 ml-auto">
              <Badge className={accountTypeColors[account.account_type]}>
                {account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)}
              </Badge>
              {account.account_status && (
                <Badge className={accountStatusColors[account.account_status]}>
                  {account.account_status.charAt(0).toUpperCase() + account.account_status.slice(1)}
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contacts</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{relatedContacts?.length || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Opportunities</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{relatedOpportunities?.length || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalOpportunityValue)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Account Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Industry</label>
                    <p className="text-sm">{account.industry || 'Not specified'}</p>
                  </div>

                  {account.company_size && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Company Size</label>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{account.company_size}</span>
                      </div>
                    </div>
                  )}

                  {account.annual_revenue && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Annual Revenue</label>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{formatCurrency(account.annual_revenue)}</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatDate(account.created_at)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {account.website && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Website</label>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={account.website.startsWith('http') ? account.website : `https://${account.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {account.website}
                        </a>
                      </div>
                    </div>
                  )}

                  {account.phone && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Phone</label>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{account.phone}</span>
                      </div>
                    </div>
                  )}

                  {account.billing_address && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Billing Address</label>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span className="text-sm">{account.billing_address}</span>
                      </div>
                    </div>
                  )}

                  {account.shipping_address && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Shipping Address</label>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span className="text-sm">{account.shipping_address}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          {account.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{account.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Related Data */}
          <div className="space-y-4">
            <Separator />
            
            {/* Related Contacts */}
            {relatedContacts && relatedContacts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Related Contacts ({relatedContacts.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {relatedContacts.slice(0, 5).map((contact) => (
                      <div key={contact.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium text-sm">
                              {contact.first_name} {contact.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">{contact.email}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {contact.contact_status}
                        </Badge>
                      </div>
                    ))}
                    {relatedContacts.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        +{relatedContacts.length - 5} more contacts
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Related Opportunities */}
            {relatedOpportunities && relatedOpportunities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Related Opportunities ({relatedOpportunities.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {relatedOpportunities.slice(0, 5).map((opportunity) => (
                      <div key={opportunity.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium text-sm">{opportunity.opportunity_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(opportunity.estimated_value)} • {opportunity.probability}% probability
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {opportunity.stage}
                        </Badge>
                      </div>
                    ))}
                    {relatedOpportunities.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        +{relatedOpportunities.length - 5} more opportunities
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Account
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
