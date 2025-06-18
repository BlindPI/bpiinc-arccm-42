
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';

interface CampaignSettings {
  defaultFromName: string;
  defaultFromEmail: string;
  defaultReplyTo: string;
  enableTracking: boolean;
  enableAutoUnsubscribe: boolean;
  sendTimeOptimization: boolean;
  maxSendRate: number;
  timeZoneHandling: string;
}

interface CampaignSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CampaignSettingsDialog({ open, onOpenChange }: CampaignSettingsDialogProps) {
  const [settings, setSettings] = useState<CampaignSettings>({
    defaultFromName: 'Training Company',
    defaultFromEmail: 'noreply@trainingcompany.com',
    defaultReplyTo: 'support@trainingcompany.com',
    enableTracking: true,
    enableAutoUnsubscribe: true,
    sendTimeOptimization: false,
    maxSendRate: 1000,
    timeZoneHandling: 'sender'
  });

  const handleSave = async () => {
    try {
      // Save settings to database using Supabase
      const { data, error } = await supabase
        .from('campaign_settings')
        .upsert({
          id: 'default', // Use a default settings record
          default_from_name: settings.defaultFromName,
          default_from_email: settings.defaultFromEmail,
          default_reply_to: settings.defaultReplyTo,
          enable_tracking: settings.enableTracking,
          enable_auto_unsubscribe: settings.enableAutoUnsubscribe,
          send_time_optimization: settings.sendTimeOptimization,
          max_send_rate: settings.maxSendRate,
          timezone_handling: settings.timeZoneHandling,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.error('Error saving campaign settings:', error);
        alert('Failed to save campaign settings: ' + error.message);
        return;
      }

      console.log('✅ Campaign settings saved successfully to database:', data);
      alert('Campaign settings saved successfully!');
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving campaign settings:', error);
      alert('Failed to save campaign settings: ' + (error as Error).message);
    }
  };

  const handleChange = (field: string, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Campaign Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Default Email Settings */}
          <div>
            <h3 className="text-lg font-medium mb-4">Default Email Settings</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="defaultFromName">Default From Name</Label>
                <Input
                  id="defaultFromName"
                  value={settings.defaultFromName}
                  onChange={(e) => handleChange('defaultFromName', e.target.value)}
                  placeholder="Your Company Name"
                />
              </div>
              
              <div>
                <Label htmlFor="defaultFromEmail">Default From Email</Label>
                <Input
                  id="defaultFromEmail"
                  type="email"
                  value={settings.defaultFromEmail}
                  onChange={(e) => handleChange('defaultFromEmail', e.target.value)}
                  placeholder="noreply@yourcompany.com"
                />
              </div>
              
              <div>
                <Label htmlFor="defaultReplyTo">Default Reply-To Email</Label>
                <Input
                  id="defaultReplyTo"
                  type="email"
                  value={settings.defaultReplyTo}
                  onChange={(e) => handleChange('defaultReplyTo', e.target.value)}
                  placeholder="support@yourcompany.com"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Tracking & Analytics */}
          <div>
            <h3 className="text-lg font-medium mb-4">Tracking & Analytics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableTracking">Enable Email Tracking</Label>
                  <p className="text-sm text-muted-foreground">Track opens, clicks, and other engagement metrics</p>
                </div>
                <Switch
                  id="enableTracking"
                  checked={settings.enableTracking}
                  onCheckedChange={(checked) => handleChange('enableTracking', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableAutoUnsubscribe">Auto-Unsubscribe Links</Label>
                  <p className="text-sm text-muted-foreground">Automatically include unsubscribe links in emails</p>
                </div>
                <Switch
                  id="enableAutoUnsubscribe"
                  checked={settings.enableAutoUnsubscribe}
                  onCheckedChange={(checked) => handleChange('enableAutoUnsubscribe', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Send Optimization */}
          <div>
            <h3 className="text-lg font-medium mb-4">Send Optimization</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sendTimeOptimization">Send Time Optimization</Label>
                  <p className="text-sm text-muted-foreground">Optimize send times based on recipient behavior</p>
                </div>
                <Switch
                  id="sendTimeOptimization"
                  checked={settings.sendTimeOptimization}
                  onCheckedChange={(checked) => handleChange('sendTimeOptimization', checked)}
                />
              </div>
              
              <div>
                <Label htmlFor="maxSendRate">Max Send Rate (emails/hour)</Label>
                <Input
                  id="maxSendRate"
                  type="number"
                  min="100"
                  max="10000"
                  value={settings.maxSendRate}
                  onChange={(e) => handleChange('maxSendRate', parseInt(e.target.value) || 1000)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
