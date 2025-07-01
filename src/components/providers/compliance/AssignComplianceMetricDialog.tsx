import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ComplianceService, ComplianceMetric } from '@/services/compliance/complianceService';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AssignComplianceMetricDialogProps {
  onAssignmentCreated: () => void;
}

interface User {
  id: string;
  display_name: string;
  email: string;
  role: string;
}

export function AssignComplianceMetricDialog({ onAssignmentCreated }: AssignComplianceMetricDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [metrics, setMetrics] = useState<ComplianceMetric[]>([]);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    user_id: '',
    metric_id: '',
    compliance_status: 'pending' as 'compliant' | 'non_compliant' | 'warning' | 'pending'
  });

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      // Load users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, display_name, email, role')
        .in('role', ['AP', 'IN', 'TM'])
        .order('display_name');

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Load metrics
      const metricsData = await ComplianceService.getComplianceMetrics();
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users and metrics',
        variant: 'destructive'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const selectedMetric = metrics.find(m => m.id === formData.metric_id);
      
      // Create initial compliance record
      await ComplianceService.updateComplianceRecord(
        formData.user_id,
        formData.metric_id,
        getInitialValue(selectedMetric?.measurement_type || 'boolean'),
        formData.compliance_status,
        'Initial assignment'
      );

      toast({
        title: 'Success',
        description: 'Compliance metric assigned successfully'
      });

      setOpen(false);
      setFormData({
        user_id: '',
        metric_id: '',
        compliance_status: 'pending'
      });
      onAssignmentCreated();
    } catch (error) {
      console.error('Error assigning compliance metric:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign compliance metric',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitialValue = (measurementType: string) => {
    switch (measurementType) {
      case 'boolean':
        return { completed: false };
      case 'percentage':
        return { completeness: 0 };
      case 'date':
        return { valid_until: null };
      case 'numeric':
        return { value: 0 };
      default:
        return {};
    }
  };

  const getFilteredMetrics = () => {
    const selectedUser = users.find(u => u.id === formData.user_id);
    if (!selectedUser) return metrics;

    return metrics.filter(metric => 
      metric.required_for_roles.length === 0 || 
      metric.required_for_roles.includes(selectedUser.role)
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Assign Metric
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Compliance Metric</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="user_id">Select User</Label>
            <Select value={formData.user_id} onValueChange={(value) => setFormData(prev => ({ ...prev, user_id: value, metric_id: '' }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.display_name} ({user.role}) - {user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="metric_id">Select Compliance Metric</Label>
            <Select 
              value={formData.metric_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, metric_id: value }))}
              disabled={!formData.user_id}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a metric" />
              </SelectTrigger>
              <SelectContent>
                {getFilteredMetrics().map(metric => (
                  <SelectItem key={metric.id} value={metric.id}>
                    {metric.name} ({metric.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="compliance_status">Initial Status</Label>
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="compliant">Compliant</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="non_compliant">Non-Compliant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.user_id || !formData.metric_id}>
              {loading ? 'Assigning...' : 'Assign Metric'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}