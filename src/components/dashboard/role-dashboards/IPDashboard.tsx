import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { ShieldCheck, FileText, CheckCircle, AlertCircle, Clock, BookOpen, UserCheck, Star, Calendar } from 'lucide-react';
import { ComplianceTierService, ComplianceTierInfo } from '@/services/compliance/complianceTierService';
import { ComplianceRequirementsService } from '@/services/compliance/complianceRequirementsService';
import { ComplianceService, UserComplianceRecord } from '@/services/compliance/complianceService';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { useProfile } from '@/hooks/useProfile'; // Import useProfile
import type { DatabaseUserRole } from '@/types/database-roles'; // Import DatabaseUserRole
import AvailabilityCalendar from '@/components/availability/AvailabilityCalendar';
 
 export function IPDashboard() {
   const { user } = useAuth(); // Get user from AuthContext
   const { data: userProfile, isLoading: isProfileLoading } = useProfile(); // Get userProfile and loading state
   
   const [tierInfo, setTierInfo] = useState<ComplianceTierInfo | null>(null);
   const [userRecords, setUserRecords] = useState<UserComplianceRecord[]>([]);
   const [isLoading, setIsLoading] = useState(true);
 
   useEffect(() => {
     // Check if user and profile are loaded and if it's an IP user
     if (!isProfileLoading && user && userProfile && userProfile.role === 'IP') {
       loadDashboardData(user.id, userProfile.role as 'IT' | 'IP' | 'IC' | 'AP');
     } else if (!isProfileLoading && user && userProfile && userProfile.role !== 'IP') {
       toast.error(`Access Denied: You are logged in as ${userProfile.role}, but this dashboard is for IP users.`);
       setIsLoading(false);
     } else if (!isProfileLoading && !user) {
       setIsLoading(false); // User not logged in
       toast.info("Please log in as an IP user to view this dashboard.");
     }
   }, [user, userProfile, isProfileLoading]); // Depend on user, userProfile, and their loading status
 
   const loadDashboardData = async (userId: string, role: 'IT' | 'IP' | 'IC' | 'AP') => {
     setIsLoading(true);
     try {
       // Fetch user's compliance tier information
       const info = await ComplianceTierService.getUserComplianceTierInfo(userId);
       setTierInfo(info);
 
       // Fetch user's compliance records
       const records = await ComplianceService.getUserComplianceRecords(userId);
       // Filter records relevant to the user's current role and tier, and exclude 'not_applicable'
       const filteredRecords = records.filter(record =>
         record.compliance_metrics?.required_for_roles.includes(role) &&
         record.compliance_metrics?.applicable_tiers?.includes(info?.tier || 'basic') &&
         record.compliance_status !== 'not_applicable'
       );
       setUserRecords(filteredRecords);
 
     } catch (error) {
       console.error('Error loading IP dashboard data:', error);
       toast.error('Failed to load dashboard data.');
     } finally {
       setIsLoading(false);
     }
   };
 
   if (isLoading || isProfileLoading || !user || !userProfile) { // Added isProfileLoading
     return (
       <Card className="w-full">
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <ShieldCheck className="h-5 w-5" />
             IP Compliance Dashboard
           </CardTitle>
         </CardHeader>
         <CardContent>
           <div className="flex items-center gap-2">
             <Clock className="h-4 w-4 animate-spin" />
             Loading IP Compliance Dashboard for {userProfile?.display_name || user?.email || 'user'}...
           </div>
         </CardContent>
       </Card>
     );
   }
 
   if (userProfile.role !== 'IP') { // This handles access control.
     return (
       <Card className="w-full">
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <ShieldCheck className="h-5 w-5 text-red-500" />
             IP Compliance Dashboard
           </CardTitle>
         </CardHeader>
         <CardContent>
           <AlertCircle className="h-4 w-4" />
           <AlertDescription>
             Access Denied: This dashboard is only for Instructor Provisional (IP) users.
           </AlertDescription>
         </CardContent>
       </Card>
     );
   }

  const getStatusBadge = (status: UserComplianceRecord['compliance_status']) => {
    switch (status) {
      case 'compliant': return <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">Compliant</Badge>;
      case 'non_compliant': return <Badge variant="destructive">Non-Compliant</Badge>;
      case 'warning': return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">Warning</Badge>;
      case 'pending': return <Badge variant="outline" className="bg-blue-500 hover:bg-blue-600 text-white">Pending</Badge>;
      case 'not_applicable': return <Badge variant="outline">N/A</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            IP Compliance Dashboard - {userProfile.display_name || user?.email}
          </CardTitle>
          <CardDescription>
            Overview of your compliance status as an Instructor Provisional.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tierInfo ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" /> Current Compliance Tier: 
                  <Badge variant="outline" className={`${tierInfo.tier === 'robust' ? 'bg-green-50 text-green-800 border-green-300' : 'bg-blue-50 text-blue-800 border-blue-300'} px-2 py-1`}>
                    {tierInfo.tier.charAt(0).toUpperCase() + tierInfo.tier.slice(1)}
                  </Badge>
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">{tierInfo.description}</p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <Label>Overall Completion</Label>
                  <span>{tierInfo.completed_requirements} / {tierInfo.total_requirements} requirements</span>
                </div>
                <Progress value={tierInfo.completion_percentage} className="h-2" />
                <p className="text-sm text-muted-foreground">{tierInfo.completion_percentage}% completed</p>
              </div>
            </div>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Unable to load your compliance tier information. Please contact support.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Availability Calendar */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Availability Calendar
          </CardTitle>
          <CardDescription>
            Manage your teaching schedule and availability.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AvailabilityCalendar showCurrentUserOnly={true} allowUserSelection={false} />
        </CardContent>
      </Card>

      {/* Compliance Requirements List */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Your Compliance Requirements
          </CardTitle>
          <CardDescription>
            Detailed list of requirements for your current compliance tier.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userRecords.length > 0 ? (
            <div className="space-y-4">
              {userRecords.map(record => (
                <div key={record.id} className="border p-3 rounded-md shadow-sm">
                  <div className="font-semibold flex items-center gap-2">
                    {record.compliance_metrics?.name}
                    {/* Add specific icons for IP requirements */}
                    {record.compliance_metrics?.name.includes('Participation Training') && <UserCheck className="h-4 w-4 text-purple-500" />}
                    {record.compliance_metrics?.name.includes('Practical Assessment') && <Star className="h-4 w-4 text-amber-500" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{record.compliance_metrics?.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {getStatusBadge(record.compliance_status)}
                    {record.last_checked_at && (
                      <span className="text-xs text-muted-foreground">
                        Last Updated: {new Date(record.last_checked_at).toLocaleDateString()}
                      </span>
                    )}
                    {/* Placeholder for Document Upload/Management Component */}
                    {record.compliance_metrics?.category === 'documentation' && (
                        <Badge variant="secondary">Upload Document (TODO)</Badge>
                        // <DocumentUploadComponent metricId={record.metric_id} userId={user?.id} />
                    )}
                    {/* Additional UI elements for different measurement types (e.g., numeric input) */}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No active compliance requirements found for your current tier.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}