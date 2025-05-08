import React from 'react';
import { TableHead } from "@/components/ui/table";
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SortColumn, SortDirection } from '@/types/certificateFilters';

interface SortableTableHeaderProps {
  column: SortColumn;
  label: string;
  currentSortColumn: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
  className?: string;
}

export function SortableTableHeader({
  column,
  label,
  currentSortColumn,
  sortDirection,
  onSort,
  className
}: SortableTableHeaderProps) {
  const isActive = currentSortColumn === column;
  
  return (
    <TableHead 
      className={cn(
        "cursor-pointer select-none transition-colors hover:bg-gray-100", 
        isActive && "bg-blue-50",
        className
      )}
      onClick={() => onSort(column)}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        <div className="flex flex-col h-4">
          {isActive ? (
            sortDirection === 'asc' ? (
              <ChevronUp className="h-4 w-4 text-primary" />
            ) : (
              <ChevronDown className="h-4 w-4 text-primary" />
            )
          ) : (
            <div className="flex flex-col opacity-30">
              <ChevronUp className="h-2.5 w-2.5" />
              <ChevronDown className="h-2.5 w-2.5 -mt-1" />
            </div>
          )}
        </div>
      </div>
    </TableHead>
  );
}
