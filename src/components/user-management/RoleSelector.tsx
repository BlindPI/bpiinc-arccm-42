
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_LABELS, UserRole } from "@/lib/roles";
import { useProfile } from "@/hooks/useProfile";

interface RoleSelectorProps {
  role: UserRole;
  onRoleChange: (value: UserRole) => void;
}

export function RoleSelector({ role, onRoleChange }: RoleSelectorProps) {
  const { data: currentUserProfile } = useProfile();

  // Only filter out SA role from visible options
  const availableRoles = Object.entries(ROLE_LABELS).filter(([roleKey]) => {
    // Only show SA role option to SA users
    if (currentUserProfile?.role !== 'SA' && roleKey === 'SA') {
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
          {availableRoles.map(([role, label]) => (
            <SelectItem key={role} value={role}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
