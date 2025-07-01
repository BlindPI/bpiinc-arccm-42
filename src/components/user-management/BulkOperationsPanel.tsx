
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  UserCog, 
  Shield, 
  Power,
  PowerOff,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { UserRole } from '@/types/supabase-schema';

interface BulkOperationsPanelProps {
  selectedUsers: string[];
  onBulkUpdateRoles: (userIds: string[], newRole: UserRole) => Promise<void>;
  onBulkUpdateStatus: (userIds: string[], status: 'ACTIVE' | 'INACTIVE') => Promise<void>;
  onBulkUpdateComplianceTier: (userIds: string[], tier: 'basic' | 'robust') => Promise<void>;
  onClearSelection: () => void;
}

export function BulkOperationsPanel({
  selectedUsers,
  onBulkUpdateRoles,
  onBulkUpdateStatus,
  onBulkUpdateComplianceTier,
  onClearSelection
}: BulkOperationsPanelProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [selectedTier, setSelectedTier] = useState<'basic' | 'robust' | ''>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBulkRoleUpdate = async () => {
    if (!selectedRole || selectedUsers.length === 0) return;
    
    setIsProcessing(true);
    try {
      await onBulkUpdateRoles(selectedUsers, selectedRole);
      setSelectedRole('');
      onClearSelection();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkStatusUpdate = async (status: 'ACTIVE' | 'INACTIVE') => {
    if (selectedUsers.length === 0) return;
    
    setIsProcessing(true);
    try {
      await onBulkUpdateStatus(selectedUsers, status);
      onClearSelection();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkTierUpdate = async () => {
    if (!selectedTier || selectedUsers.length === 0) return;
    
    setIsProcessing(true);
    try {
      await onBulkUpdateComplianceTier(selectedUsers, selectedTier);
      setSelectedTier('');
      onClearSelection();
    } finally {
      setIsProcessing(false);
    }
  };

  if (selectedUsers.length === 0) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Select users to perform bulk operations</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          Bulk Operations
          <Badge variant="secondary" className="ml-2">
            {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            These operations will affect {selectedUsers.length} selected user{selectedUsers.length !== 1 ? 's' : ''}. 
            Changes cannot be undone automatically.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Bulk Role Update */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <UserCog className="h-4 w-4" />
              Update Roles
            </div>
            <div className="flex gap-2">
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IT">Instructor Trainee</SelectItem>
                  <SelectItem value="IP">Instructor Provisional</SelectItem>
                  <SelectItem value="IC">Instructor Certified</SelectItem>
                  <SelectItem value="AP">Authorized Provider</SelectItem>
                  <SelectItem value="AD">Administrator</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleBulkRoleUpdate}
                disabled={!selectedRole || isProcessing}
              >
                Apply
              </Button>
            </div>
          </div>

          {/* Bulk Status Update */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Power className="h-4 w-4" />
              Update Status
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatusUpdate('ACTIVE')}
                disabled={isProcessing}
                className="flex-1"
              >
                <Power className="h-3 w-3 mr-1" />
                Activate
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatusUpdate('INACTIVE')}
                disabled={isProcessing}
                className="flex-1"
              >
                <PowerOff className="h-3 w-3 mr-1" />
                Deactivate
              </Button>
            </div>
          </div>

          {/* Bulk Compliance Tier Update */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Shield className="h-4 w-4" />
              Update Tier
            </div>
            <div className="flex gap-2">
              <Select value={selectedTier} onValueChange={(value) => setSelectedTier(value as 'basic' | 'robust')}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic Tier</SelectItem>
                  <SelectItem value="robust">Robust Tier</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleBulkTierUpdate}
                disabled={!selectedTier || isProcessing}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onClearSelection}
            disabled={isProcessing}
          >
            Clear Selection
          </Button>
          
          <div className="text-xs text-muted-foreground">
            All operations are logged for audit purposes
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
