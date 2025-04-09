
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserRole } from "@/types/supabase-schema";
import { useProfile } from "@/hooks/useProfile";
import { ROLE_LABELS } from "@/lib/roles";

interface RoleSelectorProps {
  role: UserRole;
  onRoleChange: (value: UserRole) => void;
}

export function RoleSelector({ role, onRoleChange }: RoleSelectorProps) {
  const { data: currentUserProfile } = useProfile();

  // Only filter out roles based on current user's role
  const availableRoles = Object.entries(ROLE_LABELS).filter(([roleKey]) => {
    // Only show SA role option to SA users
    if (currentUserProfile?.role !== 'SA' && roleKey === 'SA') {
      return false;
    }
    
    // Admin users (AD) cannot create other admins or system admins
    if (currentUserProfile?.role === 'AD' && (roleKey === 'AD' || roleKey === 'SA')) {
      return false;
    }
    
    // Provisional admins (AP) can only create instructor trainees
    if (currentUserProfile?.role === 'AP' && roleKey !== 'IT') {
      return false;
    }
    
    return true;
  });

  return (
    <div className="grid gap-2">
      <label htmlFor="role" className="text-sm font-medium">
        Initial Role
      </label>
      <Select
        value={role}
        onValueChange={(value: UserRole) => onRoleChange(value)}
      >
        <SelectTrigger id="role">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableRoles.map(([roleKey, label]) => (
            <SelectItem key={roleKey} value={roleKey}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
