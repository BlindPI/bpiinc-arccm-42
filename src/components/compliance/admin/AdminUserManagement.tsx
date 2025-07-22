import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Search,
  Shield,
  FileText,
  Settings,
  User,
  Mail,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { ComplianceTierService } from '@/services/compliance/complianceTierService';
import { ComplianceTierManager } from '../ComplianceTierManager';

interface UserWithCompliance {
  user_id: string;
  display_name: string;
  email: string;
  role: string;
  compliance_tier: 'basic' | 'robust';
  completion_percentage: number;
}

export function AdminUserManagement() {
  const [users, setUsers] = useState<UserWithCompliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await ComplianceTierService.getAllUsersComplianceTiers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesTier = tierFilter === 'all' || user.compliance_tier === tierFilter;
    
    return matchesSearch && matchesRole && matchesTier;
  });

  // Sort users by completion percentage (lowest first for attention)
  const sortedUsers = filteredUsers.sort((a, b) => a.completion_percentage - b.completion_percentage);

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCompletionIcon = (percentage: number) => {
    if (percentage >= 90) return <CheckCircle className="h-4 w-4 text-green-600" />;
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  const getTierIcon = (tier: 'basic' | 'robust') => {
    return tier === 'basic' ? <FileText className="h-4 w-4" /> : <Shield className="h-4 w-4" />;
  };

  const uniqueRoles = Array.from(new Set(users.map(user => user.role)));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{users.length}</div>
            <div className="text-xs text-gray-500">Total Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {users.filter(u => u.compliance_tier === 'basic').length}
            </div>
            <div className="text-xs text-gray-500">Basic Tier</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {users.filter(u => u.compliance_tier === 'robust').length}
            </div>
            <div className="text-xs text-gray-500">Robust Tier</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {users.filter(u => u.completion_percentage < 70).length}
            </div>
            <div className="text-xs text-gray-500">Need Attention</div>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Compliance Management
              <Badge variant="outline">{filteredUsers.length} users</Badge>
            </CardTitle>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              {uniqueRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>

            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Tiers</option>
              <option value="basic">Basic</option>
              <option value="robust">Robust</option>
            </select>
          </div>
        </CardHeader>

        <CardContent>
          {sortedUsers.length > 0 ? (
            <div className="space-y-4">
              {sortedUsers.map((user) => (
                <div key={user.user_id} className="p-4 border rounded-lg">
                  {selectedUser === user.user_id ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-gray-500" />
                          <div>
                            <div className="font-medium">{user.display_name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedUser(null)}
                        >
                          Close
                        </Button>
                      </div>
                      
                      <ComplianceTierManager
                        userId={user.user_id}
                        userRole={user.role as any}
                        userName={user.display_name}
                        canManage={true}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="font-medium">{user.display_name}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                          </div>
                        </div>

                        <Badge variant="outline">{user.role}</Badge>

                        <Badge 
                          variant="outline"
                          className={user.compliance_tier === 'robust' ? 'bg-green-50' : 'bg-blue-50'}
                        >
                          {getTierIcon(user.compliance_tier)}
                          {user.compliance_tier.charAt(0).toUpperCase() + user.compliance_tier.slice(1)}
                        </Badge>

                        <div className="flex items-center gap-2">
                          {getCompletionIcon(user.completion_percentage)}
                          <span className={`font-medium ${getCompletionColor(user.completion_percentage)}`}>
                            {user.completion_percentage}%
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedUser(user.user_id)}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Manage
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {users.length === 0 ? (
                <>
                  <Users className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No users found</p>
                  <p className="text-sm">No compliance users are currently in the system.</p>
                </>
              ) : (
                <>
                  <Search className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No users match your filters</p>
                  <p className="text-sm">Try adjusting your search or filter criteria.</p>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}