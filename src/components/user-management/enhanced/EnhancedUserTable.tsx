
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MoreHorizontal, 
  Edit, 
  Shield, 
  Mail, 
  Power,
  Eye,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ExtendedProfile } from '@/types/supabase-schema';

interface EnhancedUserTableProps {
  users: ExtendedProfile[];
  selectedUsers: string[];
  onSelectUser: (userId: string, selected: boolean) => void;
  onEditUser: (userId: string) => void;
  onActivateUser: (userId: string) => void;
  onDeactivateUser: (userId: string) => void;
  onResetPassword: (userId: string) => void;
  onChangeRole: (userId: string) => void;
  onViewDetail: (userId: string) => void;
  loading?: boolean;
}

export const EnhancedUserTable: React.FC<EnhancedUserTableProps> = ({
  users,
  selectedUsers,
  onSelectUser,
  onEditUser,
  onActivateUser,
  onDeactivateUser,
  onResetPassword,
  onChangeRole,
  onViewDetail,
  loading = false
}) => {
  const getRoleColor = (role: string) => {
    const colors = {
      'SA': 'bg-red-100 text-red-800',
      'AD': 'bg-purple-100 text-purple-800',
      'IT': 'bg-green-100 text-green-800',
      'IP': 'bg-blue-100 text-blue-800',
      'IC': 'bg-amber-100 text-amber-800',
      'AP': 'bg-indigo-100 text-indigo-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string, compliance?: boolean) => {
    if (status === 'ACTIVE') {
      return compliance ? 
        <CheckCircle className="h-4 w-4 text-green-500" /> :
        <AlertTriangle className="h-4 w-4 text-amber-500" />;
    }
    if (status === 'PENDING') {
      return <Clock className="h-4 w-4 text-blue-500" />;
    }
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'ACTIVE': 'default',
      'PENDING': 'secondary',
      'INACTIVE': 'destructive'
    };
    return variants[status] || 'outline';
  };

  if (loading) {
    return (
      <div className="grid gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <Card key={user.id} className="border-2 hover:shadow-md transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                {/* Selection Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user.id)}
                  onChange={(e) => onSelectUser(user.id, e.target.checked)}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />

                {/* Avatar */}
                <Avatar className="h-12 w-12">
                  <AvatarImage src="" alt={user.display_name || user.email} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white">
                    {(user.display_name || user.email)?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {user.display_name || 'Unnamed User'}
                    </h3>
                    <Badge className={getRoleColor(user.role)}>
                      {user.role}
                    </Badge>
                    <Badge variant={getStatusBadge(user.status) as any}>
                      {user.status}
                    </Badge>
                    {getStatusIcon(user.status, user.compliance_status)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </span>
                    <span>
                      Created: {new Date(user.created_at).toLocaleDateString()}
                    </span>
                    {user.compliance_status && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                        Compliant
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetail(user.id)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => onEditUser(user.id)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit User
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onChangeRole(user.id)}>
                      <Shield className="h-4 w-4 mr-2" />
                      Change Role
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onResetPassword(user.id)}>
                      <Mail className="h-4 w-4 mr-2" />
                      Reset Password
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {user.status === 'ACTIVE' ? (
                      <DropdownMenuItem 
                        onClick={() => onDeactivateUser(user.id)}
                        className="text-red-600"
                      >
                        <Power className="h-4 w-4 mr-2" />
                        Deactivate
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem 
                        onClick={() => onActivateUser(user.id)}
                        className="text-green-600"
                      >
                        <Power className="h-4 w-4 mr-2" />
                        Activate
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {users.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500">No users match your current filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
