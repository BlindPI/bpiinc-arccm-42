
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
import type { EnhancedTeamMember, TeamMemberUpdate } from '@/services/team/functionalTeamService';
import { Save, X, Plus } from 'lucide-react';

interface TeamMemberDetailsModalProps {
  member: EnhancedTeamMember;
  canEdit: boolean;
  onSave: (updates: TeamMemberUpdate) => void;
  onClose: () => void;
}

export function TeamMemberDetailsModal({
  member,
  canEdit,
  onSave,
  onClose
}: TeamMemberDetailsModalProps) {
  const [formData, setFormData] = useState<TeamMemberUpdate>({
    role: member.role,
    team_position: member.team_position || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
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
          </div>

          {/* Enhanced Features Coming Soon */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-500">Enhanced Features</h3>
            <div className="p-4 border rounded-lg bg-gray-50">
              <p className="text-sm text-gray-600 mb-2">
                Advanced member management features (skills, emergency contacts, notes, status tracking) will be available once the database schema is enhanced.
              </p>
              <Badge variant="outline" className="text-xs">
                Coming Soon
              </Badge>
            </div>
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
                <span className="font-medium">Last Updated:</span> {' '}
                {member.updated_at 
                  ? new Date(member.updated_at).toLocaleDateString()
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
