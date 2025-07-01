import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Plus, Search, Filter, Settings, X, ChevronDown, FileText, Calendar, Users, Target, Clock, AlertCircle } from 'lucide-react';
import { ComplianceService, UserComplianceRecord } from '@/services/compliance/complianceService';
import { ComplianceRequirementsService } from '@/services/compliance/complianceRequirementsService';
import { ComplianceTierService } from '@/services/compliance/complianceTierService';
import { supabase } from '@/integrations/supabase/client';

interface AdvancedRequirementManagerProps {
  userId: string;
  role: 'AP' | 'IC' | 'IP' | 'IT';
  tier: 'basic' | 'robust';
  viewMode?: 'kanban' | 'table';
}

interface RequirementFilter {
  field: string;
  value: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'contains';
}

interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

interface RequirementData {
  id: string;
  name: string;
  description: string;
  status: 'compliant' | 'non_compliant' | 'warning' | 'pending' | 'not_applicable';
  category: string;
  points: number;
  created_at: string;
  updated_at: string;
  compliance_metrics: {
    name: string;
    description: string;
    category: string;
    measurement_type: string;
    target_value: any;
    weight: number;
  };
}

export function AdvancedRequirementManager({
  userId,
  role,
  tier,
  viewMode = 'kanban'
}: AdvancedRequirementManagerProps) {
  const [activeFilters, setActiveFilters] = useState<RequirementFilter[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'created_at', direction: 'desc' });
  const [selectedRequirements, setSelectedRequirements] = useState<Set<string>>(new Set());
  const [bulkActionMode, setBulkActionMode] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentViewMode, setCurrentViewMode] = useState<'kanban' | 'table'>(viewMode);
  
  const [requirements, setRequirements] = useState<RequirementData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [userTierInfo, setUserTierInfo] = useState<any>(null);

  // Load user requirements and tier info
  const loadRequirements = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get user's compliance records
      const userRecords = await ComplianceService.getUserComplianceRecords(userId);
      
      // Get user's tier info
      const tierInfo = await ComplianceTierService.getUserComplianceTierInfo(userId);
      setUserTierInfo(tierInfo);

      // Transform data for UI
      const formattedRequirements: RequirementData[] = userRecords.map(record => ({
        id: record.id,
        name: record.compliance_metrics?.name || 'Untitled Requirement',
        description: record.compliance_metrics?.description || '',
        status: record.compliance_status,
        category: record.compliance_metrics?.category || '',
        points: record.compliance_metrics?.weight || 0,
        created_at: record.created_at,
        updated_at: record.updated_at,
        compliance_metrics: {
          name: record.compliance_metrics?.name || '',
          description: record.compliance_metrics?.description || '',
          category: record.compliance_metrics?.category || '',
          measurement_type: record.compliance_metrics?.measurement_type || '',
          target_value: record.compliance_metrics?.target_value,
          weight: record.compliance_metrics?.weight || 0
        }
      }));

      setRequirements(formattedRequirements);
    } catch (error) {
      console.error('Failed to load requirements:', error);
      setError('Failed to load requirements. Please try again.');
      toast.error('Failed to load requirements');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Real-time subscription to requirement updates
  useEffect(() => {
    const channel = supabase
      .channel(`requirements-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_compliance_records',
        filter: `user_id=eq.${userId}`
      }, async (payload) => {
        console.log('Real-time requirement update:', payload);
        // Reload requirements on any change
        await loadRequirements();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, loadRequirements]);

  // Load requirements on mount
  useEffect(() => {
    loadRequirements();
  }, [loadRequirements]);

  // Filter and sort requirements
  const processedRequirements = useMemo(() => {
    let filtered = requirements;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(req => 
        req.name.toLowerCase().includes(query) ||
        req.description.toLowerCase().includes(query) ||
        req.compliance_metrics.category.toLowerCase().includes(query)
      );
    }

    // Apply advanced filters
    activeFilters.forEach(filter => {
      filtered = filtered.filter(req => {
        const value = getNestedValue(req, filter.field);
        switch (filter.operator) {
          case 'eq':
            return value === filter.value;
          case 'ne':
            return value !== filter.value;
          case 'contains':
            return String(value).toLowerCase().includes(filter.value.toLowerCase());
          default:
            return true;
        }
      });
    });

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = getNestedValue(a, sortConfig.field);
      const bValue = getNestedValue(b, sortConfig.field);
      
      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [requirements, searchQuery, activeFilters, sortConfig]);

  // Helper function to get nested object values
  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Handle requirement status update
  const handleStatusUpdate = async (requirementId: string, newStatus: string) => {
    try {
      // Find the requirement to get its metric ID
      const requirement = requirements.find(r => r.id === requirementId);
      if (!requirement) return;

      // Update status using the service
      await ComplianceService.updateComplianceRecord(
        userId,
        requirement.compliance_metrics.name, // Using name as metric identifier
        null, // current_value
        newStatus as 'compliant' | 'non_compliant' | 'warning' | 'pending' | 'not_applicable',
        '' // Notes
      );

      toast.success('Requirement status updated successfully');
      await loadRequirements(); // Reload to get updated data
    } catch (error) {
      console.error('Failed to update requirement status:', error);
      toast.error('Failed to update requirement status');
    }
  };

  // Handle bulk operations
  const handleBulkOperation = async (operation: string, operationData: any) => {
    if (selectedRequirements.size === 0) {
      toast.warning('Please select requirements first');
      return;
    }

    try {
      const requirementIds = Array.from(selectedRequirements);
      
      for (const reqId of requirementIds) {
        const requirement = requirements.find(r => r.id === reqId);
        if (!requirement) continue;

        switch (operation) {
          case 'update_status':
            await handleStatusUpdate(reqId, operationData.status);
            break;
          case 'set_priority':
            // Would need to implement priority update in service
            break;
          default:
            break;
        }
      }

      setSelectedRequirements(new Set());
      setBulkActionMode(false);
      toast.success(`Bulk ${operation} completed successfully`);
    } catch (error) {
      console.error('Bulk operation failed:', error);
      toast.error('Bulk operation failed');
    }
  };

  // Handle filter addition
  const handleApplyFilter = (filter: RequirementFilter) => {
    setActiveFilters(prev => {
      const existing = prev.find(f => f.field === filter.field);
      if (existing) {
        return prev.map(f => f.field === filter.field ? filter : f);
      }
      return [...prev, filter];
    });
  };

  // Handle filter removal
  const handleRemoveFilter = (filter: RequirementFilter) => {
    setActiveFilters(prev => prev.filter(f => f.field !== filter.field));
  };

  // Render requirement card
  const renderRequirementCard = (requirement: RequirementData) => (
    <Card key={requirement.id} className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className="font-medium text-sm">{requirement.name}</h4>
            <p className="text-xs text-muted-foreground mt-1">{requirement.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusVariant(requirement.status)}>
              {requirement.status}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {requirement.compliance_metrics.weight} pts
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{requirement.compliance_metrics.category}</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(requirement.updated_at).toLocaleDateString()}
          </span>
        </div>
        
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleStatusUpdate(requirement.id, getNextStatus(requirement.status))}
          >
            {getNextStatusLabel(requirement.status)}
          </Button>
          {bulkActionMode && (
            <input
              type="checkbox"
              checked={selectedRequirements.has(requirement.id)}
              onChange={(e) => {
                const newSelected = new Set(selectedRequirements);
                if (e.target.checked) {
                  newSelected.add(requirement.id);
                } else {
                  newSelected.delete(requirement.id);
                }
                setSelectedRequirements(newSelected);
              }}
              className="rounded"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Helper functions for status management
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'compliant': return 'default';
      case 'warning': return 'secondary';
      case 'non_compliant': return 'destructive';
      case 'pending': return 'outline';
      case 'not_applicable': return 'outline';
      default: return 'outline';
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending': return 'compliant';
      case 'non_compliant': return 'compliant';
      case 'warning': return 'compliant';
      case 'compliant': return 'pending';
      default: return 'compliant';
    }
  };

  const getNextStatusLabel = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending': return 'Mark Complete';
      case 'non_compliant': return 'Mark Complete';
      case 'warning': return 'Mark Complete';
      case 'compliant': return 'Mark Pending';
      default: return 'Update';
    }
  };

  // Render kanban view
  const renderKanbanView = () => {
    const statusColumns = [
      { key: 'pending', label: 'Pending', requirements: processedRequirements.filter(r => r.status === 'pending') },
      { key: 'warning', label: 'Warning', requirements: processedRequirements.filter(r => r.status === 'warning') },
      { key: 'non_compliant', label: 'Non-Compliant', requirements: processedRequirements.filter(r => r.status === 'non_compliant') },
      { key: 'compliant', label: 'Compliant', requirements: processedRequirements.filter(r => r.status === 'compliant') },
      { key: 'not_applicable', label: 'Not Applicable', requirements: processedRequirements.filter(r => r.status === 'not_applicable') }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statusColumns.map(column => (
          <div key={column.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">{column.label}</h3>
              <Badge variant="outline" className="text-xs">
                {column.requirements.length}
              </Badge>
            </div>
            <div className="space-y-2 min-h-[200px] bg-gray-50 p-2 rounded-lg">
              {column.requirements.map(renderRequirementCard)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render table view
  const renderTableView = () => (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="text-left p-4 font-medium">Name</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Category</th>
                <th className="text-left p-4 font-medium">Points</th>
                <th className="text-left p-4 font-medium">Due Date</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {processedRequirements.map(requirement => (
                <tr key={requirement.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <div>
                      <div className="font-medium">{requirement.name}</div>
                      <div className="text-sm text-muted-foreground">{requirement.description}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant={getStatusVariant(requirement.status)}>
                      {requirement.status}
                    </Badge>
                  </td>
                  <td className="p-4">{requirement.compliance_metrics.category}</td>
                  <td className="p-4">{requirement.compliance_metrics.weight}</td>
                  <td className="p-4">
                    {requirement.updated_at ? new Date(requirement.updated_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="p-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusUpdate(requirement.id, getNextStatus(requirement.status))}
                    >
                      {getNextStatusLabel(requirement.status)}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading requirements...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Advanced Requirement Management</h2>
          <p className="text-muted-foreground">
            Manage your compliance requirements with advanced filtering and workflow features
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search requirements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Button
            variant="outline"
            onClick={() => setBulkActionMode(!bulkActionMode)}
            className={cn(bulkActionMode && "bg-blue-50 border-blue-300")}
          >
            {bulkActionMode ? 'Exit Bulk Mode' : 'Bulk Actions'}
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex border rounded-md">
                  <Button
                    variant={currentViewMode === 'kanban' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentViewMode('kanban')}
                  >
                    Kanban
                  </Button>
                  <Button
                    variant={currentViewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentViewMode('table')}
                  >
                    Table
                  </Button>
                </div>
                
                <Separator orientation="vertical" className="h-6" />
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleApplyFilter({ field: 'status', value: 'pending', operator: 'eq' })}>
                      Show Pending Only
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleApplyFilter({ field: 'status', value: 'in_progress', operator: 'eq' })}>
                      Show In Progress Only
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleApplyFilter({ field: 'status', value: 'approved', operator: 'eq' })}>
                      Show Approved Only
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {processedRequirements.length} of {requirements.length} requirements
                </span>
              </div>
            </div>

            {/* Active Filters */}
            {activeFilters.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {activeFilters.map((filter, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {filter.field}: {filter.value}
                    <button
                      onClick={() => handleRemoveFilter(filter)}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveFilters([])}
                >
                  Clear all
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {bulkActionMode && selectedRequirements.size > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {selectedRequirements.size} requirement(s) selected
              </span>
              
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm">
                      Actions
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkOperation('update_status', { status: 'in_progress' })}>
                      Mark as In Progress
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkOperation('update_status', { status: 'submitted' })}>
                      Mark as Submitted
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRequirements(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="min-h-[400px]">
        {currentViewMode === 'kanban' ? renderKanbanView() : renderTableView()}
      </div>

      {/* Summary Stats */}
      {userTierInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Progress Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {requirements.filter(r => r.status === 'compliant').length}
                </div>
                <div className="text-sm text-muted-foreground">Compliant</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {requirements.filter(r => r.status === 'warning').length}
                </div>
                <div className="text-sm text-muted-foreground">Warning</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {requirements.filter(r => r.status === 'pending').length}
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Progress</span>
                <span>{Math.round((requirements.filter(r => r.status === 'compliant').length / requirements.length) * 100)}%</span>
              </div>
              <Progress value={(requirements.filter(r => r.status === 'compliant').length / requirements.length) * 100} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}