
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Opportunity } from '@/types/crm';
import { toast } from 'sonner';

interface OpportunityFormProps {
  opportunity?: Opportunity;
  onSave: (opportunity: Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
}

export const OpportunityForm: React.FC<OpportunityFormProps> = ({
  opportunity,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    opportunity_name: opportunity?.opportunity_name || '',
    account_name: opportunity?.account_name || '',
    estimated_value: opportunity?.estimated_value || 0,
    stage: opportunity?.stage || 'Prospect' as const,
    probability: opportunity?.probability || 50,
    expected_close_date: opportunity?.expected_close_date || '',
    description: opportunity?.description || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.opportunity_name.trim()) {
      toast.error('Opportunity name is required');
      return;
    }

    onSave({
      ...formData,
      opportunity_status: 'open',
      created_by: '', // Will be set by the backend
    } as Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="opportunity_name">Opportunity Name</Label>
        <Input
          id="opportunity_name"
          value={formData.opportunity_name}
          onChange={(e) => setFormData({...formData, opportunity_name: e.target.value})}
          placeholder="Enter opportunity name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="account_name">Account Name</Label>
        <Input
          id="account_name"
          value={formData.account_name}
          onChange={(e) => setFormData({...formData, account_name: e.target.value})}
          placeholder="Enter account name"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="estimated_value">Estimated Value</Label>
          <Input
            id="estimated_value"
            type="number"
            value={formData.estimated_value}
            onChange={(e) => setFormData({...formData, estimated_value: Number(e.target.value)})}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="probability">Probability (%)</Label>
          <Input
            id="probability"
            type="number"
            min="0"
            max="100"
            value={formData.probability}
            onChange={(e) => setFormData({...formData, probability: Number(e.target.value)})}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="stage">Stage</Label>
        <Select
          value={formData.stage}
          onValueChange={(value) => setFormData({...formData, stage: value as Opportunity['stage']})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Prospect">Prospect</SelectItem>
            <SelectItem value="Proposal">Proposal</SelectItem>
            <SelectItem value="Negotiation">Negotiation</SelectItem>
            <SelectItem value="Closed Won">Closed Won</SelectItem>
            <SelectItem value="Closed Lost">Closed Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="expected_close_date">Expected Close Date</Label>
        <Input
          id="expected_close_date"
          type="date"
          value={formData.expected_close_date}
          onChange={(e) => setFormData({...formData, expected_close_date: e.target.value})}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Enter opportunity description"
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {opportunity ? 'Update' : 'Create'} Opportunity
        </Button>
      </div>
    </form>
  );
};
