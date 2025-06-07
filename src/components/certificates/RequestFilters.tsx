
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Search, RefreshCw, Layers, List, Building } from 'lucide-react';

interface RequestFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  viewMode: string;
  setViewMode: (mode: string) => void;
  handleRefresh: () => void;
  isRefreshing: boolean;
  showEnterpriseToggle?: boolean;
}

export function RequestFilters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  viewMode,
  setViewMode,
  handleRefresh,
  isRefreshing,
  showEnterpriseToggle = false
}: RequestFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-3">
      {/* Search */}
      <div className="relative">
        <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search requests..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-64"
        />
      </div>

      {/* Status Filter */}
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="PENDING">Pending</SelectItem>
          <SelectItem value="APPROVED">Approved</SelectItem>
          <SelectItem value="REJECTED">Rejected</SelectItem>
          <SelectItem value="ARCHIVED">Archived</SelectItem>
        </SelectContent>
      </Select>

      {/* View Mode Toggle */}
      <ToggleGroup 
        type="single" 
        value={viewMode} 
        onValueChange={(value) => value && setViewMode(value)}
        className="border rounded-md"
      >
        {showEnterpriseToggle && (
          <ToggleGroupItem value="enterprise" className="px-3">
            <Building className="h-4 w-4 mr-1" />
            Enterprise
          </ToggleGroupItem>
        )}
        <ToggleGroupItem value="batch" className="px-3">
          <Layers className="h-4 w-4 mr-1" />
          Batch
        </ToggleGroupItem>
        <ToggleGroupItem value="list" className="px-3">
          <List className="h-4 w-4 mr-1" />
          List
        </ToggleGroupItem>
      </ToggleGroup>

      {/* Refresh Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        disabled={isRefreshing}
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
    </div>
  );
}
