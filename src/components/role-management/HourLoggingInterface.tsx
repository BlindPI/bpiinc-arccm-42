
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const HourLoggingInterface = ({ userId }: { userId: string }) => {
  const [date, setDate] = useState<Date>(new Date());
  const [hours, setHours] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const queryClient = useQueryClient();

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('status', 'ACTIVE');
      
      if (error) throw error;
      return data;
    }
  });

  const { mutate: logHours, isPending } = useMutation({
    mutationFn: async (formData: {
      instructor_id: string;
      course_id: string;
      hours_taught: number;
      session_date: string;
      notes?: string;
    }) => {
      const { error } = await supabase
        .from('teaching_sessions')
        .insert([formData]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Teaching hours logged successfully');
      setHours('');
      setNotes('');
      queryClient.invalidateQueries({ queryKey: ['teaching-progress'] });
    },
    onError: (error) => {
      toast.error('Failed to log teaching hours');
      console.error('Error logging hours:', error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courses?.[0]?.id) return;

    const hoursNumber = parseFloat(hours);
    if (isNaN(hoursNumber) || hoursNumber <= 0) {
      toast.error('Please enter a valid number of hours');
      return;
    }

    logHours({
      instructor_id: userId,
      course_id: courses[0].id, // Using first course for now
      hours_taught: hoursNumber,
      session_date: format(date, 'yyyy-MM-dd'),
      notes: notes || undefined
    });
  };

  if (coursesLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Log Teaching Hours
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Hours Taught</label>
            <Input
              type="number"
              step="0.5"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="Enter hours taught"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes (Optional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes"
              rows={3}
            />
          </div>

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Log Hours
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
