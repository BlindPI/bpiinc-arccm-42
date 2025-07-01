import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal, User as UserIcon, UserCog, ShieldCheck } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Profile } from '@/types/supabase-schema'; // Keep original Profile import
import { UserCredentialsHoverCard } from './UserCredentialsHoverCard';
import { hasRequiredRole } from '@/utils/roleUtils';
import { ComplianceTierManager } from '@/components/compliance/ComplianceTierManager'; // New import
import { FileText, Shield } from 'lucide-react'; // New: Icons for tiers

// Extend Profile type locally to include compliance_tier if not already present in supabase-schema
interface UserWithCompliance extends Profile {
  compliance_tier: 'basic' | 'robust' | null;
}

interface UserTableRowProps {
  user: UserWithCompliance; // Use the extended type
  isSelected: boolean;
  onSelect: (userId: string, selected: boolean) => void;
  onEdit: (userId: string) => void;
  onActivate: (userId: string) => void;
  onDeactivate: (userId: string) => void;
  onResetPassword: (userId: string) => void;
  onChangeRole: (userId: string) => void;
  canManageUsers?: boolean;
  onViewDetail?: (userId: string) => void;
  // New prop to indicate if the tier manager should be shown in a modal from this row
  showTierManagerInModal?: (userId: string, userName: string, userRole: string, canManage: boolean) => void;
}

function getInitials(name?: string, email?: string) {
  if (name) {
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0] || "";
    return parts[0][0] + (parts[1]?.[0] || "");
  }
  if (email) return email[0]?.toUpperCase() || "U";
  return "U";
}

export function UserTableRow({
  user,
  isSelected,
  onSelect,
  onEdit,
  onActivate,
  onDeactivate,
  onResetPassword,
  onChangeRole,
  canManageUsers = false,
  onViewDetail
}: UserTableRowProps) {
  const handleSelectChange = (checked: boolean) => {
    onSelect(user.id, checked);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const roleNames: Record<string, string> = {
    'IT': 'Instructor Trainee',
    'IP': 'Instructor Provisional',
    'IC': 'Instructor Certified',
    'AP': 'Authorized Provider',
    'AD': 'Administrator',
    'SA': 'System Admin'
  };

  const isAdmin = hasRequiredRole(user.role, 'AD');
  const userStatus: 'ACTIVE' | 'INACTIVE' | 'PENDING' = user.status || 'ACTIVE';

  // New: Compliance badge helper
  const getComplianceBadge = () => {
    if (user.compliance_status === true) {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 gap-1" title="Compliant">
          <ShieldCheck className="w-4 h-4 text-green-700 mr-1" />
          Compliant
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 gap-1" title="Non-compliant">
        <ShieldCheck className="w-4 h-4 text-yellow-600 mr-1" />
        Non-Compliant
      </Badge>
    );
  };

  return (
    <tr 
      className={`border-b transition-colors hover:bg-muted/50 
        ${isSelected ? 'bg-muted' : 'bg-white dark:bg-background'}
        text-foreground`}
    >
      <td className="p-4">
        <Checkbox checked={isSelected} onCheckedChange={handleSelectChange} />
      </td>
      <td className="p-4 font-medium flex items-center gap-3">
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-white font-bold text-base uppercase ring-2 ring-primary/30 shadow-sm select-none">
          {getInitials(user.display_name, user.email)}
        </span>
        {user.display_name || 'No Name'}
      </td>
      <td className="p-4">{user.email || 'No Email'}</td>
      <td className="p-4">
        <Badge variant={user.role === 'SA' ? 'destructive' : isAdmin ? 'secondary' : 'outline'} className="capitalize">
          {roleNames[user.role] || user.role}
        </Badge>
      </td>
      <td className="p-4">
        <Badge variant={userStatus === 'ACTIVE' ? 'default' : 'outline'} className="capitalize">
          {userStatus}
        </Badge>
      </td>
      {/* Compliance status column */}
      <td className="p-4">
        {getComplianceBadge()}
      </td>
      {/* New: Compliance Tier column */}
      <td className="p-4">
        {user.compliance_tier && (
          <Badge
            variant="outline"
            className={`${user.compliance_tier === 'robust' ? 'bg-green-50 text-green-800 border-green-300' : 'bg-blue-50 text-blue-800 border-blue-300'} gap-1`}
            title={`Compliance Tier: ${user.compliance_tier.charAt(0).toUpperCase() + user.compliance_tier.slice(1)}`}
          >
            {user.compliance_tier === 'robust' ? (
              <Shield className="w-3 h-3 mr-1" />
            ) : (
              <FileText className="w-3 h-3 mr-1" />
            )}
            {user.compliance_tier.charAt(0).toUpperCase() + user.compliance_tier.slice(1)}
          </Badge>
        )}
        {!user.compliance_tier && (
          <Badge variant="secondary" className="gap-1">
            N/A
          </Badge>
        )}
      </td>
      <td className="p-4">
        {formatDate(user.created_at)}
      </td>
      <td className="p-4 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-50 bg-background border shadow-xl">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onViewDetail && onViewDetail(user.id)}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(user.id)}>
              Edit User
            </DropdownMenuItem>
            {/* New: Add option to manage compliance tier */}
            {canManageUsers && user.role !== 'SA' && user.role !== 'AD' && ( // Only allow for non-admin roles
              <DropdownMenuItem
                onClick={() => showTierManagerInModal &&
                  showTierManagerInModal(user.id, user.display_name || user.email || 'User', user.role, canManageUsers)}
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Manage Compliance Tier
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {canManageUsers && <>
              {userStatus === 'INACTIVE' ?
                <DropdownMenuItem onClick={() => onActivate(user.id)}>
                  Activate User
                </DropdownMenuItem>
                : <DropdownMenuItem onClick={() => onDeactivate(user.id)}>
                  Deactivate User
                </DropdownMenuItem>
              }
              <DropdownMenuItem onClick={() => onResetPassword(user.id)}>
                Reset Password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onChangeRole(user.id)}>
                <UserCog className="mr-2 h-4 w-4" />
                Change Role
              </DropdownMenuItem>
            </>}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
