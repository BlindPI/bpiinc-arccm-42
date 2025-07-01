
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Phone, Mail, MessageSquare } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { CRMService } from '@/services/crm/crmService';

interface ContactActivitiesTabProps {
  contactId: string;
}

export function ContactActivitiesTab({ contactId }: ContactActivitiesTabProps) {
  const [showActivityForm, setShowActivityForm] = useState(false);

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['contact-activities', contactId],
    queryFn: () => CRMService.getActivities()
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      case 'note': return <MessageSquare className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return <div>Loading activities...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Activities</h3>
        <Button onClick={() => setShowActivityForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Log Activity
        </Button>
      </div>

      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No activities yet</p>
            <p className="text-sm">Start logging activities to track interactions</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-4 border rounded-lg">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                {getActivityIcon(activity.activity_type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{activity.subject}</h4>
                  <span className="text-sm text-gray-500">
                    {new Date(activity.activity_date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <span className="capitalize">{activity.activity_type}</span>
                  <span>•</span>
                  <span className="capitalize">{activity.status}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
