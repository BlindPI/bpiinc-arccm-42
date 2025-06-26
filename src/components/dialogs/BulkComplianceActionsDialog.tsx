import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Download, 
  Upload,
  Loader2,
  Eye,
  Filter,
  RotateCcw,
  Calendar,
  Clock
} from 'lucide-react';
import { ComplianceService } from '@/services/compliance/complianceService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface BulkActionItem {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  compliance_status: string;
  requirement_name: string;
  requirement_type: string;
  submitted_at?: string;
  expires_at?: string;
  current_score?: number;
  selected: boolean;
}

interface BulkActionFilters {
  status: string;
  type: string;
  tier: string;
  dateRange: string;
}

interface BulkActionProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  current: string;
  errors: Array<{ item: string; error: string }>;
}

interface BulkComplianceActionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (results: BulkActionResults) => void;
  initialAction?: 'approve' | 'reject' | 'extend' | 'notify' | 'export';
  preSelectedItems?: string[];
}

interface BulkActionResults {
  action: string;
  totalItems: number;
  successCount: number;
  failureCount: number;
  errors: Array<{ item: string; error: string }>;
  processedAt: string;
}

export function BulkComplianceActionsDialog({
  isOpen,
  onClose,
  onComplete,
  initialAction,
  preSelectedItems = []
}: BulkComplianceActionsDialogProps) {
  const [selectedAction, setSelectedAction] = useState<string>(initialAction || '');
  const [actionItems, setActionItems] = useState<BulkActionItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<BulkActionItem[]>([]);
  const [filters, setFilters] = useState<BulkActionFilters>({
    status: 'all',
    type: 'all',
    tier: 'all',
    dateRange: 'all'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<BulkActionProgress>({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    current: '',
    errors: []
  });
  const [actionNotes, setActionNotes] = useState('');
  const [extensionDays, setExtensionDays] = useState(30);
  const [notificationTemplate, setNotificationTemplate] = useState('');
  const [showProgress, setShowProgress] = useState(false);
  
  // Load compliance items when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadComplianceItems();
    }
  }, [isOpen]);
  
  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [actionItems, filters]);
  
  // Pre-select items if provided
  useEffect(() => {
    if (preSelectedItems.length > 0 && actionItems.length > 0) {
      setActionItems(prev => prev.map(item => ({
        ...item,
        selected: preSelectedItems.includes(item.id)
      })));
    }
  }, [preSelectedItems, actionItems]);
  
  const loadComplianceItems = async () => {
    try {
      setIsLoading(true);
      
      // Load user compliance records
      const { data: recordsData, error: recordsError } = await supabase
        .from('user_compliance_records')
        .select(`
          id,
          user_id,
          compliance_status,
          created_at,
          updated_at,
          notes,
          metric_id
        `)
        .order('updated_at', { ascending: false });
      
      if (recordsError) {
        throw recordsError;
      }
      
      // Get user profiles
      const userIds = recordsData?.map(r => r.user_id) || [];
      const { data: profilesData, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .in('id', userIds);
      
      if (profileError) {
        console.error('Error loading profiles:', profileError);
      }
      
      // Get compliance metrics
      const metricIds = recordsData?.map(r => r.metric_id).filter(Boolean) || [];
      const { data: metricsData, error: metricsError } = await supabase
        .from('compliance_metrics')
        .select('id, name, requirement_type')
        .in('id', metricIds);
      
      if (metricsError) {
        console.error('Error loading metrics:', metricsError);
      }
      
      // Create lookup maps
      const profileMap = profilesData?.reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {} as Record<string, any>) || {};
      
      const metricsMap = metricsData?.reduce((acc, metric) => {
        acc[metric.id] = metric;
        return acc;
      }, {} as Record<string, any>) || {};
      
      const items: BulkActionItem[] = recordsData?.map(record => {
        const profile = profileMap[record.user_id];
        const metric = metricsMap[record.metric_id];
        
        return {
          id: record.id,
          user_id: record.user_id,
          user_name: profile?.display_name || 'Unknown User',
          user_email: profile?.email || '',
          compliance_status: record.compliance_status,
          requirement_name: metric?.name || 'Unknown Requirement',
          requirement_type: metric?.requirement_type || 'general',
          submitted_at: record.created_at,
          expires_at: undefined, // Not available in current schema
          current_score: 0, // Mock score
          selected: false
        };
      }) || [];
      
      setActionItems(items);
      
    } catch (error) {
      console.error('Error loading compliance items:', error);
      toast({
        title: "Error",
        description: "Failed to load compliance items",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const applyFilters = () => {
    let filtered = [...actionItems];
    
    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(item => item.compliance_status === filters.status);
    }
    
    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(item => item.requirement_type === filters.type);
    }
    
    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case '7d':
          filterDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          filterDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          filterDate.setDate(now.getDate() - 90);
          break;
      }
      
      if (filters.dateRange !== 'all') {
        filtered = filtered.filter(item => 
          item.submitted_at && new Date(item.submitted_at) >= filterDate
        );
      }
    }
    
    setFilteredItems(filtered);
  };
  
  const getSelectedItems = () => {
    return filteredItems.filter(item => item.selected);
  };
  
  const toggleItemSelection = (itemId: string) => {
    setActionItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, selected: !item.selected } : item
    ));
  };
  
  const toggleAllSelection = () => {
    const allSelected = filteredItems.every(item => item.selected);
    setActionItems(prev => prev.map(item => {
      const isInFiltered = filteredItems.some(f => f.id === item.id);
      return isInFiltered ? { ...item, selected: !allSelected } : item;
    }));
  };
  
  const processBulkAction = async () => {
    const selectedItems = getSelectedItems();
    
    if (selectedItems.length === 0) {
      toast({
        title: "No Items Selected",
        description: "Please select items to process",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedAction) {
      toast({
        title: "No Action Selected",
        description: "Please select an action to perform",
        variant: "destructive"
      });
      return;
    }
    
    // Validate action-specific requirements
    if ((selectedAction === 'reject' || selectedAction === 'notify') && !actionNotes.trim()) {
      toast({
        title: "Notes Required",
        description: "Please provide notes for this action",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    setShowProgress(true);
    setProgress({
      total: selectedItems.length,
      processed: 0,
      successful: 0,
      failed: 0,
      current: '',
      errors: []
    });
    
    const results: BulkActionResults = {
      action: selectedAction,
      totalItems: selectedItems.length,
      successCount: 0,
      failureCount: 0,
      errors: [],
      processedAt: new Date().toISOString()
    };
    
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      const performerId = currentUser?.user?.id || 'system';
      
      for (let i = 0; i < selectedItems.length; i++) {
        const item = selectedItems[i];
        
        setProgress(prev => ({
          ...prev,
          processed: i + 1,
          current: `Processing ${item.user_name} - ${item.requirement_name}`
        }));
        
        try {
          await processIndividualAction(item, selectedAction, performerId);
          results.successCount++;
          
          setProgress(prev => ({
            ...prev,
            successful: prev.successful + 1
          }));
          
        } catch (error) {
          console.error(`Error processing item ${item.id}:`, error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          results.errors.push({
            item: `${item.user_name} - ${item.requirement_name}`,
            error: errorMessage
          });
          results.failureCount++;
          
          setProgress(prev => ({
            ...prev,
            failed: prev.failed + 1,
            errors: [...prev.errors, { item: `${item.user_name} - ${item.requirement_name}`, error: errorMessage }]
          }));
        }
        
        // Small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Log bulk action
      await supabase
        .from('compliance_audit_log')
        .insert({
          user_id: performerId,
          audit_type: 'bulk_action_performed',
          notes: `Bulk ${selectedAction} performed on ${selectedItems.length} items`,
          old_value: { action: selectedAction, itemCount: selectedItems.length },
          new_value: { 
            results: {
              successful: results.successCount,
              failed: results.failureCount
            }
          },
          performed_by: performerId
        });
      
      toast({
        title: "Bulk Action Complete",
        description: `Successfully processed ${results.successCount} of ${results.totalItems} items`
      });
      
      onComplete(results);
      
    } catch (error) {
      console.error('Bulk action error:', error);
      toast({
        title: "Bulk Action Failed",
        description: "An error occurred during bulk processing",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      // Keep progress visible for review
    }
  };
  
  const processIndividualAction = async (item: BulkActionItem, action: string, performerId: string) => {
    switch (action) {
      case 'approve':
        await ComplianceService.updateComplianceRecord(
          item.user_id,
          item.id,
          100,
          'compliant',
          actionNotes || 'Bulk approved'
        );
        
        // Send notification
        await supabase
          .from('notifications')
          .insert({
            user_id: item.user_id,
            title: 'Requirement Approved',
            message: `Your submission for ${item.requirement_name} has been approved.`,
            type: 'success',
            created_at: new Date().toISOString()
          });
        break;
        
      case 'reject':
        await ComplianceService.updateComplianceRecord(
          item.user_id,
          item.id,
          null,
          'non_compliant',
          actionNotes
        );
        
        // Send notification
        await supabase
          .from('notifications')
          .insert({
            user_id: item.user_id,
            title: 'Requirement Rejected',
            message: `Your submission for ${item.requirement_name} has been rejected: ${actionNotes}`,
            type: 'error',
            created_at: new Date().toISOString()
          });
        break;
        
      case 'extend':
        // Update the compliance record with extended notes (expires_at column doesn't exist in schema)
        await supabase
          .from('user_compliance_records')
          .update({
            notes: `Extended by ${extensionDays} days. ${actionNotes}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);
        
        // Send notification
        await supabase
          .from('notifications')
          .insert({
            user_id: item.user_id,
            title: 'Requirement Extended',
            message: `Your ${item.requirement_name} deadline has been extended by ${extensionDays} days.`,
            type: 'info',
            created_at: new Date().toISOString()
          });
        break;
        
      case 'notify':
        await supabase
          .from('notifications')
          .insert({
            user_id: item.user_id,
            title: 'Compliance Reminder',
            message: notificationTemplate || actionNotes,
            type: 'warning',
            created_at: new Date().toISOString()
          });
        break;
        
      case 'reset':
        await supabase
          .from('user_compliance_records')
          .update({
            compliance_status: 'pending',
            notes: `Reset by bulk action. ${actionNotes}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);
        break;
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    // Log individual action
    await supabase
      .from('compliance_audit_log')
      .insert({
        user_id: item.user_id,
        audit_type: `bulk_${action}`,
        metric_id: item.id,
        notes: `Bulk ${action}: ${item.requirement_name}`,
        old_value: { status: item.compliance_status },
        new_value: { 
          action: action,
          notes: actionNotes,
          bulk_operation: true
        },
        performed_by: performerId
      });
  };
  
  const exportSelectedItems = async () => {
    const selectedItems = getSelectedItems();
    
    if (selectedItems.length === 0) {
      toast({
        title: "No Items Selected",
        description: "Please select items to export",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const exportData = selectedItems.map(item => ({
        user_name: item.user_name,
        user_email: item.user_email,
        requirement_name: item.requirement_name,
        requirement_type: item.requirement_type,
        compliance_status: item.compliance_status,
        submitted_at: item.submitted_at,
        expires_at: item.expires_at,
        current_score: item.current_score
      }));
      
      const csvContent = convertToCSV(exportData);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `compliance-export-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Successful",
        description: `Exported ${selectedItems.length} items to CSV`
      });
      
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export selected items",
        variant: "destructive"
      });
    }
  };
  
  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  };
  
  const getActionDescription = (action: string) => {
    switch (action) {
      case 'approve':
        return 'Mark selected items as approved and compliant';
      case 'reject':
        return 'Mark selected items as rejected and non-compliant';
      case 'extend':
        return 'Extend the deadline for selected items';
      case 'notify':
        return 'Send notifications to users for selected items';
      case 'reset':
        return 'Reset selected items to pending status';
      case 'export':
        return 'Export selected items to CSV file';
      default:
        return 'Select an action to perform';
    }
  };
  
  const selectedCount = getSelectedItems().length;
  const totalCount = filteredItems.length;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Bulk Compliance Actions</DialogTitle>
          <DialogDescription>
            Perform actions on multiple compliance items at once
          </DialogDescription>
        </DialogHeader>
        
        {showProgress ? (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium">Processing Bulk Action</h3>
              <p className="text-sm text-muted-foreground">{progress.current}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{progress.processed} of {progress.total}</span>
              </div>
              <Progress value={(progress.processed / progress.total) * 100} className="h-2" />
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{progress.successful}</p>
                <p className="text-xs text-muted-foreground">Successful</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{progress.failed}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{progress.total - progress.processed}</p>
                <p className="text-xs text-muted-foreground">Remaining</p>
              </div>
            </div>
            
            {progress.errors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-red-600">Errors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {progress.errors.map((error, idx) => (
                      <div key={idx} className="text-xs p-2 bg-red-50 rounded">
                        <strong>{error.item}:</strong> {error.error}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {!isProcessing && (
              <div className="flex justify-center gap-2">
                <Button onClick={onClose}>
                  Close
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowProgress(false);
                    loadComplianceItems();
                  }}
                >
                  Process More Items
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Tabs defaultValue="select" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="select">Select Items</TabsTrigger>
              <TabsTrigger value="configure">Configure Action</TabsTrigger>
            </TabsList>
            
            <TabsContent value="select" className="space-y-4">
              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filter Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="status-filter">Status</Label>
                      <Select 
                        value={filters.status} 
                        onValueChange={(value) => setFilters({ ...filters, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="compliant">Compliant</SelectItem>
                          <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="type-filter">Type</Label>
                      <Select 
                        value={filters.type} 
                        onValueChange={(value) => setFilters({ ...filters, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="certification">Certification</SelectItem>
                          <SelectItem value="training">Training</SelectItem>
                          <SelectItem value="background_check">Background Check</SelectItem>
                          <SelectItem value="assessment">Assessment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="date-filter">Date Range</Label>
                      <Select 
                        value={filters.dateRange} 
                        onValueChange={(value) => setFilters({ ...filters, dateRange: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="7d">Last 7 days</SelectItem>
                          <SelectItem value="30d">Last 30 days</SelectItem>
                          <SelectItem value="90d">Last 90 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-end">
                      <Button 
                        variant="outline" 
                        onClick={() => setFilters({ status: 'all', type: 'all', tier: 'all', dateRange: 'all' })}
                        className="w-full"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Selection Summary */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">{selectedCount} of {totalCount} items selected</p>
                    <p className="text-sm text-muted-foreground">
                      {totalCount} items match your filters
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={toggleAllSelection}>
                    {filteredItems.every(item => item.selected) ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportSelectedItems}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
              
              {/* Items List */}
              <Card>
                <CardContent className="p-0">
                  <div className="max-h-96 overflow-y-auto">
                    {isLoading ? (
                      <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        Loading compliance items...
                      </div>
                    ) : filteredItems.length === 0 ? (
                      <div className="text-center p-8 text-muted-foreground">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No items match your filters</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {filteredItems.map(item => (
                          <div key={item.id} className="flex items-center p-4 hover:bg-gray-50">
                            <Checkbox
                              checked={item.selected}
                              onCheckedChange={() => toggleItemSelection(item.id)}
                              className="mr-4"
                            />
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{item.user_name}</p>
                                  <p className="text-sm text-muted-foreground">{item.user_email}</p>
                                </div>
                                
                                <div className="text-right">
                                  <p className="font-medium">{item.requirement_name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline">{item.requirement_type}</Badge>
                                    <Badge variant={
                                      item.compliance_status === 'compliant' ? 'default' :
                                      item.compliance_status === 'non_compliant' ? 'destructive' : 'secondary'
                                    }>
                                      {item.compliance_status}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              
                              {(item.submitted_at || item.expires_at) && (
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  {item.submitted_at && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      Submitted {format(new Date(item.submitted_at), 'MMM d, yyyy')}
                                    </div>
                                  )}
                                  {item.expires_at && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      Expires {format(new Date(item.expires_at), 'MMM d, yyyy')}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="configure" className="space-y-4">
              {/* Action Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Select Action</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Choose the action to perform on {selectedCount} selected items
                  </p>
                </CardHeader>
                <CardContent>
                  <Select value={selectedAction} onValueChange={setSelectedAction}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an action..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approve">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Approve Items
                        </div>
                      </SelectItem>
                      <SelectItem value="reject">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          Reject Items
                        </div>
                      </SelectItem>
                      <SelectItem value="extend">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          Extend Deadlines
                        </div>
                      </SelectItem>
                      <SelectItem value="notify">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          Send Notifications
                        </div>
                      </SelectItem>
                      <SelectItem value="reset">
                        <div className="flex items-center gap-2">
                          <RotateCcw className="h-4 w-4 text-gray-600" />
                          Reset to Pending
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {selectedAction && (
                    <Alert className="mt-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {getActionDescription(selectedAction)}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
              
              {/* Action Configuration */}
              {selectedAction && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Action Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedAction === 'extend' && (
                      <div>
                        <Label htmlFor="extension-days">Extension Days</Label>
                        <Select value={extensionDays.toString()} onValueChange={(value) => setExtensionDays(parseInt(value))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7">7 days</SelectItem>
                            <SelectItem value="14">14 days</SelectItem>
                            <SelectItem value="30">30 days</SelectItem>
                            <SelectItem value="60">60 days</SelectItem>
                            <SelectItem value="90">90 days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    {selectedAction === 'notify' && (
                      <div>
                        <Label htmlFor="notification-template">Notification Template</Label>
                        <Select value={notificationTemplate} onValueChange={setNotificationTemplate}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a template..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="reminder">Compliance Reminder</SelectItem>
                            <SelectItem value="deadline">Deadline Approaching</SelectItem>
                            <SelectItem value="missing">Missing Documentation</SelectItem>
                            <SelectItem value="custom">Custom Message</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <div>
                      <Label htmlFor="action-notes">
                        Notes {(selectedAction === 'reject' || selectedAction === 'notify') && <span className="text-red-500">*</span>}
                      </Label>
                      <Textarea
                        id="action-notes"
                        placeholder={
                          selectedAction === 'reject' ? 'Provide reason for rejection...' :
                          selectedAction === 'notify' ? 'Custom notification message...' :
                          'Optional notes for this action...'
                        }
                        value={actionNotes}
                        onChange={(e) => setActionNotes(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
        
        {!showProgress && (
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button 
              onClick={processBulkAction}
              disabled={selectedCount === 0 || !selectedAction || isProcessing}
              className="min-w-32"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Process {selectedCount} Items
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}