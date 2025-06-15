
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Phone, 
  Mail, 
  Calendar, 
  FileText,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { EnhancedCRMService } from '@/services/crm/enhancedCRMService';

interface LeadActivitiesTabProps {
  leadId: string;
}

export function LeadActivitiesTab({ leadId }: LeadActivitiesTabProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: activities = [] } = useQuery({
    queryKey: ['lead-activities', leadId],
    queryFn: () => EnhancedCRMService.getActivities()
  });

  const leadActivities = activities.filter(activity => activity.lead_id === leadId);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      case 'note': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Activities & Timeline</h3>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Log Activity
        </Button>
      </div>

      {/* Activities Timeline */}
      <div className="space-y-4">
        {leadActivities.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-500">No activities yet</p>
              <p className="text-sm text-gray-400 mb-4">Start logging activities to track engagement</p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Log First Activity
              </Button>
            </CardContent>
          </Card>
        ) : (
          leadActivities
            .sort((a, b) => new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime())
            .map((activity) => (
              <Card key={activity.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-blue-50">
                        {getActivityIcon(activity.activity_type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">{activity.subject}</h4>
                          <Badge className={getStatusColor(activity.status || 'completed')}>
                            {activity.status || 'completed'}
                          </Badge>
                          {activity.priority && (
                            <Badge variant="outline" className={getPriorityColor(activity.priority)}>
                              {activity.priority}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(activity.activity_date).toLocaleString()}
                          </span>
                          <span className="capitalize">{activity.activity_type}</span>
                          {activity.completed && (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              Completed
                            </span>
                          )}
                        </div>
                        
                        {activity.outcome && (
                          <div className="mt-2 p-2 bg-gray-50 rounded">
                            <p className="text-xs text-gray-600">
                              <strong>Outcome:</strong> {activity.outcome}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>
    </div>
  );
}
