import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Download,
  Filter,
  Columns,
  Edit2,
  Save,
  X,
  Trash2,
  Users,
  Settings,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EnhancedTeam } from '@/types/team-management';

interface Column {
  key: keyof EnhancedTeam | 'actions' | 'select';
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  width?: string;
  render?: (value: any, team: EnhancedTeam) => React.ReactNode;
}

interface AdvancedTeamDataTableProps {
  teams: EnhancedTeam[];
  onTeamUpdate?: (teamId: string, updates: Partial<EnhancedTeam>) => Promise<void>;
  onTeamDelete?: (teamId: string) => Promise<void>;
  onTeamSelect?: (team: EnhancedTeam) => void;
  onBulkAction?: (action: string, teamIds: string[]) => Promise<void>;
  loading?: boolean;
  pageSize?: number;
}

export function AdvancedTeamDataTable({
  teams,
  onTeamUpdate,
  onTeamDelete,
  onTeamSelect,
  onBulkAction,
  loading = false,
  pageSize = 10,
}: AdvancedTeamDataTableProps) {
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<EnhancedTeam>>({});
  const [sortConfig, setSortConfig] = useState<{
    key: keyof EnhancedTeam;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set([
    'select', 'name', 'team_type', 'status', 'member_count', 'performance_score', 'location', 'actions'
  ]));
  const [currentPage, setCurrentPage] = useState(1);

  const columns: Column[] = [
    {
      key: 'select',
      label: '',
      width: '50px',
      render: (_, team) => (
        <Checkbox
          checked={selectedTeams.has(team.id)}
          onCheckedChange={(checked) => {
            const newSelected = new Set(selectedTeams);
            if (checked) {
              newSelected.add(team.id);
            } else {
              newSelected.delete(team.id);
            }
            setSelectedTeams(newSelected);
          }}
        />
      ),
    },
    {
      key: 'name',
      label: 'Team Name',
      sortable: true,
      filterable: true,
      editable: true,
      render: (value, team) => (
        <div className="font-medium">
          {editingTeam === team.id ? (
            <Input
              value={editValues.name || value}
              onChange={(e) => setEditValues(prev => ({ ...prev, name: e.target.value }))}
              className="h-8"
            />
          ) : (
            <span className="cursor-pointer hover:text-blue-600" onClick={() => onTeamSelect?.(team)}>
              {value}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'team_type',
      label: 'Type',
      sortable: true,
      filterable: true,
      editable: true,
      render: (value, team) => (
        editingTeam === team.id ? (
          <Select
            value={editValues.team_type || value}
            onValueChange={(newValue) => setEditValues(prev => ({ ...prev, team_type: newValue }))}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="training">Training</SelectItem>
              <SelectItem value="operations">Operations</SelectItem>
              <SelectItem value="management">Management</SelectItem>
              <SelectItem value="support">Support</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Badge variant="outline" className="capitalize">
            {value.replace('_', ' ')}
          </Badge>
        )
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      filterable: true,
      editable: true,
      render: (value, team) => {
        const getStatusColor = (status: string) => {
          switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'inactive': return 'bg-gray-100 text-gray-800';
            case 'suspended': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
          }
        };

        return editingTeam === team.id ? (
          <Select
            value={editValues.status || value}
            onValueChange={(newValue) => setEditValues(prev => ({ ...prev, status: newValue as any }))}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Badge className={getStatusColor(value)}>
            {value}
          </Badge>
        );
      },
    },
    {
      key: 'member_count',
      label: 'Members',
      sortable: true,
      render: (_, team) => (
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4 text-gray-400" />
          <span>{team.member_count || team.members?.length || 0}</span>
        </div>
      ),
    },
    {
      key: 'performance_score',
      label: 'Performance',
      sortable: true,
      render: (value) => {
        const getPerformanceColor = (score: number) => {
          if (score >= 80) return 'text-green-600';
          if (score >= 60) return 'text-yellow-600';
          return 'text-red-600';
        };

        return (
          <span className={cn("font-medium", getPerformanceColor(value))}>
            {value}%
          </span>
        );
      },
    },
    {
      key: 'location',
      label: 'Location',
      sortable: true,
      filterable: true,
      render: (_, team) => team.location?.name || 'No location',
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '120px',
      render: (_, team) => (
        <div className="flex items-center gap-1">
          {editingTeam === team.id ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSaveEdit}
                className="h-8 w-8 p-0"
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancelEdit}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleStartEdit(team)}
                className="h-8 w-8 p-0"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onTeamSelect?.(team)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStartEdit(team)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Team
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-600"
                    onClick={() => onTeamDelete?.(team.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      ),
    },
  ];

  const handleStartEdit = (team: EnhancedTeam) => {
    setEditingTeam(team.id);
    setEditValues({
      name: team.name,
      team_type: team.team_type,
      status: team.status,
      description: team.description,
    });
  };

  const handleSaveEdit = async () => {
    if (editingTeam && onTeamUpdate) {
      try {
        await onTeamUpdate(editingTeam, editValues);
        setEditingTeam(null);
        setEditValues({});
      } catch (error) {
        console.error('Failed to update team:', error);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingTeam(null);
    setEditValues({});
  };

  const handleSort = (key: keyof EnhancedTeam) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return current.direction === 'asc' 
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTeams(new Set(filteredAndSortedTeams.map(team => team.id)));
    } else {
      setSelectedTeams(new Set());
    }
  };

  const handleBulkAction = async (action: string) => {
    if (onBulkAction && selectedTeams.size > 0) {
      await onBulkAction(action, Array.from(selectedTeams));
      setSelectedTeams(new Set());
    }
  };

  const exportToCSV = () => {
    const headers = columns
      .filter(col => col.key !== 'select' && col.key !== 'actions' && visibleColumns.has(col.key))
      .map(col => col.label);
    
    const rows = filteredAndSortedTeams.map(team => 
      columns
        .filter(col => col.key !== 'select' && col.key !== 'actions' && visibleColumns.has(col.key))
        .map(col => {
          const value = col.key === 'location' ? team.location?.name : team[col.key as keyof EnhancedTeam];
          return typeof value === 'object' ? JSON.stringify(value) : value;
        })
    );

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'teams.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredAndSortedTeams = useMemo(() => {
    let result = teams.filter(team => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        const teamValue = key === 'location' ? team.location?.name : team[key as keyof EnhancedTeam];
        return String(teamValue).toLowerCase().includes(value.toLowerCase());
      });
    });

    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = sortConfig.key === 'location' ? a.location?.name : a[sortConfig.key];
        const bValue = sortConfig.key === 'location' ? b.location?.name : b[sortConfig.key];
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [teams, filters, sortConfig]);

  const paginatedTeams = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedTeams.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedTeams, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredAndSortedTeams.length / pageSize);

  const visibleColumnsList = columns.filter(col => visibleColumns.has(col.key));

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selectedTeams.size > 0 && (
            <>
              <span className="text-sm text-gray-600">
                {selectedTeams.size} selected
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Bulk Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleBulkAction('activate')}>
                    Activate Teams
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction('deactivate')}>
                    Deactivate Teams
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-600"
                    onClick={() => handleBulkAction('delete')}
                  >
                    Delete Teams
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns className="h-4 w-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {columns.filter(col => col.key !== 'select').map(column => (
                <DropdownMenuCheckboxItem
                  key={column.key}
                  checked={visibleColumns.has(column.key)}
                  onCheckedChange={(checked) => {
                    const newVisible = new Set(visibleColumns);
                    if (checked) {
                      newVisible.add(column.key);
                    } else {
                      newVisible.delete(column.key);
                    }
                    setVisibleColumns(newVisible);
                  }}
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export */}
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {columns
          .filter(col => col.filterable && visibleColumns.has(col.key))
          .map(column => (
            <Input
              key={column.key}
              placeholder={`Filter by ${column.label.toLowerCase()}...`}
              value={filters[column.key] || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, [column.key]: e.target.value }))}
              className="w-48"
            />
          ))}
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumnsList.map(column => (
                <TableHead 
                  key={column.key} 
                  className={cn(
                    column.width && `w-[${column.width}]`,
                    column.sortable && "cursor-pointer hover:bg-gray-50"
                  )}
                  onClick={() => column.sortable && handleSort(column.key as keyof EnhancedTeam)}
                >
                  <div className="flex items-center gap-2">
                    {column.key === 'select' ? (
                      <Checkbox
                        checked={selectedTeams.size === filteredAndSortedTeams.length && filteredAndSortedTeams.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    ) : (
                      <>
                        {column.label}
                        {column.sortable && (
                          <div className="flex flex-col">
                            {sortConfig?.key === column.key ? (
                              sortConfig.direction === 'asc' ? (
                                <ArrowUp className="h-3 w-3" />
                              ) : (
                                <ArrowDown className="h-3 w-3" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-gray-400" />
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTeams.map(team => (
              <TableRow key={team.id} className="hover:bg-gray-50">
                {visibleColumnsList.map(column => (
                  <TableCell key={column.key}>
                    {column.render
                      ? column.render(team[column.key as keyof EnhancedTeam], team)
                      : String(team[column.key as keyof EnhancedTeam] || '')
                    }
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredAndSortedTeams.length)} of {filteredAndSortedTeams.length} teams
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}