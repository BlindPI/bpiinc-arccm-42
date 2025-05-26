
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Calendar, 
  Clock, 
  Mail,
  Plus,
  Settings,
  Play,
  Pause
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';

interface ReportSchedule {
  id: string;
  name: string;
  type: 'INSTRUCTOR_PERFORMANCE' | 'COMPLIANCE' | 'EXECUTIVE_SUMMARY';
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  recipients: string[];
  enabled: boolean;
  lastGenerated: string;
  nextGeneration: string;
}

export const ReportScheduler: React.FC = () => {
  const [schedules, setSchedules] = useState<ReportSchedule[]>([
    {
      id: '1',
      name: 'Weekly Performance Report',
      type: 'INSTRUCTOR_PERFORMANCE',
      frequency: 'WEEKLY',
      recipients: ['admin@example.com', 'manager@example.com'],
      enabled: true,
      lastGenerated: '2024-01-15T10:00:00Z',
      nextGeneration: '2024-01-22T10:00:00Z'
    },
    {
      id: '2',
      name: 'Monthly Compliance Report',
      type: 'COMPLIANCE',
      frequency: 'MONTHLY',
      recipients: ['compliance@example.com'],
      enabled: true,
      lastGenerated: '2024-01-01T09:00:00Z',
      nextGeneration: '2024-02-01T09:00:00Z'
    }
  ]);

  const [newSchedule, setNewSchedule] = useState({
    name: '',
    type: 'INSTRUCTOR_PERFORMANCE' as const,
    frequency: 'WEEKLY' as const,
    recipients: '',
    enabled: true
  });

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleToggleSchedule = (id: string) => {
    setSchedules(schedules.map(schedule => 
      schedule.id === id 
        ? { ...schedule, enabled: !schedule.enabled }
        : schedule
    ));
  };

  const handleCreateSchedule = () => {
    const schedule: ReportSchedule = {
      id: Date.now().toString(),
      name: newSchedule.name,
      type: newSchedule.type,
      frequency: newSchedule.frequency,
      recipients: newSchedule.recipients.split(',').map(email => email.trim()),
      enabled: newSchedule.enabled,
      lastGenerated: 'Never',
      nextGeneration: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    setSchedules([...schedules, schedule]);
    setNewSchedule({
      name: '',
      type: 'INSTRUCTOR_PERFORMANCE',
      frequency: 'WEEKLY',
      recipients: '',
      enabled: true
    });
    setIsCreateDialogOpen(false);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'INSTRUCTOR_PERFORMANCE': return 'bg-blue-100 text-blue-800';
      case 'COMPLIANCE': return 'bg-green-100 text-green-800';
      case 'EXECUTIVE_SUMMARY': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'DAILY': return 'bg-red-100 text-red-800';
      case 'WEEKLY': return 'bg-yellow-100 text-yellow-800';
      case 'MONTHLY': return 'bg-green-100 text-green-800';
      case 'QUARTERLY': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Calendar className="h-7 w-7 text-primary" />}
        title="Report Scheduler"
        subtitle="Automate report generation and distribution"
        actions={
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Schedule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Report Schedule</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Report Name</Label>
                  <Input
                    id="name"
                    value={newSchedule.name}
                    onChange={(e) => setNewSchedule({...newSchedule, name: e.target.value})}
                    placeholder="e.g., Weekly Performance Report"
                  />
                </div>
                
                <div>
                  <Label htmlFor="type">Report Type</Label>
                  <Select value={newSchedule.type} onValueChange={(value: any) => setNewSchedule({...newSchedule, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INSTRUCTOR_PERFORMANCE">Instructor Performance</SelectItem>
                      <SelectItem value="COMPLIANCE">Compliance Report</SelectItem>
                      <SelectItem value="EXECUTIVE_SUMMARY">Executive Summary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select value={newSchedule.frequency} onValueChange={(value: any) => setNewSchedule({...newSchedule, frequency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Daily</SelectItem>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="recipients">Recipients (comma-separated emails)</Label>
                  <Input
                    id="recipients"
                    value={newSchedule.recipients}
                    onChange={(e) => setNewSchedule({...newSchedule, recipients: e.target.value})}
                    placeholder="user1@example.com, user2@example.com"
                  />
                </div>

                <Button onClick={handleCreateSchedule} className="w-full">
                  Create Schedule
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Active Schedules */}
      <div className="grid gap-4">
        {schedules.map((schedule) => (
          <Card key={schedule.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{schedule.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={schedule.enabled}
                    onCheckedChange={() => handleToggleSchedule(schedule.id)}
                  />
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge className={getTypeColor(schedule.type)}>
                    {schedule.type.replace('_', ' ')}
                  </Badge>
                  <Badge className={getFrequencyColor(schedule.frequency)}>
                    {schedule.frequency}
                  </Badge>
                  <Badge variant={schedule.enabled ? "default" : "secondary"}>
                    {schedule.enabled ? (
                      <>
                        <Play className="h-3 w-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <Pause className="h-3 w-3 mr-1" />
                        Paused
                      </>
                    )}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Last Generated
                    </div>
                    <div className="font-medium">
                      {schedule.lastGenerated === 'Never' 
                        ? 'Never' 
                        : new Date(schedule.lastGenerated).toLocaleString()
                      }
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Next Generation
                    </div>
                    <div className="font-medium">
                      {new Date(schedule.nextGeneration).toLocaleString()}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      Recipients
                    </div>
                    <div className="font-medium">
                      {schedule.recipients.length} recipient{schedule.recipients.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {schedule.recipients.slice(0, 3).map((email, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {email}
                    </Badge>
                  ))}
                  {schedule.recipients.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{schedule.recipients.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {schedules.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Report Schedules</h3>
            <p className="text-muted-foreground mb-4">
              Create automated report schedules to keep stakeholders informed.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Schedule
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReportScheduler;
