
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Crown, Users, Award } from 'lucide-react';

interface RoleHierarchyCardProps {
  userRole: string | string[];
  userPermissions: string[];
}

export function RoleHierarchyCard({ userRole, userPermissions }: RoleHierarchyCardProps) {
  // Fixed: Convert userRole to array properly and handle type checking
  const roleArray = Array.isArray(userRole) ? userRole : [userRole];
  
  // Fixed: ROLE_HIERARCHY as an object with proper typing
  const ROLE_HIERARCHY = {
    'SA': { level: 5, name: 'System Administrator', icon: Crown },
    'AD': { level: 4, name: 'Administrator', icon: Shield },
    'AP': { level: 3, name: 'Authorized Provider', icon: Award },
    'IT': { level: 2, name: 'Instructor Trainer', icon: Users },
    'IC': { level: 1, name: 'Instructor Candidate', icon: Users },
    'IP': { level: 1, name: 'Instructor Provisional', icon: Users },
    'IN': { level: 1, name: 'Instructor', icon: Users },
  };

  // Fixed: Determine highest role level with proper type checking
  const getHighestRoleLevel = () => {
    return Math.max(...roleArray.map(role => ROLE_HIERARCHY[role as keyof typeof ROLE_HIERARCHY]?.level || 0));
  };

  const getAccessibleRoles = () => {
    const userLevel = getHighestRoleLevel();
    return Object.entries(ROLE_HIERARCHY)
      .filter(([_, roleInfo]) => roleInfo.level <= userLevel)
      .map(([roleCode, roleInfo]) => ({ code: roleCode, ...roleInfo }));
  };

  const primaryRole = roleArray[0] || 'IT';
  const roleInfo = ROLE_HIERARCHY[primaryRole as keyof typeof ROLE_HIERARCHY];
  const IconComponent = roleInfo?.icon || Users;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconComponent className="h-5 w-5" />
          Role Hierarchy & Access
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Your Current Role(s)</h4>
          <div className="flex flex-wrap gap-2">
            {roleArray.map((role) => {
              const info = ROLE_HIERARCHY[role as keyof typeof ROLE_HIERARCHY];
              return (
                <Badge key={role} variant="default">
                  {info?.name || role}
                </Badge>
              );
            })}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Accessible Roles</h4>
          <div className="space-y-2">
            {getAccessibleRoles().map((role) => (
              <div key={role.code} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <role.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{role.name}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  Level {role.level}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Permissions</h4>
          <div className="flex flex-wrap gap-2">
            {userPermissions.map((permission) => (
              <Badge key={permission} variant="secondary" className="text-xs">
                {permission}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
