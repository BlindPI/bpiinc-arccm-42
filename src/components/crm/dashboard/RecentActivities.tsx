import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { crmActivityService } from '@/services/crm';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import {
  Phone,
  Mail,
  Calendar,
  FileText,
  Users,
  MessageSquare,
  ExternalLink
} from 'lucide-react';

export const RecentActivities: React.FC = () => {
  const { data: activities, isLoading, error } = useQuery({
    queryKey: ['crm', 'recent-activities'],
    queryFn: async () => {
      const response = await crmActivityService.getActivities({}, 1, 10);
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch activities');
      }
      return response.data.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return Phone;
      case 'email': return Mail;
      case 'meeting': return Calendar;
      case 'demo': return Users;
      case 'proposal': return FileText;
      case 'follow_up': return MessageSquare;
      default: return MessageSquare;
    }
  };

  const getOutcomeBadge = (outcome?: string) => {
    switch (outcome) {
      case 'positive':
        return <Badge variant="default" className="bg-green-100 text-green-800">Positive</Badge>;
      case 'neutral':
        return <Badge variant="secondary">Neutral</Badge>;
      case 'negative':
        return <Badge variant="destructive">Negative</Badge>;
      case 'no_response':
        return <Badge variant="outline">No Response</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>Latest sales activities and interactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>Latest sales activities and interactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            Failed to load activities
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
        <CardDescription>Latest sales activities and interactions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities && activities.length > 0 ? (
            activities.map((activity) => {
              const Icon = getActivityIcon(activity.activity_type);
              const timeAgo = formatDistanceToNow(new Date(activity.activity_date), { addSuffix: true });
              
              return (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {activity.subject}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.activity_type.charAt(0).toUpperCase() + activity.activity_type.slice(1)} • {timeAgo}
                        </p>
                        {activity.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {activity.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-2">
                        {activity.outcome && getOutcomeBadge(activity.outcome)}
                        {activity.duration_minutes && (
                          <span className="text-xs text-muted-foreground">
                            {activity.duration_minutes}m
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {activity.follow_up_required && activity.follow_up_date && (
                      <div className="mt-2 p-2 bg-yellow-50 rounded text-xs">
                        <span className="text-yellow-800">
                          Follow-up required: {formatDistanceToNow(new Date(activity.follow_up_date), { addSuffix: true })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent activities found</p>
              <p className="text-xs mt-1">Activities will appear here as they are logged</p>
            </div>
          )}
        </div>
        
        {activities && activities.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" size="sm" className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              View All Activities
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};