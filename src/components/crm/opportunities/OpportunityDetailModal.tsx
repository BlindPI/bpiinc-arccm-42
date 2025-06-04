import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  DollarSign, 
  Calendar, 
  User, 
  Building, 
  MapPin, 
  Phone, 
  Mail,
  FileText,
  TrendingUp,
  Clock,
  Target,
  Users,
  Edit,
  MoreHorizontal,
  Plus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  Paperclip,
  MessageSquare
} from 'lucide-react';
import { crmOpportunityService } from '@/services/crm/crmOpportunityService';
import { crmActivityService } from '@/services/crm/crmActivityService';
import { CRMOpportunity, CRMActivity } from '@/types/crm';

interface OpportunityDetailModalProps {
  opportunityId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (opportunity: CRMOpportunity) => void;
}

export function OpportunityDetailModal({ 
  opportunityId, 
  isOpen, 
  onClose, 
  onEdit 
}: OpportunityDetailModalProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<CRMOpportunity>>({});

  const queryClient = useQueryClient();

  // Real opportunity data
  const { data: opportunity, isLoading } = useQuery({
    queryKey: ['crm', 'opportunity', opportunityId],
    queryFn: async () => {
      if (!opportunityId) return null;
      const result = await crmOpportunityService.getOpportunity(opportunityId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!opportunityId && isOpen,
  });

  // Real activity data
  const { data: activities } = useQuery({
    queryKey: ['crm', 'activities', opportunityId],
    queryFn: async () => {
      if (!opportunityId) return [];
      const result = await crmActivityService.getActivities({ opportunity_id: opportunityId });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!opportunityId && isOpen,
  });

  // Update opportunity mutation
  const updateOpportunityMutation = useMutation({
    mutationFn: async (updates: Partial<CRMOpportunity>) => {
      if (!opportunityId) throw new Error('No opportunity ID');
      const result = await crmOpportunityService.updateOpportunity(opportunityId, updates);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'opportunity', opportunityId] });
      queryClient.invalidateQueries({ queryKey: ['crm', 'opportunities'] });
      setIsEditing(false);
      setEditData({});
    },
  });

  // Close opportunity mutation
  const closeOpportunityMutation = useMutation({
    mutationFn: async ({ outcome, notes }: { outcome: 'won' | 'lost', notes?: string }) => {
      if (!opportunityId) throw new Error('No opportunity ID');
      const result = await crmOpportunityService.closeOpportunity(opportunityId, outcome, notes);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'opportunity', opportunityId] });
      queryClient.invalidateQueries({ queryKey: ['crm', 'opportunities'] });
    },
  });

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount);

  const formatDate = (dateString: string) => 
    new Date(dateString).toLocaleDateString('en-CA');

  const getOpportunityTypeBadge = (type: string) => {
    const styles = {
      individual_training: 'bg-blue-100 text-blue-800',
      corporate_contract: 'bg-purple-100 text-purple-800',
      ap_partnership: 'bg-green-100 text-green-800'
    };
    return styles[type as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      open: 'bg-blue-100 text-blue-800',
      closed_won: 'bg-green-100 text-green-800',
      closed_lost: 'bg-red-100 text-red-800'
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 75) return 'text-green-600';
    if (probability >= 50) return 'text-yellow-600';
    if (probability >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  const getActivityIcon = (type: string) => {
    const icons = {
      call: Phone,
      email: Mail,
      meeting: Users,
      demo: Target,
      proposal: FileText,
      follow_up: Clock
    };
    return icons[type as keyof typeof icons] || Activity;
  };

  const handleSave = () => {
    if (Object.keys(editData).length > 0) {
      updateOpportunityMutation.mutate(editData);
    } else {
      setIsEditing(false);
    }
  };

  const handleClose = (outcome: 'won' | 'lost') => {
    const notes = prompt(`Add notes for closing as ${outcome}:`);
    closeOpportunityMutation.mutate({ outcome, notes: notes || undefined });
  };

  if (!isOpen || !opportunity) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <DialogTitle className="text-xl">
                {isEditing ? (
                  <Input
                    value={editData.opportunity_name || opportunity.opportunity_name}
                    onChange={(e) => setEditData(prev => ({ ...prev, opportunity_name: e.target.value }))}
                    className="text-xl font-semibold"
                  />
                ) : (
                  opportunity.opportunity_name
                )}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getOpportunityTypeBadge(opportunity.opportunity_type)}`}>
                  {opportunity.opportunity_type.replace('_', ' ')}
                </div>
                <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadge(opportunity.status)}`}>
                  {opportunity.status.replace('_', ' ')}
                </div>
                <div className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-800">
                  {opportunity.stage}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={updateOpportunityMutation.isPending}
                  >
                    {updateOpportunityMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleClose('won')}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Close as Won
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleClose('lost')}>
                        <XCircle className="h-4 w-4 mr-2" />
                        Close as Lost
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Activity
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Proposal
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="forecast">Forecast</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Financial Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Financial Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Estimated Value</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editData.estimated_value || opportunity.estimated_value}
                          onChange={(e) => setEditData(prev => ({ ...prev, estimated_value: parseFloat(e.target.value) }))}
                        />
                      ) : (
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(opportunity.estimated_value || 0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Probability</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={editData.probability || opportunity.probability}
                          onChange={(e) => setEditData(prev => ({ ...prev, probability: parseInt(e.target.value) }))}
                        />
                      ) : (
                        <div className={`text-2xl font-bold ${getProbabilityColor(opportunity.probability)}`}>
                          {opportunity.probability}%
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Weighted Value</Label>
                    <div className="text-lg font-semibold">
                      {formatCurrency((opportunity.estimated_value || 0) * (opportunity.probability / 100))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Expected Close Date</Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={editData.expected_close_date || opportunity.expected_close_date}
                        onChange={(e) => setEditData(prev => ({ ...prev, expected_close_date: e.target.value }))}
                      />
                    ) : (
                      <div className="text-sm">
                        {opportunity.expected_close_date ? formatDate(opportunity.expected_close_date) : 'Not set'}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Created</Label>
                    <div className="text-sm text-gray-600">
                      {formatDate(opportunity.created_at)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Last Updated</Label>
                    <div className="text-sm text-gray-600">
                      {formatDate(opportunity.updated_at)}
                    </div>
                  </div>
                  {opportunity.actual_close_date && (
                    <div>
                      <Label className="text-sm font-medium">Actual Close Date</Label>
                      <div className="text-sm text-gray-600">
                        {formatDate(opportunity.actual_close_date)}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Training Details */}
              {opportunity.opportunity_type !== 'ap_partnership' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Training Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Participant Count</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editData.participant_count || opportunity.participant_count}
                          onChange={(e) => setEditData(prev => ({ ...prev, participant_count: parseInt(e.target.value) }))}
                        />
                      ) : (
                        <div className="text-sm">
                          {opportunity.participant_count || 'Not specified'}
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Training Location</Label>
                      {isEditing ? (
                        <Input
                          value={editData.training_location || opportunity.training_location}
                          onChange={(e) => setEditData(prev => ({ ...prev, training_location: e.target.value }))}
                        />
                      ) : (
                        <div className="text-sm">
                          {opportunity.training_location || 'Not specified'}
                        </div>
                      )}
                    </div>
                    {opportunity.certification_types && opportunity.certification_types.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Certification Types</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {opportunity.certification_types.map((cert, index) => (
                            <div key={index} className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                              {cert}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Corporate Contract Details */}
              {opportunity.opportunity_type === 'corporate_contract' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Contract Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Contract Duration</Label>
                      <div className="text-sm">
                        {opportunity.contract_duration_months ? `${opportunity.contract_duration_months} months` : 'Not specified'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Recurring Training</Label>
                      <div className="text-sm">
                        {opportunity.recurring_training ? 'Yes' : 'No'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Volume Discount</Label>
                      <div className="text-sm">
                        {opportunity.volume_discount_applicable ? 'Applicable' : 'Not applicable'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* AP Partnership Details */}
              {opportunity.opportunity_type === 'ap_partnership' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Partnership Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Expected Monthly Volume</Label>
                      <div className="text-sm">
                        {opportunity.expected_monthly_volume || 'Not specified'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Setup Investment</Label>
                      <div className="text-sm">
                        {opportunity.setup_investment ? formatCurrency(opportunity.setup_investment) : 'Not specified'}
                      </div>
                    </div>
                    {opportunity.proposed_service_areas && opportunity.proposed_service_areas.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Service Areas</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {opportunity.proposed_service_areas.map((area, index) => (
                            <div key={index} className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                              {area}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Notes and Next Steps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Objections & Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Textarea
                      value={editData.objections_notes || opportunity.objections_notes}
                      onChange={(e) => setEditData(prev => ({ ...prev, objections_notes: e.target.value }))}
                      placeholder="Enter objections and notes..."
                      className="min-h-[100px]"
                    />
                  ) : (
                    <div className="text-sm text-gray-600">
                      {opportunity.objections_notes || 'No notes recorded'}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Next Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Textarea
                      value={editData.next_steps || opportunity.next_steps}
                      onChange={(e) => setEditData(prev => ({ ...prev, next_steps: e.target.value }))}
                      placeholder="Enter next steps..."
                      className="min-h-[100px]"
                    />
                  ) : (
                    <div className="text-sm text-gray-600">
                      {opportunity.next_steps || 'No next steps defined'}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Activity Timeline</h3>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Activity
              </Button>
            </div>

            <div className="space-y-4">
              {activities && Array.isArray(activities) && activities.length > 0 ? (
                activities.map((activity) => {
                  const ActivityIcon = getActivityIcon(activity.activity_type);
                  return (
                    <Card key={activity.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <ActivityIcon className="h-4 w-4 text-blue-600" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm">{activity.subject}</h4>
                              <div className="text-xs text-gray-500">
                                {formatDate(activity.activity_date)}
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {activity.description}
                            </div>
                            {activity.outcome && (
                              <div className="flex items-center gap-2 mt-2">
                                <div className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                  activity.outcome === 'positive' ? 'bg-green-100 text-green-800' :
                                  activity.outcome === 'negative' ? 'bg-red-100 text-red-800' :
                                  activity.outcome === 'neutral' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {activity.outcome}
                                </div>
                                {activity.interest_level && (
                                  <div className="text-xs text-gray-500">
                                    Interest: {activity.interest_level}/10
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No activities recorded</h3>
                  <p className="text-gray-600 mb-4">Start tracking your interactions with this opportunity</p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Activity
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Documents & Attachments</h3>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>

            <div className="text-center py-8">
              <Paperclip className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents uploaded</h3>
              <p className="text-gray-600 mb-4">Upload proposals, contracts, and other relevant documents</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Upload First Document
              </Button>
            </div>
          </TabsContent>

          {/* Forecast Tab */}
          <TabsContent value="forecast" className="space-y-4">
            <h3 className="text-lg font-medium">Revenue Forecasting</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Weighted Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency((opportunity.estimated_value || 0) * (opportunity.probability / 100))}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Based on {opportunity.probability}% probability
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Days to Close</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {opportunity.expected_close_date ? 
                      Math.max(0, Math.ceil((new Date(opportunity.expected_close_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) :
                      'N/A'
                    }
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Until expected close
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Stage Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {opportunity.probability}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Current stage probability
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Competitor Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600">
                  {opportunity.competitor_analysis ? 
                    JSON.stringify(opportunity.competitor_analysis) : 
                    'No competitor analysis recorded'
                  }
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}