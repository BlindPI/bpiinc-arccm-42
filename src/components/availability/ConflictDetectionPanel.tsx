import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Clock, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { AvailabilityConflictService, ConflictResult, TimeSlot } from '@/services/availability/availabilityConflictService';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface ConflictDetectionPanelProps {
  userId?: string;
}

export const ConflictDetectionPanel: React.FC<ConflictDetectionPanelProps> = ({
  userId
}) => {
  const [selectedUserId, setSelectedUserId] = useState(userId || '');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [conflictResult, setConflictResult] = useState<ConflictResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Get list of users for selection
  const { data: users } = useQuery({
    queryKey: ['users-for-conflict-check'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, role')
        .in('role', ['IN', 'AP', 'AD'])
        .order('display_name');
      
      if (error) throw error;
      return data;
    }
  });

  const handleConflictCheck = async () => {
    if (!selectedUserId || !startDateTime || !endDateTime) return;

    setIsChecking(true);
    try {
      const result = await AvailabilityConflictService.checkAvailabilityConflicts({
        userId: selectedUserId,
        startTime: startDateTime,
        endTime: endDateTime,
        bookingType: 'course_instruction'
      });
      setConflictResult(result);
    } catch (error) {
      console.error('Error checking conflicts:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const formatTimeSlot = (slot: TimeSlot) => {
    const start = new Date(slot.start);
    const end = new Date(slot.end);
    return `${format(start, 'MMM d, h:mm a')} - ${format(end, 'h:mm a')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Conflict Detection
        </CardTitle>
        <CardDescription>
          Check for scheduling conflicts before booking time slots
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* User Selection */}
        {!userId && (
          <div className="space-y-2">
            <Label htmlFor="user-select">Select User</Label>
            <select
              id="user-select"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select a user...</option>
              {users?.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.display_name || 'Unknown'} ({user.role})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date/Time Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-datetime">Start Date & Time</Label>
            <Input
              id="start-datetime"
              type="datetime-local"
              value={startDateTime}
              onChange={(e) => setStartDateTime(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="end-datetime">End Date & Time</Label>
            <Input
              id="end-datetime"
              type="datetime-local"
              value={endDateTime}
              onChange={(e) => setEndDateTime(e.target.value)}
            />
          </div>
        </div>

        {/* Check Button */}
        <Button 
          onClick={handleConflictCheck}
          disabled={!selectedUserId || !startDateTime || !endDateTime || isChecking}
          className="w-full"
        >
          {isChecking ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Checking Conflicts...
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Check for Conflicts
            </>
          )}
        </Button>

        {/* Results */}
        {conflictResult && (
          <div className="space-y-4">
            <Separator />
            
            {/* Conflict Status */}
            <Alert className={conflictResult.hasConflicts ? 'border-destructive' : 'border-success'}>
              <div className="flex items-center gap-2">
                {conflictResult.hasConflicts ? (
                  <XCircle className="h-4 w-4 text-destructive" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-success" />
                )}
                <AlertDescription>
                  {conflictResult.hasConflicts 
                    ? `${conflictResult.conflicts.length} conflict(s) detected`
                    : 'No conflicts found - time slot is available'
                  }
                </AlertDescription>
              </div>
            </Alert>

            {/* Conflict Details */}
            {conflictResult.hasConflicts && (
              <div className="space-y-3">
                <h4 className="font-medium">Conflicts:</h4>
                {conflictResult.conflicts.map((conflict, index) => (
                  <Card key={index} className="border-l-4 border-l-destructive">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={getSeverityColor(conflict.severity)}>
                          {conflict.severity} priority
                        </Badge>
                        <Badge variant="outline">
                          {conflict.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        <strong>Conflicts with:</strong> {conflict.conflictWith}
                      </p>
                      <p className="text-sm">
                        {conflict.reason}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Suggested Alternatives */}
            {conflictResult.suggestedTimes && conflictResult.suggestedTimes.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Suggested Alternative Times:
                </h4>
                <div className="space-y-2">
                  {conflictResult.suggestedTimes.map((slot, index) => (
                    <Card key={index} className="border-l-4 border-l-success">
                      <CardContent className="pt-3 pb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {formatTimeSlot(slot)}
                          </span>
                          <Badge variant="outline" className="text-success">
                            Available
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};