import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Upload, Search, User, FileText, CheckCircle, XCircle, Clock, AlertTriangle, Eye, Download, Users, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
      const { data: users, error } = await supabase
        .from('compliance_dashboard_summary')
        .select('*')
        .order('role', { ascending: true });

      if (error) throw error;
      
      setUsers(users || []);
      
      // Group users by role and calculate compliance data
      const roleGroups = (users || []).reduce((acc: { [key: string]: UserSummary[] }, user) => {
        const role = user.role || 'Unknown';
        if (!acc[role]) acc[role] = [];
        acc[role].push(user);
        return acc;
      }, {});

      // Calculate compliance metrics for each role
      const roleCompliance: RoleComplianceData[] = [];
      
      for (const [role, roleUsers] of Object.entries(roleGroups)) {
        // Get compliance records for all users in this role
        const userIds = roleUsers.map(u => u.user_id);
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
        
        const overallCompliance = Math.round(
          roleUsers.reduce((sum, user) => sum + (user.compliance_score || 0), 0) / roleUsers.length
        );

        roleCompliance.push({
          role,
          totalUsers: roleUsers.length,
          basicTierCompliance,
          robustTierCompliance,
          overallCompliance,
          users: roleUsers
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
      // Upload file to Supabase storage
      const fileName = `${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('compliance-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create compliance document record
      const { data: docData, error: docError } = await supabase
        .from('compliance_documents')
        .insert({
          user_id: selectedUser?.user_id,
          metric_id: complianceRecords.find(r => r.id === recordId)?.metric_id,
          file_name: file.name,
          file_path: uploadData.path,
          file_type: file.type,
          file_size: file.size,
          verification_status: 'pending'
        })
        .select()
        .single();

      if (docError) throw docError;

      // Update compliance record with document reference
      const currentRecord = complianceRecords.find(r => r.id === recordId);
      const updatedFiles = [...(currentRecord?.evidence_files || []), {
        id: docData.id,
        name: file.name,
        path: uploadData.path,
        uploaded_at: new Date().toISOString()
      }];

      const { error: updateError } = await supabase
        .from('user_compliance_records')
        .update({ 
          evidence_files: updatedFiles,
          status: 'submitted'
        })
        .eq('id', recordId);

      if (updateError) throw updateError;

      // Refresh records
      await fetchUserComplianceRecords(selectedUser!.user_id);
      
    } catch (error) {
      console.error('Error uploading file:', error);
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
                    </div>
                  ))}

                  {complianceRecords.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      No compliance records found for this user
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Select a user from the list to view their compliance details
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}