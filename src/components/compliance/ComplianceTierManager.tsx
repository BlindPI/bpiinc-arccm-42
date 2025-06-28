
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Shield, TrendingUp, Users, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ComplianceTierService } from '@/services/compliance/complianceTierService';
import { ComplianceTierInfo, adaptTierInfoFromDatabase } from '@/types/compliance-tier-standardized';

interface ComplianceTierManagerProps {
  userId: string;
  userRole: string;
  userName: string;
  canManageTier?: boolean;
}

export function ComplianceTierManager({ 
  userId, 
  userRole, 
  userName, 
  canManageTier = false 
}: ComplianceTierManagerProps) {
  const [tierInfo, setTierInfo] = useState<ComplianceTierInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [switchingTier, setSwitchingTier] = useState(false);
  const [newTier, setNewTier] = useState<'basic' | 'robust'>('basic');
  const [switchReason, setSwitchReason] = useState('');

  useEffect(() => {
    loadTierInfo();
  }, [userId]);

  const loadTierInfo = async () => {
    try {
      setLoading(true);
      // Fixed: Use the correct method name and handle the response properly
      const result = await ComplianceTierService.getUserComplianceTierInfo(userId);
      if (result) {
        setTierInfo(result);
      }
    } catch (error) {
      console.error('Error loading tier info:', error);
      toast.error('Failed to load compliance tier information');
    } finally {
      setLoading(false);
    }
  };

  const handleTierSwitch = async () => {
    if (!switchReason.trim()) {
      toast.error('Please provide a reason for the tier switch');
      return;
    }

    try {
      setSwitchingTier(true);
      // Fixed: Use only 2 arguments as expected by the service
      const result = await ComplianceTierService.switchTier(userId, newTier);
      
      if (result.success) {
        await loadTierInfo();
        setSwitchReason('');
        toast.success(`Successfully switched to ${newTier} tier`);
      } else {
        toast.error(result.message || 'Failed to switch tier');
      }
    } catch (error) {
      console.error('Error switching tier:', error);
      toast.error('Failed to switch tier');
    } finally {
      setSwitchingTier(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tierInfo) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No compliance tier information available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Tier Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Compliance Tier Status for {userName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Tier</p>
              <Badge variant={tierInfo.tier === 'robust' ? 'default' : 'secondary'} className="mt-1">
                {tierInfo.tier.charAt(0).toUpperCase() + tierInfo.tier.slice(1)}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Progress</p>
              <p className="text-2xl font-bold">{tierInfo.completion_percentage}%</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Requirements Completed</span>
              <span>{tierInfo.completed_requirements} / {tierInfo.totalRequirements}</span>
            </div>
            <Progress value={tierInfo.completion_percentage} className="h-2" />
          </div>

          {tierInfo.can_advance_tier && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Ready to advance tier!</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tier Management (Admin Only) */}
      {canManageTier && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tier Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newTier">Switch to Tier</Label>
              <Select value={newTier} onValueChange={(value: 'basic' | 'robust') => setNewTier(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="robust">Robust</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Change</Label>
              <Textarea
                id="reason"
                value={switchReason}
                onChange={(e) => setSwitchReason(e.target.value)}
                placeholder="Please provide a reason for this tier change..."
                rows={3}
              />
            </div>

            <Button 
              onClick={handleTierSwitch}
              disabled={switchingTier || !switchReason.trim() || newTier === tierInfo.tier}
              className="w-full"
            >
              {switchingTier ? 'Switching...' : `Switch to ${newTier} Tier`}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
