// File: src/components/dialogs/TierSwitchDialog.tsx (From Currentplan1.5.md)

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowRight, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface TierSwitchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier?: string;
  targetTier?: string;
  onConfirm: (targetTier: string, reason: string) => Promise<void>;
}

export function TierSwitchDialog({
  isOpen,
  onClose,
  currentTier,
  targetTier,
  onConfirm
}: TierSwitchDialogProps) {
  const [step, setStep] = useState<'comparison' | 'confirmation' | 'processing'>('comparison');
  const [reason, setReason] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Load impact analysis when dialog opens
  useEffect(() => {
    if (isOpen && targetTier) {
      loadImpactAnalysis();
    }
  }, [isOpen, targetTier]);
  
  const loadImpactAnalysis = async () => {
    try {
      // Analysis would be loaded from backend
      console.log('Loading impact analysis...');
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
                  <li>5 new requirements will be added</li>
                  <li>2 requirements will be removed</li>
                  <li>3 requirements will be preserved</li>
                  <li>Estimated time to complete new requirements: 4-6 weeks</li>
                </ul>
              </AlertDescription>
            </Alert>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={() => setStep('confirmation')}>
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

function TierComparisonTable({ currentTier, targetTier, highlightDifferences }: any) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-200">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-200 p-3 text-left">Feature</th>
            <th className="border border-gray-200 p-3 text-center">Essential</th>
            <th className="border border-gray-200 p-3 text-center">Comprehensive</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-200 p-3">Requirements Count</td>
            <td className="border border-gray-200 p-3 text-center">3-5</td>
            <td className="border border-gray-200 p-3 text-center">6-8</td>
          </tr>
          <tr>
            <td className="border border-gray-200 p-3">Time to Complete</td>
            <td className="border border-gray-200 p-3 text-center">2-4 weeks</td>
            <td className="border border-gray-200 p-3 text-center">6-12 weeks</td>
          </tr>
          <tr>
            <td className="border border-gray-200 p-3">Advanced Features</td>
            <td className="border border-gray-200 p-3 text-center">❌</td>
            <td className="border border-gray-200 p-3 text-center">✅</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}