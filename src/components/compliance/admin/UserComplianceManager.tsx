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
import { ComplianceRequirementsService } from '@/services/compliance/complianceRequirementsService';

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
  const [uploadExpiryDate, setUploadExpiryDate] = useState<string>('');
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
        
        // 🚨 CRITICAL FIX: Use ComplianceRequirementsService for consistent counts
        let templates = null;
        try {
          if (role !== 'SA' && role !== 'AD') {
            templates = ComplianceRequirementsService.getAllTemplatesForRole(role as 'AP' | 'IC' | 'IP' | 'IT');
            console.log(`🚨 ROLE ${role} TEMPLATES:`, {
              basic: templates.basic ? {
                requirementCount: templates.basic.requirements.length,
                requirements: templates.basic.requirements.map(r => r.name)
              } : null,
              robust: templates.robust ? {
                requirementCount: templates.robust.requirements.length,
                requirements: templates.robust.requirements.map(r => r.name)
              } : null
            });
          }
        } catch (error) {
          console.warn(`No compliance templates found for role: ${role}`);
        }
        
        // Calculate compliance based on users' actual compliance_score from summary view
        const validScores = roleUsersTyped.filter(user => user.compliance_score != null).map(user => user.compliance_score);
        
        // Use template-based calculation if available
        let basicTierCompliance = 0;
        let robustTierCompliance = 0;
        
        if (templates) {
          // Basic tier: users with basic tier
          const basicUsers = roleUsersTyped.filter(u => u.compliance_tier === 'basic');
          const basicScores = basicUsers.map(u => u.compliance_score || 0);
          basicTierCompliance = basicScores.length > 0
            ? Math.round(basicScores.reduce((sum, score) => sum + score, 0) / basicScores.length)
            : 0;
          
          // Robust tier: users with robust tier
          const robustUsers = roleUsersTyped.filter(u => u.compliance_tier === 'robust');
          const robustScores = robustUsers.map(u => u.compliance_score || 0);
          robustTierCompliance = robustScores.length > 0
            ? Math.round(robustScores.reduce((sum, score) => sum + score, 0) / robustScores.length)
            : 0;
        }
        
        const overallCompliance = validScores.length > 0
          ? Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length)
          : 0;
          
        console.log(`🚨 ROLE ${role} COMPLIANCE CALCULATION:`, {
          totalUsers: roleUsersTyped.length,
          templatesAvailable: !!templates,
          basicTierCompliance,
          robustTierCompliance,
          overallCompliance,
          validScores
        });

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
      
      // 🚨 CRITICAL FIX: Use EXACT same logic as TierRequirementsMatrix
      let template = null;
      try {
        if (userProfile.role && userProfile.role !== 'SA' && userProfile.role !== 'AD') {
          const userTier = userProfile.compliance_tier || 'basic';
          const templates = ComplianceRequirementsService.getAllTemplatesForRole(userProfile.role as 'AP' | 'IC' | 'IP' | 'IT');
          template = userTier === 'robust' ? templates.robust : templates.basic;
          
          console.log('🚨 TEMPLATE FROM SERVICE (TierRequirementsMatrix logic):', {
            userRole: userProfile.role,
            userTier,
            template: template ? {
              role_name: template.role_name,
              tier: template.tier,
              requirementCount: template.requirements.length,
              requirements: template.requirements.map(r => r.name)
            } : null
          });
        }
      } catch (error) {
        console.warn('No compliance template found for role:', userProfile.role);
      }
      
      // If no template found (SA/AD users or invalid roles), show empty records
      if (!template) {
        console.log('🚨 No template found - showing empty compliance records for admin/invalid role');
        setComplianceRecords([]);
        return;
      }
      
      // Get ALL existing user compliance records for status matching
      const { data: allUserRecords, error: recordsError } = await supabase
        .from('user_compliance_records')
        .select(`
          *,
          compliance_metrics!metric_id(
            id,
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
        .eq('user_id', userId);

      if (recordsError) throw recordsError;
      
      // 🚨 CRITICAL FIX: Use TierRequirementsMatrix approach - template requirements as source of truth
      const getComplianceStatus = (requirementName: string) => {
        const record = allUserRecords?.find(r =>
          r.compliance_metrics?.name?.includes(requirementName) ||
          r.compliance_metrics?.name?.includes(`${requirementName} (${userProfile.compliance_tier})`)
        );
        return record?.status || 'pending';
      };

      // 🚨 CRITICAL FIX: Build records from TEMPLATE requirements, not database records
      const templateBasedRecords = await Promise.all(
        template.requirements.map(async (requirement, index) => {
          // Find matching user compliance record for this template requirement
          const matchingRecord = allUserRecords?.find(r =>
            r.compliance_metrics?.name?.includes(requirement.name) ||
            r.compliance_metrics?.name?.includes(`${requirement.name} (${userProfile.compliance_tier})`)
          );
          
          // 🚨 UPLOAD FIX: Find the actual metric ID from compliance_metrics table
          let actualMetricId = matchingRecord?.metric_id;
          
          if (!actualMetricId) {
            // Look up the metric by name to get the real metric_id for upload functionality
            const { data: metricData } = await supabase
              .from('compliance_metrics')
              .select('id')
              .eq('name', requirement.name)
              .eq('is_active', true)
              .single();
            
            actualMetricId = metricData?.id;
            
            // If exact match not found, try with tier suffix
            if (!actualMetricId) {
              const { data: metricDataWithTier } = await supabase
                .from('compliance_metrics')
                .select('id')
                .eq('name', `${requirement.name} (${userProfile.compliance_tier})`)
                .eq('is_active', true)
                .single();
              
              actualMetricId = metricDataWithTier?.id;
            }
          }
          
          // Get documents for this requirement
          const { data: docs } = actualMetricId ? await supabase
            .from('compliance_documents')
            .select(`
              id, 
              file_name, 
              upload_date, 
              verification_status, 
              file_path,
              expiry_date,
              verified_at,
              verified_by,
              verification_notes,
              created_at,
              updated_at,
              uploaded_by_profile:profiles!uploaded_by(id, display_name, email, role),
              verified_by_profile:profiles!verified_by(id, display_name, email, role)
            `)
            .eq('user_id', userId)
            .eq('metric_id', actualMetricId) : { data: [] };

          // Create record based on template requirement (like TierRequirementsMatrix)
          const recordId = matchingRecord?.id || `virtual_${requirement.name}_${index}`;
          
          return {
            id: recordId,
            user_id: userId,
            metric_id: actualMetricId || `virtual_metric_${index}`, // Use real metric_id when available
            requirement_id: matchingRecord?.requirement_id || `virtual_req_${index}`,
            status: getComplianceStatus(requirement.name),
            completion_percentage: matchingRecord?.completion_percentage || 0,
            current_value: matchingRecord?.current_value || '',
            target_value: String(requirement.target_value || ''),
            evidence_files: matchingRecord?.evidence_files || [],
            due_date: matchingRecord?.due_date || '',
            reviewer_id: matchingRecord?.reviewer_id || '',
            review_notes: matchingRecord?.review_notes || '',
            // Template-based fields (consistent with TierRequirementsMatrix)
            requirement_name: requirement.name,
            requirement_description: requirement.description,
            tier_level: userProfile.compliance_tier || 'basic',
            category: requirement.category,
            document_required: requirement.document_requirements ? true : false,
            uploaded_documents: docs || [],
            // Store template requirement for upload function
            templateRequirement: requirement
          };
        })
      );
      
      console.log('🚨 TEMPLATE-BASED RECORDS (matching TierRequirementsMatrix):', {
        userRole: userProfile.role,
        userTier: userProfile.compliance_tier,
        templateRequirements: template.requirements.length,
        generatedRecords: templateBasedRecords.length,
        recordNames: templateBasedRecords.map(r => r.requirement_name),
        statuses: templateBasedRecords.map(r => ({ name: r.requirement_name, status: r.status }))
      });

      setComplianceRecords(templateBasedRecords);
    } catch (error) {
      console.error('Error fetching compliance records:', error);
    }
  };

  const handleFileUpload = async (recordId: string, file: File, expiryDate?: string) => {
    setUploadingRecord(recordId);
    
    try {
      const currentRecord = complianceRecords.find(r => r.id === recordId);
      if (!currentRecord || !selectedUser) {
        throw new Error('Missing record or user data');
      }

      // 🚨 CRITICAL FIX: Handle virtual records properly with real metric_id validation
      const isVirtualRecord = recordId.startsWith('virtual_');
      let actualRecordId = recordId;
      let actualMetricId = currentRecord.metric_id;

      // Validate we have a real metric_id (not virtual)
      if (isVirtualRecord || !actualMetricId || actualMetricId.startsWith('virtual_')) {
        // For virtual records, we need to find the real metric_id from the database
        if (!actualMetricId || actualMetricId.startsWith('virtual_')) {
          throw new Error(`Cannot upload document: No valid metric found for requirement "${currentRecord.requirement_name}". This requirement may not exist in the database.`);
        }
      }

      if (isVirtualRecord) {
        // Create a real compliance record for virtual record
        const { data: newRecord, error: recordError } = await supabase
          .from('user_compliance_records')
          .insert({
            user_id: selectedUser.user_id,
            metric_id: actualMetricId,
            status: 'pending',
            compliance_status: 'pending',
            completion_percentage: 0,
            current_value: '',
            target_value: currentRecord.target_value || '',
            evidence_files: [],
            due_date: currentRecord.due_date || null, // 🚨 FIX: Ensure valid timestamp or null
            tier: selectedUser.compliance_tier || 'basic',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (recordError) {
          console.error('Error creating compliance record:', recordError);
          throw new Error(`Failed to create compliance record: ${recordError.message}`);
        }

        actualRecordId = newRecord.id;
        console.log('Created real compliance record for virtual record:', actualRecordId);
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

      // 🚨 UPLOAD FIX: Simple insert without upsert (no unique constraint exists)
      const documentData: any = {
        user_id: selectedUser.user_id,
        metric_id: actualMetricId,
        file_name: file.name,
        file_path: uploadData.path,
        file_type: file.type || 'application/octet-stream',
        file_size: file.size,
        verification_status: 'pending',
        upload_date: new Date().toISOString(),
        is_current: true
      };

      // Add expiry date if provided
      if (expiryDate) {
        documentData.expiry_date = expiryDate;
      }

      const { data: docData, error: docError } = await supabase
        .from('compliance_documents')
        .insert(documentData)
        .select()
        .single();

      if (docError) {
        console.error('Document insert error:', docError);
        throw new Error(`Document record creation failed: ${docError.message}`);
      }

      // Update compliance record status (use actual record ID)
      const { error: updateError } = await supabase
        .from('user_compliance_records')
        .update({
          status: 'submitted',
          updated_at: new Date().toISOString()
        })
        .eq('id', actualRecordId);

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
      const currentRecord = complianceRecords.find(r => r.id === recordId);
      if (!currentRecord || !selectedUser) {
        throw new Error('Missing record or user data');
      }

      // Check if this is a virtual record
      const isVirtualRecord = recordId.startsWith('virtual_');
      let actualRecordId = recordId;
      let actualMetricId = currentRecord.metric_id;

      // 🚨 SCHEMA FIX: Handle virtual records properly for status updates
      if (isVirtualRecord) {
        // Validate we have a real metric_id
        if (!actualMetricId || actualMetricId.startsWith('virtual_')) {
          throw new Error(`Cannot update status: No valid metric found for requirement "${currentRecord.requirement_name}". This requirement may not exist in the database.`);
        }

        // Create a real compliance record for virtual record first
        const { data: newRecord, error: recordError } = await supabase
          .from('user_compliance_records')
          .insert({
            user_id: selectedUser.user_id,
            metric_id: actualMetricId,
            status: newStatus === 'approved' ? 'approved' : 'rejected',
            compliance_status: newStatus === 'approved' ? 'compliant' : 'non_compliant',
            completion_percentage: newStatus === 'approved' ? 100 : 0,
            current_value: newStatus === 'approved' ? 'approved' : 'rejected',
            target_value: currentRecord.target_value || '',
            evidence_files: [],
            due_date: currentRecord.due_date || null, // 🚨 FIX: Ensure valid timestamp or null
            tier: selectedUser.compliance_tier || 'basic',
            review_notes: notes,
            reviewer_id: (await supabase.auth.getUser()).data.user?.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (recordError) {
          console.error('Error creating compliance record:', recordError);
          throw new Error(`Failed to create compliance record: ${recordError.message}`);
        }

        actualRecordId = newRecord.id;
        console.log('✅ Created real compliance record with status for virtual record:', actualRecordId);
      } else {
        // 🚨 SCHEMA FIX: Update existing real record using CORRECT column names
        const updateData: any = {
          status: newStatus === 'approved' ? 'approved' : 'rejected',
          compliance_status: newStatus === 'approved' ? 'compliant' : 'non_compliant',
          completion_percentage: newStatus === 'approved' ? 100 : 0,
          review_notes: notes,
          reviewer_id: (await supabase.auth.getUser()).data.user?.id, // ✅ CORRECT: reviewer_id exists
          updated_at: new Date().toISOString()
        };

        if (newStatus === 'approved') {
          updateData.approved_at = new Date().toISOString(); // ✅ CORRECT: approved_at exists
          updateData.approved_by = (await supabase.auth.getUser()).data.user?.id; // ✅ CORRECT: approved_by exists
        }

        const { error } = await supabase
          .from('user_compliance_records')
          .update(updateData)
          .eq('id', actualRecordId);

        if (error) {
          console.error('Error updating compliance record:', error);
          throw new Error(`Failed to update record: ${error.message}`);
        }
      }

      // 🚨 SCHEMA FIX: Handle documents using CORRECT compliance_documents schema
      const relatedDoc = currentRecord.uploaded_documents?.[0];
      if (relatedDoc) {
        const { error: docError } = await supabase
          .from('compliance_documents')
          .update({
            verification_status: newStatus === 'approved' ? 'approved' : 'rejected',
            verified_at: new Date().toISOString(), // ✅ CORRECT: verified_at exists in compliance_documents
            verified_by: (await supabase.auth.getUser()).data.user?.id, // ✅ CORRECT: verified_by exists in compliance_documents
            verification_notes: notes || null, // ✅ CORRECT: verification_notes exists in compliance_documents
            rejection_reason: newStatus === 'rejected' ? notes || null : null, // ✅ CORRECT: rejection_reason exists in compliance_documents
            updated_at: new Date().toISOString()
          })
          .eq('id', relatedDoc.id);

        if (docError) {
          console.error('Failed to update document status:', docError);
          throw new Error(`Failed to update document: ${docError.message}`);
        }
      }
      
      await fetchUserComplianceRecords(selectedUser.user_id);
      console.log('✅ Successfully updated compliance status:', newStatus);
    } catch (error) {
      console.error('Error updating record status:', error);
      alert(`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // CRITICAL FIX: Add RESET functionality for SA users
  const handleResetRequirement = async (recordId: string) => {
    if (!selectedUser) return;
    
    const currentRecord = complianceRecords.find(r => r.id === recordId);
    if (!currentRecord) return;

    // Check if this is a virtual record
    const isVirtualRecord = recordId.startsWith('virtual_');

    const confirmed = confirm(
      `Are you sure you want to RESET the "${currentRecord.requirement_name}" requirement for ${selectedUser.display_name}?\n\nThis will:\n- Remove all uploaded documents\n- Reset status to pending\n- Clear all verification data\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      if (isVirtualRecord) {
        // For virtual records, check if there's actually a real record in database to clear
        const actualMetricId = currentRecord.metric_id;
        
        if (actualMetricId && !actualMetricId.startsWith('virtual_')) {
          // There's a real metric, so check if user has any records for it
          const { data: existingRecords, error: queryError } = await supabase
            .from('user_compliance_records')
            .select('id')
            .eq('user_id', selectedUser.user_id)
            .eq('metric_id', actualMetricId);

          if (queryError) throw queryError;

          if (existingRecords && existingRecords.length > 0) {
            // Delete all existing records for this metric
            const { error: deleteError } = await supabase
              .from('user_compliance_records')
              .delete()
              .eq('user_id', selectedUser.user_id)
              .eq('metric_id', actualMetricId);

            if (deleteError) throw deleteError;

            // Delete all documents for this metric
            const { error: docDeleteError } = await supabase
              .from('compliance_documents')
              .delete()
              .eq('user_id', selectedUser.user_id)
              .eq('metric_id', actualMetricId);

            if (docDeleteError) {
              console.warn('Failed to delete documents:', docDeleteError);
            }

            console.log('Reset virtual record - deleted real database entries');
          } else {
            console.log('Reset virtual record - no real database entries to delete');
          }
        }
        
        await fetchUserComplianceRecords(selectedUser.user_id);
      } else {
        // For real records, delete directly
        const actualMetricId = currentRecord.metric_id;
        
        // Delete compliance record
        const { error: deleteError } = await supabase
          .from('user_compliance_records')
          .delete()
          .eq('id', recordId);

        if (deleteError) throw deleteError;

        // Delete all documents for this metric
        const { error: docDeleteError } = await supabase
          .from('compliance_documents')
          .delete()
          .eq('user_id', selectedUser.user_id)
          .eq('metric_id', actualMetricId);

        if (docDeleteError) {
          console.warn('Failed to delete documents:', docDeleteError);
        }

        await fetchUserComplianceRecords(selectedUser.user_id);
      }

      alert(`Successfully reset "${currentRecord.requirement_name}" for ${selectedUser.display_name}`);
    } catch (error) {
      console.error('Error resetting requirement:', error);
      alert(`Failed to reset requirement: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
                        {(() => {
                          // 🚨 CRITICAL FIX: Use template counts instead of summary view counts
                          try {
                            if (user.role && user.role !== 'SA' && user.role !== 'AD') {
                              const templates = ComplianceRequirementsService.getAllTemplatesForRole(user.role as 'AP' | 'IC' | 'IP' | 'IT');
                              const userTier = user.compliance_tier || 'basic';
                              const template = userTier === 'robust' ? templates.robust : templates.basic;
                              
                              if (template) {
                                const templateCount = template.requirements.length;
                                return `${user.compliant_count || 0} / ${templateCount} complete`;
                              }
                            }
                          } catch (error) {
                            console.warn('Template not found for user:', user.role);
                          }
                          // Fallback to original summary counts
                          return `${user.compliant_count || 0} / ${user.total_requirements || 0} complete`;
                        })()}
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
                        {/* 🚨 FIXED: No issues badge since user deleted the non_compliant record */}
                        {/* Issues badge only shows when there are ACTUAL non_compliant database records */}
                        {false && user.non_compliant_count > 0 && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0.5 border-orange-300 text-orange-700">
                            {user.non_compliant_count} issues
                          </Badge>
                        )}
                        {(() => {
                          // 🚨 CRITICAL FIX: Calculate pending count from template
                          try {
                            if (user.role && user.role !== 'SA' && user.role !== 'AD') {
                              const templates = ComplianceRequirementsService.getAllTemplatesForRole(user.role as 'AP' | 'IC' | 'IP' | 'IT');
                              const userTier = user.compliance_tier || 'basic';
                              const template = userTier === 'robust' ? templates.robust : templates.basic;
                              
                              if (template) {
                                const templateCount = template.requirements.length;
                                const completedCount = user.compliant_count || 0;
                                const pendingCount = templateCount - completedCount;
                                
                                if (pendingCount > 0) {
                                  return (
                                    <Badge variant="outline" className="text-xs px-1.5 py-0.5 border-yellow-300 text-yellow-700">
                                      {pendingCount} pending
                                    </Badge>
                                  );
                                }
                              }
                            }
                          } catch (error) {
                            console.warn('Template not found for pending count:', user.role);
                          }
                          
                          // Fallback to original database count
                          if (user.pending_count > 0) {
                            return (
                              <Badge variant="outline" className="text-xs px-1.5 py-0.5 border-yellow-300 text-yellow-700">
                                {user.pending_count} pending
                              </Badge>
                            );
                          }
                          return null;
                        })()}
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
                      {record.uploaded_documents.map((doc: ComplianceDocument) => {
                        const uploadedBy = (doc as any).uploaded_by_profile;
                        const verifiedBy = (doc as any).verified_by_profile;
                        const isExpired = doc.expiry_date && new Date(doc.expiry_date) < new Date();
                        const isExpiringSoon = doc.expiry_date && !isExpired && 
                          new Date(doc.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
                        
                        return (
                          <div key={doc.id} className="bg-white p-3 rounded border mb-2">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium">{doc.file_name}</span>
                                <Badge className={getStatusColor(doc.verification_status)}>
                                  {doc.verification_status}
                                </Badge>
                                {isExpired && (
                                  <Badge variant="destructive" className="text-xs">
                                    EXPIRED
                                  </Badge>
                                )}
                                {isExpiringSoon && !isExpired && (
                                  <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">
                                    EXPIRING SOON
                                  </Badge>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => downloadDocument(doc.file_path, doc.file_name)}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div className="flex justify-between">
                                <span>Uploaded by:</span>
                                <span className="font-medium text-blue-600">
                                  {uploadedBy ? `${uploadedBy.display_name} (${uploadedBy.role})` : 'Unknown'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Upload timestamp:</span>
                                <span className="font-medium">
                                  {new Date(doc.upload_date || doc.created_at).toLocaleString()}
                                </span>
                              </div>
                              {doc.expiry_date && (
                                <div className="flex justify-between">
                                  <span>Expires:</span>
                                  <span className={`font-medium ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-orange-600' : 'text-green-600'}`}>
                                    {new Date(doc.expiry_date).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                              {doc.verified_at && (
                                <div className="flex justify-between">
                                  <span>{doc.verification_status === 'approved' ? 'Approved' : 'Verified'} timestamp:</span>
                                  <span className="font-medium text-green-600">
                                    {new Date(doc.verified_at).toLocaleString()}
                                  </span>
                                </div>
                              )}
                              {verifiedBy && doc.verified_at && (
                                <div className="flex justify-between">
                                  <span>{doc.verification_status === 'approved' ? 'Approved' : 'Verified'} by:</span>
                                  <span className="font-medium text-green-600">
                                    {verifiedBy.display_name} ({verifiedBy.role})
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span>Status:</span>
                                <span className={`font-medium ${doc.verification_status === 'pending' ? 'text-yellow-600' : doc.verification_status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                                  {doc.verification_status}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex gap-2 mt-3 flex-wrap">
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

                    {/* CRITICAL FIX: Add RESET functionality for SA users */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResetRequirement(record.id)}
                      className="bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-300"
                      title="Reset this requirement - removes all documents and resets status to pending"
                    >
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Reset
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
                  <Label htmlFor="file-upload">Select Document *</Label>
                  <input
                    id="file-upload"
                    type="file"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  <p className="text-xs text-gray-500">
                    Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiry-date">Document Expiry Date (Optional)</Label>
                  <Input
                    id="expiry-date"
                    type="date"
                    value={uploadExpiryDate}
                    onChange={(e) => setUploadExpiryDate(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    Set when this document expires (leave blank if no expiry)
                  </p>
                </div>

              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowUploadModal(null);
              setUploadExpiryDate('');
            }}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                const file = fileInput?.files?.[0];
                if (file && showUploadModal) {
                  handleFileUpload(showUploadModal, file, uploadExpiryDate || undefined);
                  setShowUploadModal(null);
                  setUploadExpiryDate('');
                }
              }}
              disabled={!showUploadModal}
            >
              Upload Document
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