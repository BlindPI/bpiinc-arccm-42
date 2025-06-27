
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Settings, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  FileText,
  Clock
} from 'lucide-react';
import { ComplianceTierService, ComplianceTierInfo, TierSwitchResult } from '@/services/compliance/complianceTierService';
import { toast } from 'sonner';

interface ComplianceTierManagerProps {
  userId: string;
  userRole: 'AP' | 'IC' | 'IP' | 'IT' | 'SA' | 'AD';
  userName: string;
  canManage?: boolean;
}

export function ComplianceTierManager({ 
  userId, 
  userRole, 
  userName, 
  canManage 
}: ComplianceTierManagerProps) {
  const [tierInfo, setTierInfo] = useState<ComplianceTierInfo | null>(null);
  const [isChanging, setIsChanging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fix: SA and AD users should have management permissions
  const hasManagementAccess = canManage || ['SA', 'AD'].includes(userRole);

  useEffect(() => {
    loadTierInfo();
  }, [userId]);

  const loadTierInfo = async () => {
    try {
      setIsLoading(true);
      const info = await ComplianceTierService.getUserComplianceTierInfo(userId);
      setTierInfo(info);
    } catch (error) {
      console.error('Error loading tier info:', error);
      toast.error('Failed to load compliance tier information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTierChange = async (newTier: 'basic' | 'robust') => {
    if (!hasManagementAccess) {
      toast.error('You do not have permission to change compliance tiers');
      return;
    }

    setIsChanging(true);
    try {
      const result: TierSwitchResult = await ComplianceTierService.switchComplianceTier(userId, newTier);
      
      if (result.success) {
        toast.success(result.message);
        await loadTierInfo(); // Reload tier information
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error changing tier:', error);
      toast.error('Failed to update compliance tier');
    } finally {
      setIsChanging(false);
    }
  };

  const getTierIcon = (tier: 'basic' | 'robust') => {
    return tier === 'basic' ? <FileText className="h-4 w-4" /> : <Shield className="h-4 w-4" />;
  };

  const getTierColor = (tier: 'basic' | 'robust') => {
    return tier === 'basic' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Compliance Tier
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 animate-spin" />
            Loading compliance information...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tierInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Compliance Tier
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to load compliance tier information for this user.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Compliance Tier - {userName}
          </div>
          <Badge variant="outline" className={getTierColor(tierInfo.tier)}>
            {getTierIcon(tierInfo.tier)}
            {tierInfo.tier.charAt(0).toUpperCase() + tierInfo.tier.slice(1)}
          </Badge>
        </CardTitle>
        <CardDescription>
          {tierInfo.description}
          {hasManagementAccess && (
            <span className="block mt-1 text-green-600 font-medium">
              ✓ Administrator Access - Can modify tiers
            </span>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Completion Status</Label>
            <span className="text-sm text-muted-foreground">
              {tierInfo.completed_requirements} of {tierInfo.total_requirements} requirements
            </span>
          </div>
          
          <Progress 
            value={tierInfo.completion_percentage} 
            className="h-2"
          />
          
          <div className="flex items-center gap-2 text-sm">
            {tierInfo.completion_percentage === 100 ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-green-700">All requirements completed</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span className="text-yellow-700">{tierInfo.completion_percentage}% completed</span>
              </>
            )}
          </div>
        </div>

        {/* Tier Selection (only if user can manage) */}
        {hasManagementAccess && (
          <div className="space-y-4 border-t pt-4">
            <Label className="text-sm font-medium">Change Compliance Tier</Label>
            
            <RadioGroup
              value={tierInfo.tier}
              onValueChange={handleTierChange}
              disabled={isChanging}
              className="space-y-4"
            >
              <div className="flex items-start space-x-3 p-3 border rounded-lg bg-blue-50 border-blue-200">
                <RadioGroupItem value="basic" id="basic" className="mt-1" />
                <div className="space-y-1 flex-1">
                  <Label htmlFor="basic" className="text-sm font-medium cursor-pointer">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Basic Compliance
                    </div>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Essential requirements only: resume upload, background check, basic company information.
                    Ideal for quick onboarding and temporary assignments.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 border rounded-lg bg-green-50 border-green-200">
                <RadioGroupItem value="robust" id="robust" className="mt-1" />
                <div className="space-y-1 flex-1">
                  <Label htmlFor="robust" className="text-sm font-medium cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Robust Compliance
                    </div>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Comprehensive requirements: all basic requirements plus training courses, 
                    certifications, insurance, and continuing education. Required for full certification.
                  </p>
                </div>
              </div>
            </RadioGroup>

            {isChanging && (
              <Alert>
                <Clock className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  Updating compliance tier and reassigning requirements...
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Information Alert */}
        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>
            {hasManagementAccess 
              ? "Changing the compliance tier will reassign all requirements. Previous compliance progress may be affected."
              : "Only administrators can change compliance tiers. Contact your administrator if you need tier adjustments."
            }
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
