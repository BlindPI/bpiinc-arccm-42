
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Plus, Edit, Trash } from 'lucide-react';
import { useCourseOfferings } from '@/hooks/useCourseOfferings';
import { CourseOfferingForm } from '@/components/CourseOfferingForm';
import { format } from 'date-fns';
import { PageHeader } from '@/components/ui/PageHeader';

export default function CourseOfferingsManagement() {
  const [showForm, setShowForm] = useState(false);
  const { data: offerings, isLoading, createOffering, updateOffering } = useCourseOfferings();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-lg">Loading course offerings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Calendar className="h-7 w-7 text-primary" />}
        title="Course Offerings Management"
        subtitle="Schedule and manage course offerings across locations"
        actions={
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Offering
          </Button>
        }
      />

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Course Offering</CardTitle>
          </CardHeader>
          <CardContent>
            <CourseOfferingForm />
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {offerings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Course Offerings</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first course offering</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Course Offering
              </Button>
            </CardContent>
          </Card>
        ) : (
          offerings.map((offering) => (
            <Card key={offering.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {offering.courses?.name || 'Unknown Course'}
                    </h3>
                    <Badge className={getStatusColor(offering.status)}>
                      {offering.status}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium">Start Date</div>
                      <div className="text-gray-600">
                        {format(new Date(offering.start_date), 'MMM dd, yyyy h:mm a')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium">Location</div>
                      <div className="text-gray-600">
                        {offering.locations?.name || 'No location set'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium">Capacity</div>
                      <div className="text-gray-600">
                        0 / {offering.max_participants} enrolled
                      </div>
                    </div>
                  </div>
                </div>

                {offering.instructors && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm">
                      <span className="font-medium">Instructor: </span>
                      <span className="text-gray-600">{offering.instructors.display_name}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
