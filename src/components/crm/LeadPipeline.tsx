
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CRMService } from '@/services/crm/crmService';
import { toast } from 'sonner';
import type { Lead } from '@/types/crm';
import { Plus, User, Building, Phone, Mail } from 'lucide-react';

interface LeadStage {
  id: string;
  name: string;
  color: string;
  description: string;
}

const LEAD_STAGES: LeadStage[] = [
  {
    id: 'new',
    name: 'New Leads',
    color: 'bg-blue-50 border-blue-200',
    description: 'Recently created leads'
  },
  {
    id: 'contacted',
    name: 'Contacted',
    color: 'bg-yellow-50 border-yellow-200',
    description: 'Initial contact made'
  },
  {
    id: 'qualified',
    name: 'Qualified',
    color: 'bg-green-50 border-green-200',
    description: 'Qualified prospects'
  },
  {
    id: 'converted',
    name: 'Converted',
    color: 'bg-purple-50 border-purple-200',
    description: 'Converted to customers'
  }
];

interface LeadCardProps {
  lead: Lead;
  onStageChange: (leadId: string, newStage: string) => void;
}

function LeadCard({ lead, onStageChange }: LeadCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', JSON.stringify({
      leadId: lead.id,
      currentStage: lead.lead_status
    }));
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'immediate': return 'bg-red-100 text-red-800';
      case 'within_month': return 'bg-orange-100 text-orange-800';
      case 'within_quarter': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`bg-white border rounded-lg p-3 mb-2 cursor-move transition-all ${
        isDragging ? 'opacity-50 transform rotate-2' : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-medium text-sm">{lead.first_name} {lead.last_name}</h4>
          {lead.company_name && (
            <p className="text-xs text-gray-600 flex items-center gap-1">
              <Building className="h-3 w-3" />
              {lead.company_name}
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="text-xs font-medium">Score: {lead.lead_score}</div>
          {lead.estimated_participant_count && (
            <div className="text-xs text-gray-500">
              {lead.estimated_participant_count} participants
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1 mb-2">
        {lead.email && (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Mail className="h-3 w-3" />
            {lead.email}
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Phone className="h-3 w-3" />
            {lead.phone}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <Badge variant="outline" className={lead.lead_source ? 'text-xs' : 'text-xs bg-gray-100'}>
          {lead.lead_source?.replace('_', ' ') || 'Unknown'}
        </Badge>
        {lead.training_urgency && (
          <Badge className={getUrgencyColor(lead.training_urgency)} variant="outline">
            {lead.training_urgency.replace('_', ' ')}
          </Badge>
        )}
      </div>
    </div>
  );
}

interface StageColumnProps {
  stage: LeadStage;
  leads: Lead[];
  onStageChange: (leadId: string, newStage: string) => void;
  onAddLead: (stage: string) => void;
}

function StageColumn({ stage, leads, onStageChange, onAddLead }: StageColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data.leadId && data.currentStage !== stage.id) {
        onStageChange(data.leadId, stage.id);
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  const stageLeads = leads.filter(lead => lead.lead_status === stage.id);
  const totalValue = stageLeads.reduce((sum, lead) => 
    sum + (lead.estimated_participant_count || 0) * 500, 0
  );

  return (
    <div className="flex-1 min-w-72">
      <Card className={`h-full ${stage.color} ${isDragOver ? 'ring-2 ring-blue-400' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-sm font-medium">{stage.name}</CardTitle>
              <p className="text-xs text-gray-600 mt-1">{stage.description}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddLead(stage.id)}
              className="h-6 w-6 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex justify-between items-center text-xs text-gray-600">
            <span>{stageLeads.length} leads</span>
            <span>${totalValue.toLocaleString()}</span>
          </div>
        </CardHeader>
        <CardContent 
          className="space-y-2 min-h-96 max-h-96 overflow-y-auto"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {stageLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onStageChange={onStageChange}
            />
          ))}
          {stageLeads.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No leads in this stage</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function LeadPipeline() {
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['crm-leads'],
    queryFn: () => CRMService.getLeads()
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ leadId, newStage }: { leadId: string; newStage: string }) =>
      CRMService.updateLead(leadId, { lead_status: newStage as any }),
    onSuccess: () => {
      toast.success('Lead stage updated');
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
    },
    onError: (error) => {
      toast.error('Failed to update lead stage: ' + error.message);
    }
  });

  const handleStageChange = (leadId: string, newStage: string) => {
    updateStageMutation.mutate({ leadId, newStage });
  };

  const handleAddLead = (stage: string) => {
    // This would open the lead creation dialog with the appropriate stage pre-selected
    toast.info(`Add new lead to ${stage} stage`);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {LEAD_STAGES.map((stage) => (
          <div key={stage.id} className="h-96 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  // Summary statistics
  const totalLeads = leads.length;
  const conversionRate = leads.length > 0 
    ? (leads.filter(l => l.lead_status === 'converted').length / totalLeads * 100).toFixed(1)
    : '0';
  const averageScore = leads.length > 0
    ? (leads.reduce((sum, lead) => sum + lead.lead_score, 0) / totalLeads).toFixed(1)
    : '0';

  return (
    <div className="space-y-4">
      {/* Pipeline Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{totalLeads}</div>
            <div className="text-sm text-gray-600">Total Leads</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <div className="text-sm text-gray-600">Conversion Rate</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{averageScore}</div>
            <div className="text-sm text-gray-600">Average Score</div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Stages */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {LEAD_STAGES.map((stage) => (
          <StageColumn
            key={stage.id}
            stage={stage}
            leads={leads}
            onStageChange={handleStageChange}
            onAddLead={handleAddLead}
          />
        ))}
      </div>
    </div>
  );
}
