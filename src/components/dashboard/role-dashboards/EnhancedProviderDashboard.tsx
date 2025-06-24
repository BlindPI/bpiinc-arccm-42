/**
 * ENHANCED PROVIDER DASHBOARD - ALIGNED WITH PROVIDER MANAGEMENT
 * 
 * ✅ Uses proven providerRelationshipService (replaces useProviderDashboardData)
 * ✅ Includes team assignment management (missing in original)
 * ✅ Includes location assignment management (missing in original)
 * ✅ Real-time data with location ID mismatch handling
 * ✅ Role-based access control aligned with UnifiedProviderDashboard
 * ✅ Bulk operations support
 * ✅ Performance metrics integration
 * ✅ Integrated Dual-Tier Compliance Management and Display
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { providerRelationshipService } from '@/services/provider/providerRelationshipService';
import { validateDashboardDataSources, logValidationResults } from '@/utils/validateDashboardDataSources';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { ComplianceTierService } from '@/services/compliance/complianceTierService'; // New Import
import { ComplianceRequirementsService } from '@/services/compliance/complianceRequirementsService'; // New Import needed for assignRoleRequirements
import { ComplianceService } from '@/services/compliance/complianceService'; // Added missing import
import toast from 'react-hot-toast'; // Added missing import
import { ComplianceTierManager } from '@/components/compliance/ComplianceTierManager'; // Re-confirming explicit import
import {
  GraduationCap,
  Calendar,
  Users,
  Award,
  ClipboardList,
  Building2,
  MapPin,
  TrendingUp,
  RefreshCw,
  Plus,
  Eye,
  CheckCircle,
  AlertTriangle,
  Crown,
  Shield,
  UserCheck,
  AlertCircle,
  Clock,
  FileText,
  Target,
  Edit,
  ChevronRight
} from 'lucide-react';
import { WorkingDashboardActionButton } from '../ui/WorkingDashboardActionButton';
import { InlineLoader } from '@/components/ui/LoadingStates';
import type { DatabaseUserRole } from '@/types/database-roles';
import { hasEnterpriseAccess } from '@/types/database-roles';
import { UserProfile } from '@/types/auth'; // Ensure thisUserProfile includes 'compliance_tier' implicitly or explicitly
import { DashboardConfig } from '@/hooks/useDashboardConfig';

interface EnhancedProviderDashboardProps {
  config: DashboardConfig;
  profile: UserProfile;
}

interface ProviderData {
  id: string;
  name: string;
  status: string;
  provider_type: string;
}

const EnhancedProviderDashboard: React.FC<EnhancedProviderDashboardProps> = ({ config, profile }) => {
  const { user } = useAuth();
  const { data: userProfile } = useProfile(); // This userProfile should ideally have compliance_tier
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [validationResults, setValidationResults] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any | null>(null); // This `any` will be refined below
  const [isComplianceDialogOpen, setIsComplianceDialogOpen] = useState(false);
  
  // Role-based access control (aligned with UnifiedProviderDashboard)
  const userRole = userProfile?.role as DatabaseUserRole;
  const hasEnterprise = userRole ? hasEnterpriseAccess(userRole) : false;
  const isAdmin = userRole === 'SA' || userRole === 'AD';
  const isAPUser = userRole === 'AP';

  const roleBasedActions = {
    canCreate: isAdmin,
    canEdit: isAdmin || isAPUser, // AP users can edit team members (including compliance)
    canDelete: isAdmin,
    canViewPerformance: isAdmin || isAPUser,
    canManageTeams: isAdmin || isAPUser,
    canExportData: isAdmin || hasEnterprise
  };

  // Get user's provider context (if they are an AP user)
  const { 
    data: userProviders, 
    isLoading: providersLoading,
    refetch: refetchProviders 
  } = useQuery({
    queryKey: ['user-providers', user?.id, userRole],
    queryFn: async () => {
      console.log('🔍 ENHANCED DASHBOARD: Loading providers with validation...');
      
      // Run validation first
      const validation = await validateDashboardDataSources();
      setValidationResults(validation);
      await logValidationResults(validation);
      
      // For AP users, find their provider record using user_id relationship
      if (isAPUser && user?.id) {
        console.log('🔍 ENHANCED DASHBOARD: Looking up AP user provider record for user ID:', user.id);
        
        // Query authorized_providers table by user_id
        const { data: providerRecord, error } = await supabase
          .from('authorized_providers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error) {
          console.error('🚨 ENHANCED DASHBOARD: Error finding provider record:', error);
          return [];
        }
        
        if (providerRecord) {
          console.log('✅ ENHANCED DASHBOARD: Found provider record:', providerRecord.name, providerRecord.id);
          return [providerRecord];
        } else {
          console.log('❌ ENHANCED DASHBOARD: No provider record found for user_id:', user.id);
          return [];
        }
      }
      
      // For admins, show recent providers
      if (isAdmin) {
        return await providerRelationshipService.getProviders({ 
          status: ['active', 'APPROVED'] 
        });
      }
      
      return [];
    },
    enabled: !!user && !!userRole,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Get comprehensive metrics using proven service
  const { 
    data: providerMetrics, 
    isLoading: metricsLoading 
  } = useQuery({
    queryKey: ['enhanced-provider-metrics', selectedProvider || userProviders?.[0]?.id],
    queryFn: async () => {
      const providerId = selectedProvider || userProviders?.[0]?.id;
      if (!providerId) return null;
      
      console.log('🔍 ENHANCED DASHBOARD: Loading comprehensive metrics...');
      
      // Use proven service methods with location ID mismatch handling
      const [kpis, teamStats, performanceData] = await Promise.all([
        providerRelationshipService.getProviderLocationKPIs(providerId),
        providerRelationshipService.getProviderTeamStatistics(providerId),
        providerRelationshipService.getProviderPerformanceMetrics(providerId)
      ]);
      
      return {
        kpis,
        teamStats,
        performanceData,
        providerId
      };
    },
    enabled: !!(selectedProvider || userProviders?.[0]?.id),
    refetchInterval: 30000
  });

  // Get team assignments (including new compliance_tier for members)
  const {
    data: teamAssignments,
    isLoading: teamsLoading
  } = useQuery({
    queryKey: ['enhanced-provider-teams', selectedProvider || userProviders?.[0]?.id],
    queryFn: async () => {
      const providerId = selectedProvider || userProviders?.[0]?.id;
      if (!providerId) return [];
      
      console.log('🔍 ENHANCED DASHBOARD: Loading team assignments...');
      // Ensure providerRelationshipService.getProviderTeamAssignments fetches compliance_tier
      return await providerRelationshipService.getProviderTeamAssignments(providerId);
    },
    enabled: !!(selectedProvider || userProviders?.[0]?.id)
  });

  // Get provider's primary location
  const {
    data: locationAssignments,
    isLoading: locationsLoading
  } = useQuery({
    queryKey: ['enhanced-provider-locations', selectedProvider || userProviders?.[0]?.id],
    queryFn: async () => {
      const providerId = selectedProvider || userProviders?.[0]?.id;
      if (!providerId) return [];
      
      console.log('🔍 ENHANCED DASHBOARD: Loading provider primary location...');
      
      const { data: provider, error: providerError } = await supabase
        .from('authorized_providers')
        .select('primary_location_id')
        .eq('id', providerId)
        .single();
      
      if (providerError || !provider?.primary_location_id) {
        console.log('🔍 ENHANCED DASHBOARD: No primary location found for provider');
        return [];
      }
      
      const { data: location, error: locationError } = await supabase
        .from('locations')
        .select('id, name, address, city, state')
        .eq('id', provider.primary_location_id)
        .single();
      
      if (locationError || !location) {
        console.log('🔍 ENHANCED DASHBOARD: Location details not found');
        return [];
      }
      
      console.log('✅ ENHANCED DASHBOARD: Found primary location:', location.name);
      
      return [{
        id: `${providerId}-${location.id}-primary`,
        provider_id: providerId,
        location_id: location.id,
        assignment_role: 'primary',
        start_date: new Date().toISOString().split('T')[0],
        status: 'active',
        location_name: location.name,
        location_address: `${location.address || ''}, ${location.city || ''}, ${location.state || ''}`.replace(/^,\s*|,\s*$/g, ''),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }];
    },
    enabled: !!(selectedProvider || userProviders?.[0]?.id)
  });

  // Get real performance metrics from actual activity data (NO SIMULATIONS)
  const {
    data: realPerformanceMetrics,
    isLoading: performanceLoading
  } = useQuery({
    queryKey: ['real-activity-performance-metrics', selectedProvider || userProviders?.[0]?.id],
    queryFn: async () => {
      const providerId = selectedProvider || userProviders?.[0]?.id;
      if (!providerId) return null;
      
      console.log('🔍 ENHANCED DASHBOARD: Loading REAL performance metrics from actual activity data...');
      
      const currentMetrics = await providerRelationshipService.getProviderLocationKPIs(providerId);
      
      const { data: historicalData, error } = await supabase
        .from('provider_performance_metrics')
        .select('*')
        .eq('provider_id', providerId)
        .order('measurement_period', { ascending: false })
        .limit(12);
      
      if (error) {
        console.log('🔍 ENHANCED DASHBOARD: No historical performance data found in database');
      }
      
      console.log('✅ ENHANCED DASHBOARD: Real current metrics loaded, historical records:', historicalData?.length || 0);
      
      return {
        currentPeriod: {
          ...currentMetrics,
          measurement_period: new Date().toISOString().split('T')[0]
        },
        historicalRecords: historicalData || []
      };
    },
    enabled: !!(selectedProvider || userProviders?.[0]?.id)
  });

  // Get comprehensive compliance data for team members
  const {
    data: complianceData,
    isLoading: complianceLoading
  } = useQuery({
    queryKey: ['provider-compliance-data', selectedProvider || userProviders?.[0]?.id],
    queryFn: async () => {
      const providerId = selectedProvider || userProviders?.[0]?.id;
      if (!providerId) return null;
      
      console.log('🔍 PHASE 4: Loading comprehensive compliance data...');
      
      const [teamMemberComplianceMetrics, complianceSummary, overdueMembers, complianceByTeam] = await Promise.all([
        // Ensure this service method fetches compliance_tier from profiles
        providerRelationshipService.getProviderTeamMemberCompliance(providerId), 
        providerRelationshipService.getProviderComplianceSummary(providerId),
        providerRelationshipService.getOverdueComplianceMembers(providerId),
        providerRelationshipService.getComplianceByTeam(providerId)
      ]);
      
      console.log(`✅ PHASE 4: Loaded compliance data - ${teamMemberComplianceMetrics.length} members, ${overdueMembers.length} overdue`);
      
      return {
        teamMemberCompliance: teamMemberComplianceMetrics,
        complianceSummary,
        overdueMembers,
        complianceByTeam,
        providerId
      };
    },
    enabled: !!(selectedProvider || userProviders?.[0]?.id),
    refetchInterval: 60000 
  });

  // Get detailed compliance requirements for selected member
  // This query is updated to leverage new ComplianceTierService and ComplianceRequirementsService
  const {
    data: selectedMemberCompliance,
    isLoading: memberComplianceLoading,
    refetch: refetchMemberCompliance
  } = useQuery({
    queryKey: ['member-compliance-details', selectedMember?.user_id],
    queryFn: async () => {
      if (!selectedMember?.user_id) return null;
      
      console.log('🔍 Loading detailed compliance for member:', selectedMember.member_name);
      
      // Get user's profile to determine their actual role and assigned tier
      const { data: userProfileData, error: profileError } = await supabase
        .from('profiles')
        .select('role, compliance_tier')
        .eq('id', selectedMember.user_id)
        .single();
      
      if (profileError || !userProfileData) {
        console.error('Error fetching user profile for compliance details:', profileError);
        return null; 
      }

      const complianceRole = userProfileData.role as 'AP' | 'IC' | 'IP' | 'IT';
      const complianceTier = userProfileData.compliance_tier || 'basic'; // Default to basic if null

      console.log(`🔍 User ${selectedMember.member_name}: User Role = ${complianceRole}, Tier = ${complianceTier}`);

      // Get user's existing compliance records
      const complianceRecords = await ComplianceService.getUserComplianceRecords(selectedMember.user_id);
      
      // Get the compliance template for the specific role and tier
      const roleTemplate = ComplianceRequirementsService.getRequirementsTemplateByTier(complianceRole, complianceTier);
      
      // Get all relevant metrics from the DB that apply to this role and tier
      const applicableMetrics = await ComplianceService.getComplianceMetrics({ 
        role: complianceRole, 
        tier: complianceTier 
      });
      
      console.log(`🔍 Found ${applicableMetrics.length} applicable requirements and ${complianceRecords.length} existing records for role ${complianceRole}, tier ${complianceTier}`);
      
      // Combine applicable metrics with existing records to show status
      const requirementsWithStatus = applicableMetrics.map(metric => {
        const existingRecord = complianceRecords.find(record =>
          record.metric_id === metric.id
        );
        
        return {
          name: metric.name,
          description: metric.description,
          category: metric.category,
          measurement_type: metric.measurement_type,
          target_value: metric.target_value,
          weight: metric.weight,
          is_required: metric.is_active, 
          document_requirements: metric.category === 'documentation' ? { 
            required_file_types: ['PDF'], max_file_size_mb: 5, requires_expiry_date: true, description: 'Document required' 
          } : undefined, 
          metric_id: metric.id,
          current_value: existingRecord?.current_value,
          compliance_status: existingRecord?.compliance_status || 'pending',
          last_checked_at: existingRecord?.last_checked_at,
          next_check_due: existingRecord?.next_check_due,
          notes: existingRecord?.notes,
          record_id: existingRecord?.id
        };
      }) || [];
      
      return {
        member: selectedMember,
        complianceRole,
        complianceTier, 
        roleTemplate,
        requirementsWithStatus,
        hasExistingRecords: complianceRecords.length > 0
      };
    },
    enabled: !!selectedMember?.user_id,
    refetchOnWindowFocus: false 
  });
...........................................................................