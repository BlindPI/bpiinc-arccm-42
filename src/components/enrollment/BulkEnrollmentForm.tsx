
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Users, AlertCircle, CheckCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function BulkEnrollmentForm() {
  const [selectedOffering, setSelectedOffering] = useState<string>('');
  const [emailList, setEmailList] = useState('');
  const [enrollmentResults, setEnrollmentResults] = useState<{
    successful: string[];
    failed: Array<{ email: string; reason: string }>;
  } | null>(null);

  const queryClient = useQueryClient();

  const { data: courseOfferings = [] } = useQuery({
    queryKey: ['course-offerings-bulk'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_offerings')
        .select(`
          id,
          start_date,
          end_date,
          max_participants,
          courses:course_id(name),
          locations:location_id(name)
        `)
        .eq('status', 'SCHEDULED')
        .order('start_date', { ascending: true });

      if (error) throw error;
      return data;
    }
  });

  const bulkEnrollMutation = useMutation({
    mutationFn: async ({ offeringId, emails }: { offeringId: string; emails: string[] }) => {
      const results = {
        successful: [] as string[],
        failed: [] as Array<{ email: string; reason: string }>
      };

      for (const email of emails) {
        try {
          // First, find the user by email
          const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email.trim())
            .single();

          if (profileError || !profiles) {
            results.failed.push({ email, reason: 'User not found' });
            continue;
          }

          // Check if already enrolled
          const { data: existingEnrollment } = await supabase
            .from('enrollments')
            .select('id')
            .eq('user_id', profiles.id)
            .eq('course_offering_id', offeringId)
            .single();

          if (existingEnrollment) {
            results.failed.push({ email, reason: 'Already enrolled' });
            continue;
          }

          // Create enrollment
          const { error: enrollmentError } = await supabase
            .from('enrollments')
            .insert({
              user_id: profiles.id,
              course_offering_id: offeringId,
              status: 'ENROLLED'
            });

          if (enrollmentError) {
            results.failed.push({ email, reason: enrollmentError.message });
          } else {
            results.successful.push(email);
          }
        } catch (error) {
          results.failed.push({ email, reason: 'Unknown error' });
        }
      }

      return results;
    },
    onSuccess: (results) => {
      setEnrollmentResults(results);
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      toast.success(`Bulk enrollment completed: ${results.successful.length} successful, ${results.failed.length} failed`);
    },
    onError: (error) => {
      toast.error('Bulk enrollment failed');
      console.error('Bulk enrollment error:', error);
    }
  });

  const handleBulkEnroll = () => {
    if (!selectedOffering || !emailList.trim()) {
      toast.error('Please select a course offering and provide email addresses');
      return;
    }

    const emails = emailList
      .split('\n')
      .map(email => email.trim())
      .filter(email => email.length > 0);

    if (emails.length === 0) {
      toast.error('No valid email addresses found');
      return;
    }

    bulkEnrollMutation.mutate({ offeringId: selectedOffering, emails });
  };

  const resetForm = () => {
    setSelectedOffering('');
    setEmailList('');
    setEnrollmentResults(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Enrollment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="offering">Course Offering</Label>
            <Select value={selectedOffering} onValueChange={setSelectedOffering}>
              <SelectTrigger>
                <SelectValue placeholder="Select a course offering" />
              </SelectTrigger>
              <SelectContent>
                {courseOfferings.map((offering) => (
                  <SelectItem key={offering.id} value={offering.id}>
                    <div className="flex flex-col">
                      <span>{offering.courses?.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {offering.locations?.name} - {new Date(offering.start_date).toLocaleDateString()}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emails">Email Addresses</Label>
            <Textarea
              id="emails"
              placeholder="Enter email addresses, one per line&#10;example@domain.com&#10;another@domain.com"
              value={emailList}
              onChange={(e) => setEmailList(e.target.value)}
              rows={6}
              className="font-mono text-sm"
            />
            <p className="text-sm text-muted-foreground">
              Enter one email address per line. Users must already exist in the system.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleBulkEnroll}
              disabled={bulkEnrollMutation.isPending || !selectedOffering || !emailList.trim()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {bulkEnrollMutation.isPending ? 'Processing...' : 'Enroll Students'}
            </Button>
            <Button variant="outline" onClick={resetForm}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {enrollmentResults && (
        <Card>
          <CardHeader>
            <CardTitle>Enrollment Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {enrollmentResults.successful.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">
                    Successfully enrolled ({enrollmentResults.successful.length})
                  </span>
                </div>
                <div className="bg-green-50 p-3 rounded border text-sm">
                  {enrollmentResults.successful.join(', ')}
                </div>
              </div>
            )}

            {enrollmentResults.failed.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">
                    Failed enrollments ({enrollmentResults.failed.length})
                  </span>
                </div>
                <div className="bg-red-50 p-3 rounded border space-y-1 text-sm">
                  {enrollmentResults.failed.map((failure, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{failure.email}</span>
                      <span className="text-red-600">{failure.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
