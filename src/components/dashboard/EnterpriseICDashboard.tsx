import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  ShieldCheck, FileText, CheckCircle, AlertCircle, Clock, 
  BookOpen, Award, FilePen, CalendarCheck, GraduationCap,
  Upload, Users, MapPin, Building, User, Calendar,
  Download, Eye, Edit
} from 'lucide-react';
import { ComplianceTierService, ComplianceTierInfo } from '@/services/compliance/complianceTierService';
import { ComplianceService, UserComplianceRecord } from '@/services/compliance/complianceService';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useTeamMemberships } from '@/hooks/useTeamMemberships';
import { useAPUserLocationTeams } from '@/hooks/useAPUserLocationTeams';
import { toast } from 'sonner';
import { ComplianceStatusWidget } from './widgets/ComplianceStatusWidget';
import WorkingDashboardActionButton from './ui/WorkingDashboardActionButton';
import { DocumentUploadComponent } from '@/components/documents/DocumentUploadComponent';
import { RosterManagement } from '@/components/roster/RosterManagement';
import { AvailabilityManagement } from '@/components/availability/AvailabilityManagement';

export function EnterpriseICDashboard() {
  const { user } = useAuth();
  const { data: userProfile, isLoading: isProfileLoading } = useProfile();
  const { data: teamMemberships, isLoading: teamsLoading } = useTeamMemberships();
  const { data: apLocationData, isLoading: locationLoading } = useAPUserLocationTeams(user?.id || '');

  const [tierInfo, setTierInfo] = useState<ComplianceTierInfo | null>(null);
  const [userRecords, setUserRecords] = useState<UserComplianceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<File | null>(null);
  const [uploadNotes, setUploadNotes] = useState('');

  useEffect(() => {
    if (!isProfileLoading && user && userProfile && userProfile.role === 'IC') {
      loadDashboardData(user.id, userProfile.role);
    } else if (!isProfileLoading && user && userProfile && userProfile.role !== 'IC') {
      toast.error(`Access Denied: This dashboard is for IC users only.`);
      setIsLoading(false);
    }
  }, [user, userProfile, isProfileLoading]);

  const loadDashboardData = async (userId: string, role: string) => {
    setIsLoading(true);
    try {
      const info = await ComplianceTierService.getUserComplianceTierInfo(userId);
      setTierInfo(info);

      const records = await ComplianceService.getUserComplianceRecords(userId);
      
      // Enhanced filtering with proper array handling
      const filteredRecords = records.filter(record => {
        const metric = record.compliance_metrics;
        if (!metric) return false;
        
        const isRequiredForRole = Array.isArray(metric.required_for_roles) 
          ? metric.required_for_roles.includes(role)
          : false;
          
        const isApplicableForTier = metric.applicable_tiers
          ? metric.applicable_tiers.includes(info?.tier || 'basic')
          : true;
          
        return isRequiredForRole && isApplicableForTier && record.compliance_status !== 'not_applicable';
      });
      
      setUserRecords(filteredRecords);
    } catch (error) {
      console.error('Error loading IC dashboard data:', error);
      toast.error('Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentUpload = async (metricId: string) => {
    // This is now handled by the DocumentUploadComponent
    await loadDashboardData(user.id, userProfile?.role || 'IC');
  };

  const getStatusBadge = (status: UserComplianceRecord['compliance_status']) => {
    switch (status) {
      case 'compliant':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">Compliant</Badge>;
      case 'non_compliant':
        return <Badge variant="destructive">Non-Compliant</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">Warning</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-blue-500 hover:bg-blue-600 text-white">Pending</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (isLoading || isProfileLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Enterprise IC Compliance Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 animate-spin" />
            Loading your enterprise dashboard...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (userProfile?.role !== 'IC') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-red-500" />
            Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This dashboard is only for Instructor Certified (IC) users.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const primaryTeam = teamMemberships?.find(tm => tm.role === 'ADMIN') || teamMemberships?.[0];
  // Access team and location data properly
  const assignedTeam = apLocationData?.assignedTeams?.[0];
  const assignedLocation = apLocationData?.assignedLocation;

  return (
    <div className="space-y-6">
      {/* Header Dashboard */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Enterprise IC Compliance Dashboard - {userProfile.display_name}
          </CardTitle>
          <CardDescription>
            Complete compliance management for Instructor Certified professionals
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Team & Location Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              Team Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {primaryTeam || assignedTeam ? (
              <div>
                <p className="font-medium">{assignedTeam?.name || primaryTeam?.team_id || 'Team Assigned'}</p>
                <p className="text-sm text-muted-foreground">Role: {primaryTeam?.role || 'Member'}</p>
                <Badge variant="outline">{primaryTeam?.status || 'active'}</Badge>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No team assignment</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assignedLocation ? (
              <div>
                <p className="font-medium">{assignedLocation.name}</p>
                <p className="text-sm text-muted-foreground">{assignedLocation.city}, {assignedLocation.state}</p>
                <p className="text-xs text-muted-foreground">{assignedLocation.address}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No location assigned</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              AP Supervisor
            </CardTitle>
          </CardHeader>
          <CardContent>
            {apLocationData?.provider ? (
              <div>
                <p className="font-medium">{apLocationData.provider.name}</p>
                <p className="text-sm text-muted-foreground">{apLocationData.provider.contact_email}</p>
                <p className="text-xs text-muted-foreground">{apLocationData.provider.contact_phone}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No AP supervisor assigned</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <WorkingDashboardActionButton
              icon={Calendar}
              label="View Schedule"
              description="Availability & bookings"
              path="/availability"
              colorScheme="blue"
            />
            <WorkingDashboardActionButton
              icon={Users}
              label="View Rosters"
              description="Assigned students"
              path="/rosters"
              colorScheme="green"
            />
            <WorkingDashboardActionButton
              icon={FileText}
              label="Upload Documents"
              description="Compliance files"
              path="/documents"
              colorScheme="purple"
            />
            <WorkingDashboardActionButton
              icon={Award}
              label="Certificates"
              description="View & manage"
              path="/certificates"
              colorScheme="amber"
            />
          </div>
        </CardContent>
      </Card>

      {/* Compliance Status Widget */}
      <ComplianceStatusWidget userId={user?.id || ''} />

      {/* Compliance Requirements with Document Upload */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Compliance Requirements & Documents
          </CardTitle>
          <CardDescription>
            Track requirements and upload supporting documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userRecords.length > 0 ? (
            <div className="space-y-6">
              {userRecords.map(record => (
                <div key={record.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold flex items-center gap-2">
                        {record.compliance_metrics?.name}
                        {record.compliance_metrics?.name?.includes('Teaching Practice') && <GraduationCap className="h-4 w-4 text-orange-500" />}
                        {record.compliance_metrics?.name?.includes('Written Examination') && <FilePen className="h-4 w-4 text-fuchsia-500" />}
                        {record.compliance_metrics?.name?.includes('CPR/First Aid') && <Award className="h-4 w-4 text-amber-500" />}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {record.compliance_metrics?.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {getStatusBadge(record.compliance_status)}
                        {record.last_checked_at && (
                          <span className="text-xs text-muted-foreground">
                            Last Updated: {new Date(record.last_checked_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Document Upload Section */}
                  {record.compliance_metrics?.category === 'documentation' && (
                    <DocumentUploadComponent
                      metricName={record.compliance_metrics?.name || 'Document Upload'}
                      userId={user?.id || ''}
                      onUploadComplete={() => handleDocumentUpload(record.metric_id)}
                    />
                  )}

                  {/* Progress tracking for measurable requirements */}
                  {record.compliance_metrics?.measurement_type === 'percentage' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{record.current_value || 0}%</span>
                      </div>
                      <Progress value={Number(record.current_value) || 0} className="h-2" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No active compliance requirements found. Contact your administrator if this seems incorrect.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Roster Management */}
      <RosterManagement 
        instructorId={user?.id || ''} 
        showTeamRostersOnly={false}
      />

      {/* Availability & Schedule Management */}
      <AvailabilityManagement 
        userId={user?.id || ''} 
        showTeamBookings={false}
      />
    </div>
  );
}