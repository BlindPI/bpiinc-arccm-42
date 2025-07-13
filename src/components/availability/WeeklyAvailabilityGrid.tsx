import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Clock } from 'lucide-react';
import { useUserAvailability } from '@/hooks/useUserAvailability';
import type { Database } from '@/integrations/supabase/types';

type UserAvailability = Database['public']['Tables']['user_availability']['Row'];

interface WeeklyAvailabilityGridProps {
  availability: UserAvailability[];
}

const DAYS_OF_WEEK = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
];

const AVAILABILITY_TYPES = [
  { value: 'available', label: 'Available', color: 'bg-green-500' },
  { value: 'busy', label: 'Busy', color: 'bg-red-500' },
  { value: 'tentative', label: 'Tentative', color: 'bg-yellow-500' },
  { value: 'out_of_office', label: 'Out of Office', color: 'bg-gray-500' },
];

const TIME_SLOT_DURATIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
];

export function WeeklyAvailabilityGrid({ availability }: WeeklyAvailabilityGridProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<UserAvailability | null>(null);
  const { saveAvailability, deleteAvailability } = useUserAvailability();

  const [formData, setFormData] = useState({
    day_of_week: '1',
    start_time: '09:00',
    end_time: '17:00',
    availability_type: 'available',
    time_slot_duration: 60,
    notes: '',
    recurring_pattern: 'weekly',
    effective_date: new Date().toISOString().split('T')[0],
  });

  const groupedAvailability = availability.reduce((acc, slot) => {
    if (!acc[slot.day_of_week]) {
      acc[slot.day_of_week] = [];
    }
    acc[slot.day_of_week].push(slot);
    return acc;
  }, {} as Record<string, UserAvailability[]>);

  const handleAddSlot = (dayOfWeek?: string) => {
    setEditingSlot(null);
    setFormData(prev => ({
      ...prev,
      day_of_week: dayOfWeek || prev.day_of_week,
    }));
    setIsDialogOpen(true);
  };

  const handleEditSlot = (slot: UserAvailability) => {
    setEditingSlot(slot);
    setFormData({
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      availability_type: slot.availability_type,
      time_slot_duration: slot.time_slot_duration,
      notes: slot.notes || '',
      recurring_pattern: slot.recurring_pattern || 'weekly',
      effective_date: slot.effective_date,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const data = editingSlot 
        ? { ...formData, id: editingSlot.id }
        : formData;
      
      await saveAvailability.mutateAsync(data);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save availability:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAvailability.mutateAsync(id);
    } catch (error) {
      console.error('Failed to delete availability:', error);
    }
  };

  const getAvailabilityTypeConfig = (type: string) => {
    return AVAILABILITY_TYPES.find(t => t.value === type) || AVAILABILITY_TYPES[0];
  };

  const formatTime = (time: string) => {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-7 gap-4">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day.value} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">{day.label}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAddSlot(day.value)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="space-y-2 min-h-[200px]">
              {groupedAvailability[day.value]?.map((slot) => {
                const typeConfig = getAvailabilityTypeConfig(slot.availability_type);
                return (
                  <Card key={slot.id} className="p-2 hover:shadow-md transition-shadow">
                    <CardContent className="p-0 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${typeConfig.color}`} />
                        <Badge variant="secondary" className="text-xs">
                          {typeConfig.label}
                        </Badge>
                      </div>
                      
                      <div className="text-sm font-medium">
                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {slot.time_slot_duration}min slots
                      </div>
                      
                      {slot.notes && (
                        <p className="text-xs text-muted-foreground">{slot.notes}</p>
                      )}
                      
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSlot(slot)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(slot.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSlot ? 'Edit Availability' : 'Add Availability'}
            </DialogTitle>
            <DialogDescription>
              Set your availability for specific time slots
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="day">Day of Week</Label>
                <Select
                  value={formData.day_of_week}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, day_of_week: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day.value} value={day.value}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">Time Slot Duration</Label>
              <Select
                value={formData.time_slot_duration.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, time_slot_duration: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOT_DURATIONS.map((duration) => (
                    <SelectItem key={duration.value} value={duration.value.toString()}>
                      {duration.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="effective_date">Effective Date</Label>
              <Input
                id="effective_date"
                type="date"
                value={formData.effective_date}
                onChange={(e) => setFormData(prev => ({ ...prev, effective_date: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveAvailability.isPending}>
              {saveAvailability.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}