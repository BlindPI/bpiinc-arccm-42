
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Upload, 
  Download, 
  Play, 
  Pause, 
  RotateCcw, 
  AlertTriangle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';

interface BulkOperationsInterfaceProps {
  teamId: string;
}

interface BulkOperation {
  id: string;
  operation_type: string;
  operation_name: string;
  status: string;
  total_items: number;
  processed_items: number;
  failed_items: number;
  progress_percentage: number;
  can_rollback: boolean;
  created_at: string;
  completed_at?: string;
}

export function BulkOperationsInterface({ teamId }: BulkOperationsInterfaceProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [operationType, setOperationType] = useState('add_members');
  const [operationName, setOperationName] = useState('');
  const [bulkData, setBulkData] = useState('');

  // Get bulk operations
  const { data: operations = [], isLoading } = useQuery({
    queryKey: ['bulk-operations', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bulk_operations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BulkOperation[];
    },
    refetchInterval: 5000
  });

  const createBulkOperationMutation = useMutation({
    mutationFn: async (operationData: any) => {
      const { data, error } = await supabase
        .from('bulk_operations')
        .insert({
          operation_type: operationType,
          operation_name: operationName,
          initiated_by: user?.id,
          total_items: operationData.items.length,
          operation_data: operationData,
          status: 'pending'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Bulk operation initiated');
      queryClient.invalidateQueries({ queryKey: ['bulk-operations', teamId] });
      setOperationName('');
      setBulkData('');
    },
    onError: (error: any) => {
      toast.error('Failed to initiate operation: ' + error.message);
    }
  });

  const cancelOperationMutation = useMutation({
    mutationFn: async (operationId: string) => {
      const { error } = await supabase
        .from('bulk_operations')
        .update({ status: 'cancelled' })
        .eq('id', operationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Operation cancelled');
      queryClient.invalidateQueries({ queryKey: ['bulk-operations', teamId] });
    }
  });

  const rollbackOperationMutation = useMutation({
    mutationFn: async (operationId: string) => {
      const { error } = await supabase
        .from('bulk_operations')
        .update({ status: 'rolling_back' })
        .eq('id', operationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Rollback initiated');
      queryClient.invalidateQueries({ queryKey: ['bulk-operations', teamId] });
    }
  });

  const handleCreateOperation = () => {
    if (!operationName.trim()) {
      toast.error('Operation name is required');
      return;
    }

    if (!bulkData.trim()) {
      toast.error('Bulk data is required');
      return;
    }

    let items: any[] = [];
    
    if (operationType === 'add_members') {
      items = bulkData
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && line.includes('@'))
        .map(email => ({ email, role: 'MEMBER' }));
    } else if (operationType === 'update_roles') {
      items = bulkData
        .split('\n')
        .map(line => line.trim())
        .filter(line => line)
        .map(line => {
          const [email, role] = line.split(',').map(s => s.trim());
          return { email, role };
        });
    }

    if (items.length === 0) {
      toast.error('No valid items found in bulk data');
      return;
    }

    createBulkOperationMutation.mutate({
      team_id: teamId,
      operation_type: operationType,
      items
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'in_progress':
        return <Play className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <X className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'in_progress':
        return 'default';
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Operation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Create Bulk Operation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="operation-type">Operation Type</Label>
            <Select value={operationType} onValueChange={setOperationType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add_members">Add Members</SelectItem>
                <SelectItem value="remove_members">Remove Members</SelectItem>
                <SelectItem value="update_roles">Update Member Roles</SelectItem>
                <SelectItem value="transfer_members">Transfer Members</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="operation-name">Operation Name</Label>
            <Input
              id="operation-name"
              value={operationName}
              onChange={(e) => setOperationName(e.target.value)}
              placeholder="e.g., Q1 2024 New Hires"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bulk-data">Bulk Data</Label>
            <Textarea
              id="bulk-data"
              value={bulkData}
              onChange={(e) => setBulkData(e.target.value)}
              placeholder={
                operationType === 'add_members' 
                  ? 'user1@example.com\nuser2@example.com\nuser3@example.com'
                  : operationType === 'update_roles'
                  ? 'user1@example.com,ADMIN\nuser2@example.com,MEMBER'
                  : 'Enter data based on operation type'
              }
              rows={8}
            />
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This operation will be processed asynchronously. You can monitor progress below.
              Operations can be cancelled while in progress and some may support rollback.
            </AlertDescription>
          </Alert>

          <Button 
            onClick={handleCreateOperation}
            disabled={createBulkOperationMutation.isPending}
            className="w-full"
          >
            {createBulkOperationMutation.isPending ? 'Creating...' : 'Start Operation'}
          </Button>
        </CardContent>
      </Card>

      {/* Operations List */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Operations</CardTitle>
        </CardHeader>
        <CardContent>
          {operations.length > 0 ? (
            <div className="space-y-4">
              {operations.map((operation) => (
                <div key={operation.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(operation.status)}
                      <div>
                        <h4 className="font-medium">{operation.operation_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {operation.operation_type.replace('_', ' ')} • 
                          Started {new Date(operation.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(operation.status as any)}>
                        {operation.status}
                      </Badge>
                      
                      {operation.status === 'in_progress' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cancelOperationMutation.mutate(operation.id)}
                          disabled={cancelOperationMutation.isPending}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {operation.can_rollback && operation.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rollbackOperationMutation.mutate(operation.id)}
                          disabled={rollbackOperationMutation.isPending}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress: {operation.processed_items}/{operation.total_items}</span>
                      <span>{Math.round(operation.progress_percentage)}%</span>
                    </div>
                    <Progress value={operation.progress_percentage} className="h-2" />
                    
                    {operation.failed_items > 0 && (
                      <p className="text-sm text-red-600">
                        {operation.failed_items} items failed
                      </p>
                    )}
                  </div>

                  {operation.completed_at && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Completed {new Date(operation.completed_at).toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No bulk operations found</p>
              <p className="text-sm">Create your first bulk operation to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
