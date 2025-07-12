import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EnrollmentFormData {
  firstName: string;
  lastName: string;
  email: string;
  courseOfferingId: string;
  status: 'ENROLLED' | 'WAITLISTED';
}

export function ManualEnrollmentForm() {
  const [formData, setFormData] = useState<EnrollmentFormData>({
    firstName: '',
    lastName: '',
    email: '',
    courseOfferingId: '',
    status: 'ENROLLED'
  });
  
  const [enrollmentResult, setEnrollmentResult] = useState<{
    success: boolean;
    message: string;
    studentId?: string;
    enrollmentId?: string;
  } | null>(null);

  const queryClient = useQueryClient();

  const { data: courseOfferings = [] } = useQuery({
    queryKey: ['course-offerings-manual'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_offerings')
        .select(`
          id,
          start_date,
          end_date,
          max_participants,
          courses:course_id(
            id,
            name,
            title
          ),
          locations:location_id(
            id,
            name,
            city
          )
        `)
        .eq('status', 'SCHEDULED')
        .order('start_date', { ascending: true });

      if (error) throw error;
      return data || [];
    }
  });

  const createEnrollmentMutation = useMutation({
    mutationFn: async (data: EnrollmentFormData) => {
      const { firstName, lastName, email, courseOfferingId, status } = data;
      
      // Step 1: Check if student already exists
      let studentProfileId: string;
      const { data: existingStudent, error: studentCheckError } = await supabase
        .from('student_enrollment_profiles')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      if (existingStudent) {
        studentProfileId = existingStudent.id;
      } else {
        // Step 2: Create new student profile
        const { data: newStudent, error: studentError } = await supabase
          .from('student_enrollment_profiles')
          .insert([{
            email: email.toLowerCase(),
            first_name: firstName,
            last_name: lastName,
            display_name: `${firstName} ${lastName}`,
            enrollment_status: 'ACTIVE',
            is_active: true,
            import_date: new Date().toISOString(),
            student_metadata: {},
            sync_status: 'MANUAL_ENTRY'
          }])
          .select('id')
          .single();

        if (studentError) throw new Error(`Failed to create student: ${studentError.message}`);
        studentProfileId = newStudent.id;
      }

      // Step 3: Check if already enrolled in this offering
      const { data: existingEnrollment } = await supabase
        .from('enrollments')
        .select('id, status')
        .eq('student_profile_id', studentProfileId)
        .eq('course_offering_id', courseOfferingId)
        .single();

      if (existingEnrollment) {
        throw new Error(`Student is already ${existingEnrollment.status.toLowerCase()} in this course`);
      }

      // Step 4: Create enrollment
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .insert([{
          student_profile_id: studentProfileId,
          course_offering_id: courseOfferingId,
          status: status,
          enrollment_date: new Date().toISOString(),
          user_id: studentProfileId // Required field
        }])
        .select('id')
        .single();

      if (enrollmentError) throw new Error(`Failed to create enrollment: ${enrollmentError.message}`);

      return {
        success: true,
        message: `Successfully enrolled ${firstName} ${lastName}`,
        studentId: studentProfileId,
        enrollmentId: enrollment.id
      };
    },
    onSuccess: (result) => {
      setEnrollmentResult(result);
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments-filtered'] });
      queryClient.invalidateQueries({ queryKey: ['enrollment-metrics'] });
      toast.success(result.message);
    },
    onError: (error: Error) => {
      const errorResult = {
        success: false,
        message: error.message
      };
      setEnrollmentResult(errorResult);
      toast.error(error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim()) {
      toast.error('First name is required');
      return;
    }
    
    if (!formData.lastName.trim()) {
      toast.error('Last name is required');
      return;
    }
    
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return;
    }
    
    if (!formData.courseOfferingId) {
      toast.error('Please select a course offering');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    createEnrollmentMutation.mutate(formData);
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      courseOfferingId: '',
      status: 'ENROLLED'
    });
    setEnrollmentResult(null);
  };

  const updateFormData = (field: keyof EnrollmentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Manual Student Enrollment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => updateFormData('firstName', e.target.value)}
                  placeholder="Enter first name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => updateFormData('lastName', e.target.value)}
                  placeholder="Enter last name"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                placeholder="Enter email address"
                required
              />
              <p className="text-sm text-muted-foreground">
                If the student doesn't exist, a new student profile will be created automatically.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="courseOffering">Course Offering *</Label>
              <Select value={formData.courseOfferingId} onValueChange={(value) => updateFormData('courseOfferingId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a course offering" />
                </SelectTrigger>
                <SelectContent>
                  {courseOfferings.map((offering) => (
                    <SelectItem key={offering.id} value={offering.id}>
                      <div className="flex flex-col">
                        <span>{(offering.courses as any)?.name || 'Course'}</span>
                        <span className="text-sm text-muted-foreground">
                          {offering.locations?.name} - {new Date(offering.start_date).toLocaleDateString()}
                          {offering.max_participants ? ` (${offering.max_participants} max participants)` : ''}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Enrollment Status</Label>
              <Select value={formData.status} onValueChange={(value: 'ENROLLED' | 'WAITLISTED') => updateFormData('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENROLLED">Enrolled</SelectItem>
                  <SelectItem value="WAITLISTED">Waitlisted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={createEnrollmentMutation.isPending}
              >
                {createEnrollmentMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Enroll Student
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {enrollmentResult && (
        <Card>
          <CardHeader>
            <CardTitle>Enrollment Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`flex items-center gap-2 ${enrollmentResult.success ? 'text-green-600' : 'text-red-600'}`}>
              {enrollmentResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span className="font-medium">{enrollmentResult.message}</span>
            </div>
            {enrollmentResult.success && enrollmentResult.studentId && (
              <div className="mt-2 text-sm text-muted-foreground">
                Student ID: {enrollmentResult.studentId}
                {enrollmentResult.enrollmentId && ` | Enrollment ID: ${enrollmentResult.enrollmentId}`}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}