import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, Search, User, FileText, CheckCircle, XCircle, Clock, AlertTriangle, Eye, Download, Users, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface RoleComplianceData {
  role: string;
  totalUsers: number;
  basicTierCompliance: number;
  robustTierCompliance: number;
  overallCompliance: number;
  users: UserSummary[];
}

interface UserSummary {
  user_id: string;
  display_name: string;
  email: string;
  role: string;
  compliance_tier: string;
  compliance_score: number;
  total_requirements: number;
  compliant_count: number;
  warning_count: number;
  non_compliant_count: number;
  pending_count: number;
  overdue_count: number;
  last_activity: string;
}

interface ComplianceDocument {
  id: string;
  file_name: string;
  upload_date: string;
  verification_status: string;
  file_path: string;
}

interface UserComplianceRecord {
  id: string;
  user_id: string;
  metric_id: string;
  requirement_id: string;
  status: string;
  completion_percentage: number;
  current_value: string;
  target_value: string;
  evidence_files: any[];
  due_date: string;
  reviewer_id: string;
  review_notes: string;
  requirement_name?: string;
  requirement_description?: string;
  tier_level?: string;
  category?: string;
  document_required?: boolean;
  uploaded_documents?: ComplianceDocument[];
}

export default function UserComplianceManager() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [roleData, setRoleData] = useState<RoleComplianceData[]>([]);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
  const [complianceRecords, setComplianceRecords] = useState<UserComplianceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingRecord, setUploadingRecord] = useState<string | null>(null);
  const [showApproveModal, setShowApproveModal] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<string | null>(null);
  const [actionNotes, setActionNotes] = useState<string>('');

  useEffect(() => {
    fetchUsersAndRoleData();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchUserComplianceRecords(selectedUser.user_id);
    }
  }, [selectedUser]);

  const fetchUsersAndRoleData = async () => {
    try {
      console.log('🪲 UserComplianceManager: Fetching users and role data...');
      console.log('🪲 UserComplianceManager: Current user ID:', currentUser?.id);
      
      const { data: allUsers, error } = await supabase
        .from('compliance_dashboard_summary')
        .select('*')
        .order('role', { ascending: true });

      if (error) throw error;
      
      console.log('🪲 UserComplianceManager: Raw users data:', allUsers);
      console.log('🪲 UserComplianceManager: Found users with SA role:', allUsers?.filter(u => u.role === 'SA'));
      
      // 🪲 DIAGNOSTIC: Check for 23% compliance scores
      const usersWithIssues = allUsers?.filter(user => user.compliance_score === 23);
      if (usersWithIssues && usersWithIssues.length > 0) {
        console.log('🚨 FOUND USERS WITH 23% COMPLIANCE:', usersWithIssues);
        usersWithIssues.forEach(user => {
          console.log('🚨 User Details:', {
            display_name: user.display_name,
            compliance_score: user.compliance_score,
            total_requirements: user.total_requirements,
            compliant_count: user.compliant_count,
            non_compliant_count: user.non_compliant_count,
            pending_count: user.pending_count,
            warning_count: user.warning_count,
            overdue_count: user.overdue_count
          });
        });
      }
      
      // 🪲 DIAGNOSTIC: Check all users with compliance_score > 0 but compliant_count = 0
      const suspiciousUsers = allUsers?.filter(user =>
        user.compliance_score > 0 && user.compliant_count === 0
      );
      if (suspiciousUsers && suspiciousUsers.length > 0) {
        console.log('🚨 SUSPICIOUS: Users with compliance_score > 0 but compliant_count = 0:', suspiciousUsers);
      }
      
      // CRITICAL FIX: Show ALL roles including SA/AD but handle them differently
      const filteredUsers = (allUsers || []).filter(user => {
        // Exclude current user to prevent personal compliance data viewing
        if (user.user_id === currentUser?.id) {
          console.log('🚫 Filtering out current user:', user.display_name);
          return false;
        }
        
        // Include all other users including SA/AD admin users for complete role visibility
        return true;
      });
      
      console.log('🪲 UserComplianceManager: Filtered users (admin-view only):', filteredUsers.length, 'of', allUsers?.length, 'total');
      setUsers(filteredUsers);
      
      // Group filtered users by role and calculate compliance data
      const roleGroups = filteredUsers.reduce((acc: { [key: string]: UserSummary[] }, user) => {
        const role = user.role || 'Unknown';
        if (!acc[role]) acc[role] = [];
        acc[role].push(user);
        return acc;
      }, {});

      // Calculate compliance metrics for each role
      const roleCompliance: RoleComplianceData[] = [];
      
      for (const [role, roleUsers] of Object.entries(roleGroups)) {
        const roleUsersTyped = roleUsers as UserSummary[];
        
        // Handle SA/AD admin roles that don't have compliance requirements
        if (role === 'SA' || role === 'AD') {
          roleCompliance.push({
            role,
            totalUsers: roleUsersTyped.length,
            basicTierCompliance: 100, // Admin roles are considered compliant by default
            robustTierCompliance: 100,
            overallCompliance: 100,
            users: roleUsersTyped
          });
          continue;
        }
        
        // Get compliance records for all users in this role
        const userIds = roleUsersTyped.map(u => u.user_id);
        const { data: records } = await supabase
          .from('user_compliance_records')
          .select(`
            *,
            compliance_metrics!metric_id(
              applicable_tiers
            )
          `)
          .in('user_id', userIds);

        const basicRecords = (records || []).filter(r => r.compliance_metrics?.applicable_tiers?.includes('basic'));
        const robustRecords = (records || []).filter(r => r.compliance_metrics?.applicable_tiers?.includes('robust'));

        const basicCompliant = basicRecords.filter(r => r.status === 'compliant' || r.status === 'approved').length;
        const robustCompliant = robustRecords.filter(r => r.status === 'compliant' || r.status === 'approved').length;

        const basicTierCompliance = basicRecords.length > 0 ? Math.round((basicCompliant / basicRecords.length) * 100) : 0;
        const robustTierCompliance = robustRecords.length > 0 ? Math.round((robustCompliant / robustRecords.length) * 100) : 0;
        
        // 🪲 DIAGNOSTIC: Calculate overall compliance with detailed logging
        const validScores = roleUsersTyped.filter(user => user.compliance_score != null).map(user => user.compliance_score);
        
        console.log(`🪲 Role ${role} compliance calculation:`, {
          totalUsers: roleUsersTyped.length,
          validScores,
          basicRecords: basicRecords.length,
          robustRecords: robustRecords.length,
          basicCompliant,
          robustCompliant,
          basicTierCompliance,
          robustTierCompliance
        });
        
        // 🪲 EDGE CASE TESTING: Test the fix for zero compliance
        const overallCompliance = validScores.length > 0
          ? Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length)
          : 0;
          
        // 🪲 TESTING: Check for various problematic scores
        if (overallCompliance > 0 && roleUsersTyped.every(user => user.compliant_count === 0)) {
          console.log('🚨 POTENTIAL BUG: Non-zero compliance with zero compliant items:', {
            role,
            overallCompliance,
            validScores,
            allUsersWithZeroCompliance: roleUsersTyped.map(u => ({
              name: u.display_name,
              score: u.compliance_score,
              compliant: u.compliant_count,
              total: u.total_requirements
            }))
          });
        }
        
        // 🪲 TESTING: Verify the fix worked (no more 23%)
        if (overallCompliance === 23 || validScores.includes(23)) {
          console.log('🚨 OLD BUG STILL EXISTS - 23% CALCULATION:', {
            role,
            overallCompliance,
            validScores,
            calculation: `(${validScores.join(' + ')}) / ${validScores.length} = ${validScores.reduce((sum, score) => sum + score, 0) / validScores.length}`
          });
        } else if (overallCompliance === 0 && validScores.every(score => score === 0)) {
          console.log('✅ FIX VERIFIED: Zero compliance correctly shows 0%:', {
            role,
            overallCompliance,
            validScores
          });
        }

        roleCompliance.push({
          role,
          totalUsers: roleUsersTyped.length,
          basicTierCompliance,
          robustTierCompliance,
          overallCompliance,
          users: roleUsersTyped
        });
      }

      setRoleData(roleCompliance);
    } catch (error) {
      console.error('Error fetching users and role data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserComplianceRecords = async (userId: string) => {
    try {
      console.log('🪲 DIAGNOSTIC: Fetching compliance records for userId:', userId);
      
      // 🚨 CRITICAL FIX: Get user profile to determine role and tier
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('role, compliance_tier')
        .eq('id', userId)
        .single();
      
      if (profileError) throw profileError;
      
      console.log('🚨 SA USER VIEWING USER PROFILE:', {
        viewingUserId: userId,
        userProfile: userProfile,
        role: userProfile?.role,
        compliance_tier: userProfile?.compliance_tier
      });
      
      // 🚨 CRITICAL FIX: Get ALL active metrics that apply to this user's role
      const { data: allActiveMetrics, error: metricsError } = await supabase
        .from('compliance_metrics')
        .select('*')
        .eq('is_active', true);
      
      if (metricsError) throw metricsError;
      
      // CRITICAL FIX: Correct role filtering logic
      const applicableMetrics = (allActiveMetrics || []).filter(metric => {
        // FIXED LOGIC: Empty required_for_roles means NOT role-specific
        const requiredRoles = metric.required_for_roles || [];
        const roleMatches = requiredRoles.length > 0 && requiredRoles.includes(userProfile.role);
        
        // Filter by TIER
        const userTier = userProfile.compliance_tier || 'basic';
        let tierMatches = false;
        
        if (metric.applicable_tiers) {
          // Database contains simple values like 'basic', 'robust', 'basic,robust'
          const applicableTiers = metric.applicable_tiers.split(',').map(t => t.trim());
          tierMatches = applicableTiers.includes(userTier) || applicableTiers.includes('basic,robust');
        } else {
          // If no applicable_tiers, default to basic tier only
          tierMatches = userTier === 'basic';
        }
        
        console.log(`🔍 METRIC FILTER: ${metric.name}`, {
          metric_roles: requiredRoles,
          user_role: userProfile.role,
          role_matches: roleMatches,
          metric_tiers: metric.applicable_tiers,
          user_tier: userTier,
          tier_matches: tierMatches,
          overall_match: roleMatches && tierMatches
        });
        
        return roleMatches && tierMatches;
      });
      
      console.log('🚨 APPLICABLE METRICS FOR USER:', {
        userId,
        userRole: userProfile.role,
        userTier: userProfile.compliance_tier,
        totalActiveMetrics: allActiveMetrics?.length || 0,
        applicableMetrics: applicableMetrics.length,
        applicableMetricNames: applicableMetrics.map(m => m.name),
        allMetricsWithTiers: allActiveMetrics?.map(m => ({
          name: m.name,
          applicable_tiers: m.applicable_tiers,
          matches: !m.applicable_tiers || m.applicable_tiers.includes(userProfile.compliance_tier || 'basic')
        }))
      });
      
      // Get existing user compliance records
      const { data: existingRecords, error: recordsError } = await supabase
        .from('user_compliance_records')
        .select('*')
        .eq('user_id', userId);

      if (recordsError) throw recordsError;
      
      // 🚨 CRITICAL FIX: Create missing records for new metrics
      const existingMetricIds = new Set((existingRecords || []).map(r => r.metric_id));
      const missingMetrics = applicableMetrics.filter(metric => !existingMetricIds.has(metric.id));
      
      if (missingMetrics.length > 0) {
        console.log('🚨 CREATING MISSING RECORDS:', missingMetrics.map(m => m.name));
        
        const newRecords = missingMetrics.map(metric => ({
          user_id: userId,
          metric_id: metric.id,
          compliance_status: 'pending',
          current_value: null,
          last_checked_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        const { error: insertError } = await supabase
          .from('user_compliance_records')
          .insert(newRecords);
        
        if (insertError) {
          console.error('Failed to create missing records:', insertError);
        } else {
          console.log('✅ Created', missingMetrics.length, 'missing compliance records');
        }
      }
      
      // 🚨 CRITICAL FIX: Get updated records with active metrics only
      const { data: allRecords, error: finalError } = await supabase
        .from('user_compliance_records')
        .select(`
          *,
          compliance_metrics!metric_id(
            name,
            description,
            category,
            measurement_type,
            target_value,
            weight,
            applicable_tiers,
            is_active
          )
        `)
        .eq('user_id', userId)
        .order('due_date', { ascending: true });

      if (finalError) throw finalError;
      
      // CRITICAL FIX: Correct role filtering logic
      const activeRecords = (allRecords || []).filter(record => {
        const isActive = record.compliance_metrics?.is_active === true;
        
        // FIXED LOGIC: Empty required_for_roles means NOT role-specific
        const requiredRoles = record.compliance_metrics?.required_for_roles || [];
        const roleMatches = requiredRoles.length > 0 && requiredRoles.includes(userProfile.role);
        
        // Filter by TIER
        const userTier = userProfile.compliance_tier || 'basic';
        let tierMatches = false;
        
        if (record.compliance_metrics?.applicable_tiers) {
          // Database contains simple values like 'basic', 'robust', 'basic,robust'
          const applicableTiers = record.compliance_metrics.applicable_tiers.split(',').map(t => t.trim());
          tierMatches = applicableTiers.includes(userTier) || applicableTiers.includes('basic,robust');
        } else {
          // If no applicable_tiers, default to basic tier only
          tierMatches = userTier === 'basic';
        }
        
        return isActive && roleMatches && tierMatches;
      });
      
      console.log('🚨 FILTERED RECORDS:', {
        totalRecords: allRecords?.length || 0,
        activeRecords: activeRecords.length,
        filteredOut: (allRecords?.length || 0) - activeRecords.length
      });

      // Get documents for each active record
      const recordsWithDocs = await Promise.all(
        activeRecords.map(async (record) => {
          const { data: docs } = await supabase
            .from('compliance_documents')
            .select('id, file_name, upload_date, verification_status, file_path')
            .eq('user_id', userId)
            .eq('metric_id', record.metric_id);

          return {
            ...record,
            requirement_name: record.compliance_metrics?.name || 'Unknown Requirement',
            requirement_description: record.compliance_metrics?.description || '',
            tier_level: userProfile.compliance_tier || 'basic', // CRITICAL FIX: Use USER'S actual tier, not metric's applicable tiers
            category: record.compliance_metrics?.category || 'general',
            document_required: record.compliance_metrics?.measurement_type === 'boolean' || false,
            uploaded_documents: docs || []
          };
        })
      );

      setComplianceRecords(recordsWithDocs);
    } catch (error) {
      console.error('Error fetching compliance records:', error);
    }
  };

  const handleFileUpload = async (recordId: string, file: File) => {
    setUploadingRecord(recordId);
    
    try {
      const currentRecord = complianceRecords.find(r => r.id === recordId);
      if (!currentRecord || !selectedUser) {
        throw new Error('Missing record or user data');
      }

      // Upload file to Supabase storage with proper naming
      const fileName = `compliance_${selectedUser.user_id}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('compliance-documents')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error('File upload failed');
      }

      // Upsert document record (insert or update if exists)
      const { data: docData, error: docError } = await supabase
        .from('compliance_documents')
        .upsert({
          user_id: selectedUser.user_id,
          metric_id: currentRecord.metric_id,
          file_name: file.name,
          file_path: uploadData.path,
          file_type: file.type || 'application/octet-stream',
          file_size: file.size,
          verification_status: 'pending',
          upload_date: new Date().toISOString(),
          is_current: true
        }, {
          onConflict: 'user_id,metric_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (docError) {
        console.error('Document upsert error:', docError);
        throw new Error('Document record creation failed');
      }

      // Update compliance record status
      const { error: updateError } = await supabase
        .from('user_compliance_records')
        .update({
          status: 'submitted',
          updated_at: new Date().toISOString()
        })
        .eq('id', recordId);

      if (updateError) {
        console.error('Record update error:', updateError);
        throw new Error('Status update failed');
      }

      // Refresh records to show changes
      await fetchUserComplianceRecords(selectedUser.user_id);
      
    } catch (error) {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploadingRecord(null);
    }
  };

  const updateRecordStatus = async (recordId: string, newStatus: string, notes?: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (notes) updateData.review_notes = notes;
      if (newStatus === 'approved') updateData.approved_at = new Date().toISOString();

      const { error } = await supabase
        .from('user_compliance_records')
        .update(updateData)
        .eq('id', recordId);

      if (error) throw error;
      
      await fetchUserComplianceRecords(selectedUser!.user_id);
    } catch (error) {
      console.error('Error updating record status:', error);
    }
  };

  const downloadDocument = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('compliance-documents')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'robust': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'approved': 
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
      case 'submitted': 
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'non_compliant':
      case 'rejected': 
        return <XCircle className="h-4 w-4 text-red-500" />;
      default: 
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'approved': 
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'submitted': 
        return 'bg-yellow-100 text-yellow-800';
      case 'non_compliant':
      case 'rejected': 
        return 'bg-red-100 text-red-800';
      default: 
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = selectedRole 
    ? users.filter(user => user.role === selectedRole)
    : users.filter(user =>
        user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase())
      );

  if (loading) {
    return <div className="p-6">Loading compliance data...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Compliance Management by Role</h1>
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Badge variant="outline" className="text-xs">
            Admin View - {users.length} users
          </Badge>
        </div>
      </div>

      {!selectedRole && !selectedUser && (
        <div className="space-y-6">
          {/* Role Overview Cards - Responsive Grid: Full-width on desktop, stacked on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-6">
            {roleData.map((role) => (
              <Card
                key={role.role}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-l-4 border-l-blue-500"
                onClick={() => setSelectedRole(role.role)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold">{role.role}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs px-2 py-1">
                      {role.totalUsers} users
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Prominent Overall Compliance Percentage */}
                    <div className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-blue-700">{role.overallCompliance}%</div>
                      <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">Overall Compliance</div>
                    </div>
                    
                    {/* Tier Breakdown - More Compact */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-blue-50 p-2 rounded-md text-center border border-blue-200">
                        <div className="text-blue-800 font-medium">Basic</div>
                        <div className="text-lg font-bold text-blue-700">{role.basicTierCompliance}%</div>
                      </div>
                      <div className="bg-purple-50 p-2 rounded-md text-center border border-purple-200">
                        <div className="text-purple-800 font-medium">Robust</div>
                        <div className="text-lg font-bold text-purple-700">{role.robustTierCompliance}%</div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs h-8 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRole(role.role);
                      }}
                    >
                      Manage {role.role} Users →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tier Comparison Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Tier Compliance Comparison Across All Roles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roleData.map((role) => (
                  <div key={role.role} className="flex items-center justify-between p-3 border rounded">
                    <div className="font-medium">{role.role}</div>
                    <div className="flex gap-4 text-sm">
                      <div className="text-center">
                        <Badge className={getTierColor('basic')} variant="outline">Basic</Badge>
                        <div className="font-bold mt-1">{role.basicTierCompliance}%</div>
                      </div>
                      <div className="text-center">
                        <Badge className={getTierColor('robust')} variant="outline">Robust</Badge>
                        <div className="font-bold mt-1">{role.robustTierCompliance}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-500">Overall</div>
                        <div className="font-bold">{role.overallCompliance}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedRole && !selectedUser && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{selectedRole} Role Users</h2>
            <Button variant="outline" onClick={() => setSelectedRole(null)}>
              ← Back to All Roles
            </Button>
          </div>

          {/* User Cards - Responsive Grid: More cards per row on wide screens */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {roleData.find(r => r.role === selectedRole)?.users.map((user) => (
              <Card
                key={user.user_id}
                className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] border-l-4 border-l-indigo-500"
                onClick={() => setSelectedUser(user)}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* User Info Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{user.display_name}</div>
                        <div className="text-xs text-gray-500 truncate">{user.email}</div>
                      </div>
                      <Badge className={`${getTierColor(user.compliance_tier)} text-xs ml-2 flex-shrink-0`}>
                        {user.compliance_tier}
                      </Badge>
                    </div>
                    
                    {/* Prominent Compliance Score */}
                    <div className="text-center bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-2">
                      <div className="text-xl font-bold text-indigo-700">
                        {user.compliance_score || 0}%
                      </div>
                      <div className="text-xs text-indigo-600">
                        {user.compliant_count || 0} / {user.total_requirements || 0} complete
                      </div>
                    </div>
                    
                    {/* Status Indicators */}
                    {(user.overdue_count > 0 || user.non_compliant_count > 0 || user.pending_count > 0) && (
                      <div className="flex flex-wrap gap-1">
                        {user.overdue_count > 0 && (
                          <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                            {user.overdue_count} overdue
                          </Badge>
                        )}
                        {user.non_compliant_count > 0 && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0.5 border-orange-300 text-orange-700">
                            {user.non_compliant_count} issues
                          </Badge>
                        )}
                        {user.pending_count > 0 && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0.5 border-yellow-300 text-yellow-700">
                            {user.pending_count} pending
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    {/* Quick Action Hint */}
                    <div className="text-xs text-gray-400 text-center">
                      Click to manage compliance →
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{selectedUser.display_name} - Compliance Management</h2>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>
              ← Back to {selectedRole} Users
            </Button>
          </div>

          <div className="space-y-4">
            {complianceRecords.map((record) => (
              <Card key={record.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{record.requirement_name}</div>
                        <Badge className={getTierColor(record.tier_level)}>
                          {record.tier_level}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {record.category}
                        </Badge>
                      </div>
                      {record.requirement_description && (
                        <div className="text-sm text-gray-600 mt-1">
                          {record.requirement_description}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(record.status)}
                      <Badge className={getStatusColor(record.status)}>
                        {record.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Show uploaded documents */}
                  {record.uploaded_documents && record.uploaded_documents.length > 0 && (
                    <div className="mb-3 p-2 bg-green-50 rounded">
                      <div className="text-sm font-medium mb-2 text-green-800">Uploaded Documents:</div>
                      {record.uploaded_documents.map((doc: ComplianceDocument) => (
                        <div key={doc.id} className="flex items-center justify-between bg-white p-2 rounded mb-1">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium">{doc.file_name}</span>
                            <Badge className={getStatusColor(doc.verification_status)}>
                              {doc.verification_status}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => downloadDocument(doc.file_path, doc.file_name)}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowUploadModal(record.id)}
                      disabled={uploadingRecord === record.id}
                      className="flex items-center gap-1"
                    >
                      <Upload className="h-3 w-3" />
                      {uploadingRecord === record.id ? 'Uploading...' : 'Upload Document'}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowApproveModal(record.id)}
                      disabled={record.status === 'approved'}
                      className="bg-green-50 text-green-700 hover:bg-green-100"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approve
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRejectModal(record.id)}
                      disabled={record.status === 'rejected'}
                      className="bg-red-50 text-red-700 hover:bg-red-100"
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Reject
                    </Button>
                  </div>

                  {record.review_notes && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                      <strong>Notes:</strong> {record.review_notes}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {complianceRecords.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No compliance records found for this user
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <Dialog open={!!showUploadModal} onOpenChange={() => setShowUploadModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Compliance Document
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {showUploadModal && (
              <>
                <div className="p-3 bg-blue-50 rounded border border-blue-200">
                  <div className="text-sm font-medium text-blue-800">
                    {complianceRecords.find(r => r.id === showUploadModal)?.requirement_name}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    {complianceRecords.find(r => r.id === showUploadModal)?.requirement_description}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file-upload">Select Document</Label>
                  <input
                    id="file-upload"
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(showUploadModal, file);
                        setShowUploadModal(null);
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadModal(null)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Modal */}
      <Dialog open={!!showApproveModal} onOpenChange={() => setShowApproveModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Approve Compliance Record
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {showApproveModal && (
              <>
                <div className="p-3 bg-green-50 rounded border border-green-200">
                  <div className="text-sm font-medium text-green-800">
                    {complianceRecords.find(r => r.id === showApproveModal)?.requirement_name}
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    User: {selectedUser?.display_name}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="approve-notes">Approval Notes (Optional)</Label>
                  <Textarea
                    id="approve-notes"
                    placeholder="Add any notes about this approval..."
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowApproveModal(null);
              setActionNotes('');
            }}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                if (showApproveModal) {
                  updateRecordStatus(showApproveModal, 'approved', actionNotes);
                  setShowApproveModal(null);
                  setActionNotes('');
                }
              }}
            >
              Approve Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={!!showRejectModal} onOpenChange={() => setShowRejectModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Reject Compliance Record
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {showRejectModal && (
              <>
                <div className="p-3 bg-red-50 rounded border border-red-200">
                  <div className="text-sm font-medium text-red-800">
                    {complianceRecords.find(r => r.id === showRejectModal)?.requirement_name}
                  </div>
                  <div className="text-xs text-red-600 mt-1">
                    User: {selectedUser?.display_name}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reject-notes">Rejection Reason *</Label>
                  <Textarea
                    id="reject-notes"
                    placeholder="Please provide a reason for rejection..."
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    rows={3}
                    className={!actionNotes.trim() ? 'border-red-300' : ''}
                  />
                  <p className="text-xs text-gray-500">
                    This reason will be shared with the user.
                  </p>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRejectModal(null);
              setActionNotes('');
            }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!actionNotes.trim()}
              onClick={() => {
                if (showRejectModal && actionNotes.trim()) {
                  updateRecordStatus(showRejectModal, 'rejected', actionNotes);
                  setShowRejectModal(null);
                  setActionNotes('');
                }
              }}
            >
              Reject Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}