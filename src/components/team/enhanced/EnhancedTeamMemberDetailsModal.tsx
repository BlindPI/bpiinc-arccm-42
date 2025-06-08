
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { EnhancedTeamMember, TeamMemberUpdate } from '@/services/team/enhancedTeamService';
import { Save, X, Plus, Trash2 } from 'lucide-react';

interface EnhancedTeamMemberDetailsModalProps {
  member: EnhancedTeamMember;
  canEdit: boolean;
  onSave: (updates: TeamMemberUpdate) => void;
  onClose: () => void;
}

export function EnhancedTeamMemberDetailsModal({
  member,
  canEdit,
  onSave,
  onClose
}: EnhancedTeamMemberDetailsModalProps) {
  const [formData, setFormData] = useState<TeamMemberUpdate>({
    role: member.role,
    team_position: member.team_position || '',
    status: member.status,
    skills: [...member.skills],
    emergency_contact: { ...member.emergency_contact },
    notes: member.notes || ''
  });

  const [newSkill, setNewSkill] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills?.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...(prev.skills || []), newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills?.filter(skill => skill !== skillToRemove) || []
    }));
  };

  const updateEmergencyContact = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      emergency_contact: {
        ...prev.emergency_contact,
        [field]: value
      }
    }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {member.display_name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {member.display_name}
            <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
              {member.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  value={member.profile?.email || ''} 
                  disabled 
                  className="bg-gray-50"
                />
              </div>
              
              <div>
                <Label htmlFor="role">Team Role</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value: 'MEMBER' | 'ADMIN') => 
                    setFormData(prev => ({ ...prev, role: value }))
                  }
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={formData.team_position}
                  onChange={(e) => setFormData(prev => ({ ...prev, team_position: e.target.value }))}
                  disabled={!canEdit}
                  placeholder="e.g., Senior Developer"
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: 'active' | 'inactive' | 'on_leave' | 'suspended') => 
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                  disabled={!canEdit}
                >
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
            </div>
          </div>

          {/* Skills Management */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Skills</h3>
            
            {canEdit && (
              <div className="flex gap-2">
                <Input
                  placeholder="Add a skill..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
                <Button type="button" onClick={addSkill} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {formData.skills?.map((skill, index) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1">
                  {skill}
                  {canEdit && (
                    <button 
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
              {(!formData.skills || formData.skills.length === 0) && (
                <span className="text-sm text-muted-foreground">No skills added</span>
              )}
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Emergency Contact</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergency_name">Contact Name</Label>
                <Input
                  id="emergency_name"
                  value={formData.emergency_contact?.name || ''}
                  onChange={(e) => updateEmergencyContact('name', e.target.value)}
                  disabled={!canEdit}
                  placeholder="Emergency contact name"
                />
              </div>
              
              <div>
                <Label htmlFor="emergency_phone">Contact Phone</Label>
                <Input
                  id="emergency_phone"
                  value={formData.emergency_contact?.phone || ''}
                  onChange={(e) => updateEmergencyContact('phone', e.target.value)}
                  disabled={!canEdit}
                  placeholder="Emergency contact phone"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="emergency_relationship">Relationship</Label>
              <Input
                id="emergency_relationship"
                value={formData.emergency_contact?.relationship || ''}
                onChange={(e) => updateEmergencyContact('relationship', e.target.value)}
                disabled={!canEdit}
                placeholder="e.g., Spouse, Parent, Friend"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              disabled={!canEdit}
              placeholder="Additional notes about this team member..."
              rows={3}
            />
          </div>

          {/* Timestamps */}
          <div className="space-y-2 pt-4 border-t">
            <h3 className="text-sm font-medium text-muted-foreground">Membership Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <span className="font-medium">Joined:</span> {' '}
                {member.assignment_start_date 
                  ? new Date(member.assignment_start_date).toLocaleDateString()
                  : 'Not set'
                }
              </div>
              <div>
                <span className="font-medium">Last Activity:</span> {' '}
                {member.last_activity 
                  ? new Date(member.last_activity).toLocaleDateString()
                  : 'Never'
                }
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              {canEdit ? 'Cancel' : 'Close'}
            </Button>
            {canEdit && (
              <Button type="submit" className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
