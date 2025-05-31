
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { enhancedTeamManagementService } from '@/services/team/enhancedTeamManagementService';
import { Users, MapPin, Edit, History, UserCheck, AlertCircle, Calendar, Settings } from 'lucide-react';
import { toast } from 'sonner';
import type { EnhancedTeamMember, BulkMemberAction } from '@/types/enhanced-team-management';

interface EnhancedMemberManagementProps {
  teamId: string;
}

export function EnhancedMemberManagement({ teamId }: EnhancedMemberManagementProps) {
  const queryClient = useQueryClient();
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [editingMember, setEditingMember] = useState<EnhancedTeamMember | null>(null);
  const [bulkAction, setBulkAction] = useState<string>('');

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['enhanced-team-members', teamId],
    queryFn: () => enhancedTeamManagementService.getEnhancedTeamMembers(teamId)
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({ memberId, updates }: { memberId: string; updates: Partial<EnhancedTeamMember> }) =>
      enhancedTeamManagementService.updateMemberDetails(memberId, updates),
    onSuccess: () => {
      toast.success('Member updated successfully');
      queryClient.invalidateQueries({ queryKey: ['enhanced-team-members', teamId] });
      setEditingMember(null);
    },
    onError: (error) => {
      toast.error(`Failed to update member: ${error.message}`);
    }
  });

  const bulkActionMutation = useMutation({
    mutationFn: (action: BulkMemberAction) =>
      enhancedTeamManagementService.performBulkMemberAction(action),
    onSuccess: () => {
      toast.success('Bulk action completed successfully');
      queryClient.invalidateQueries({ queryKey: ['enhanced-team-members', teamId] });
      setSelectedMembers([]);
      setBulkAction('');
    },
    onError: (error) => {
      toast.error(`Bulk action failed: ${error.message}`);
    }
  });

  const handleMemberSelect = (memberId: string, checked: boolean | string) => {
    const isChecked = typeof checked === 'boolean' ? checked : checked === 'true';
    if (isChecked) {
      setSelectedMembers([...selectedMembers, memberId]);
    } else {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId));
    }
  };

  const handleSelectAll = (checked: boolean | string) => {
    const isChecked = typeof checked === 'boolean' ? checked : checked === 'true';
    if (isChecked) {
      setSelectedMembers(members.map(m => m.id));
    } else {
      setSelectedMembers([]);
    }
  };

  const handleBulkAction = () => {
    if (!bulkAction || selectedMembers.length === 0) {
      toast.error('Please select members and an action');
      return;
    }

    const action: BulkMemberAction = {
      action: bulkAction as any,
      member_ids: selectedMembers,
      data: {}, // This would be populated based on the specific action
      reason: 'Bulk operation'
    };

    bulkActionMutation.mutate(action);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'on_leave': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Loading enhanced member management...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bulk Actions Bar */}
      {selectedMembers.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">
                {selectedMembers.length} member(s) selected
              </span>
              <Select value={bulkAction} onValueChange={setBulkAction}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Choose action..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="update_status">Update Status</SelectItem>
                  <SelectItem value="reassign_location">Reassign Location</SelectItem>
                  <SelectItem value="update_role">Update Role</SelectItem>
                  <SelectItem value="send_notification">Send Notification</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleBulkAction}
                disabled={!bulkAction || bulkActionMutation.isPending}
              >
                {bulkActionMutation.isPending ? 'Processing...' : 'Apply Action'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setSelectedMembers([])}
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Enhanced Member Management ({members.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedMembers.length === members.length && members.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm">Select All</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div key={member.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedMembers.includes(member.id)}
                      onCheckedChange={(checked) => handleMemberSelect(member.id, checked)}
                    />
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <UserCheck className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{member.display_name}</h4>
                        <p className="text-sm text-muted-foreground">{member.team_position || 'Team Member'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(member.status)}>
                      {member.status}
                    </Badge>
                    <Badge variant="outline">
                      {member.role}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingMember(member)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>

                {/* Member Details */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Location:</span>
                    <p>{member.location_assignment || 'Not assigned'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Skills:</span>
                    <p>{member.skills?.length ? `${member.skills.length} skills` : 'None listed'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last Activity:</span>
                    <p>{member.last_activity ? new Date(member.last_activity).toLocaleDateString() : 'Never'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Member Since:</span>
                    <p>{new Date(member.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {member.notes && (
                  <div className="mt-3 p-3 bg-muted rounded">
                    <span className="text-sm font-medium">Notes:</span>
                    <p className="text-sm mt-1">{member.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Member Modal */}
      {editingMember && (
        <MemberEditModal
          member={editingMember}
          onSave={(updates) => updateMemberMutation.mutate({ memberId: editingMember.id, updates })}
          onClose={() => setEditingMember(null)}
          isLoading={updateMemberMutation.isPending}
        />
      )}
    </div>
  );
}

interface MemberEditModalProps {
  member: EnhancedTeamMember;
  onSave: (updates: Partial<EnhancedTeamMember>) => void;
  onClose: () => void;
  isLoading: boolean;
}

function MemberEditModal({ member, onSave, onClose, isLoading }: MemberEditModalProps) {
  const [formData, setFormData] = useState({
    status: member.status,
    team_position: member.team_position || '',
    skills: member.skills?.join(', ') || '',
    notes: member.notes || '',
    emergency_contact: {
      name: member.emergency_contact?.name || '',
      phone: member.emergency_contact?.phone || '',
      relationship: member.emergency_contact?.relationship || ''
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      status: formData.status as any,
      team_position: formData.team_position,
      skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
      notes: formData.notes,
      emergency_contact: formData.emergency_contact
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Edit {member.display_name}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList>
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="contact">Emergency Contact</TabsTrigger>
                <TabsTrigger value="notes">Notes & Skills</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Position</label>
                  <Input
                    value={formData.team_position}
                    onChange={(e) => setFormData({...formData, team_position: e.target.value})}
                    placeholder="Team position or role"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="contact" className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Emergency Contact Name</label>
                  <Input
                    value={formData.emergency_contact.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      emergency_contact: {...formData.emergency_contact, name: e.target.value}
                    })}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Emergency Contact Phone</label>
                  <Input
                    value={formData.emergency_contact.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      emergency_contact: {...formData.emergency_contact, phone: e.target.value}
                    })}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Relationship</label>
                  <Input
                    value={formData.emergency_contact.relationship}
                    onChange={(e) => setFormData({
                      ...formData,
                      emergency_contact: {...formData.emergency_contact, relationship: e.target.value}
                    })}
                    placeholder="e.g., Spouse, Parent, Sibling"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="notes" className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Skills (comma-separated)</label>
                  <Input
                    value={formData.skills}
                    onChange={(e) => setFormData({...formData, skills: e.target.value})}
                    placeholder="First Aid, CPR, AED, Management..."
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Additional notes about this team member..."
                    rows={4}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
