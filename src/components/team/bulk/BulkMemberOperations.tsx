
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Upload, AlertTriangle } from 'lucide-react';
import { BulkOperationsService } from '@/services/team/bulkOperationsService';
import { toast } from 'sonner';

interface BulkMemberOperationsProps {
  teamId: string;
  onOperationStart?: (operationId: string) => void;
}

export function BulkMemberOperations({ teamId, onOperationStart }: BulkMemberOperationsProps) {
  const queryClient = useQueryClient();
  const [memberEmails, setMemberEmails] = useState('');

  const bulkOperationMutation = useMutation({
    mutationFn: (emails: string[]) => 
      BulkOperationsService.processBulkTeamMemberAddition(teamId, emails, 'current-user-id'),
    onSuccess: (operation) => {
      toast.success('Bulk operation started successfully');
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      onOperationStart?.(operation.id);
      setMemberEmails('');
    },
    onError: (error) => {
      toast.error(`Failed to start bulk operation: ${error.message}`);
    }
  });

  const handleBulkAdd = () => {
    if (!memberEmails.trim()) {
      toast.error('Please provide email addresses');
      return;
    }

    const emails = memberEmails
      .split('\n')
      .map(email => email.trim())
      .filter(email => email && email.includes('@'));

    if (emails.length === 0) {
      toast.error('Please provide valid email addresses');
      return;
    }

    bulkOperationMutation.mutate(emails);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Bulk Member Operations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="member-emails">Member Email Addresses (one per line)</Label>
          <Textarea
            id="member-emails"
            value={memberEmails}
            onChange={(e) => setMemberEmails(e.target.value)}
            placeholder="user1@example.com&#10;user2@example.com&#10;user3@example.com"
            rows={8}
          />
          <p className="text-sm text-muted-foreground mt-1">
            {memberEmails.split('\n').filter(line => line.trim() && line.includes('@')).length} valid email addresses
          </p>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This will attempt to add all provided email addresses as team members. 
            Users must already exist in the system. Failed additions will be logged and can be reviewed.
          </AlertDescription>
        </Alert>

        <Button 
          onClick={handleBulkAdd}
          disabled={bulkOperationMutation.isPending || !memberEmails.trim()}
          className="w-full"
        >
          {bulkOperationMutation.isPending ? 'Processing...' : 'Start Bulk Addition'}
        </Button>
      </CardContent>
    </Card>
  );
}
