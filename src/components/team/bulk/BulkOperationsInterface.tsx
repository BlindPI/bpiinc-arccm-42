
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { safeParseJson, safeParseJsonArray, safeString, safeNumber, safeBoolean, safeDate } from '@/utils/databaseTypes';
import { 
  Users, 
  Upload, 
  Download, 
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

interface BulkOperationsInterfaceProps {
  teamId: string;
}

// Database response type (matches Supabase schema)
interface DatabaseBulkOperation {
  id: string;
  operation_name: string;
  operation_type: string;
  status: string;
  total_items: number;
  processed_items: number;
  failed_items: number;
  progress_percentage: number;
  created_at: string;
  completed_at: string | null;
  updated_at: string;
  initiated_by: string;
  operation_data: any; // Json type from Supabase
  error_log: any; // Json type from Supabase
  rollback_data: any; // Json type from Supabase
  can_rollback: boolean;
  started_at: string | null;
}

// UI interface
interface BulkOperation {
  id: string;
  operation_name: string;
  operation_type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  total_items: number;
  processed_items: number;
  failed_items: number;
  progress_percentage: number;
  created_at: string;
  error_log?: any[];
}

function transformBulkOperation(dbOperation: DatabaseBulkOperation): BulkOperation {
  return {
    id: dbOperation.id,
    operation_name: dbOperation.operation_name,
    operation_type: dbOperation.operation_type,
    status: (dbOperation.status as 'pending' | 'in_progress' | 'completed' | 'failed') || 'pending',
    total_items: dbOperation.total_items,
    processed_items: dbOperation.processed_items,
    failed_items: dbOperation.failed_items,
    progress_percentage: dbOperation.progress_percentage,
    created_at: dbOperation.created_at,
    error_log: safeParseJsonArray(dbOperation.error_log)
  };
}

export function BulkOperationsInterface({ teamId }: BulkOperationsInterfaceProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [operationType, setOperationType] = useState<string>('');
  const [memberEmails, setMemberEmails] = useState('');
  const [memberRole, setMemberRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');

  const { data: bulkOperations = [], isLoading } = useQuery({
    queryKey: ['bulk-operations', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bulk_operations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      return (data || []).map(transformBulkOperation);
    }
  });

  const createBulkOperationMutation = useMutation({
    mutationFn: async ({ operation }: { operation: any }) => {
      const { data, error } = await supabase
        .from('bulk_operations')
        .insert({
          operation_name: operation.name,
          operation_type: operation.type,
          initiated_by: user?.id,
          total_items: operation.totalItems,
          operation_data: operation.data,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Simulate processing for demo
      setTimeout(async () => {
        await supabase.rpc('update_bulk_operation_progress', {
          p_operation_id: data.id,
          p_processed: operation.totalItems,
          p_failed: 0
        });
        
        queryClient.invalidateQueries({ queryKey: ['bulk-operations'] });
      }, 2000);

      return data;
    },
    onSuccess: () => {
      toast.success('Bulk operation initiated');
      queryClient.invalidateQueries({ queryKey: ['bulk-operations'] });
      setMemberEmails('');
      setOperationType('');
    },
    onError: () => {
      toast.error('Failed to initiate bulk operation');
    }
  });

  const handleBulkAddMembers = () => {
    if (!operationType || !memberEmails.trim()) {
      toast.error('Please select operation type and provide email addresses');
      return;
    }

    const emailList = memberEmails
      .split('\n')
      .map(email => email.trim())
      .filter(email => email && email.includes('@'));

    if (emailList.length === 0) {
      toast.error('Please provide valid email addresses');
      return;
    }

    createBulkOperationMutation.mutate({
      operation: {
        name: `Bulk ${operationType} - ${emailList.length} members`,
        type: operationType,
        totalItems: emailList.length,
        data: {
          teamId,
          emails: emailList,
          role: memberRole,
          operation: operationType
        }
      }
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'in_progress':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'in_progress':
        return 'outline';
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Bulk Operations Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Member Operations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="operation-type">Operation Type</Label>
            <Select value={operationType} onValueChange={setOperationType}>
              <SelectTrigger>
                <SelectValue placeholder="Select operation type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add_members">Add Members</SelectItem>
                <SelectItem value="remove_members">Remove Members</SelectItem>
                <SelectItem value="update_roles">Update Roles</SelectItem>
                <SelectItem value="transfer_members">Transfer Members</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="member-role">Default Role</Label>
            <Select value={memberRole} onValueChange={(value: 'MEMBER' | 'ADMIN') => setMemberRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Team Member</SelectItem>
                <SelectItem value="ADMIN">Team Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="member-emails">Email Addresses (one per line)</Label>
            <Textarea
              id="member-emails"
              value={memberEmails}
              onChange={(e) => setMemberEmails(e.target.value)}
              placeholder="user1@example.com&#10;user2@example.com&#10;user3@example.com"
              rows={6}
            />
            <p className="text-sm text-muted-foreground">
              {memberEmails.split('\n').filter(line => line.trim() && line.includes('@')).length} valid email addresses
            </p>
          </div>

          <Button 
            onClick={handleBulkAddMembers}
            disabled={createBulkOperationMutation.isPending || !operationType || !memberEmails.trim()}
            className="w-full"
          >
            {createBulkOperationMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Initiating Operation...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Start Bulk Operation
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Operation History */}
      <Card>
        <CardHeader>
          <CardTitle>Operation History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : bulkOperations.length > 0 ? (
            <div className="space-y-4">
              {bulkOperations.map((operation: BulkOperation) => (
                <div key={operation.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(operation.status)}
                      <div>
                        <h3 className="font-medium">{operation.operation_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(operation.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={getStatusColor(operation.status) as any}>
                      {operation.status}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{operation.processed_items}/{operation.total_items} processed</span>
                    </div>
                    <Progress value={operation.progress_percentage || 0} />
                    
                    {operation.failed_items > 0 && (
                      <p className="text-sm text-destructive">
                        {operation.failed_items} items failed
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No bulk operations performed yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
