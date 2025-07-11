import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StudentProfile } from '@/hooks/useStudentManagement';
import { format } from 'date-fns';

interface StudentDetailModalProps {
  student: StudentProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<StudentProfile>) => Promise<boolean>;
  isLoading: boolean;
}

export function StudentDetailModal({ 
  student, 
  isOpen, 
  onClose, 
  onSave, 
  isLoading 
}: StudentDetailModalProps) {
  const [formData, setFormData] = useState<Partial<StudentProfile>>({});
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (student) {
      setFormData({
        email: student.email,
        first_name: student.first_name || '',
        last_name: student.last_name || '',
        display_name: student.display_name || '',
        external_student_id: student.external_student_id || '',
        enrollment_status: student.enrollment_status,
        is_active: student.is_active,
        student_metadata: student.student_metadata || {}
      });
    }
  }, [student]);

  const handleSave = async () => {
    if (!student) return;
    
    const success = await onSave(formData);
    if (success) {
      onClose();
    }
  };

  const updateMetadata = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      student_metadata: {
        ...prev.student_metadata,
        [key]: value
      }
    }));
  };

  if (!student) return null;

  const metadata = student.student_metadata || {};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Student Profile: {student.display_name || student.email}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="enrollment">Enrollment Data</TabsTrigger>
            <TabsTrigger value="metadata">Additional Data</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="external_id">External ID</Label>
                <Input
                  id="external_id"
                  value={formData.external_student_id || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, external_student_id: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  value={formData.display_name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Enrollment Status</Label>
                <Select 
                  value={formData.enrollment_status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, enrollment_status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="is_active">Active Student</Label>
            </div>
          </TabsContent>

          <TabsContent value="enrollment" className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Enrollment Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Enrollments:</span>
                      <span className="font-semibold">{metadata.enrollments || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Amount Spent:</span>
                      <span className="font-semibold">${metadata.amount_spent || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sign-in Count:</span>
                      <span className="font-semibold">{metadata.sign_in_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Sign-in:</span>
                      <span className="text-sm text-muted-foreground">
                        {metadata.last_sign_in ? format(new Date(metadata.last_sign_in), 'PPp') : 'Never'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Course Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-sm font-medium">Enrolled Courses:</Label>
                      <div className="mt-1">
                        {metadata.enrollments_list ? (
                          metadata.enrollments_list.split(',').map((course: string, index: number) => (
                            <Badge key={index} variant="secondary" className="mr-1 mb-1">
                              {course.trim()}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No courses listed</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="metadata" className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={metadata.country || ''}
                  onChange={(e) => updateMetadata('country', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={metadata.postal_code || ''}
                  onChange={(e) => updateMetadata('postal_code', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Input
                  id="region"
                  value={metadata.region || ''}
                  onChange={(e) => updateMetadata('region', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="external_source">External Source</Label>
                <Input
                  id="external_source"
                  value={metadata.external_source || ''}
                  onChange={(e) => updateMetadata('external_source', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="referred_by">Referred By</Label>
                <Input
                  id="referred_by"
                  value={metadata.referred_by || ''}
                  onChange={(e) => updateMetadata('referred_by', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="referred_from">Referred From</Label>
                <Input
                  id="referred_from"
                  value={metadata.referred_from || ''}
                  onChange={(e) => updateMetadata('referred_from', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roles">Roles</Label>
                <Input
                  id="roles"
                  value={metadata.roles || ''}
                  onChange={(e) => updateMetadata('roles', e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
                <CardDescription>Technical details and import history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Student ID:</span>
                    <span className="text-sm text-muted-foreground">{student.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Import Source:</span>
                    <Badge variant="outline">{student.imported_from}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Import Date:</span>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(student.import_date), 'PPp')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Last Sync:</span>
                    <span className="text-sm text-muted-foreground">
                      {student.last_sync_date ? format(new Date(student.last_sync_date), 'PPp') : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Sync Status:</span>
                    <Badge variant={student.sync_status === 'SYNCED' ? 'default' : 'secondary'}>
                      {student.sync_status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Created:</span>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(student.created_at), 'PPp')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Last Updated:</span>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(student.updated_at), 'PPp')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}