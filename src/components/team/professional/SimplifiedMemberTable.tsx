
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Users, 
  Mail, 
  Phone, 
  Settings, 
  MoreVertical,
  UserPlus,
  Crown,
  Shield
} from 'lucide-react';

interface SimplifiedMemberTableProps {
  teamId: string;
  members: any[];
  onMemberUpdated: () => void;
}

export function SimplifiedMemberTable({ 
  teamId, 
  members, 
  onMemberUpdated 
}: SimplifiedMemberTableProps) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'LEAD': return <Shield className="h-4 w-4 text-blue-500" />;
      default: return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Badge className="bg-yellow-100 text-yellow-800">Admin</Badge>;
      case 'LEAD': return <Badge className="bg-blue-100 text-blue-800">Lead</Badge>;
      default: return <Badge variant="secondary">Member</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members ({members.length})
          </CardTitle>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Team Members</h3>
            <p>This team doesn't have any members yet.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {member.display_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{member.display_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {member.team_position || 'Team Member'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(member.role)}
                      {getRoleBadge(member.role)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      {member.profile?.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3" />
                          {member.profile.email}
                        </div>
                      )}
                      {member.profile?.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3" />
                          {member.profile.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge 
                      variant={member.status === 'active' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {member.status || 'active'}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
