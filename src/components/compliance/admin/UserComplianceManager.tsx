import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
            compliance_requirements(tier_level)
          `)
          .in('user_id', userIds);

        const basicRecords = (records || []).filter(r => r.compliance_requirements?.tier_level === 'basic');
        const robustRecords = (records || []).filter(r => r.compliance_requirements?.tier_level === 'robust');

        const basicCompliant = basicRecords.filter(r => r.status === 'compliant' || r.status === 'approved').length;
        const robustCompliant = robustRecords.filter(r => r.status === 'compliant' || r.status === 'approved').length;

        const basicTierCompliance = basicRecords.length > 0 ? Math.round((basicCompliant / basicRecords.length) * 100) : 0;
        const robustTierCompliance = robustRecords.length > 0 ? Math.round((robustCompliant / robustRecords.length) * 100) : 0;
        
        // Calculate overall compliance, handling cases where compliance_score might be null
        const validScores = roleUsersTyped.filter(user => user.compliance_score != null).map(user => user.compliance_score);
        const overallCompliance = validScores.length > 0
          ? Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length)
          : 0;

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
      // Get user compliance records with requirements and documents
      const { data: records, error: recordsError } = await supabase
        .from('user_compliance_records')
        .select(`
          *,
          compliance_requirements(
            name, 
            description, 
            tier_level,
            category,
            document_required
          )
        `)
        .eq('user_id', userId)
        .order('due_date', { ascending: true });

      if (recordsError) throw recordsError;

      // Get documents for each record
      const recordsWithDocs = await Promise.all(
        (records || []).map(async (record) => {
          const { data: docs } = await supabase
            .from('compliance_documents')
            .select('id, file_name, upload_date, verification_status, file_path')
            .eq('user_id', userId)
            .eq('metric_id', record.metric_id);

          return {
            ...record,
            requirement_name: record.compliance_requirements?.name || 'Unknown Requirement',
            requirement_description: record.compliance_requirements?.description || '',
            tier_level: record.compliance_requirements?.tier_level || 'basic',
            category: record.compliance_requirements?.category || 'general',
            document_required: record.compliance_requirements?.document_required || false,
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
          {/* Role Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roleData.map((role) => (
              <Card 
                key={role.role} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedRole(role.role)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {role.role} Role
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{role.overallCompliance}%</div>
                      <div className="text-sm text-gray-500">Overall Compliance</div>
                      <div className="text-xs text-gray-400">{role.totalUsers} users</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-blue-50 p-2 rounded text-center">
                        <Badge className={getTierColor('basic')} variant="outline">Basic Tier</Badge>
                        <div className="font-bold text-blue-600 mt-1">{role.basicTierCompliance}%</div>
                      </div>
                      <div className="bg-purple-50 p-2 rounded text-center">
                        <Badge className={getTierColor('robust')} variant="outline">Robust Tier</Badge>
                        <div className="font-bold text-purple-600 mt-1">{role.robustTierCompliance}%</div>
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRole(role.role);
                      }}
                    >
                      View {role.role} Users
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

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {roleData.find(r => r.role === selectedRole)?.users.map((user) => (
              <Card 
                key={user.user_id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedUser(user)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">{user.display_name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      <Badge className={getTierColor(user.compliance_tier)}>
                        Tier {user.compliance_tier}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">
                        {user.compliance_score || 0}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {user.compliant_count || 0} / {user.total_requirements || 0}
                      </div>
                    </div>
                  </div>
                  {(user.overdue_count > 0 || user.non_compliant_count > 0) && (
                    <div className="flex gap-1 mt-2">
                      {user.overdue_count > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {user.overdue_count} overdue
                        </Badge>
                      )}
                      {user.non_compliant_count > 0 && (
                        <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                          {user.non_compliant_count} issues
                        </Badge>
                      )}
                    </div>
                  )}
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
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(record.id, file);
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={uploadingRecord === record.id}
                        className="flex items-center gap-1"
                      >
                        <Upload className="h-3 w-3" />
                        {uploadingRecord === record.id ? 'Uploading...' : 'Upload Document'}
                      </Button>
                    </label>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateRecordStatus(record.id, 'approved')}
                      disabled={record.status === 'approved'}
                      className="bg-green-50 text-green-700 hover:bg-green-100"
                    >
                      Approve
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateRecordStatus(record.id, 'rejected')}
                      disabled={record.status === 'rejected'}
                      className="bg-red-50 text-red-700 hover:bg-red-100"
                    >
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
    </div>
  );
}