
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_LABELS } from "@/lib/roles";

interface FilterBarProps {
  onSearchChange: (value: string) => void;
  onRoleFilterChange: (value: string) => void;
  onComplianceFilterChange: (value: string) => void;
  searchValue: string;
  roleFilter: string;
  complianceFilter: string;
}

export function FilterBar({
  onSearchChange,
  onRoleFilterChange,
  onComplianceFilterChange,
  searchValue,
  roleFilter,
  complianceFilter,
}: FilterBarProps) {
  return (
    <div className="flex flex-col space-y-4 md:flex-row md:items-end md:space-x-4 md:space-y-0">
      <div className="flex-1 space-y-2">
        <Label>Search Users</Label>
        <Input
          placeholder="Search by name or email..."
          className="w-full"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="w-full space-y-2 md:w-[200px]">
        <Label>Filter by Role</Label>
        <Select value={roleFilter} onValueChange={onRoleFilterChange}>
          <SelectTrigger>
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {Object.entries(ROLE_LABELS).map(([role, label]) => (
              <SelectItem key={role} value={role}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-full space-y-2 md:w-[200px]">
        <Label>Compliance Status</Label>
        <Select value={complianceFilter} onValueChange={onComplianceFilterChange}>
          <SelectTrigger>
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="compliant">Compliant</SelectItem>
            <SelectItem value="non-compliant">Non-Compliant</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
