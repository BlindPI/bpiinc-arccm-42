import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Clock,
  Plus,
  Edit,
  Trash2,
  Calendar,
  AlertCircle,
  Users,
  Eye,
  Shield
} from 'lucide-react';
import { useUserAvailability, useAvailabilityByUser } from '@/hooks/useUserAvailability';
import { AvailabilityUser } from '@/types/availability';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import {
  UserAvailabilitySlot,
  DAYS_OF_WEEK,
  AVAILABILITY_TYPES,
  WeeklySchedule
} from '@/types/availability';
import { AvailabilityForm } from './AvailabilityForm';
import AvailabilityCalendar from './AvailabilityCalendar';
import { toast } from 'sonner';

interface AvailabilitySectionProps {
  userId: string;
}

export const AvailabilitySection: React.FC<AvailabilitySectionProps> = ({ userId }) => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [showForm, setShowForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState<UserAvailabilitySlot | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [selectedUserId, setSelectedUserId] = useState<string>(userId);
  const [displayMode, setDisplayMode] = useState<'own' | 'team'>('own');

  // Use the enhanced hooks
  const {
    availability,
    isLoading,
    saveAvailability,
    deleteAvailability,
    canEditAvailability,
    userRole
  } = useUserAvailability();

  // For AP users, get team availability data
  const { availabilityByUser, isLoading: teamLoading } = useAvailabilityByUser();

  console.log('🔧 AvailabilitySection: Hook results:', {
    availability: availability?.length || 0,
    availabilityByUser: availabilityByUser?.length || 0,
    isLoading,
    teamLoading,
    userRole,
    displayMode,
    selectedUserId
  });

  // Determine what data to display based on role and mode
  const getDisplayData = () => {
    if (userRole === 'AP' && displayMode === 'team' && availabilityByUser.length > 0) {
      const selectedUser = availabilityByUser.find(u => u.user_id === selectedUserId);
      return selectedUser ? selectedUser.availability_slots : [];
    }
    
    // For IC/IP/IT/IN users or when viewing own data
    return availability;
  };

  const displayAvailability = getDisplayData();
  const isViewingTeamData = userRole === 'AP' && displayMode === 'team';
  const canEdit = !isViewingTeamData || canEditAvailability(selectedUserId);

  // Organize availability by day of week - ensure we handle both string and number types
  const weeklySchedule: WeeklySchedule = DAYS_OF_WEEK.reduce((schedule, day) => {
    schedule[day.value.toString()] = displayAvailability.filter(slot => {
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

  if (isLoading || teamLoading) {
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
              {isViewingTeamData && (
                <Badge variant="outline" className="ml-2">
                  <Users className="h-3 w-3 mr-1" />
                  Team View
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* Role-based view controls for AP users */}
              {userRole === 'AP' && (
                <Select
                  value={displayMode}
                  onValueChange={(value: 'own' | 'team') => {
                    setDisplayMode(value);
                    if (value === 'own') {
                      setSelectedUserId(userId);
                    } else if (availabilityByUser.length > 0) {
                      setSelectedUserId(availabilityByUser[0].user_id);
                    }
                  }}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="own">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        My Schedule
                      </div>
                    </SelectItem>
                    <SelectItem value="team">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Team View
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* User selector for team view */}
              {isViewingTeamData && availabilityByUser.length > 0 && (
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availabilityByUser.map(user => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium">{user.display_name}</div>
                            <div className="text-xs text-gray-500">{user.role}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

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
              
              {canEdit && (
                <Button onClick={handleAddAvailability} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Availability
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {isViewingTeamData
                ? 'View and manage team member availability schedules.'
                : 'Set your weekly availability schedule. This helps others know when you\'re available for meetings and training sessions.'
              }
            </p>
            {isViewingTeamData && !canEdit && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                View Only
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {displayAvailability.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isViewingTeamData ? 'No availability data' : 'No availability set'}
              </h3>
              <p className="text-gray-600 mb-4">
                {isViewingTeamData
                  ? 'This team member hasn\'t set their availability schedule yet.'
                  : 'You haven\'t set your availability schedule yet. Add your available times to let others know when you can be scheduled.'
                }
              </p>
              {canEdit && (
                <Button onClick={handleAddAvailability}>
                  <Plus className="h-4 w-4 mr-2" />
                  {isViewingTeamData ? 'Add Availability for Member' : 'Set Your Availability'}
                </Button>
              )}
            </div>
          ) : (
            <>
              {viewMode === 'calendar' ? (
                <AvailabilityCalendar />
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

      {/* Team Management Summary for AP users */}
      {userRole === 'AP' && displayMode === 'team' && availabilityByUser.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Availability Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availabilityByUser.map(user => (
                <div key={user.user_id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{user.display_name}</h4>
                      <p className="text-sm text-gray-500">{user.role}</p>
                    </div>
                    <Badge variant="outline">
                      {user.availability_slots.length} slots
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    {user.availability_slots.length > 0 ? (
                      <p>Available {DAYS_OF_WEEK.filter(day =>
                        user.availability_slots.some(slot =>
                          (typeof slot.day_of_week === 'string' ? parseInt(slot.day_of_week) : slot.day_of_week) === day.value
                        )
                      ).length} days/week</p>
                    ) : (
                      <p className="text-gray-400">No availability set</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => {
                      setSelectedUserId(user.user_id);
                      setViewMode('calendar');
                    }}
                  >
                    View Schedule
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showForm && (
        <AvailabilityForm
          userId={isViewingTeamData ? selectedUserId : userId}
          editingSlot={editingSlot}
          onClose={handleFormClose}
          onSave={saveAvailability}
        />
      )}
    </div>
  );
};