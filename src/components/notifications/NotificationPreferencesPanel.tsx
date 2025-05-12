
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

const NOTIFICATION_CATEGORIES = [
  { id: 'GENERAL', name: 'General notifications', description: 'System announcements and updates' },
  { id: 'CERTIFICATE', name: 'Certificate notifications', description: 'Certificate approvals, rejections and expiry notices' },
  { id: 'COURSE', name: 'Course notifications', description: 'Course enrollment and completion' },
];

interface NotificationPreference {
  id: string;
  user_id: string;
  category: string;
  email_enabled: boolean;
  in_app_enabled: boolean;
  browser_enabled: boolean;
}

export function NotificationPreferencesPanel() {
  const { data: profile } = useProfile();
  const [preferences, setPreferences] = useState<Record<string, NotificationPreference>>({});
  const [loading, setLoading] = useState(true);
  
  // Fetch user preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!profile?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', profile.id);
        
        if (error) throw error;
        
        // Convert array to record with category as key
        const prefsRecord: Record<string, NotificationPreference> = {};
        data?.forEach(pref => {
          prefsRecord[pref.category] = pref;
        });
        
        setPreferences(prefsRecord);
      } catch (error) {
        console.error('Error fetching notification preferences:', error);
        toast.error('Failed to load notification preferences');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPreferences();
  }, [profile?.id]);
  
  // Update a preference
  const updatePreference = async (category: string, field: 'email_enabled' | 'in_app_enabled' | 'browser_enabled', value: boolean) => {
    if (!profile?.id) return;
    
    // Local optimistic update
    setPreferences(prev => {
      const updatedPrefs = { ...prev };
      
      if (updatedPrefs[category]) {
        updatedPrefs[category] = { ...updatedPrefs[category], [field]: value };
      } else {
        updatedPrefs[category] = {
          id: '',
          user_id: profile.id,
          category,
          email_enabled: field === 'email_enabled' ? value : true,
          in_app_enabled: field === 'in_app_enabled' ? value : true,
          browser_enabled: field === 'browser_enabled' ? value : true
        };
      }
      
      return updatedPrefs;
    });
    
    try {
      // Check if preference exists
      if (preferences[category]?.id) {
        // Update existing
        const { error } = await supabase
          .from('notification_preferences')
          .update({ [field]: value })
          .eq('id', preferences[category].id);
          
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: profile.id,
            category,
            email_enabled: field === 'email_enabled' ? value : true,
            in_app_enabled: field === 'in_app_enabled' ? value : true,
            browser_enabled: field === 'browser_enabled' ? value : true
          });
          
        if (error) throw error;
        
        // Refetch to get the new ID
        const { data, error: fetchError } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', profile.id)
          .eq('category', category)
          .single();
          
        if (fetchError) throw fetchError;
        
        setPreferences(prev => ({
          ...prev,
          [category]: data
        }));
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      toast.error('Failed to update notification preferences');
      
      // Revert the optimistic update
      setPreferences(prev => ({ ...prev }));
    }
  };

  // Get preference with defaults
  const getPreference = (category: string): { email_enabled: boolean, in_app_enabled: boolean, browser_enabled: boolean } => {
    return preferences[category] || { email_enabled: true, in_app_enabled: true, browser_enabled: true };
  };

  if (loading) {
    return <div className="p-4 text-center">Loading preferences...</div>;
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        {NOTIFICATION_CATEGORIES.map(category => (
          <div key={category.id} className="space-y-3 pb-5 border-b last:border-b-0">
            <div>
              <h3 className="font-medium">{category.name}</h3>
              <p className="text-sm text-muted-foreground">{category.description}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor={`email-${category.id}`} className="flex flex-col">
                  <span>Email</span>
                  <span className="font-normal text-xs text-muted-foreground">Get notifications via email</span>
                </Label>
                <Switch
                  id={`email-${category.id}`}
                  checked={getPreference(category.id).email_enabled}
                  onCheckedChange={(checked) => updatePreference(category.id, 'email_enabled', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor={`app-${category.id}`} className="flex flex-col">
                  <span>In-App</span>
                  <span className="font-normal text-xs text-muted-foreground">Show notifications in the app</span>
                </Label>
                <Switch
                  id={`app-${category.id}`}
                  checked={getPreference(category.id).in_app_enabled}
                  onCheckedChange={(checked) => updatePreference(category.id, 'in_app_enabled', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor={`browser-${category.id}`} className="flex flex-col">
                  <span>Browser</span>
                  <span className="font-normal text-xs text-muted-foreground">Show browser notifications</span>
                </Label>
                <Switch
                  id={`browser-${category.id}`}
                  checked={getPreference(category.id).browser_enabled}
                  onCheckedChange={(checked) => updatePreference(category.id, 'browser_enabled', checked)}
                  disabled={true}
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
