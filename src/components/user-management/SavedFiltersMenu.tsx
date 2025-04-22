
import React, { useState } from "react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SaveAll, Trash2, ListCheck, ListPlus, ListX } from "lucide-react";
import { FilterSet, SavedItem } from "@/types/filter-types";

interface SavedFiltersMenuProps {
  filters: FilterSet;
  savedFilters: SavedItem[];
  onSave: (name: string) => void;
  onApply: (filters: FilterSet) => void;
  onDelete: (name: string) => void;
}

export function SavedFiltersMenu({
  filters,
  savedFilters,
  onSave,
  onApply,
  onDelete,
}: SavedFiltersMenuProps) {
  const [saving, setSaving] = useState(false);
  const [newFilterName, setNewFilterName] = useState("");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 px-3 py-2 ring-1 ring-primary/10 shadow transition"
          title="Saved Filters"
        >
          <ListCheck className="h-4 w-4 text-primary" />
          Saved Filters
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-50 bg-white min-w-[260px] border shadow-lg">
        <DropdownMenuLabel className="flex items-center gap-2 text-base font-semibold">
          <ListCheck className="h-4 w-4" />
          Saved Filters
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {savedFilters.length === 0 && (
          <DropdownMenuItem asChild>
            <span className="text-muted-foreground/80 text-xs italic px-2 py-1">No saved filters yet</span>
          </DropdownMenuItem>
        )}
        {savedFilters.map((item) => (
          <DropdownMenuItem key={item.name} className="flex justify-between items-center group">
            <span
              className="cursor-pointer hover:text-primary"
              onClick={() => onApply(item.filters)}
            >
              <ListPlus className="inline h-4 w-4 mr-1 opacity-70" />
              {item.name}
            </span>
            <button
              className="ml-2 p-1 rounded hover:bg-red-100 group-hover:text-red-600"
              title="Delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.name);
              }}
              type="button"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <form
          className="px-2 py-2 flex gap-2 flex-col border-t"
          onSubmit={e => {
            e.preventDefault();
            if (newFilterName.trim().length > 0) {
              setSaving(true);
              onSave(newFilterName.trim());
              setNewFilterName("");
              setSaving(false);
            }
          }}
        >
          <div className="flex flex-col gap-1">
            <input
              className="border rounded px-2 py-1 text-sm"
              placeholder="Save current as..."
              value={newFilterName}
              onChange={e => setNewFilterName(e.target.value)}
              maxLength={32}
            />
          </div>
          <Button
            variant="secondary"
            type="submit"
            size="sm"
            className="flex gap-1 justify-center items-center"
            disabled={saving || newFilterName.trim().length === 0}
          >
            <SaveAll className="h-4 w-4" />
            Save Filter
          </Button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
