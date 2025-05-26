
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Building, Users, GraduationCap, MapPin } from 'lucide-react';

interface ProviderMetricsWidgetProps {
  providerId: string;
}

export const ProviderMetricsWidget: React.FC<ProviderMetricsWidgetProps> = ({ providerId }) => {
  // Mock metrics data
  const metricsData = {
    totalInstructors: 24,
    activeLocations: 6,
    coursesThisMonth: 18,
    studentsEnrolled: 342,
    locationBreakdown: [
      { location: 'Center A', instructors: 8, courses: 12 },
      { location: 'Center B', instructors: 6, courses: 8 },
      { location: 'Center C', instructors: 5, courses: 10 },
      { location: 'Center D', instructors: 5, courses: 6 }
    ]
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5 text-blue-600" />
          Provider Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <Users className="h-6 w-6 text-blue-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-blue-900">{metricsData.totalInstructors}</div>
            <div className="text-sm text-blue-700">Instructors</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <MapPin className="h-6 w-6 text-green-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-green-900">{metricsData.activeLocations}</div>
            <div className="text-sm text-green-700">Locations</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <GraduationCap className="h-6 w-6 text-purple-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-purple-900">{metricsData.coursesThisMonth}</div>
            <div className="text-sm text-purple-700">Courses</div>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded-lg">
            <Users className="h-6 w-6 text-amber-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-amber-900">{metricsData.studentsEnrolled}</div>
            <div className="text-sm text-amber-700">Students</div>
          </div>
        </div>

        <div className="h-48">
          <h4 className="font-medium mb-2">Activity by Location</h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metricsData.locationBreakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="location" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="courses" fill="#3b82f6" name="Courses" />
              <Bar dataKey="instructors" fill="#10b981" name="Instructors" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
