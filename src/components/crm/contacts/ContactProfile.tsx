import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Mail, 
  Phone, 
  Building2, 
  Edit,
  Calendar,
  Activity,
  Target,
  MessageSquare,
  PhoneCall,
  Ban,
  User,
  Briefcase
} from 'lucide-react';
import { Contact } from '@/services/crm/crmService';
import { CRMService } from '@/services/crm/crmService';
import { formatDate } from '@/lib/utils';

interface ContactProfileProps {
  contact: Contact;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

const contactStatusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  bounced: 'bg-red-100 text-red-800'
};

const contactMethodColors = {
  email: 'bg-blue-100 text-blue-800',
  phone: 'bg-purple-100 text-purple-800',
  mobile: 'bg-orange-100 text-orange-800'
};

export const ContactProfile: React.FC<ContactProfileProps> = ({ 
  contact, 
  isOpen, 
  onClose, 
  onEdit 
}) => {
  // Fetch the account information if contact has an account
  const { data: account } = useQuery({
    queryKey: ['account', contact.account_id],
    queryFn: () => contact.account_id ? CRMService.getAccounts().then(accounts => 
      accounts.find(acc => acc.id === contact.account_id)
    ) : null,
    enabled: isOpen && !!contact.account_id
  });

  // Fetch related opportunities for this contact
  const { data: opportunities } = useQuery({
    queryKey: ['opportunities', contact.id],
    queryFn: () => CRMService.getOpportunities(),
    enabled: isOpen,
    select: (data) => data.filter(opp => 
      // Filter opportunities that might be related to this contact's account
      account && opp.account_name === account.account_name
    )
  });

  // Fetch recent activities related to this contact
  const { data: activities } = useQuery({
    queryKey: ['activities', contact.id],
    queryFn: () => CRMService.getActivities(),
    enabled: isOpen,
    select: (data) => data.filter(activity => 
      activity.lead_id === contact.converted_from_lead_id
    ).slice(0, 10)
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">
                  {contact.first_name} {contact.last_name}
                </DialogTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className={contactStatusColors[contact.contact_status]}>
                    {contact.contact_status.charAt(0).toUpperCase() + contact.contact_status.slice(1)}
                  </Badge>
                  <Badge variant="outline" className={contactMethodColors[contact.preferred_contact_method]}>
                    Prefers {contact.preferred_contact_method}
                  </Badge>
                  {contact.do_not_call && (
                    <Badge variant="destructive" className="text-xs">
                      Do Not Call
                    </Badge>
                  )}
                  {contact.do_not_email && (
                    <Badge variant="destructive" className="text-xs">
                      Do Not Email
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Contact
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Key Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contact Method</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold capitalize">
                  {contact.preferred_contact_method}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lead Source</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">
                  {contact.lead_source.replace('_', ' ').toUpperCase()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">
                  {contact.last_activity_date ? formatDate(contact.last_activity_date) : 'No activity'}
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{contact.email}</span>
                      {contact.do_not_email && (
                        <span title="Do not email">
                          <Ban className="h-3 w-3 text-red-500" />
                        </span>
                      )}
                    </div>
                    {contact.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{contact.phone}</span>
                        {contact.do_not_call && (
                          <span title="Do not call">
                            <Ban className="h-3 w-3 text-red-500" />
                          </span>
                        )}
                      </div>
                    )}
                    {contact.mobile_phone && (
                      <div className="flex items-center space-x-2">
                        <PhoneCall className="h-4 w-4 text-muted-foreground" />
                        <span>{contact.mobile_phone}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Created:</span>
                      <span className="text-sm">{formatDate(contact.created_at)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Professional Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Professional Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {contact.title && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Title:</span>
                        <span className="text-sm">{contact.title}</span>
                      </div>
                    )}
                    {contact.department && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Department:</span>
                        <span className="text-sm">{contact.department}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Lead Source:</span>
                      <span className="text-sm">{contact.lead_source.replace('_', ' ')}</span>
                    </div>
                    {contact.converted_from_lead_id && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Converted from Lead:</span>
                        <span className="text-sm">Yes</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Notes */}
              {contact.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-line">{contact.notes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="account" className="space-y-4">
              {account ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-lg">{account.account_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {account.industry && `${account.industry} • `}
                          {account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)}
                        </div>
                        {account.website && (
                          <div className="text-sm text-blue-600 mt-1">
                            <a 
                              href={account.website.startsWith('http') ? account.website : `https://${account.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              {account.website}
                            </a>
                          </div>
                        )}
                      </div>
                      <Badge className={account.account_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {account.account_status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No account associated with this contact</p>
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
                                ${opportunity.value.toLocaleString()} • {opportunity.probability}% probability
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
                    <p className="text-muted-foreground">No opportunities found for this contact</p>
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
                    <p className="text-muted-foreground">No recent activities found for this contact</p>
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