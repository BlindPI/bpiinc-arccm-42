import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ComplianceService } from '@/services/compliance/complianceService';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreateComplianceMetricDialogProps {
  onMetricCreated: () => void;
}

export function CreateComplianceMetricDialog({ onMetricCreated }: CreateComplianceMetricDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    measurement_type: 'boolean' as 'boolean' | 'percentage' | 'date' | 'numeric',
    target_value: {},
    weight: 1,
    required_for_roles: [] as string[]
  });

  const categories = [
    'certification',
    'training', 
    'safety',
    'documentation',
    'equipment'
  ];

  const roles = ['AP', 'IN', 'TM', 'SA', 'AD'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Set appropriate target value based on measurement type
      let targetValue = {};
      switch (formData.measurement_type) {
        case 'boolean':
          targetValue = { completed: true };
          break;
        case 'percentage':
          targetValue = { completeness: 95 };
          break;
        case 'date':
          targetValue = { valid_until: 'required' };
          break;
        case 'numeric':
          targetValue = { minimum_value: 1 };
          break;
      }

      await ComplianceService.upsertComplianceMetric({
        ...formData,
        target_value: targetValue
      });

      toast({
        title: 'Success',
        description: 'Compliance metric created successfully'
      });

      setOpen(false);
      setFormData({
        name: '',
        description: '',
        category: '',
        measurement_type: 'boolean',
        target_value: {},
        weight: 1,
        required_for_roles: []
      });
      onMetricCreated();
    } catch (error) {
      console.error('Error creating compliance metric:', error);
      toast({
        title: 'Error',
        description: 'Failed to create compliance metric',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (role: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      required_for_roles: checked 
        ? [...prev.required_for_roles, role]
        : prev.required_for_roles.filter(r => r !== role)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Metric
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Compliance Metric</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Metric Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="measurement_type">Measurement Type</Label>
            <Select 
              value={formData.measurement_type} 
              onValueChange={(value: 'boolean' | 'percentage' | 'date' | 'numeric') => 
                setFormData(prev => ({ ...prev, measurement_type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="boolean">Boolean (Yes/No)</SelectItem>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="numeric">Numeric</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="weight">Weight (1-5)</Label>
            <Input
              id="weight"
              type="number"
              min="1"
              max="5"
              value={formData.weight}
              onChange={(e) => setFormData(prev => ({ ...prev, weight: parseInt(e.target.value) }))}
            />
          </div>

          <div>
            <Label>Required for Roles</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {roles.map(role => (
                <div key={role} className="flex items-center space-x-2">
                  <Checkbox
                    id={role}
                    checked={formData.required_for_roles.includes(role)}
                    onCheckedChange={(checked) => handleRoleChange(role, checked as boolean)}
                  />
                  <Label htmlFor={role} className="text-sm">{role}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Metric'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}