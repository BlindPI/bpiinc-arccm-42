
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, Users, BookOpen, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useTeachingManagement } from '@/hooks/useTeachingManagement';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const sessionFormSchema = z.object({
  course_id: z.string().min(1, 'Course is required'),
  session_date: z.string().min(1, 'Session date is required'),
  duration_minutes: z.number().min(30, 'Minimum 30 minutes').max(480, 'Maximum 8 hours'),
  hours_taught: z.number().min(0.5, 'Minimum 0.5 hours').max(8, 'Maximum 8 hours'),
  session_notes: z.string().optional(),
  assessment_conducted: z.boolean().default(false),
});

type SessionFormData = z.infer<typeof sessionFormSchema>;

export const TeachingSessionManager: React.FC = () => {
  const { user } = useAuth();
  const { createSession, useTeachingSessions } = useTeachingManagement();
  const [selectedTab, setSelectedTab] = useState('create');

  const form = useForm<SessionFormData>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      course_id: '',
      session_date: '',
      duration_minutes: 60,
      hours_taught: 1,
      session_notes: '',
      assessment_conducted: false,
    },
  });

  // Get courses for dropdown
  const { data: courses } = useQuery({
    queryKey: ['courses', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, name')
        .eq('status', 'ACTIVE')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Get user's teaching sessions
  const { data: sessions, isLoading: sessionsLoading } = useTeachingSessions(user?.id);

  const onSubmit = (data: SessionFormData) => {
    if (!user?.id) {
      return;
    }

    createSession.mutate({
      instructor_id: user.id,
      course_id: data.course_id,
      session_date: data.session_date,
      duration_minutes: data.duration_minutes,
      hours_taught: data.hours_taught,
      session_notes: data.session_notes,
      assessment_conducted: data.assessment_conducted,
      completion_status: 'COMPLETED'
    });
  };

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'non_compliant': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teaching Session Management</h1>
          <p className="text-muted-foreground">Track and manage your teaching sessions</p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="create">Create Session</TabsTrigger>
          <TabsTrigger value="sessions">My Sessions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Log New Teaching Session
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="course_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Course</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a course" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {courses?.map((course) => (
                                <SelectItem key={course.id} value={course.id}>
                                  {course.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="session_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Session Date & Time
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="duration_minutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Duration (minutes)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="30"
                              max="480"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hours_taught"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teaching Hours Credit</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.5"
                              min="0.5"
                              max="8"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="session_notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Session Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add any notes about the session..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => form.reset()}
                    >
                      Clear
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createSession.isPending}
                    >
                      {createSession.isPending ? 'Logging...' : 'Log Session'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Teaching Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <div className="text-center py-4">Loading sessions...</div>
              ) : !sessions || sessions.length === 0 ? (
                <Alert>
                  <BookOpen className="h-4 w-4" />
                  <AlertDescription>
                    No teaching sessions recorded yet. Create your first session above.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div key={session.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">
                          Session on {new Date(session.session_date).toLocaleDateString()}
                        </div>
                        <Badge className={getComplianceStatusColor(session.compliance_status)}>
                          {session.compliance_status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Duration:</span> {session.duration_minutes} min
                        </div>
                        <div>
                          <span className="font-medium">Hours Credit:</span> {session.teaching_hours_credit}
                        </div>
                        <div>
                          <span className="font-medium">Attendance:</span> {session.attendance_count}
                        </div>
                        <div className="flex items-center gap-1">
                          {session.assessment_conducted ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          )}
                          Assessment {session.assessment_conducted ? 'Conducted' : 'Not Conducted'}
                        </div>
                      </div>
                      {session.session_notes && (
                        <div className="mt-2 text-sm">
                          <span className="font-medium">Notes:</span> {session.session_notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {sessions?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Sessions</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {sessions?.reduce((sum, s) => sum + s.teaching_hours_credit, 0).toFixed(1) || '0.0'}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Hours</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {sessions ? Math.round((sessions.filter(s => s.compliance_status === 'compliant').length / sessions.length) * 100) || 0 : 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Compliance Rate</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeachingSessionManager;
