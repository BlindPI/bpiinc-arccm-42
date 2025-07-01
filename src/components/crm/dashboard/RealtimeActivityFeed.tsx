
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Activity, 
  Phone, 
  Mail, 
  Calendar, 
  FileText, 
  Filter,
  Search,
  Clock
} from 'lucide-react';
import type { Activity as ActivityType } from '@/types/crm';

interface RealtimeActivityFeedProps {
  activities: ActivityType[];
  showFilters?: boolean;
}

export function RealtimeActivityFeed({ activities, showFilters = false }: RealtimeActivityFeedProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'meeting':
        return <Calendar className="h-4 w-4" />;
      case 'note':
        return <FileText className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'call':
        return 'bg-blue-100 text-blue-800';
      case 'email':
        return 'bg-green-100 text-green-800';
      case 'meeting':
        return 'bg-purple-100 text-purple-800';
      case 'note':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredActivities = activities
    .filter(activity => {
      if (filterType !== 'all' && activity.activity_type !== filterType) return false;
      if (searchTerm && !activity.subject.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .slice(0, 20);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activities
              <Badge variant="secondary" className="ml-2">
                Live
              </Badge>
            </CardTitle>
            <CardDescription>
              Real-time activity feed across all CRM entities
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-muted-foreground">Auto-updating</span>
          </div>
        </div>

        {showFilters && (
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Types</option>
                <option value="call">Calls</option>
                <option value="email">Emails</option>
                <option value="meeting">Meetings</option>
                <option value="note">Notes</option>
                <option value="task">Tasks</option>
              </select>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {filteredActivities.length > 0 ? (
            filteredActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`p-2 rounded-full ${getActivityColor(activity.activity_type)}`}>
                  {getActivityIcon(activity.activity_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium truncate">{activity.subject}</h4>
                    <Badge variant="outline" className="ml-2">
                      {activity.activity_type}
                    </Badge>
                  </div>
                  {activity.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {activity.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(activity.activity_date).toLocaleString()}
                    </div>
                    {activity.completed && (
                      <Badge variant="success" className="text-xs">
                        Completed
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No activities found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
