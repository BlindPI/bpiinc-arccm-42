import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  Users, 
  DollarSign, 
  Globe, 
  Phone, 
  MapPin, 
  Edit,
  Mail,
  Calendar,
  TrendingUp,
  Target,
  Activity
} from 'lucide-react';
import { Account } from '@/services/crm/crmService';
import { CRMService } from '@/services/crm/crmService';
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
  inactive: 'bg-gray-100 text-gray-800',
  suspended: 'bg-red-100 text-red-800'
};

export const AccountProfile: React.FC<AccountProfileProps> = ({ 
  account, 
  isOpen, 
  onClose, 
  onEdit 
}) => {
  // Fetch related contacts for this account
  const { data: contacts } = useQuery({
    queryKey: ['contacts', account.id],
    queryFn: () => CRMService.getContacts({ account_id: account.id }),
    enabled: isOpen
  });

  // Fetch related opportunities for this account
  const { data: opportunities } = useQuery({
    queryKey: ['opportunities', account.id],
    queryFn: () => CRMService.getOpportunities(),
    enabled: isOpen,
    select: (data) => data.filter(opp => opp.account_name === account.account_name)
  });

  // Fetch recent activities related to this account
  const { data: activities } = useQuery({
    queryKey: ['activities', account.id],
    queryFn: () => CRMService.getActivities(),
    enabled: isOpen,
    select: (data) => data.filter(activity => 
      contacts?.some(contact => 
        activity.lead_id === contact.converted_from_lead_id
      ) || opportunities?.some(opp => 
        activity.opportunity_id === opp.id
      )
    ).slice(0, 10)
  });

  const totalOpportunityValue = opportunities?.reduce((sum, opp) => sum + opp.value, 0) || 0;
  const wonOpportunities = opportunities?.filter(opp => opp.stage === 'closed_won') || [];
  const totalRevenue = wonOpportunities.reduce((sum, opp) => sum + opp.value, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">{account.account_name}</DialogTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className={accountTypeColors[account.account_type]}>
                    {account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)}
                  </Badge>
                  <Badge className={accountStatusColors[account.account_status]}>
                    {account.account_status.charAt(0).toUpperCase() + account.account_status.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
            <Button onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Account
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contacts</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{contacts?.length || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Opportunities</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{opportunities?.length || 0}</div>
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

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Account Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {account.industry && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Industry:</span>
                        <span className="text-sm">{account.industry}</span>
                      </div>
                    )}
                    {account.company_size && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Company Size:</span>
                        <span className="text-sm">{account.company_size}</span>
                      </div>
                    )}
                    {account.annual_revenue && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Annual Revenue:</span>
                        <span className="text-sm">{formatCurrency(account.annual_revenue)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Created:</span>
                      <span className="text-sm">{formatDate(account.created_at)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {account.website && (
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={account.website.startsWith('http') ? account.website : `https://${account.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {account.website}
                        </a>
                      </div>
                    )}
                    {account.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{account.phone}</span>
                      </div>
                    )}
                    {account.billing_address && (
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="text-sm">
                          <div className="font-medium">Billing Address:</div>
                          <div className="whitespace-pre-line">{account.billing_address}</div>
                        </div>
                      </div>
                    )}
                    {account.shipping_address && (
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="text-sm">
                          <div className="font-medium">Shipping Address:</div>
                          <div className="whitespace-pre-line">{account.shipping_address}</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Notes */}
              {account.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-line">{account.notes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="contacts" className="space-y-4">
              {contacts && contacts.length > 0 ? (
                <div className="space-y-4">
                  {contacts.map((contact) => (
                    <Card key={contact.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium">
                                {contact.first_name} {contact.last_name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {contact.title && `${contact.title} • `}
                                {contact.email}
                              </div>
                            </div>
                          </div>
                          <Badge className={contact.contact_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {contact.contact_status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No contacts found for this account</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="opportunities" className="space-y-4">
              {opportunities && opportunities.length > 0 ? (
                <div className="space-y-4">
                  {opportunities.map((opportunity) => (
                    <Card key={opportunity.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                              <Target className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <div className="font-medium">{opportunity.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {formatCurrency(opportunity.value)} • {opportunity.probability}% probability
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">{opportunity.stage}</Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              Close: {formatDate(opportunity.close_date)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Target className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No opportunities found for this account</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="activities" className="space-y-4">
              {activities && activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <Card key={activity.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                            <Activity className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="font-medium">{activity.subject}</div>
                              <div className="text-xs text-muted-foreground">
                                {activity.due_date && formatDate(activity.due_date)}
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                              {activity.description && ` • ${activity.description}`}
                            </div>
                          </div>
                          <Badge variant={activity.completed ? 'default' : 'secondary'}>
                            {activity.completed ? 'Completed' : 'Pending'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No recent activities found for this account</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};