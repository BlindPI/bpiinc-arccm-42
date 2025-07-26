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
import { supabase } from '@/integrations/supabase/client';

// Define measurement type enum based on database constraints
type MeasurementType = 'boolean' | 'percentage' | 'date' | 'numeric';

const MEASUREMENT_TYPES: Array<{ value: MeasurementType; label: string }> = [
  { value: 'boolean', label: 'Boolean (Yes/No)' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'date', label: 'Date' },
  { value: 'numeric', label: 'Numeric' }
];

const DEFAULT_MEASUREMENT_TYPE: MeasurementType = 'boolean';

interface CreateComplianceMetricDialogProps {
  onMetricCreated: () => void;
}

// Validation function for measurement type
const validateMeasurementType = (value: string): MeasurementType => {
  const validTypes: MeasurementType[] = ['boolean', 'percentage', 'date', 'numeric'];
  return validTypes.includes(value as MeasurementType) 
    ? (value as MeasurementType) 
    : DEFAULT_MEASUREMENT_TYPE;
};

export function CreateComplianceMetricDialog({ onMetricCreated }: CreateComplianceMetricDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    measurement_type: DEFAULT_MEASUREMENT_TYPE,
    target_value: {},
    weight: 1,
    required_for_roles: [] as string[],
    applicable_tiers: 'basic,robust'
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

      const savedMetric = await ComplianceService.upsertComplianceMetric({
        ...formData,
        target_value: targetValue
      });

      // Create compliance records for all existing users
      console.log('🔧 Creating compliance records for new metric:', savedMetric.name);
      
      // Get all users
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, role');
      
      if (usersError) {
        console.error('Failed to fetch users:', usersError);
      } else if (users && users.length > 0) {
        // Filter users based on required_for_roles
        const applicableUsers = users.filter(user => {
          const requiredRoles = savedMetric.required_for_roles || [];
          return requiredRoles.length === 0 || requiredRoles.includes(user.role);
        });
        
        console.log(`🔧 Creating records for ${applicableUsers.length} applicable users`);
        
        // Create compliance records for applicable users
        const recordPromises = applicableUsers.map(user =>
          supabase
            .from('user_compliance_records')
            .upsert({
              user_id: user.id,
              metric_id: savedMetric.id,
              compliance_status: 'pending',
              current_value: null,
              last_checked_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id,metric_id'
            })
        );
        
        await Promise.all(recordPromises);
        console.log('✅ Compliance records created for all applicable users');
      }

      toast({
        title: 'Success',
        description: 'Compliance metric created successfully'
      });

      setOpen(false);
      setFormData({
        name: '',
        description: '',
        category: '',
        measurement_type: DEFAULT_MEASUREMENT_TYPE,
        target_value: {},
        weight: 1,
        required_for_roles: [],
        applicable_tiers: 'basic,robust'
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
              onValueChange={(value: string) => {
                const validatedType = validateMeasurementType(value);
                setFormData(prev => ({ ...prev, measurement_type: validatedType }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select measurement type" />
              </SelectTrigger>
              <SelectContent>
                {MEASUREMENT_TYPES.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
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
            <Label htmlFor="applicable_tiers">Applicable Tiers</Label>
            <Select 
              value={formData.applicable_tiers} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, applicable_tiers: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select applicable tiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic,robust">Both Tiers</SelectItem>
                <SelectItem value="basic">Basic Only</SelectItem>
                <SelectItem value="robust">Robust Only</SelectItem>
              </SelectContent>
            </Select>
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