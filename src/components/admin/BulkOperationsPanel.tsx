
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Mail, 
  Download, 
  Trash2, 
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useBulkUserOperations, useBulkCertificateOperations } from '@/hooks/useBulkOperations';

interface BulkOperationsPanelProps {
  selectedUsers?: any[];
  selectedCertificates?: any[];
  onClearSelection?: () => void;
}

export const BulkOperationsPanel: React.FC<BulkOperationsPanelProps> = ({
  selectedUsers = [],
  selectedCertificates = [],
  onClearSelection
}) => {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const userOperations = useBulkUserOperations();
  const certificateOperations = useBulkCertificateOperations();

  const handleBulkRoleUpdate = () => {
    if (!selectedRole || selectedUsers.length === 0) return;
    
    const userIds = selectedUsers.map(user => user.id);
    userOperations.bulkUpdateRoles.mutate({ userIds, newRole: selectedRole });
  };

  const handleBulkUserDeactivation = () => {
    if (selectedUsers.length === 0) return;
    
    const userIds = selectedUsers.map(user => user.id);
    userOperations.bulkDeactivateUsers.mutate(userIds);
  };

  const handleBulkEmailCertificates = () => {
    if (selectedCertificates.length === 0) return;
    
    const certificateIds = selectedCertificates.map(cert => cert.id);
    certificateOperations.bulkEmailCertificates.mutate(certificateIds);
  };

  const handleBulkCertificateStatusUpdate = () => {
    if (!selectedStatus || selectedCertificates.length === 0) return;
    
    const certificateIds = selectedCertificates.map(cert => cert.id);
    certificateOperations.bulkUpdateCertificateStatus.mutate({ 
      certificateIds, 
      status: selectedStatus 
    });
  };

  const isProcessing = userOperations.isProcessing || certificateOperations.isProcessing;
  const currentProgress = userOperations.progress.total > 0 ? userOperations.progress : certificateOperations.progress;

  return (
    <div className="space-y-4">
      {/* User Bulk Operations */}
      {selectedUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Bulk Operations
              <Badge variant="secondary">{selectedUsers.length} selected</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Role Update */}
            <div className="flex items-center gap-2">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select new role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IT">Instructor Trainee</SelectItem>
                  <SelectItem value="IC">Instructor Candidate</SelectItem>
                  <SelectItem value="IP">Instructor Provisional</SelectItem>
                  <SelectItem value="IF">Instructor Full</SelectItem>
                  <SelectItem value="IE">Instructor Examiner</SelectItem>
                  <SelectItem value="ITR">Instructor Trainer</SelectItem>
                  <SelectItem value="AP">Affiliate Provider</SelectItem>
                  <SelectItem value="AD">Administrator</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleBulkRoleUpdate}
                disabled={!selectedRole || isProcessing}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Update Roles
              </Button>
            </div>

            {/* Deactivation */}
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                onClick={handleBulkUserDeactivation}
                disabled={isProcessing}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Deactivate Users
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Certificate Bulk Operations */}
      {selectedCertificates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Certificate Bulk Operations
              <Badge variant="secondary">{selectedCertificates.length} selected</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email Certificates */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleBulkEmailCertificates}
                disabled={isProcessing}
              >
                <Mail className="h-4 w-4 mr-2" />
                Email Certificates
              </Button>
            </div>

            {/* Status Update */}
            <div className="flex items-center gap-2">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                  <SelectItem value="REVOKED">Revoked</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleBulkCertificateStatusUpdate}
                disabled={!selectedStatus || isProcessing}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Update Status
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Indicator */}
      {isProcessing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Processing Bulk Operation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{currentProgress.current} / {currentProgress.total}</span>
              </div>
              <Progress 
                value={(currentProgress.current / currentProgress.total) * 100} 
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clear Selection */}
      {(selectedUsers.length > 0 || selectedCertificates.length > 0) && (
        <Button 
          variant="outline" 
          onClick={onClearSelection}
          className="w-full"
        >
          Clear Selection
        </Button>
      )}

      {/* Performance Tips */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Bulk operations are processed in batches to optimize performance. 
          Large operations may take several minutes to complete.
        </AlertDescription>
      </Alert>
    </div>
  );
};
