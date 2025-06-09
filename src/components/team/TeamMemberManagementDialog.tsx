
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { TeamMemberWithProfile } from '@/types/team-management';

interface TeamMemberManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: TeamMemberWithProfile;
  onSave: (memberData: Partial<TeamMemberWithProfile>) => void;
}

export function TeamMemberManagementDialog({
  open,
  onOpenChange,
  member,
  onSave
}: TeamMemberManagementDialogProps) {
  const [formData, setFormData] = useState<Partial<TeamMemberWithProfile>>({
    role: member?.role || 'MEMBER',
    status: member?.status || 'active',
    permissions: member?.permissions || []
  });

  const handlePermissionChange = (permission: string, checked: boolean) => {
    const currentPermissions = Array.isArray(formData.permissions) ? formData.permissions : [];
    
    if (checked) {
      setFormData({
        ...formData,
        permissions: [...currentPermissions, permission]
      });
    } else {
      setFormData({
        ...formData,
        permissions: currentPermissions.filter(p => p !== permission)
      });
    }
  };

  const isPermissionChecked = (permission: string): boolean => {
    const permissions = Array.isArray(formData.permissions) ? formData.permissions : [];
    return permissions.includes(permission);
  };

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {member ? 'Edit Member' : 'Add Member'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">Role</Label>
            <Select 
              value={formData.role} 
              onValueChange={(value) => setFormData({ ...formData, role: value as 'MEMBER' | 'ADMIN' })}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData({ ...formData, status: value as any })}
            >
              <SelectTrigger className="col-span-3">
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

          <div className="space-y-3">
            <Label>Permissions</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="admin"
                  checked={isPermissionChecked('admin')}
                  onCheckedChange={(checked) => handlePermissionChange('admin', checked as boolean)}
                />
                <Label htmlFor="admin">Admin Access</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="manage_members"
                  checked={isPermissionChecked('manage_members')}
                  onCheckedChange={(checked) => handlePermissionChange('manage_members', checked as boolean)}
                />
                <Label htmlFor="manage_members">Manage Members</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="manage_team"
                  checked={isPermissionChecked('manage_team')}
                  onCheckedChange={(checked) => handlePermissionChange('manage_team', checked as boolean)}
                />
                <Label htmlFor="manage_team">Manage Team</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="view_analytics"
                  checked={isPermissionChecked('view_analytics')}
                  onCheckedChange={(checked) => handlePermissionChange('view_analytics', checked as boolean)}
                />
                <Label htmlFor="view_analytics">View Analytics</Label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
