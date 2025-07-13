import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Clock, Bell, Calendar, Save } from 'lucide-react';

export function AvailabilitySettings() {
  const [settings, setSettings] = useState({
    defaultTimeSlotDuration: '60',
    workingHoursStart: '09:00',
    workingHoursEnd: '17:00',
    weekendAvailability: false,
    automaticBreaks: true,
    breakDuration: '15',
    notificationsEnabled: true,
    reminderMinutes: '30',
    allowOverlaps: false,
    requireApproval: false,
    timezone: 'America/New_York',
  });

  const handleSave = () => {
    // TODO: Implement settings save to user preferences or profile
    console.log('Saving settings:', settings);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time Slot Preferences
          </CardTitle>
          <CardDescription>
            Configure your default time slot settings and working hours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultDuration">Default Time Slot Duration</Label>
              <Select
                value={settings.defaultTimeSlotDuration}
                onValueChange={(value) => setSettings(prev => ({ ...prev, defaultTimeSlotDuration: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={settings.timezone}
                onValueChange={(value) => setSettings(prev => ({ ...prev, timezone: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workStart">Default Working Hours Start</Label>
              <Input
                id="workStart"
                type="time"
                value={settings.workingHoursStart}
                onChange={(e) => setSettings(prev => ({ ...prev, workingHoursStart: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="workEnd">Default Working Hours End</Label>
              <Input
                id="workEnd"
                type="time"
                value={settings.workingHoursEnd}
                onChange={(e) => setSettings(prev => ({ ...prev, workingHoursEnd: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Availability Rules
          </CardTitle>
          <CardDescription>
            Configure how your availability is managed and scheduled
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Weekend Availability</Label>
              <p className="text-sm text-muted-foreground">
                Allow scheduling on weekends (Saturday & Sunday)
              </p>
            </div>
            <Switch
              checked={settings.weekendAvailability}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, weekendAvailability: checked }))}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Automatic Breaks</Label>
              <p className="text-sm text-muted-foreground">
                Automatically add breaks between consecutive bookings
              </p>
            </div>
            <Switch
              checked={settings.automaticBreaks}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, automaticBreaks: checked }))}
            />
          </div>
          
          {settings.automaticBreaks && (
            <div className="ml-6 space-y-2">
              <Label htmlFor="breakDuration">Break Duration</Label>
              <Select
                value={settings.breakDuration}
                onValueChange={(value) => setSettings(prev => ({ ...prev, breakDuration: value }))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Overlapping Bookings</Label>
              <p className="text-sm text-muted-foreground">
                Allow multiple bookings at the same time (for team activities)
              </p>
            </div>
            <Switch
              checked={settings.allowOverlaps}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, allowOverlaps: checked }))}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Approval</Label>
              <p className="text-sm text-muted-foreground">
                Require manager approval for bookings during your available time
              </p>
            </div>
            <Switch
              checked={settings.requireApproval}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, requireApproval: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configure how you receive notifications about your schedule
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications for booking changes and reminders
              </p>
            </div>
            <Switch
              checked={settings.notificationsEnabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notificationsEnabled: checked }))}
            />
          </div>
          
          {settings.notificationsEnabled && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="reminderMinutes">Reminder Time</Label>
                <Select
                  value={settings.reminderMinutes}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, reminderMinutes: value }))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes before</SelectItem>
                    <SelectItem value="30">30 minutes before</SelectItem>
                    <SelectItem value="60">1 hour before</SelectItem>
                    <SelectItem value="120">2 hours before</SelectItem>
                    <SelectItem value="1440">1 day before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}