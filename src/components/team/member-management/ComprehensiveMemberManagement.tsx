
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { teamMemberService } from '@/services/team/teamMemberService';
import { enhancedTeamManagementService } from '@/services/team/enhancedTeamManagementService';
import { ComplianceService } from '@/services/team/complianceService';
import { EnhancedMemberTable } from './EnhancedMemberTable';
import { MemberActivityTimeline } from './MemberActivityTimeline';
import { MemberCompliancePanel } from './MemberCompliancePanel';
import { BulkMemberOperationsPanel } from './BulkMemberOperationsPanel';
import { MemberPermissionsManager } from './MemberPermissionsManager';
import { AddMemberModal } from './AddMemberModal';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Activity, 
  Settings,
  Download,
  Filter,
  Search
} from 'lucide-react';

interface ComprehensiveMemberManagementProps {
  teamId: string;
  userRole?: string;
}

export function ComprehensiveMemberManagement({ teamId, userRole }: ComprehensiveMemberManagementProps) {
  const [activeTab, setActiveTab] = useState('members');
  const [showAddMember, setShowAddMember] = useState(false);
  const [showBulkOps, setShowBulkOps] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // Real-time data queries
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['team-members', teamId],
    queryFn: () => teamMemberService.getTeamMembers(teamId),
    refetchInterval: 30000 // Real-time updates every 30 seconds
  });

  const { data: membershipStats } = useQuery({
    queryKey: ['membership-stats', teamId],
    queryFn: () => enhancedTeamManagementService.getMembershipStatistics(teamId),
    refetchInterval: 60000
  });

  const { data: complianceOverview } = useQuery({
    queryKey: ['team-compliance', teamId],
    queryFn: () => ComplianceService.getTeamComplianceOverview(teamId),
    refetchInterval: 300000
  });

  const canManageMembers = ['SA', 'AD'].includes(userRole || '');
  const canViewCompliance = ['SA', 'AD', 'AP'].includes(userRole || '');

  const handleMemberSelect = (memberIds: string[]) => {
    setSelectedMembers(memberIds);
  };

  const handleBulkOperationComplete = () => {
    setSelectedMembers([]);
    setShowBulkOps(false);
  };

  if (membersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Total Members</span>
            </div>
            <p className="text-2xl font-bold mt-1">{membershipStats?.totalMembers || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Active Members</span>
            </div>
            <p className="text-2xl font-bold mt-1">{membershipStats?.activeMembers || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Admins</span>
            </div>
            <p className="text-2xl font-bold mt-1">{membershipStats?.adminMembers || 0}</p>
          </CardContent>
        </Card>

        {canViewCompliance && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Compliance</span>
              </div>
              <p className="text-2xl font-bold mt-1">{complianceOverview?.complianceRate || 0}%</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Bar */}
      {canManageMembers && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowAddMember(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
            
            {selectedMembers.length > 0 && (
              <Button variant="outline" onClick={() => setShowBulkOps(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Bulk Operations ({selectedMembers.length})
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filter
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          {canViewCompliance && <TabsTrigger value="compliance">Compliance</TabsTrigger>}
          {canManageMembers && <TabsTrigger value="permissions">Permissions</TabsTrigger>}
          {canManageMembers && <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>}
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <EnhancedMemberTable
            teamId={teamId}
            userRole={userRole}
            onSelectionChange={handleMemberSelect}
            selectedMembers={selectedMembers}
          />
        </TabsContent>

        <TabsContent value="activity">
          <MemberActivityTimeline teamId={teamId} />
        </TabsContent>

        {canViewCompliance && (
          <TabsContent value="compliance">
            <MemberCompliancePanel teamId={teamId} members={members} />
          </TabsContent>
        )}

        {canManageMembers && (
          <TabsContent value="permissions">
            <MemberPermissionsManager teamId={teamId} members={members} />
          </TabsContent>
        )}

        {canManageMembers && (
          <TabsContent value="bulk">
            <BulkMemberOperationsPanel
              teamId={teamId}
              selectedMembers={selectedMembers}
              onOperationComplete={handleBulkOperationComplete}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Modals */}
      {showAddMember && (
        <AddMemberModal
          teamId={teamId}
          onClose={() => setShowAddMember(false)}
          onSuccess={() => setShowAddMember(false)}
        />
      )}

      {showBulkOps && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <BulkMemberOperationsPanel
              teamId={teamId}
              selectedMembers={selectedMembers}
              onOperationComplete={handleBulkOperationComplete}
              onClose={() => setShowBulkOps(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
