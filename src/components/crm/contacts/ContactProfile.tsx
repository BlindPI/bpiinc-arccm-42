
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  Activity,
  DollarSign,
  Edit,
  MessageSquare,
  PhoneCall,
  Video
} from 'lucide-react';
import { CRMService } from '@/services/crm/crmService';
import type { Contact, Activity as ActivityType, Opportunity } from '@/types/crm';
import { formatDate, formatCurrency } from '@/lib/utils';

interface ContactProfileProps {
  contactId: string;
  onEdit?: () => void;
  className?: string;
}

export const ContactProfile: React.FC<ContactProfileProps> = ({
  contactId,
  onEdit,
  className
}) => {
  const { data: contacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => CRMService.getContacts()
  });

  const { data: activities } = useQuery({
    queryKey: ['activities'],
    queryFn: () => CRMService.getActivities()
  });

  const { data: opportunities } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => CRMService.getOpportunities()
  });

  const contact = contacts?.find(c => c.id === contactId);
  const contactActivities = activities?.filter(a => a.lead_id === contactId) || [];
  const contactOpportunities = opportunities?.filter(o => o.account_id === contact?.account_id) || [];

  if (!contact) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Contact not found
          </div>
        </CardContent>
      </Card>
    );
  }

  const contactStatusColors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    bounced: 'bg-red-100 text-red-800'
  };

  const totalOpportunityValue = contactOpportunities.reduce(
    (sum, opp) => sum + opp.estimated_value,
    0
  );

  const recentActivities = contactActivities
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">
                  {contact.first_name} {contact.last_name}
                </CardTitle>
                <CardDescription className="text-base">
                  {contact.title || 'No title'} {contact.department && `• ${contact.department}`}
                </CardDescription>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={contactStatusColors[contact.contact_status]}>
                    {contact.contact_status.charAt(0).toUpperCase() + contact.contact_status.slice(1)}
                  </Badge>
                  {contact.lead_source && (
                    <Badge variant="outline">
                      {contact.lead_source.replace('_', ' ').toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                Email
              </Button>
              <Button variant="outline" size="sm">
                <PhoneCall className="h-4 w-4 mr-2" />
                Call
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{contact.email}</div>
                      <div className="text-sm text-muted-foreground">
                        {contact.do_not_email ? 'No email communications' : 'Email allowed'}
                      </div>
                    </div>
                  </div>
                  
                  {contact.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{contact.phone}</div>
                        <div className="text-sm text-muted-foreground">Work Phone</div>
                      </div>
                    </div>
                  )}
                  
                  {contact.mobile_phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{contact.mobile_phone}</div>
                        <div className="text-sm text-muted-foreground">Mobile Phone</div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  {contact.account_id && (
                    <div className="flex items-center space-x-3">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Account ID: {contact.account_id}</div>
                        <div className="text-sm text-muted-foreground">Organization</div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{formatDate(contact.created_at)}</div>
                      <div className="text-sm text-muted-foreground">First Contact</div>
                    </div>
                  </div>
                  
                  {contact.last_activity_date && (
                    <div className="flex items-center space-x-3">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{formatDate(contact.last_activity_date)}</div>
                        <div className="text-sm text-muted-foreground">Last Activity</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {contact.notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Notes</h4>
                    <p className="text-sm text-muted-foreground">{contact.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Activities</CardTitle>
                <Button variant="outline" size="sm">
                  <Activity className="h-4 w-4 mr-2" />
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <Activity className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {activity.activity_type.toUpperCase()}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(activity.created_at)}
                          </span>
                        </div>
                        <p className="font-medium">{activity.subject}</p>
                        {activity.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {activity.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No activities recorded
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Activities</span>
                <span className="font-medium">{contactActivities.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Opportunities</span>
                <span className="font-medium">{contactOpportunities.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Potential Value</span>
                <span className="font-medium">{formatCurrency(totalOpportunityValue)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Preferred Contact</span>
                <span className="font-medium capitalize">
                  {contact.preferred_contact_method || 'Email'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Related Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle>Related Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              {contactOpportunities.length > 0 ? (
                <div className="space-y-3">
                  {contactOpportunities.slice(0, 3).map((opportunity) => (
                    <div key={opportunity.id} className="p-3 border rounded-lg">
                      <div className="font-medium text-sm line-clamp-1">
                        {opportunity.opportunity_name}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(opportunity.estimated_value)}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {opportunity.stage}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {contactOpportunities.length > 3 && (
                    <Button variant="outline" size="sm" className="w-full">
                      View All ({contactOpportunities.length})
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  No opportunities
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
