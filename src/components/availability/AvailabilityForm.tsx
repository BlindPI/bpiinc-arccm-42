import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { X, Save, Clock } from 'lucide-react';
import { 
  UserAvailabilitySlot, 
  AvailabilityFormData,
  DAYS_OF_WEEK, 
  AVAILABILITY_TYPES,
  RECURRING_PATTERNS,
  TIME_SLOT_DURATIONS,
  DEFAULT_AVAILABILITY_SETTINGS 
} from '@/types/availability';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AvailabilityFormProps {
  userId: string;
  editingSlot?: UserAvailabilitySlot | null;
  onClose: () => void;
  onSave: any; // useMutation object
}

export const AvailabilityForm: React.FC<AvailabilityFormProps> = ({
  userId,
  editingSlot,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<AvailabilityFormData>({
    day_of_week: 1, // Monday
    start_time: '09:00:00',
    end_time: '17:00:00',
    ...DEFAULT_AVAILABILITY_SETTINGS
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editingSlot) {
      setFormData({
        day_of_week: editingSlot.day_of_week,
        start_time: editingSlot.start_time,
        end_time: editingSlot.end_time,
        availability_type: editingSlot.availability_type,
        recurring_pattern: editingSlot.recurring_pattern,
        effective_date: editingSlot.effective_date,
        expiry_date: editingSlot.expiry_date,
        time_slot_duration: editingSlot.time_slot_duration,
        notes: editingSlot.notes || ''
      });
    }
  }, [editingSlot]);

  const handleInputChange = (field: keyof AvailabilityFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = async (): Promise<boolean> => {
    if (!formData.start_time || !formData.end_time) {
      toast.error('Please set both start and end times');
      return false;
    }

    if (formData.start_time >= formData.end_time) {
      toast.error('End time must be after start time');
      return false;
    }

    if (!formData.effective_date) {
      toast.error('Please set an effective date');
      return false;
    }

    if (formData.expiry_date && formData.expiry_date <= formData.effective_date) {
      toast.error('Expiry date must be after effective date');
      return false;
    }

    // Check for exact duplicate (same user_id, day_of_week, start_time, end_time)
    try {
      const { data: existingSlots, error } = await supabase
        .from('user_availability')
        .select('id')
        .eq('user_id', userId)
        .eq('day_of_week', formData.day_of_week)
        .eq('start_time', formData.start_time)
        .eq('end_time', formData.end_time)
        .eq('is_active', true);

      if (error) {
        console.error('Error checking for duplicates:', error);
        return true; // Allow save if we can't check
      }

      // If editing, exclude the current slot
      const duplicates = existingSlots?.filter(slot =>
        !editingSlot || slot.id !== editingSlot.id
      ) || [];

      if (duplicates.length > 0) {
        const dayName = DAYS_OF_WEEK.find(d => d.value === formData.day_of_week)?.label || 'Unknown';
        toast.error(`You already have availability set for ${dayName} ${formatTimeForInput(formData.start_time)} - ${formatTimeForInput(formData.end_time)}`);
        return false;
      }
    } catch (error) {
      console.error('Error validating form:', error);
      // Allow save if validation fails
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔧 AvailabilityForm: Form submitted');
    console.log('🔧 AvailabilityForm: Form data:', formData);
    console.log('🔧 AvailabilityForm: onSave mutation:', onSave);
    
    const isValid = await validateForm();
    console.log('🔧 AvailabilityForm: Form validation result:', isValid);
    if (!isValid) {
      console.log('🔧 AvailabilityForm: Validation failed, stopping submission');
      return;
    }

    setIsSaving(true);
    try {
      const saveData = {
        ...formData,
        user_id: userId,
        is_active: true,
        ...(editingSlot && { id: editingSlot.id })
      };
      
      console.log('🔧 AvailabilityForm: Attempting to save data:', saveData);
      console.log('🔧 AvailabilityForm: Mutation function exists?', !!onSave?.mutateAsync);

      await onSave.mutateAsync(saveData);
      console.log('🔧 AvailabilityForm: Save successful');
      toast.success(editingSlot ? 'Availability updated successfully' : 'Availability added successfully');
      onClose();
    } catch (error: any) {
      console.error('🔧 AvailabilityForm: Error saving availability:', error);
      
      // Handle specific database constraint violations
      if (error?.code === '23505' && error?.message?.includes('no_overlapping_availability')) {
        toast.error('This availability slot conflicts with an existing one. Please choose different times.');
      } else {
        toast.error('Failed to save availability: ' + (error?.message || 'Unknown error'));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const formatTimeForInput = (time: string) => {
    return time.slice(0, 5); // Convert HH:MM:SS to HH:MM
  };

  const formatTimeForSave = (time: string) => {
    return `${time}:00`; // Convert HH:MM to HH:MM:SS
  };

  return (
    <Card className="fixed inset-0 z-50 m-4 md:relative md:inset-auto md:m-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {editingSlot ? 'Edit Availability' : 'Add Availability'}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <Separator />

      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Day of Week */}
            <div className="space-y-2">
              <Label htmlFor="day_of_week">Day of Week</Label>
              <Select
                value={formData.day_of_week.toString()}
                onValueChange={(value) => handleInputChange('day_of_week', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map(day => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Availability Type */}
            <div className="space-y-2">
              <Label htmlFor="availability_type">Availability Type</Label>
              <Select
                value={formData.availability_type}
                onValueChange={(value) => handleInputChange('availability_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABILITY_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full bg-${type.color}-500`} />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Time */}
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                type="time"
                value={formatTimeForInput(formData.start_time)}
                onChange={(e) => handleInputChange('start_time', formatTimeForSave(e.target.value))}
                required
              />
            </div>

            {/* End Time */}
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time</Label>
              <Input
                type="time"
                value={formatTimeForInput(formData.end_time)}
                onChange={(e) => handleInputChange('end_time', formatTimeForSave(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Time Slot Duration */}
            <div className="space-y-2">
              <Label htmlFor="time_slot_duration">Time Slot Duration</Label>
              <Select
                value={formData.time_slot_duration.toString()}
                onValueChange={(value) => handleInputChange('time_slot_duration', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOT_DURATIONS.map(duration => (
                    <SelectItem key={duration.value} value={duration.value.toString()}>
                      {duration.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recurring Pattern */}
            <div className="space-y-2">
              <Label htmlFor="recurring_pattern">Recurring Pattern</Label>
              <Select
                value={formData.recurring_pattern}
                onValueChange={(value) => handleInputChange('recurring_pattern', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pattern" />
                </SelectTrigger>
                <SelectContent>
                  {RECURRING_PATTERNS.map(pattern => (
                    <SelectItem key={pattern.value} value={pattern.value}>
                      {pattern.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Effective Date */}
            <div className="space-y-2">
              <Label htmlFor="effective_date">Effective Date</Label>
              <Input
                type="date"
                value={formData.effective_date}
                onChange={(e) => handleInputChange('effective_date', e.target.value)}
                required
              />
            </div>

            {/* Expiry Date */}
            <div className="space-y-2">
              <Label htmlFor="expiry_date">Expiry Date (Optional)</Label>
              <Input
                type="date"
                value={formData.expiry_date || ''}
                onChange={(e) => handleInputChange('expiry_date', e.target.value || undefined)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Add any additional notes about this availability slot..."
              rows={3}
            />
          </div>

          <Separator />

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : editingSlot ? 'Update' : 'Save'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};