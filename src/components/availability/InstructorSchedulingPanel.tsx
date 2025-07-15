import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, Users, FileText, Award } from 'lucide-react';
import { AvailabilityManagement } from './AvailabilityManagement';
import { RosterManagement } from '../roster/RosterManagement';
import { DocumentUploadComponent } from '../documents/DocumentUploadComponent';
import { useAuth } from '@/contexts/AuthContext';

export const InstructorSchedulingPanel: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('schedule');

  if (!user) {
    return <div>Please log in to access scheduling.</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="schedule" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Training Sessions
          </TabsTrigger>
          <TabsTrigger value="rosters" className="gap-2">
            <Users className="h-4 w-4" />
            Student Rosters
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="certificates" className="gap-2">
            <Award className="h-4 w-4" />
            Certificates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Training Sessions & Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <AvailabilityManagement userId={user.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rosters" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Student Rosters</CardTitle>
            </CardHeader>
            <CardContent>
              <RosterManagement instructorId={user.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Training Documents & Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentUploadComponent 
                metricName="Instructor Training Documents"
                userId={user.id}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Certificate Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Submit completed rosters for certificate processing. 
                Once sessions are marked complete and all students have passed, 
                certificates can be generated through the batch workflow system.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};