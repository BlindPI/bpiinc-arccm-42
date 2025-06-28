
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Shield, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ComplianceTierManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: { id: string; name: string; role: string } | null;
  canManage: boolean;
  onClose: () => void;
}

export function ComplianceTierManagerDialog({ 
  open, 
  onOpenChange, 
  user, 
  canManage, 
  onClose 
}: ComplianceTierManagerDialogProps) {
  const [selectedTier, setSelectedTier] = useState<'basic' | 'robust'>('basic');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTierChange = async () => {
    if (!user || !canManage) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          compliance_tier: selectedTier,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      // Log the tier change
      await supabase
        .from('audit_logs')
        .insert({
          action: 'compliance_tier_change',
          entity_type: 'user',
          entity_id: user.id,
          details: {
            previous_tier: 'unknown', // Could be enhanced to fetch current tier
            new_tier: selectedTier,
            notes: notes,
            changed_by: 'system_admin'
          }
        });

      toast.success(`Compliance tier updated to ${selectedTier} for ${user.name}`);
      onClose();
    } catch (error: any) {
      console.error('Error updating compliance tier:', error);
      toast.error(`Failed to update compliance tier: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const tierComparison = {
    basic: {
      icon: FileText,
      title: 'Basic Tier',
      description: 'Standard compliance requirements with essential tracking',
      features: [
        'Basic requirement tracking',
        'Standard documentation',
        'Email notifications',
        'Monthly progress reports'
      ],
      color: 'bg-blue-50 border-blue-200 text-blue-800'
    },
    robust: {
      icon: Shield,
      title: 'Robust Tier',
      description: 'Enhanced compliance with advanced features and monitoring',
      features: [
        'Advanced requirement tracking',
        'Comprehensive documentation',
        'Real-time notifications',
        'Weekly progress reports',
        'Automated escalations',
        'Performance analytics'
      ],
      color: 'bg-green-50 border-green-200 text-green-800'
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Shield className="h-5 w-5" />
            Manage Compliance Tier - {user.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!canManage && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You don't have permission to modify compliance tiers for this user.
              </AlertDescription>
            </Alert>
          )}

          {/* Current User Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">User Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">Role: {user.role}</p>
                </div>
                <Badge variant="outline">Current User</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Tier Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select Compliance Tier</h3>
            
            <RadioGroup 
              value={selectedTier} 
              onValueChange={(value) => setSelectedTier(value as 'basic' | 'robust')}
              disabled={!canManage}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(tierComparison).map(([key, tier]) => {
                  const IconComponent = tier.icon;
                  return (
                    <Card key={key} className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedTier === key ? 'ring-2 ring-primary' : ''
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <RadioGroupItem value={key} id={key} />
                          <Label htmlFor={key} className="flex items-center gap-2 cursor-pointer">
                            <IconComponent className="h-4 w-4" />
                            {tier.title}
                          </Label>
                        </div>
                        
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">{tier.description}</p>
                          
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Features:</p>
                            <ul className="text-xs space-y-1">
                              {tier.features.map((feature, index) => (
                                <li key={index} className="flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </RadioGroup>
          </div>

          {/* Notes Section */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this tier change..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={!canManage}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {canManage && (
              <Button 
                onClick={handleTierChange}
                disabled={isLoading}
              >
                {isLoading ? 'Updating...' : 'Update Tier'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
