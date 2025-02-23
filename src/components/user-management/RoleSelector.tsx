
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_LABELS, UserRole } from "@/lib/roles";

interface RoleSelectorProps {
  role: UserRole;
  onRoleChange: (value: UserRole) => void;
}

export function RoleSelector({ role, onRoleChange }: RoleSelectorProps) {
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
          {Object.entries(ROLE_LABELS).map(([role, label]) => (
            <SelectItem key={role} value={role}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
