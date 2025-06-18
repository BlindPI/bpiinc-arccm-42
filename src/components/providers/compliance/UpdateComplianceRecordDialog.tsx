import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ComplianceService, UserComplianceRecord, ComplianceMetric } from '@/services/compliance/complianceService';
import { Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UpdateComplianceRecordDialogProps {
  record: UserComplianceRecord;
  metric: ComplianceMetric;
  onRecordUpdated: () => void;
}

export function UpdateComplianceRecordDialog({ record, metric, onRecordUpdated }: UpdateComplianceRecordDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    current_value: record.current_value || {},
    compliance_status: record.compliance_status,
    notes: record.notes || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await ComplianceService.updateComplianceRecord(
        record.user_id,
        record.metric_id,
        formData.current_value,
        formData.compliance_status as 'compliant' | 'non_compliant' | 'warning' | 'pending',
        formData.notes
      );

      toast({
        title: 'Success',
        description: 'Compliance record updated successfully'
      });

      setOpen(false);
      onRecordUpdated();
    } catch (error) {
      console.error('Error updating compliance record:', error);
      toast({
        title: 'Error',
        description: 'Failed to update compliance record',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderValueInput = () => {
    switch (metric.measurement_type) {
      case 'boolean':
        return (
          <Select 
            value={formData.current_value?.completed ? 'true' : 'false'} 
            onValueChange={(value) => setFormData(prev => ({ 
              ...prev, 
              current_value: { completed: value === 'true' } 
            }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        );
      
      case 'percentage':
        return (
          <Input
            type="number"
            min="0"
            max="100"
            value={formData.current_value?.completeness || 0}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              current_value: { completeness: parseInt(e.target.value) } 
            }))}
          />
        );
      
      case 'date':
        return (
          <Input
            type="date"
            value={formData.current_value?.valid_until || ''}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              current_value: { valid_until: e.target.value } 
            }))}
          />
        );
      
      case 'numeric':
        return (
          <Input
            type="number"
            value={formData.current_value?.value || 0}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              current_value: { value: parseInt(e.target.value) } 
            }))}
          />
        );
      
      default:
        return (
          <Input
            value={JSON.stringify(formData.current_value)}
            onChange={(e) => {
              try {
                setFormData(prev => ({ 
                  ...prev, 
                  current_value: JSON.parse(e.target.value) 
                }));
              } catch {
                // Invalid JSON, ignore
              }
            }}
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Update
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Compliance Record</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Metric</Label>
            <p className="text-sm text-muted-foreground">{metric.name}</p>
          </div>

          <div>
            <Label htmlFor="current_value">Current Value</Label>
            {renderValueInput()}
          </div>

          <div>
            <Label htmlFor="compliance_status">Compliance Status</Label>
            <Select 
              value={formData.compliance_status} 
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                compliance_status: value as 'compliant' | 'non_compliant' | 'warning' | 'pending'
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compliant">Compliant</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="Add any notes about this compliance record..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Record'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}