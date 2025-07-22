import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Upload, Search, User, FileText, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
}

export default function UserComplianceManager() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
  const [complianceRecords, setComplianceRecords] = useState<UserComplianceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingRecord, setUploadingRecord] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchUserComplianceRecords(selectedUser.user_id);
    }
  }, [selectedUser]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('compliance_dashboard_summary')
        .select('*')
        .order('display_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserComplianceRecords = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_compliance_records')
        .select(`
          *,
          compliance_requirements(name, description)
        `)
        .eq('user_id', userId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      
      const recordsWithRequirementNames = data?.map(record => ({
        ...record,
        requirement_name: record.compliance_requirements?.name || 'Unknown Requirement',
        requirement_description: record.compliance_requirements?.description || ''
      })) || [];

      setComplianceRecords(recordsWithRequirementNames);
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

  const filteredUsers = users.filter(user =>
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  if (loading) {
    return <div className="p-6">Loading users...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Compliance Management</h1>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Selection Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Select User ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredUsers.map((user) => (
                <div
                  key={user.user_id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedUser?.user_id === user.user_id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{user.display_name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      <div className="text-sm text-gray-500">
                        {user.role} • Tier {user.compliance_tier}
                      </div>
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
                    <div className="flex gap-2 mt-2">
                      {user.overdue_count > 0 && (
                        <Badge className="bg-red-100 text-red-800">
                          {user.overdue_count} overdue
                        </Badge>
                      )}
                      {user.non_compliant_count > 0 && (
                        <Badge className="bg-orange-100 text-orange-800">
                          {user.non_compliant_count} non-compliant
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Compliance Details Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedUser ? `${selectedUser.display_name} - Compliance Records` : 'Select a user'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedUser ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-500">Compliance Score</div>
                    <div className="text-xl font-bold text-blue-600">
                      {selectedUser.compliance_score || 0}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Total Requirements</div>
                    <div className="text-xl font-bold">
                      {selectedUser.total_requirements || 0}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {complianceRecords.map((record) => (
                    <div key={record.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium">{record.requirement_name}</div>
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

                      {record.due_date && (
                        <div className="text-sm text-gray-500 mb-2">
                          Due: {new Date(record.due_date).toLocaleDateString()}
                        </div>
                      )}

                      {record.evidence_files && record.evidence_files.length > 0 && (
                        <div className="mb-2">
                          <div className="text-sm font-medium mb-1">Uploaded Files:</div>
                          {record.evidence_files.map((file: any, index: number) => (
                            <div key={index} className="text-sm text-blue-600">
                              📄 {file.name}
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
                            {uploadingRecord === record.id ? 'Uploading...' : 'Upload'}
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