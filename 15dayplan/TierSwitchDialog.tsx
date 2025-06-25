// File: src/components/dialogs/TierSwitchDialog.tsx (From Currentplan1.5.md)

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './components/ui/dialog';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Label } from './components/ui/label';
import { Textarea } from './components/ui/textarea';
import { Checkbox } from './components/ui/checkbox';
import { Progress } from './components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert';
import { ArrowRight, AlertCircle, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from './contexts/AuthContext';
import { useTierSwitchValidation } from './hooks/useComplianceTier';
import { ComplianceTierService } from './services/compliance/complianceTierService';

interface TierSwitchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier?: string;
  targetTier?: string;
  onConfirm: (targetTier: string, reason: string) => Promise<void>;
  role?: string;
  userId?: string;
}

export function TierSwitchDialog({
  isOpen,
  onClose,
  currentTier,
  targetTier,
  onConfirm,
  role = 'IT', // Default to IT role if not provided
  userId
}: TierSwitchDialogProps) {
  const [step, setStep] = useState<'comparison' | 'confirmation' | 'processing'>('comparison');
  const [reason, setReason] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [impactData, setImpactData] = useState<any>({
    requirementsToAdd: 0,
    requirementsToRemove: 0,
    requirementsToPreserve: 0,
    estimatedTimeToComplete: ''
  });
  const [switchAllowed, setSwitchAllowed] = useState(true);
  
  const { user } = useAuth();
  const actualUserId = userId || user?.id;
  
  // Use the validation hook
  const { data: validationData, isLoading: validationLoading } = useTierSwitchValidation(
    actualUserId!,
    targetTier!
  );
  
  // Load impact analysis when dialog opens
  useEffect(() => {
    if (isOpen && targetTier) {
      loadImpactAnalysis();
    }
  }, [isOpen, targetTier]);
  
  const loadImpactAnalysis = async () => {
    try {
      if (!actualUserId || !targetTier) {
        return;
      }
      
      // Get validation data from the service directly if not available from hook
      const validation = validationData || await ComplianceTierService.validateTierSwitch(
        actualUserId,
        targetTier
      );
      
      if (validation) {
        setImpactData(validation.impact || {
          requirementsToAdd: 0,
          requirementsToRemove: 0,
          requirementsToPreserve: 0,
          estimatedTimeToComplete: targetTier === 'robust' ? '6-12 weeks' : '2-4 weeks'
        });
        
        setSwitchAllowed(validation.allowed);
        
        if (!validation.allowed) {
          setValidationErrors([validation.reason]);
        } else {
          setValidationErrors([]);
        }
      }
    } catch (error) {
      console.error('Failed to load impact analysis:', error);
      toast.error('Unable to analyze tier switch impact');
    }
  };
  
  const handleConfirmSwitch = async () => {
    if (!agreedToTerms) {
      setValidationErrors(['You must agree to the terms before proceeding']);
      return;
    }
    
    setStep('processing');
    setIsProcessing(true);
    
    try {
      await onConfirm(targetTier!, reason);
      toast.success('Tier switch completed successfully!');
      onClose();
    } catch (error) {
      console.error('Tier switch failed:', error);
      toast.error('Failed to switch tier. Please try again.');
      setStep('confirmation');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const renderStepContent = () => {
    switch (step) {
      case 'comparison':
        return (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold">Compare Compliance Tiers</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Review the differences between tiers before making a switch
              </p>
            </div>
            
            {/* Tier Comparison Table */}
            <TierComparisonTable
              currentTier={currentTier!}
              targetTier={targetTier!}
              highlightDifferences
            />
            
            {/* Impact Summary */}
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle>Impact Summary</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>{impactData.requirementsToAdd} new requirements will be added</li>
                  <li>{impactData.requirementsToRemove} requirements will be removed</li>
                  <li>{impactData.requirementsToPreserve} requirements will be preserved</li>
                  <li>Estimated time to complete new requirements: {impactData.estimatedTimeToComplete}</li>
                </ul>
              </AlertDescription>
            </Alert>
            
            {!switchAllowed && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Switch Not Allowed</AlertTitle>
                <AlertDescription>
                  {validationErrors.map((error, idx) => (
                    <p key={idx}>{error}</p>
                  ))}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={() => setStep('confirmation')}
                disabled={!switchAllowed}
              >
                Continue to Confirmation
              </Button>
            </div>
          </div>
        );
        
      case 'confirmation':
        return (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold">Confirm Tier Switch</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Please review and confirm your tier change
              </p>
            </div>
            
            {/* Summary Card */}
            <Card className="border-2 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-center flex-1">
                    <Badge variant={currentTier === 'basic' ? 'default' : 'secondary'} className="mb-2">
                      {currentTier === 'basic' ? 'Essential' : 'Comprehensive'}
                    </Badge>
                    <p className="text-sm font-medium">Current Tier</p>
                  </div>
                  
                  <ArrowRight className="h-6 w-6 text-muted-foreground" />
                  
                  <div className="text-center flex-1">
                    <Badge variant={targetTier === 'basic' ? 'default' : 'secondary'} className="mb-2">
                      {targetTier === 'basic' ? 'Essential' : 'Comprehensive'}
                    </Badge>
                    <p className="text-sm font-medium">New Tier</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Reason Input */}
            <div className="space-y-2">
              <Label htmlFor="switch-reason">
                Reason for tier change <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="switch-reason"
                placeholder="Please provide a reason for this tier change..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                required
              />
            </div>
            
            {/* Terms Agreement */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium">Terms & Conditions</h4>
              <div className="space-y-2 text-sm">
                <p>By switching tiers, you acknowledge that:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Your compliance requirements will be updated immediately</li>
                  <li>Progress on tier-specific requirements may be reset</li>
                  <li>This action will be logged in your compliance history</li>
                  <li>You may need to complete additional requirements</li>
                </ul>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="agree-terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                />
                <Label htmlFor="agree-terms" className="text-sm cursor-pointer">
                  I understand and agree to these terms
                </Label>
              </div>
            </div>
            
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside">
                    {validationErrors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('comparison')}>
                Back
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleConfirmSwitch}
                  disabled={!reason.trim() || !agreedToTerms}
                  variant="default"
                >
                  Confirm Switch
                </Button>
              </div>
            </div>
          </div>
        );
        
      case 'processing':
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <h3 className="text-lg font-semibold">Processing Tier Switch</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Please wait while we update your compliance requirements and migrate your data...
            </p>
            <Progress value={33} className="w-full max-w-xs" />
          </div>
        );
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
}

function TierComparisonTable({ currentTier, targetTier, highlightDifferences, role = 'IT' }: any) {
  // Use the comparison hook for actual data if available
  // For demo, we'll use static data that could be replaced with useComplianceTierComparison hook
  const tierFeatures = {
    'basic': {
      'Requirements Count': {
        'IT': '3-5',
        'IP': '3-4',
        'IC': '4-6',
        'AP': '3'
      },
      'Time to Complete': {
        'IT': '2-4 weeks',
        'IP': '2-3 weeks',
        'IC': '4-6 weeks',
        'AP': '2-4 weeks'
      },
      'Advanced Features': false,
      'Mentoring Support': false,
      'Progress Tracking': 'Basic',
      'Dashboard Features': 'Standard',
      'Document Requirements': 'Basic',
      'Reporting': 'Basic'
    },
    'robust': {
      'Requirements Count': {
        'IT': '6-8',
        'IP': '5-6',
        'IC': '7-9',
        'AP': '5-7'
      },
      'Time to Complete': {
        'IT': '6-12 weeks',
        'IP': '8-10 weeks',
        'IC': '10-14 weeks',
        'AP': '8-12 weeks'
      },
      'Advanced Features': true,
      'Mentoring Support': true,
      'Progress Tracking': 'Advanced',
      'Dashboard Features': 'Enhanced',
      'Document Requirements': 'Comprehensive',
      'Reporting': 'Advanced'
    }
  };
  
  // Generate table rows based on features
  const featureRows = Object.keys(tierFeatures.basic).map(feature => {
    let basicValue: any = tierFeatures.basic[feature];
    let robustValue: any = tierFeatures.robust[feature];
    
    // Handle role-specific values
    if (typeof basicValue === 'object' && basicValue[role]) {
      basicValue = basicValue[role];
    }
    
    if (typeof robustValue === 'object' && robustValue[role]) {
      robustValue = robustValue[role];
    }
    
    // Handle boolean values
    if (typeof basicValue === 'boolean') {
      basicValue = basicValue ? '✅' : '❌';
    }
    
    if (typeof robustValue === 'boolean') {
      robustValue = robustValue ? '✅' : '❌';
    }
    
    // Determine if the row should be highlighted
    const isHighlighted = highlightDifferences &&
      ((currentTier === 'basic' && targetTier === 'robust') ||
       (currentTier === 'robust' && targetTier === 'basic'));
    
    return (
      <tr key={feature} className={isHighlighted ? 'bg-blue-50' : ''}>
        <td className="border border-gray-200 p-3 font-medium">{feature}</td>
        <td className={`border border-gray-200 p-3 text-center ${currentTier === 'basic' && isHighlighted ? 'bg-green-100' : ''}`}>
          {basicValue}
        </td>
        <td className={`border border-gray-200 p-3 text-center ${currentTier === 'robust' && isHighlighted ? 'bg-green-100' : ''}`}>
          {robustValue}
        </td>
      </tr>
    );
  });
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-200">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-200 p-3 text-left">Feature</th>
            <th className="border border-gray-200 p-3 text-center">Essential (Basic)</th>
            <th className="border border-gray-200 p-3 text-center">Comprehensive (Robust)</th>
          </tr>
        </thead>
        <tbody>
          {featureRows}
        </tbody>
      </table>
    </div>
  );
}