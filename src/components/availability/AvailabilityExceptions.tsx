import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Calendar, Clock } from 'lucide-react';
import { useUserAvailability } from '@/hooks/useUserAvailability';
import type { Database } from '@/integrations/supabase/types';

type AvailabilityException = Database['public']['Tables']['availability_exceptions']['Row'];

interface AvailabilityExceptionsProps {
  exceptions: AvailabilityException[];
}

const AVAILABILITY_TYPES = [
  { value: 'available', label: 'Available', color: 'bg-green-500' },
  { value: 'busy', label: 'Busy', color: 'bg-red-500' },
  { value: 'tentative', label: 'Tentative', color: 'bg-yellow-500' },
  { value: 'out_of_office', label: 'Out of Office', color: 'bg-gray-500' },
];

export function AvailabilityExceptions({ exceptions }: AvailabilityExceptionsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { addException } = useUserAvailability();

  const [formData, setFormData] = useState({
    exception_date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    availability_type: 'out_of_office',
    reason: '',
  });

  const handleAddException = async () => {
    try {
      await addException.mutateAsync({
        exception_date: formData.exception_date,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        availability_type: formData.availability_type as any,
        reason: formData.reason || null,
      });
      setIsDialogOpen(false);
      setFormData({
        exception_date: new Date().toISOString().split('T')[0],
        start_time: '',
        end_time: '',
        availability_type: 'out_of_office',
        reason: '',
      });
    } catch (error) {
      console.error('Failed to add exception:', error);
    }
  };

  const getAvailabilityTypeConfig = (type: string) => {
    return AVAILABILITY_TYPES.find(t => t.value === type) || AVAILABILITY_TYPES[0];
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time: string | null) => {
    if (!time) return null;
    return new Date(`1970-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const isFullDayException = (exception: AvailabilityException) => {
    return !exception.start_time || !exception.end_time;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {exceptions.length} upcoming exceptions
        </p>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Exception
        </Button>
      </div>

      <div className="grid gap-4">
        {exceptions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No exceptions scheduled</p>
            </CardContent>
          </Card>
        ) : (
          exceptions.map((exception) => {
            const typeConfig = getAvailabilityTypeConfig(exception.availability_type);
            return (
              <Card key={exception.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${typeConfig.color}`} />
                      <Badge variant="secondary">
                        {typeConfig.label}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium">
                      {formatDate(exception.exception_date)}
                    </p>
                  </div>
                  
                  {!isFullDayException(exception) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {formatTime(exception.start_time)} - {formatTime(exception.end_time)}
                    </div>
                  )}
                  
                  {isFullDayException(exception) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Full Day
                    </div>
                  )}
                  
                  {exception.reason && (
                    <p className="text-sm">{exception.reason}</p>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Availability Exception</DialogTitle>
            <DialogDescription>
              Create a one-time change to your regular availability schedule
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="date">Exception Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.exception_date}
                onChange={(e) => setFormData(prev => ({ ...prev, exception_date: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Availability Type</Label>
              <Select
                value={formData.availability_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, availability_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABILITY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time (Optional)</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  placeholder="Leave empty for full day"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end_time">End Time (Optional)</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  placeholder="Leave empty for full day"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Vacation, sick leave, training, etc."
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddException} disabled={addException.isPending}>
              {addException.isPending ? 'Adding...' : 'Add Exception'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}