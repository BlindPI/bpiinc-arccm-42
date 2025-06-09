import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  status: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export function TeamManagementComponent() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('member');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  useEffect(() => {
    // Fetch team members from database or API
    const mockTeamMembers = [
      {
        id: '1',
        user_id: 'user1',
        role: 'admin',
        status: 'active',
        permissions: ['manage_members', 'manage_team'],
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      },
      {
        id: '2',
        user_id: 'user2',
        role: 'member',
        status: 'active',
        permissions: [],
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      },
      {
        id: '3',
        user_id: 'user3',
        role: 'member',
        status: 'inactive',
        permissions: [],
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      }
    ];
    setTeamMembers(mockTeamMembers);
  }, []);

  const handleAddMember = () => {
    // Add new member to database or API
    console.log('Adding member', newMemberEmail, selectedRole);
    setNewMemberEmail('');
    setSelectedRole('member');
  };

  const handleOpenDialog = (member: TeamMember) => {
    setSelectedMember(member);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedMember(null);
  };

  const handleUpdateMember = (memberId: string, updates: Partial<TeamMember>) => {
    // Convert permissions object to string array if needed
    const updatedMember = {
      ...updates,
      permissions: Array.isArray(updates.permissions) ? updates.permissions : []
    };
    
    setTeamMembers(teamMembers.map(member => {
      if (member.id === memberId) {
        return {
          ...member,
          ...updatedMember,
        };
      }
      return member;
    }));
    handleCloseDialog();
  };

  const handleDeleteMember = (memberId: string) => {
    // Delete member from database or API
    console.log('Deleting member', memberId);
    setTeamMembers(teamMembers.filter(member => member.id !== memberId));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="flex items-center space-x-2">
            <Input
              type="email"
              placeholder="Email address"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
            />
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAddMember}>Add Member</Button>
          </div>
          <div className="divide-y divide-gray-200">
            {teamMembers.map(member => (
              <div key={member.id} className="py-4 flex items-center justify-between">
                <div>
                  <p>{member.user_id}</p>
                  <p className="text-sm text-gray-500">Role: {member.role}</p>
                  <p className="text-sm text-gray-500">Status: {member.status}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleOpenDialog(member)}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeleteMember(member.id)}>
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
