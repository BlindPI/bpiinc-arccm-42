
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityLogProps {
  userId: string | undefined;
  className?: string;
  limit?: number;
}

interface ActivityItem {
  id: string;
  user_id: string;
  action_type: string;
  action_description: string;
  created_at: string;
}

export function ActivityLog({ userId, className, limit = 5 }: ActivityLogProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchActivities = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Note: This is a mock implementation as we don't have an actual activity_logs table
        // In a real implementation, you would fetch from a table like:
        // const { data, error } = await supabase
        //   .from('activity_logs')
        //   .select('*')
        //   .eq('user_id', userId)
        //   .order('created_at', { ascending: false })
        //   .limit(limit);
        
        // Mock data for demonstration purposes
        const mockActivities = [
          {
            id: '1',
            user_id: userId,
            action_type: 'login',
            action_description: 'Logged in successfully',
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            user_id: userId,
            action_type: 'profile_update',
            action_description: 'Updated profile information',
            created_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
          },
          {
            id: '3',
            user_id: userId,
            action_type: 'password_change',
            action_description: 'Changed account password',
            created_at: new Date(Date.now() - 172800000).toISOString() // 2 days ago
          }
        ];
        
        setActivities(mockActivities);
      } catch (error) {
        console.error("Error fetching activity log:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivities();
  }, [userId, limit]);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString();
  };
  
  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case 'login':
        return <div className="h-2 w-2 rounded-full bg-green-500" />;
      case 'logout':
        return <div className="h-2 w-2 rounded-full bg-gray-500" />;
      case 'profile_update':
        return <div className="h-2 w-2 rounded-full bg-blue-500" />;
      case 'password_change':
        return <div className="h-2 w-2 rounded-full bg-yellow-500" />;
      default:
        return <div className="h-2 w-2 rounded-full bg-gray-500" />;
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-md font-medium">Recent Activity</h4>
      </div>
      
      <div className="border rounded-md">
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">
            Loading activity log...
          </div>
        ) : activities.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No recent activity found
          </div>
        ) : (
          <ul className="divide-y">
            {activities.map((activity) => (
              <li key={activity.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getActivityIcon(activity.action_type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {activity.action_description}
                    </p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(activity.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(activity.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="flex justify-center">
        <Button variant="outline" size="sm">
          View All Activity
        </Button>
      </div>
    </div>
  );
}
