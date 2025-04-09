
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useCourseOfferings } from '@/hooks/useCourseOfferings';
import { useCreateEnrollment } from '@/hooks/useEnrollment';
import { CalendarRange, Users, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
  course_offering_id: z.string().min(1, { message: 'Please select a course offering' }),
  notes: z.string().optional(),
});

export function EnrollmentForm() {
  const { user } = useAuth();
  const { data: courseOfferings, isLoading } = useCourseOfferings();
  const createEnrollment = useCreateEnrollment();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      course_offering_id: '',
      notes: '',
    },
  });
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!user?.id) return;
    
    createEnrollment.mutate({
      user_id: user.id,
      course_offering_id: values.course_offering_id,
      notes: values.notes,
      status: 'ENROLLED', // This will be overridden in the hook based on availability
      attendance: null,
    });
    
    // Reset form
    form.reset();
  };
  
  // Filter course offerings - only show scheduled or in progress courses
  const availableCourseOfferings = courseOfferings?.filter(offering => 
    ['SCHEDULED', 'IN_PROGRESS'].includes(offering.status)
  );
  
  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Course Enrollment</CardTitle>
        <CardDescription>
          Register for an upcoming course offering
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="course_offering_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Course Offering</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course offering" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoading ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : availableCourseOfferings?.length === 0 ? (
                        <SelectItem value="none" disabled>No available courses</SelectItem>
                      ) : (
                        availableCourseOfferings?.map(offering => (
                          <SelectItem key={offering.id} value={offering.id}>
                            <div className="flex flex-col gap-1">
                              <span>{offering.courses.name}</span>
                              <span className="text-xs text-muted-foreground flex items-center">
                                <CalendarRange className="h-3 w-3 mr-1" />
                                {format(new Date(offering.start_date), 'MMM d, yyyy')}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center">
                                <Users className="h-3 w-3 mr-1" />
                                {offering.max_participants} max participants
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any accommodations or special requests..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {availableCourseOfferings?.length === 0 && !isLoading && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Available Courses</AlertTitle>
                <AlertDescription>
                  There are currently no scheduled course offerings available for enrollment.
                </AlertDescription>
              </Alert>
            )}
          </form>
        </Form>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="ghost" 
          onClick={() => form.reset()}
        >
          Cancel
        </Button>
        <Button 
          onClick={form.handleSubmit(onSubmit)}
          disabled={createEnrollment.isPending || isLoading || availableCourseOfferings?.length === 0}
        >
          {createEnrollment.isPending ? 'Processing...' : 'Enroll'}
        </Button>
      </CardFooter>
    </Card>
  );
}
