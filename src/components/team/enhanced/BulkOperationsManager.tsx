import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  Upload, 
  AlertTriangle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';
import { BulkOperationsService } from '@/services/team/bulkOperationsService';
import { toast } from 'sonner';
import type { BulkOperation } from '@/types/enhanced-team-management';

interface BulkOperationsManagerProps {
  teamId: string;
  userId: string;
}

export function BulkOperationsManager({ teamId, userId }: BulkOperationsManagerProps) {
  const queryClient = useQueryClient();
  const [showNewOperation, setShowNewOperation] = useState(false);
  const [bulkEmails, setBulkEmails] = useState('');
  const [operationName, setOperationName] = useState('');

  // Get bulk operations - removed parameter as the method doesn't accept one
  const { data: operations = [], isLoading } = useQuery({
    queryKey: ['bulk-operations'],
    queryFn: () => BulkOperationsService.getBulkOperations(),
    refetchInterval: 5000 // Refresh every 5 seconds for real-time progress
  });

  // Create bulk team member addition
  const createBulkAddMutation = useMutation({
    mutationFn: ({ emails }: { emails: string[] }) =>
      BulkOperationsService.processBulkTeamMemberAddition(teamId, emails, userId),
    onSuccess: () => {
      toast.success('Bulk operation started successfully');
      queryClient.invalidateQueries({ queryKey: ['bulk-operations'] });
      setShowNewOperation(false);
      setBulkEmails('');
      setOperationName('');
    },
    onError: (error: any) => {
      toast.error('Failed to start bulk operation: ' + error.message);
    }
  });

  // Cancel operation
  const cancelMutation = useMutation({
    mutationFn: (operationId: string) =>
      BulkOperationsService.cancelBulkOperation(operationId),
    onSuccess: () => {
      toast.success('Operation cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['bulk-operations'] });
    },
    onError: () => {
      toast.error('Failed to cancel operation');
    }
  });

  // Rollback operation
  const rollbackMutation = useMutation({
    mutationFn: (operationId: string) =>
      BulkOperationsService.rollbackBulkOperation(operationId),
    onSuccess: () => {
      toast.success('Operation rollback initiated');
      queryClient.invalidateQueries({ queryKey: ['bulk-operations'] });
    },
    onError: () => {
      toast.error('Failed to rollback operation');
    }
  });

  const handleBulkAdd = () => {
    if (!operationName.trim()) {
      toast.error('Please provide an operation name');
      return;
    }

    if (!bulkEmails.trim()) {
      toast.error('Please provide email addresses');
      return;
    }

    const emails = bulkEmails
      .split('\n')
      .map(email => email.trim())
      .filter(email => email && email.includes('@'));

    if (emails.length === 0) {
      toast.error('Please provide valid email addresses');
      return;
    }

    createBulkAddMutation.mutate({ emails });
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bulk Operations Manager</h2>
          <p className="text-muted-foreground">
            Manage large-scale team operations with progress tracking and rollback capabilities
          </p>
        </div>
        <Button onClick={() => setShowNewOperation(true)}>
          <Upload className="h-4 w-4 mr-2" />
          New Bulk Operation
        </Button>
      </div>

      {/* New Operation Form */}
      {showNewOperation && (
        <Card>
          <CardHeader>
            <CardTitle>Create Bulk Team Member Addition</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="operation-name">Operation Name</Label>
              <Input
                id="operation-name"
                value={operationName}
                onChange={(e) => setOperationName(e.target.value)}
                placeholder="e.g., Q1 2024 New Hires"
              />
            </div>
            
            <div>
              <Label htmlFor="bulk-emails">Email Addresses (one per line)</Label>
              <Textarea
                id="bulk-emails"
                value={bulkEmails}
                onChange={(e) => setBulkEmails(e.target.value)}
                placeholder="user1@example.com&#10;user2@example.com&#10;user3@example.com"
                rows={8}
              />
              <p className="text-sm text-muted-foreground mt-1">
                {bulkEmails.split('\n').filter(line => line.trim() && line.includes('@')).length} valid email addresses
              </p>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This operation will add users to the team. Make sure all email addresses belong to existing users in the system.
                Failed additions can be reviewed and the entire operation can be rolled back if needed.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button 
                onClick={handleBulkAdd}
                disabled={createBulkAddMutation.isPending}
              >
                {createBulkAddMutation.isPending ? 'Starting...' : 'Start Operation'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowNewOperation(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Operations List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Operations</CardTitle>
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
                          onClick={() => cancelMutation.mutate(operation.id)}
                          disabled={cancelMutation.isPending}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {operation.can_rollback && operation.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rollbackMutation.mutate(operation.id)}
                          disabled={rollbackMutation.isPending}
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

                  {/* Completion Info */}
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
