
import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  useNotificationTypes, 
  useNotificationPreferences, 
  useUpdateNotificationPreferences,
  useNotificationDigests,
  useUpdateNotificationDigest
} from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Bell, 
  Mail, 
  BellRing,
  Clock,
  CalendarDays
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { NotificationCategory } from '@/types/notifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Group notification types by category
const groupByCategory = (types: any[]) => {
  if (!Array.isArray(types)) return {};
  return types.reduce((acc, type) => {
    if (!acc[type.category]) {
      acc[type.category] = [];
    }
    acc[type.category].push(type);
    return acc;
  }, {} as Record<string, any[]>);
};

// Get icon for category
const getCategoryIcon = (category: NotificationCategory) => {
  switch (category) {
    case 'GENERAL':
      return <Bell className="h-5 w-5 text-gray-500" />;
    case 'CERTIFICATE':
      return <BellRing className="h-5 w-5 text-blue-500" />;
    case 'COURSE':
      return <CalendarDays className="h-5 w-5 text-green-500" />;
    case 'ACCOUNT':
      return <Bell className="h-5 w-5 text-purple-500" />;
    case 'ROLE_MANAGEMENT':
      return <Bell className="h-5 w-5 text-amber-500" />;
    case 'SUPERVISION':
      return <Bell className="h-5 w-5 text-indigo-500" />;
    case 'INSTRUCTOR':
      return <Bell className="h-5 w-5 text-cyan-500" />;
    case 'PROVIDER':
      return <Bell className="h-5 w-5 text-emerald-500" />;
    case 'SYSTEM':
      return <Bell className="h-5 w-5 text-red-500" />;
    default:
      return <Bell className="h-5 w-5 text-gray-500" />;
  }
};

