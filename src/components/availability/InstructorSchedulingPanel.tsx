import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Users, FileText, Award, MapPin, Building } from 'lucide-react';
import { AvailabilityManagement } from './AvailabilityManagement';
import { RosterManagement } from '../roster/RosterManagement';
import { DocumentUploadComponent } from '../documents/DocumentUploadComponent';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface InstructorContext {
  teamName: string;
  locationName: string;
  role: string;
  displayName: string;
}

export const InstructorSchedulingPanel: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('schedule');
  const [instructorContext, setInstructorContext] = useState<InstructorContext | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadInstructorContext();
    }
  }, [user?.id]);

  const loadInstructorContext = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          teams(name, location_id, locations(name)),
          profiles(display_name, role)
        `)
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .single();

      if (error) throw error;

      if (data) {
        setInstructorContext({
          teamName: (data.teams as any)?.name || 'No Team',
          locationName: (data.teams as any)?.locations?.name || 'No Location',
          role: (data.profiles as any)?.role || 'IC',
          displayName: (data.profiles as any)?.display_name || 'Instructor'
        });
      }
    } catch (error) {
      console.error('Error loading instructor context:', error);
    } finally {
      setIsLoadingContext(false);
    }
  };

  if (!user) {
    return <div>Please log in to access scheduling.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Instructor Context Header */}
      {!isLoadingContext && instructorContext && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{instructorContext.displayName}</h2>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    <span>{instructorContext.teamName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{instructorContext.locationName}</span>
                  </div>
                  <Badge variant="outline">{instructorContext.role}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
          <InstructorCompliancePanel userId={user.id} instructorContext={instructorContext} />
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

// Enhanced Compliance Panel Component
interface InstructorCompliancePanelProps {
  userId: string;
  instructorContext: InstructorContext | null;
}

function InstructorCompliancePanel({ userId, instructorContext }: InstructorCompliancePanelProps) {
  const [complianceRequirements, setComplianceRequirements] = useState<any[]>([]);
  const [userCompliance, setUserCompliance] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadComplianceData();
  }, [userId]);

  const loadComplianceData = async () => {
    try {
      // Load compliance requirements for instructor role
      const { data: requirements, error: reqError } = await supabase
        .from('compliance_requirements')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (reqError) throw reqError;

      // For now, show requirements without status tracking
      // This can be enhanced when user_compliance table is created
      setComplianceRequirements(requirements || []);
      setUserCompliance([]);
    } catch (error) {
      console.error('Error loading compliance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getComplianceStatus = (requirementId: string) => {
    const userComp = userCompliance.find(uc => uc.requirement_id === requirementId);
    return userComp?.status || 'not_started';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 hover:bg-green-600 text-white">Complete</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">In Progress</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Context Header */}
      {instructorContext && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Compliance Requirements - {instructorContext.teamName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Manage your compliance documents and training requirements for {instructorContext.locationName}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Compliance Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Required Training & Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {complianceRequirements.map((req) => (
              <div key={req.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{req.icon}</span>
                    <h3 className="font-medium">{req.name}</h3>
                    {getStatusBadge(getComplianceStatus(req.id))}
                  </div>
                  <Badge 
                    variant={req.is_mandatory ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {req.is_mandatory ? 'Mandatory' : 'Optional'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{req.description}</p>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Category: {req.category}</span>
                  <span>Due: {req.due_days_from_assignment} days from assignment</span>
                  <span>Est. Time: {req.estimated_completion_time} minutes</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Document Upload */}
      <DocumentUploadComponent 
        metricName="Instructor Training Documents"
        userId={userId}
      />
    </div>
  );
}