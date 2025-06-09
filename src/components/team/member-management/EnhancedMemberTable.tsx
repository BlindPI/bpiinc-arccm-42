
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { teamMemberService } from '@/services/team/teamMemberService';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  UserMinus,
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import type { TeamMemberWithProfile } from '@/types/team-management';

interface EnhancedMemberTableProps {
  teamId: string;
  members: TeamMemberWithProfile[];
  userRole?: string;
  onSelectionChange?: (selectedIds: string[]) => void;
  selectedMembers?: string[];
}

export function EnhancedMemberTable({ 
  teamId, 
  members, 
  userRole,
  onSelectionChange,
  selectedMembers = []
}: EnhancedMemberTableProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'role' | 'status' | 'joined'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const canManageMembers = ['SA', 'AD'].includes(userRole || '');

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => teamMemberService.removeTeamMember(teamId, memberId),
    onSuccess: () => {
      toast.success('Member removed successfully');
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to remove member');
    }
  });

  // Update member role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, newRole }: { memberId: string; newRole: string }) =>
      teamMemberService.updateMemberRole(teamId, memberId, newRole),
    onSuccess: () => {
      toast.success('Member role updated successfully');
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update member role');
    }
  });

  // Filtered and sorted members
  const filteredMembers = useMemo(() => {
    let filtered = members.filter(member => {
      const displayName = member.profiles?.display_name || member.display_name || '';
      const email = member.profiles?.email || '';
      const matchesSearch = displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = filterRole === 'all' || member.role === filterRole;
      const matchesStatus = filterStatus === 'all' || member.status === filterStatus;
      
      return matchesSearch && matchesRole && matchesStatus;
    });

    // Sort members
    filtered.sort((a, b) => {
      let aValue: string | Date;
      let bValue: string | Date;

      switch (sortBy) {
        case 'name':
          aValue = (a.profiles?.display_name || a.display_name || '').toLowerCase();
          bValue = (b.profiles?.display_name || b.display_name || '').toLowerCase();
          break;
        case 'role':
          aValue = a.role;
          bValue = b.role;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'joined':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        default:
          aValue = '';
          bValue = '';
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [members, searchTerm, sortBy, sortOrder, filterRole, filterStatus]);

  const handleSort = (column: 'name' | 'role' | 'status' | 'joined') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleMemberSelect = (memberId: string, selected: boolean) => {
    const newSelection = selected 
      ? [...selectedMembers, memberId]
      : selectedMembers.filter(id => id !== memberId);
    
    onSelectionChange?.(newSelection);
  };

  const handleSelectAll = (selected: boolean) => {
    const newSelection = selected 
      ? filteredMembers.map(member => member.id)
      : [];
    
    onSelectionChange?.(newSelection);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-800';
      case 'MEMBER': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-red-100 text-red-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Team Members ({filteredMembers.length})
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search and Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Role: {filterRole === 'all' ? 'All' : filterRole}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterRole('all')}>
                All Roles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterRole('ADMIN')}>
                Admin
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterRole('MEMBER')}>
                Member
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Status: {filterStatus === 'all' ? 'All' : filterStatus}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterStatus('all')}>
                All Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('ACTIVE')}>
                Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('INACTIVE')}>
                Inactive
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('PENDING')}>
                Pending
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Members Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedMembers.length === filteredMembers.length && filteredMembers.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('name')}
                >
                  Member {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('role')}
                >
                  Role {sortBy === 'role' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('status')}
                >
                  Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead>Contact</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('joined')}
                >
                  Joined {sortBy === 'joined' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                {canManageMembers && <TableHead className="w-12">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedMembers.includes(member.id)}
                      onCheckedChange={(checked) => handleMemberSelect(member.id, checked as boolean)}
                    />
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {(member.profiles?.display_name || member.display_name || 'U').charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {member.profiles?.display_name || member.display_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {member.profiles?.role || 'No role assigned'}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge className={getRoleBadgeColor(member.role)}>
                      <Shield className="h-3 w-3 mr-1" />
                      {member.role}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Badge className={getStatusBadgeColor(member.status)}>
                      {member.status}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      {member.profiles?.email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          <span>{member.profiles.email}</span>
                        </div>
                      )}
                      {member.profiles?.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          <span>{member.profiles.phone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(member.created_at).toLocaleDateString()}</span>
                    </div>
                  </TableCell>

                  {canManageMembers && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => updateRoleMutation.mutate({
                              memberId: member.id,
                              newRole: member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN'
                            })}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => removeMemberMutation.mutate(member.id)}
                            className="text-red-600"
                          >
                            <UserMinus className="h-4 w-4 mr-2" />
                            Remove Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredMembers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <UserIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No members found</p>
            <p className="text-sm">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
