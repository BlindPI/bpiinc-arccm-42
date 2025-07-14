import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, AlertCircle, CheckCircle, Loader2, Building, Phone, MapPin, FileText, GraduationCap } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EnhancedEnrollmentFormData {
  // Basic student information
  firstName: string;
  lastName: string;
  email: string;
  
  // Contact information (matching certificate_requests)
  phone: string;
  company: string;
  city: string;
  province: string;
  postalCode: string;
  
  // Course and certification details
  courseId: string;
  firstAidLevel: string;
  cprLevel: string;
  courseLength: number | '';
  
  // Location and instructor
  locationId: string;
  instructorName: string;
  
  // Additional information
  notes: string;
  
  // Status fields
  assessmentStatus: 'PENDING' | 'PASSED' | 'FAILED';
  completionStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

interface Course {
  id: string;
  name: string;
  first_aid_level: string;
  cpr_level: string;
  length: number;
}

interface Location {
  id: string;
  name: string;
  city: string;
  state: string;
}

export function EnhancedManualEnrollmentForm() {
  const [formData, setFormData] = useState<EnhancedEnrollmentFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    city: '',
    province: '',
    postalCode: '',
    courseId: '',
    firstAidLevel: '',
    cprLevel: '',
    courseLength: '',
    locationId: '',
    instructorName: '',
    notes: '',
    assessmentStatus: 'PENDING',
    completionStatus: 'NOT_STARTED'
  });
  
  const [enrollmentResult, setEnrollmentResult] = useState<{
    success: boolean;
    message: string;
    studentId?: string;
  } | null>(null);

  const queryClient = useQueryClient();

  // Fetch available courses
  const { data: courses = [] } = useQuery({
    queryKey: ['courses-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, name, first_aid_level, cpr_level, length')
        .eq('status', 'ACTIVE')
        .order('name');

      if (error) throw error;
      return data as Course[];
    }
  });

  // Fetch available locations
  const { data: locations = [] } = useQuery({
    queryKey: ['locations-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, city, state')
        .order('name');

      if (error) throw error;
      return data as Location[];
    }
  });

  // Auto-populate course details when course is selected
  useEffect(() => {
    if (formData.courseId) {
      const selectedCourse = courses.find(course => course.id === formData.courseId);
      if (selectedCourse) {
        setFormData(prev => ({
          ...prev,
          firstAidLevel: selectedCourse.first_aid_level || '',
          cprLevel: selectedCourse.cpr_level || '',
          courseLength: selectedCourse.length || ''
        }));
      }
    }
  }, [formData.courseId, courses]);

  // Auto-populate location details when location is selected
  useEffect(() => {
    if (formData.locationId) {
      const selectedLocation = locations.find(location => location.id === formData.locationId);
      if (selectedLocation && !formData.city && !formData.province) {
        setFormData(prev => ({
          ...prev,
          city: selectedLocation.city || '',
          province: selectedLocation.state || ''
        }));
      }
    }
  }, [formData.locationId, locations]);

  const createStudentMutation = useMutation({
    mutationFn: async (data: EnhancedEnrollmentFormData) => {
      const { 
        firstName, lastName, email, phone, company, city, province, postalCode,
        courseId, firstAidLevel, cprLevel, courseLength, locationId, instructorName,
        notes, assessmentStatus, completionStatus 
      } = data;
      
      // Check if student already exists
      const { data: existingStudent, error: studentCheckError } = await supabase
        .from('student_enrollment_profiles')
        .select('id, email')
        .eq('email', email.toLowerCase())
        .single();

      if (existingStudent) {
        // Update existing student with new information
        const { data: updatedStudent, error: updateError } = await supabase
          .from('student_enrollment_profiles')
          .update({
            first_name: firstName,
            last_name: lastName,
            display_name: `${firstName} ${lastName}`,
            phone: phone || null,
            company: company || null,
            city: city || null,
            province: province || null,
            postal_code: postalCode || null,
            first_aid_level: firstAidLevel || null,
            cpr_level: cprLevel || null,
            course_length: courseLength || null,
            location_id: locationId || null,
            instructor_name: instructorName || null,
            notes: notes || null,
            assessment_status: assessmentStatus,
            completion_status: completionStatus,
            last_sync_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingStudent.id)
          .select('id')
          .single();

        if (updateError) throw new Error(`Failed to update student: ${updateError.message}`);
        
        return {
          success: true,
          message: `Successfully updated existing student: ${firstName} ${lastName}`,
          studentId: existingStudent.id,
          isUpdate: true
        };
      } else {
        // Create new student profile with all certificate-ready data
        const { data: newStudent, error: studentError } = await supabase
          .from('student_enrollment_profiles')
          .insert([{
            email: email.toLowerCase(),
            first_name: firstName,
            last_name: lastName,
            display_name: `${firstName} ${lastName}`,
            phone: phone || null,
            company: company || null,
            city: city || null,
            province: province || null,
            postal_code: postalCode || null,
            first_aid_level: firstAidLevel || null,
            cpr_level: cprLevel || null,
            course_length: courseLength || null,
            location_id: locationId || null,
            instructor_name: instructorName || null,
            notes: notes || null,
            assessment_status: assessmentStatus,
            completion_status: completionStatus,
            enrollment_status: 'ACTIVE',
            is_active: true,
            imported_from: 'MANUAL_ENTRY',
            sync_status: 'SYNCED',
            import_date: new Date().toISOString(),
            last_sync_date: new Date().toISOString(),
            student_metadata: {
              created_via: 'enhanced_manual_form',
              course_id: courseId
            }
          }])
          .select('id')
          .single();

        if (studentError) throw new Error(`Failed to create student: ${studentError.message}`);
        
        return {
          success: true,
          message: `Successfully created new student: ${firstName} ${lastName}`,
          studentId: newStudent.id,
          isUpdate: false
        };
      }
    },
    onSuccess: (result) => {
      setEnrollmentResult(result);
      queryClient.invalidateQueries({ queryKey: ['student-enrollment-profiles'] });
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

  const validateForm = (): boolean => {
    const requiredFields = [
      { field: 'firstName', label: 'First name' },
      { field: 'lastName', label: 'Last name' },
      { field: 'email', label: 'Email' },
      { field: 'courseId', label: 'Course' }
    ];

    for (const { field, label } of requiredFields) {
      if (!formData[field as keyof EnhancedEnrollmentFormData]) {
        toast.error(`${label} is required`);
        return false;
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    createStudentMutation.mutate(formData);
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      city: '',
      province: '',
      postalCode: '',
      courseId: '',
      firstAidLevel: '',
      cprLevel: '',
      courseLength: '',
      locationId: '',
      instructorName: '',
      notes: '',
      assessmentStatus: 'PENDING',
      completionStatus: 'NOT_STARTED'
    });
    setEnrollmentResult(null);
  };

  const updateFormData = (field: keyof EnhancedEnrollmentFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Enhanced Student Registration
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Complete student information capture for certificate-ready enrollment
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Basic Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <UserPlus className="h-4 w-4" />
                Basic Information
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    placeholder="(XXX) XXX-XXXX"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Building className="h-4 w-4" />
                Contact Information
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company/Organization</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => updateFormData('company', e.target.value)}
                    placeholder="Enter company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => updateFormData('city', e.target.value)}
                    placeholder="Enter city"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="province">Province/State</Label>
                  <Input
                    id="province"
                    value={formData.province}
                    onChange={(e) => updateFormData('province', e.target.value)}
                    placeholder="Enter province/state"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => updateFormData('postalCode', e.target.value)}
                    placeholder="Enter postal code"
                  />
                </div>
              </div>
            </div>

            {/* Course Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <GraduationCap className="h-4 w-4" />
                Course Information
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="courseId">Course *</Label>
                  <Select value={formData.courseId} onValueChange={(value) => updateFormData('courseId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          <div className="flex flex-col">
                            <span>{course.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {course.first_aid_level} | {course.cpr_level}
                              {course.length && ` | ${course.length}h`}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseLength">Course Length (hours)</Label>
                  <Input
                    id="courseLength"
                    type="number"
                    value={formData.courseLength}
                    onChange={(e) => updateFormData('courseLength', e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="Course duration"
                    min="1"
                    max="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firstAidLevel">First Aid Level</Label>
                  <Input
                    id="firstAidLevel"
                    value={formData.firstAidLevel}
                    onChange={(e) => updateFormData('firstAidLevel', e.target.value)}
                    placeholder="Auto-filled from course"
                    readOnly={!!formData.courseId}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cprLevel">CPR Level</Label>
                  <Input
                    id="cprLevel"
                    value={formData.cprLevel}
                    onChange={(e) => updateFormData('cprLevel', e.target.value)}
                    placeholder="Auto-filled from course"
                    readOnly={!!formData.courseId}
                  />
                </div>
              </div>
            </div>

            {/* Location and Instructor Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <MapPin className="h-4 w-4" />
                Location & Instructor
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="locationId">Training Location</Label>
                  <Select value={formData.locationId} onValueChange={(value) => updateFormData('locationId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select training location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          <div className="flex flex-col">
                            <span>{location.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {location.city}, {location.state}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instructorName">Instructor Name</Label>
                  <Input
                    id="instructorName"
                    value={formData.instructorName}
                    onChange={(e) => updateFormData('instructorName', e.target.value)}
                    placeholder="Enter instructor name"
                  />
                </div>
              </div>
            </div>

            {/* Status and Notes Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <FileText className="h-4 w-4" />
                Status & Notes
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assessmentStatus">Assessment Status</Label>
                  <Select value={formData.assessmentStatus} onValueChange={(value: 'PENDING' | 'PASSED' | 'FAILED') => updateFormData('assessmentStatus', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="PASSED">Passed</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="completionStatus">Completion Status</Label>
                  <Select value={formData.completionStatus} onValueChange={(value: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED') => updateFormData('completionStatus', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => updateFormData('notes', e.target.value)}
                  placeholder="Enter any additional notes about the student or course..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={createStudentMutation.isPending}
                className="flex-1"
              >
                {createStudentMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Register Student
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Reset Form
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {enrollmentResult && (
        <Card>
          <CardHeader>
            <CardTitle>Registration Result</CardTitle>
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
              <div className="mt-3 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Student ID:</strong> {enrollmentResult.studentId}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Student profile created with all certificate-ready information. 
                  Ready for roster assignment and certificate generation workflow.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}