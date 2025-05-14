
import React, { useState } from 'react';
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BadgePlus, BookmarkPlus, Filter, Loader2, Search, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { FilterSet, SavedItem } from '@/types/filter-types';

interface UserFiltersProps {
  currentFilters: FilterSet;
  onFilterChange: (key: keyof FilterSet, value: string) => void;
  savedFilters: SavedItem[];
  onSaveFilter: (name: string) => void;
  onLoadFilter: (filter: SavedItem) => void;
}

export function UserFilters({
  currentFilters,
  onFilterChange,
  savedFilters,
  onSaveFilter,
  onLoadFilter
}: UserFiltersProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  
  // Check if any filters are active
  const hasActiveFilters = currentFilters.role !== 'all' || 
                          currentFilters.compliance !== 'all' || 
                          currentFilters.search.trim() !== '';
  
  // Reset all filters
  const handleReset = () => {
    onFilterChange('role', 'all');
    onFilterChange('compliance', 'all');
    onFilterChange('search', '');
  };
  
  // Handle saving a filter set
  const handleSave = () => {
    if (filterName.trim()) {
      onSaveFilter(filterName.trim());
      setFilterName("");
      setSaveDialogOpen(false);
    }
  };
  
  return (
    <>
      <Card className="border border-border/60 shadow-sm">
        <CardContent className="pt-4 pb-3">
          <div className="grid gap-4 md:grid-cols-12">
            {/* Search */}
            <div className="relative md:col-span-5">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                className="pl-8"
                value={currentFilters.search}
                onChange={(e) => onFilterChange('search', e.target.value)}
              />
              {currentFilters.search && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-7 w-7 p-0"
                  onClick={() => onFilterChange('search', '')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            {/* Role Filter */}
            <div className="md:col-span-2">
              <Select
                value={currentFilters.role}
                onValueChange={(value) => onFilterChange('role', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="SA">System Admin</SelectItem>
                  <SelectItem value="AD">Admin</SelectItem>
                  <SelectItem value="IT">IT</SelectItem>
                  <SelectItem value="FA">Full Instructor</SelectItem>
                  <SelectItem value="SI">Student Instructor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Compliance Filter */}
            <div className="md:col-span-2">
              <Select
                value={currentFilters.compliance}
                onValueChange={(value) => onFilterChange('compliance', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Compliance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="compliant">Compliant</SelectItem>
                  <SelectItem value="non-compliant">Non-compliant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2 md:col-span-3 md:justify-end">
              {/* Reset Filters */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleReset}
                      disabled={!hasActiveFilters}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reset all filters</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {/* Save Current Filter */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSaveDialogOpen(true)}
                      disabled={!hasActiveFilters}
                    >
                      <BookmarkPlus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Save current filter</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {/* Saved Filters Menu */}
              {savedFilters.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[200px]">
                    <DropdownMenuLabel>Saved Filters</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {savedFilters.map((filter, index) => (
                      <DropdownMenuItem 
                        key={`${filter.name}-${index}`}
                        onClick={() => onLoadFilter(filter)}
                      >
                        {filter.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          
          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
              <div className="text-sm font-medium text-muted-foreground mr-1 flex items-center">
                <BadgePlus className="h-3 w-3 mr-1" />
                Active filters:
              </div>
              
              {currentFilters.search && (
                <Badge variant="secondary" className="text-xs">
                  Search: {currentFilters.search}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => onFilterChange('search', '')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              {currentFilters.role !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  Role: {currentFilters.role}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => onFilterChange('role', 'all')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              {currentFilters.compliance !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  Compliance: {currentFilters.compliance}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => onFilterChange('compliance', 'all')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Save Filter Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter a name for this filter..."
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!filterName.trim() || isSaving}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
