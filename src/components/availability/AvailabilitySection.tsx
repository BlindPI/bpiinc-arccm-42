import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  AlertCircle 
} from 'lucide-react';
import { useUserAvailability } from '@/hooks/useUserAvailability';
import { 
  UserAvailabilitySlot, 
  DAYS_OF_WEEK, 
  AVAILABILITY_TYPES,
  WeeklySchedule 
} from '@/types/availability';
import { AvailabilityForm } from './AvailabilityForm';
import { WeeklyAvailabilityView } from './WeeklyAvailabilityView';
import { toast } from 'sonner';

interface AvailabilitySectionProps {
  userId: string;
}

export const AvailabilitySection: React.FC<AvailabilitySectionProps> = ({ userId }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState<UserAvailabilitySlot | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');

  const {
    availability,
    isLoading,
    saveAvailability,
    deleteAvailability
  } = useUserAvailability();

  console.log('🔧 AvailabilitySection: Hook results:', {
    availability: availability?.length || 0,
    isLoading,
    saveAvailability: !!saveAvailability,
    saveAvailabilityMutateAsync: !!saveAvailability?.mutateAsync,
    userId
  });

  // Organize availability by day of week - ensure we handle both string and number types
  const weeklySchedule: WeeklySchedule = DAYS_OF_WEEK.reduce((schedule, day) => {
    schedule[day.value.toString()] = availability.filter(slot => {
      // Handle both string and number day_of_week values
      const slotDay = typeof slot.day_of_week === 'string' ? parseInt(slot.day_of_week) : slot.day_of_week;
      return slotDay === day.value;
    });
    return schedule;
  }, {} as WeeklySchedule);

  const handleAddAvailability = () => {
    setEditingSlot(null);
    setShowForm(true);
  };

  const handleEditAvailability = (slot: UserAvailabilitySlot) => {
    setEditingSlot(slot);
    setShowForm(true);
  };

  const handleDeleteAvailability = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this availability slot?')) {
      return;
    }

    try {
      await deleteAvailability.mutateAsync(id);
      toast.success('Availability slot deleted successfully');
    } catch (error) {
      console.error('Error deleting availability:', error);
      toast.error('Failed to delete availability slot');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingSlot(null);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getAvailabilityTypeInfo = (type: string) => {
    return AVAILABILITY_TYPES.find(t => t.value === type) || AVAILABILITY_TYPES[0];
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Availability Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Availability Schedule
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border">
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                  className="rounded-r-none"
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Calendar
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <Clock className="h-4 w-4 mr-1" />
                  List
                </Button>
              </div>
              <Button onClick={handleAddAvailability} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Availability
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Set your weekly availability schedule. This helps others know when you're available for meetings and training sessions.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {availability.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No availability set</h3>
              <p className="text-gray-600 mb-4">
                You haven't set your availability schedule yet. Add your available times to let others know when you can be scheduled.
              </p>
              <Button onClick={handleAddAvailability}>
                <Plus className="h-4 w-4 mr-2" />
                Set Your Availability
              </Button>
            </div>
          ) : (
            <>
              {viewMode === 'calendar' ? (
                <WeeklyAvailabilityView 
                  weeklySchedule={weeklySchedule}
                  onEditSlot={handleEditAvailability}
                  onDeleteSlot={handleDeleteAvailability}
                />
              ) : (
                <div className="space-y-4">
                  {DAYS_OF_WEEK.map(day => {
                    const daySlots = weeklySchedule[day.value.toString()] || [];
                    
                    return (
                      <div key={day.value} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">{day.label}</h4>
                          {daySlots.length === 0 && (
                            <span className="text-sm text-gray-500">Not available</span>
                          )}
                        </div>
                        
                        {daySlots.length > 0 && (
                          <div className="space-y-2">
                            {daySlots.map(slot => {
                              const typeInfo = getAvailabilityTypeInfo(slot.availability_type);
                              
                              return (
                                <div key={slot.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                  <div className="flex items-center gap-3">
                                    <div className="text-sm font-medium">
                                      {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                    </div>
                                    <Badge 
                                      variant="outline"
                                      className={`border-${typeInfo.color}-200 text-${typeInfo.color}-700 bg-${typeInfo.color}-50`}
                                    >
                                      {typeInfo.label}
                                    </Badge>
                                    {slot.notes && (
                                      <span className="text-xs text-gray-500">
                                        {slot.notes}
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditAvailability(slot)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteAvailability(slot.id!)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <AvailabilityForm
          userId={userId}
          editingSlot={editingSlot}
          onClose={handleFormClose}
          onSave={saveAvailability}
        />
      )}
    </div>
  );
};