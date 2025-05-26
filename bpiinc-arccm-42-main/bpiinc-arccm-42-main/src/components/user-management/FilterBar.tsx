
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
import React from "react";

type FilterTagProps = {
  label: string;
  onRemove: () => void;
};

function FilterTag({ label, onRemove }: FilterTagProps) {
  return (
    <span className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-100 via-purple-100 to-blue-50 text-blue-700 rounded-full text-xs font-medium mr-2 animate-fade-in border border-primary/10 shadow-sm cursor-default">
      {label}
      <button
        className="ml-1 px-1 text-purple-600 hover:text-red-400 transition"
        onClick={onRemove}
        type="button"
        aria-label="Remove filter"
      >
        ×
      </button>
    </span>
  );
}

interface FilterBarProps {
  onSearchChange: (value: string) => void;
  onRoleFilterChange: (value: string) => void;
  onComplianceFilterChange: (value: string) => void;
  onClearAllFilters: () => void;
  searchValue: string;
  roleFilter: string;
  complianceFilter: string;
  activeTags: { key: string; label: string }[];
}

export function FilterBar({
  onSearchChange,
  onRoleFilterChange,
  onComplianceFilterChange,
  onClearAllFilters,
  searchValue,
  roleFilter,
  complianceFilter,
  activeTags
}: FilterBarProps) {
  // Handle the input change event and extract the value to pass to the parent
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  const hasActiveFilters =
    !!searchValue ||
    (roleFilter && roleFilter !== "all") ||
    (complianceFilter && complianceFilter !== "all");

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-1 min-h-[28px] animate-fade-in">
        {activeTags.map((tag) => (
          <FilterTag label={tag.label} key={tag.key} onRemove={() => onClearAllFilters()} />
        ))}
        {hasActiveFilters && (
          <button
            className="inline-flex items-center px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded hover:bg-red-100 hover:text-red-700 transition ml-2"
            onClick={onClearAllFilters}
            type="button"
          >
            Clear All
          </button>
        )}
      </div>
      <div className={`flex flex-col space-y-4 md:flex-row md:items-end md:space-x-4 md:space-y-0 transition-shadow duration-150 ${hasActiveFilters ? "ring-2 ring-primary/30 shadow-lg" : ""}`}>
        <div className="flex-1 space-y-2">
          <Label>Search Users</Label>
          <Input
            placeholder="Search by name or email..."
            className="w-full"
            value={searchValue}
            onChange={handleInputChange}
            aria-label="Search by name or email"
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
    </div>
  );
}
