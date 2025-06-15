
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CRMService } from '@/services/crm/crmService';
import { toast } from 'sonner';

export interface LeadConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any;
  onSuccess: () => void;
}

export function LeadConversionModal({ isOpen, onClose, lead, onSuccess }: LeadConversionModalProps) {
  const queryClient = useQueryClient();
  const [conversionData, setConversionData] = useState({
    opportunity_name: lead?.company || '',
    estimated_value: '',
    close_date: '',
    stage: 'qualification',
    notes: ''
  });

  const convertLeadMutation = useMutation({
    mutationFn: async (data: any) => {
      // Convert lead to opportunity
      const opportunityData = {
        lead_id: lead.id,
        account_id: lead.account_id,
        contact_id: lead.contact_id,
        opportunity_name: data.opportunity_name,
        opportunity_status: 'open',
        estimated_value: parseFloat(data.estimated_value) || 0,
        close_date: data.close_date,
        stage: data.stage,
        probability: 25, // Default for qualification stage
        notes: data.notes,
        created_at: new Date().toISOString()
      };

      const opportunity = await CRMService.createOpportunity(opportunityData);
      
      // Update lead status to converted
      await CRMService.updateLead(lead.id, { 
        lead_status: 'converted',
        converted_at: new Date().toISOString(),
        converted_opportunity_id: opportunity.id
      });

      return opportunity;
    },
    onSuccess: () => {
      toast.success('Lead converted to opportunity successfully');
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
      queryClient.invalidateQueries({ queryKey: ['crm-opportunities'] });
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast.error('Failed to convert lead');
      console.error('Lead conversion error:', error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    convertLeadMutation.mutate(conversionData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convert Lead to Opportunity</DialogTitle>
          <DialogDescription>
            Convert {lead?.first_name} {lead?.last_name} from {lead?.company} into a sales opportunity.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="opportunity_name">Opportunity Name</Label>
            <Input
              id="opportunity_name"
              value={conversionData.opportunity_name}
              onChange={(e) => setConversionData(prev => ({ ...prev, opportunity_name: e.target.value }))}
              placeholder="Enter opportunity name"
              required
            />
          </div>

          <div>
            <Label htmlFor="estimated_value">Estimated Value ($)</Label>
            <Input
              id="estimated_value"
              type="number"
              value={conversionData.estimated_value}
              onChange={(e) => setConversionData(prev => ({ ...prev, estimated_value: e.target.value }))}
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="close_date">Expected Close Date</Label>
            <Input
              id="close_date"
              type="date"
              value={conversionData.close_date}
              onChange={(e) => setConversionData(prev => ({ ...prev, close_date: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="stage">Initial Stage</Label>
            <Select 
              value={conversionData.stage} 
              onValueChange={(value) => setConversionData(prev => ({ ...prev, stage: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="qualification">Qualification</SelectItem>
                <SelectItem value="needs_analysis">Needs Analysis</SelectItem>
                <SelectItem value="proposal">Proposal</SelectItem>
                <SelectItem value="negotiation">Negotiation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Conversion Notes</Label>
            <Textarea
              id="notes"
              value={conversionData.notes}
              onChange={(e) => setConversionData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any relevant notes about this conversion..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={convertLeadMutation.isPending}
            >
              {convertLeadMutation.isPending ? 'Converting...' : 'Convert Lead'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