export function NotificationPreferencesPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('notifications');
  const [digestTime, setDigestTime] = useState('08:00');
  const [digestDay, setDigestDay] = useState('1');
  const [updatingPreferences, setUpdatingPreferences] = useState<Record<string, boolean>>({});
  
  const { data: notificationTypes = [], isLoading: typesLoading } = useNotificationTypes();
  const { data: preferences = [], isLoading: prefsLoading } = useNotificationPreferences();
  const { data: digests = [], isLoading: digestsLoading } = useNotificationDigests();
  
  const updatePreference = useUpdateNotificationPreferences();
  const updateDigest = useUpdateNotificationDigest();
  
  // Debug logging
  useEffect(() => {
    console.log('NotificationPreferencesPanel - Data loaded:', {
      notificationTypes: notificationTypes?.length || 0,
      preferences: preferences?.length || 0,
      digests: digests?.length || 0,
      user: user?.id
    });
  }, [notificationTypes, preferences, digests, user]);
  
  // Group notification types by category
  const typesByCategory = groupByCategory(notificationTypes);
  
  // Handle preference toggle with proper debugging
  const handleToggle = async (typeId: string, category: string, field: 'in_app_enabled' | 'email_enabled' | 'browser_enabled', value: boolean) => {
    if (!user?.id) {
      console.error('No user ID available for preference update');
      return;
    }
    
    console.log('handleToggle called:', {
      typeId,
      category,
      field,
      value,
      userId: user.id
    });
    
    const updateKey = `${typeId}-${field}`;
    setUpdatingPreferences(prev => ({ ...prev, [updateKey]: true }));
    
    try {
      await updatePreference.mutateAsync({
        userId: user.id,
        notificationTypeId: typeId,
        updates: { [field]: value }
      });
      
      console.log('Preference update successful:', { typeId, field, value });
      toast.success('Preference updated successfully');
    } catch (error) {
      console.error('Failed to update preference:', error);
      toast.error('Failed to update preference');
    } finally {
      setUpdatingPreferences(prev => ({ ...prev, [updateKey]: false }));
    }
  };
  
  // Get preference for a notification type by category
  const getPreference = (typeCategory: string) => {
    const pref = preferences.find(p => p.category === typeCategory);
    console.log('getPreference for category:', typeCategory, 'found:', pref);
    return pref;
  };
  
  // Handle digest settings update
  const handleDigestUpdate = (type: 'daily' | 'weekly', enabled: boolean) => {
    const digest = digests.find(d => d.digest_type === type);
    if (!digest) {
      console.error('No digest found for type:', type);
      return;
    }
    
    console.log('handleDigestUpdate:', { type, enabled, digest });
    
    // Calculate next scheduled time
    let nextScheduled = new Date();
    
    if (type === 'daily') {
      // Parse time
      const [hours, minutes] = digestTime.split(':').map(Number);
      nextScheduled.setHours(hours, minutes, 0, 0);
      
      // If time has already passed today, schedule for tomorrow
      if (nextScheduled < new Date()) {
        nextScheduled.setDate(nextScheduled.getDate() + 1);
      }
    } else if (type === 'weekly') {
      // Parse day (0-6, Sunday-Saturday)
      const day = parseInt(digestDay);
      
      // Set to the specified time
      const [hours, minutes] = digestTime.split(':').map(Number);
      nextScheduled.setHours(hours, minutes, 0, 0);
      
      // Calculate days until the next occurrence of the specified day
      const currentDay = nextScheduled.getDay();
      const daysUntilNext = (day - currentDay + 7) % 7;
      
      // If it's the same day but the time has passed, add 7 days
      if (daysUntilNext === 0 && nextScheduled < new Date()) {
        nextScheduled.setDate(nextScheduled.getDate() + 7);
      } else {
        nextScheduled.setDate(nextScheduled.getDate() + daysUntilNext);
      }
    }
    
    updateDigest.mutate({
      digestType: type,
      isEnabled: enabled,
      nextScheduledAt: nextScheduled.toISOString()
    });
  };
  
  // Get digest settings
  const getDailyDigest = () => digests.find(d => d.digest_type === 'daily');
  const getWeeklyDigest = () => digests.find(d => d.digest_type === 'weekly');
  
  if (typesLoading || prefsLoading || digestsLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="notifications" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notifications">Notification Types</TabsTrigger>
          <TabsTrigger value="digests">Email Digests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="notifications" className="space-y-6 pt-4">
          {Object.entries(typesByCategory).map(([category, types]) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-2">
                {getCategoryIcon(category as NotificationCategory)}
                <h3 className="text-lg font-semibold">{category}</h3>
              </div>
              
              <div className="space-y-4 rounded-md border p-4">
                {Array.isArray(types) && types.map(type => {
                  const pref = getPreference(type.category);
                  return (
                    <div key={type.id} className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-medium">{type.display_name}</h4>
                          <p className="text-xs text-muted-foreground">{type.description}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`${type.id}-in-app`}
                            checked={pref?.in_app_enabled ?? true}
                            disabled={updatingPreferences[`${type.id}-in_app_enabled`]}
                            onCheckedChange={(checked) => handleToggle(type.id, type.category, 'in_app_enabled', checked)}
                          />
                          <Label htmlFor={`${type.id}-in-app`} className="flex flex-col">
                            <span>In-App</span>
                            <span className="font-normal text-xs text-muted-foreground">Show in app</span>
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`${type.id}-email`}
                            checked={pref?.email_enabled ?? type.requires_email}
                            disabled={updatingPreferences[`${type.id}-email_enabled`]}
                            onCheckedChange={(checked) => handleToggle(type.id, type.category, 'email_enabled', checked)}
                          />
                          <Label htmlFor={`${type.id}-email`} className="flex flex-col">
                            <span>Email</span>
                            <span className="font-normal text-xs text-muted-foreground">Send email</span>
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`${type.id}-browser`}
                            checked={pref?.browser_enabled ?? false}
                            disabled={updatingPreferences[`${type.id}-browser_enabled`]}
                            onCheckedChange={(checked) => handleToggle(type.id, type.category, 'browser_enabled', checked)}
                          />
                          <Label htmlFor={`${type.id}-browser`} className="flex flex-col">
                            <span>Browser</span>
                            <span className="font-normal text-xs text-muted-foreground">Show browser notification</span>
                          </Label>
                        </div>
                      </div>
                      
                      <Separator className="my-2" />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </TabsContent>
        
        <TabsContent value="digests" className="space-y-6 pt-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-semibold">Email Digest Settings</h3>
            </div>
            
            <div className="space-y-6 rounded-md border p-4">
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Digest Schedule</h4>
                <p className="text-xs text-muted-foreground">
                  Configure when you want to receive email digests of your notifications.
                  Digests will include all non-urgent notifications that you haven't read.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <div>
                        <h5 className="text-sm font-medium">Daily Digest</h5>
                        <p className="text-xs text-muted-foreground">Receive a daily summary of notifications</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        id="daily-digest"
                        checked={getDailyDigest()?.is_enabled ?? false}
                        onCheckedChange={(checked) => handleDigestUpdate('daily', checked)}
                      />
                      <Input
                        type="time"
                        value={digestTime}
                        onChange={(e) => setDigestTime(e.target.value)}
                        className="w-24"
                        disabled={!getDailyDigest()?.is_enabled}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-green-500" />
                      <div>
                        <h5 className="text-sm font-medium">Weekly Digest</h5>
                        <p className="text-xs text-muted-foreground">Receive a weekly summary of notifications</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        id="weekly-digest"
                        checked={getWeeklyDigest()?.is_enabled ?? false}
                        onCheckedChange={(checked) => handleDigestUpdate('weekly', checked)}
                      />
                      <Select
                        value={digestDay}
                        onValueChange={setDigestDay}
                        disabled={!getWeeklyDigest()?.is_enabled}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Sunday</SelectItem>
                          <SelectItem value="1">Monday</SelectItem>
                          <SelectItem value="2">Tuesday</SelectItem>
                          <SelectItem value="3">Wednesday</SelectItem>
                          <SelectItem value="4">Thursday</SelectItem>
                          <SelectItem value="5">Friday</SelectItem>
                          <SelectItem value="6">Saturday</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="time"
                        value={digestTime}
                        onChange={(e) => setDigestTime(e.target.value)}
                        className="w-24"
                        disabled={!getWeeklyDigest()?.is_enabled}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    if (getDailyDigest()?.is_enabled) {
                      handleDigestUpdate('daily', true);
                    }
                    if (getWeeklyDigest()?.is_enabled) {
                      handleDigestUpdate('weekly', true);
                    }
                    toast.success('Digest settings updated');
                  }}
                >
                  Save Digest Settings
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
