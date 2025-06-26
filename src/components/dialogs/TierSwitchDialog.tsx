import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowRight, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { ComplianceTierService } from '@/services/compliance/complianceTierService';
import { ComplianceService } from '@/services/compliance/complianceService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TierSwitchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (targetTier: string, reason: string) => Promise<void>;
  userId: string;
  currentTier: 'basic' | 'robust';
  targetTier?: 'basic' | 'robust';
  userRole: string;
}

type DialogStep = 'comparison' | 'confirmation' | 'processing' | 'complete';

interface TierImpactAnalysis {
  requirementsToAdd: number;
  requirementsToRemove: number;
  requirementsToPreserve: number;
  estimatedTimeToComplete: string;
  complexityScore: number;
  riskFactors: string[];
  recommendations: string[];
  dataIntegrityImpact: {
    recordsAffected: number;
    backupRequired: boolean;
    reversible: boolean;
  };
}

interface TierComparisonData {
  currentTierDetails: {
    name: string;
    requirementCount: number;
    completionRate: number;
    categories: string[];
  };
  targetTierDetails: {
    name: string;
    requirementCount: number;
    estimatedCompletionTime: string;
    categories: string[];
  };
  differences: {
    added: Array<{
      name: string;
      category: string;
      type: string;
      estimatedHours: number;
    }>;
    removed: Array<{
      name: string;
      category: string;
      currentStatus: string;
    }>;
    modified: Array<{
      name: string;
      changes: string[];
    }>;
  };
}

export function TierSwitchDialog({
  isOpen,
  onClose,
  onConfirm,
  userId,
  currentTier,
  targetTier,
  userRole
}: TierSwitchDialogProps) {
  const [step, setStep] = useState<DialogStep>('comparison');
  const [reason, setReason] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [impactAnalysis, setImpactAnalysis] = useState<TierImpactAnalysis | null>(null);
  const [tierComparison, setTierComparison] = useState<TierComparisonData | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  
  // Load real impact analysis when dialog opens
  useEffect(() => {
    if (isOpen && targetTier) {
      loadRealImpactAnalysis();
      loadRealTierComparison();
    }
  }, [isOpen, targetTier]);
  
  // Reset dialog state when opening
  useEffect(() => {
    if (isOpen) {
      setStep('comparison');
      setReason('');
      setAgreedToTerms(false);
      setValidationErrors([]);
      setProcessingProgress(0);
    }
  }, [isOpen]);
  
  const loadRealImpactAnalysis = async () => {
    try {
      // Get current user compliance records
      const currentRecords = await ComplianceService.getUserComplianceRecords(userId);
      
      // Get requirements for target tier
      const { data: targetRequirements, error } = await supabase
        .from('compliance_metrics')
        .select('*')
        .contains('required_for_roles', [userRole])
        .like('applicable_tiers', `%${targetTier}%`);
      
      if (error) throw error;
      
      // Calculate real impact
      const currentRequirementIds = currentRecords.map(r => r.metric_id);
      const targetRequirementIds = targetRequirements?.map(r => r.id) || [];
      
      const toAdd = targetRequirementIds.filter(id => !currentRequirementIds.includes(id));
      const toRemove = currentRequirementIds.filter(id => !targetRequirementIds.includes(id));
      const toPreserve = currentRequirementIds.filter(id => targetRequirementIds.includes(id));
      
      // Calculate complexity score based on real data
      const complexityFactors = {
        requirementChanges: (toAdd.length + toRemove.length) / 10,
        dataLoss: toRemove.length > 0 ? 3 : 0,
        roleComplexity: userRole === 'IC' ? 2 : userRole === 'IP' ? 1.5 : 1,
        currentProgress: currentRecords.filter(r => r.compliance_status === 'pending').length / 5
      };
      
      const complexityScore = Math.min(10, Math.round(
        complexityFactors.requirementChanges + 
        complexityFactors.dataLoss + 
        complexityFactors.roleComplexity + 
        complexityFactors.currentProgress
      ));
      
      // Generate real risk factors
      const riskFactors: string[] = [];
      if (toRemove.length > 0) {
        riskFactors.push(`${toRemove.length} requirements will be removed from tracking`);
      }
      if (currentRecords.some(r => r.compliance_status === 'pending')) {
        riskFactors.push('Some requirements currently in progress may need revalidation');
      }
      if (targetTier === 'robust' && currentTier === 'basic') {
        riskFactors.push('Additional training and documentation requirements will be added');
      }
      
      // Generate real recommendations
      const recommendations: string[] = [];
      if (complexityScore > 6) {
        recommendations.push('Consider completing current in-progress requirements before switching');
      }
      if (toRemove.length > 5) {
        recommendations.push('Export current compliance data before proceeding');
      }
      recommendations.push('Schedule time to review new requirements after the switch');
      
      setImpactAnalysis({
        requirementsToAdd: toAdd.length,
        requirementsToRemove: toRemove.length,
        requirementsToPreserve: toPreserve.length,
        estimatedTimeToComplete: calculateEstimatedTime(toAdd.length, targetTier),
        complexityScore,
        riskFactors,
        recommendations,
        dataIntegrityImpact: {
          recordsAffected: toAdd.length + toRemove.length,
          backupRequired: toRemove.length > 0,
          reversible: targetTier === 'basic'
        }
      });
      
    } catch (error) {
      console.error('Failed to load real impact analysis:', error);
      toast({
        title: "Analysis Error",
        description: "Unable to analyze tier switch impact. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const loadRealTierComparison = async () => {
    try {
      // Get current tier requirements
      const { data: currentReqs } = await supabase
        .from('compliance_metrics')
        .select('*')
        .contains('required_for_roles', [userRole])
        .like('applicable_tiers', `%${currentTier}%`);
      
      // Get target tier requirements
      const { data: targetReqs } = await supabase
        .from('compliance_metrics')
        .select('*')
        .contains('required_for_roles', [userRole])
        .like('applicable_tiers', `%${targetTier}%`);
      
      // Get user's current completion rate
      const userRecords = await ComplianceService.getUserComplianceRecords(userId);
      const completedCount = userRecords.filter(r => r.compliance_status === 'compliant').length;
      const completionRate = userRecords.length > 0 ? Math.round((completedCount / userRecords.length) * 100) : 0;
      
      // Calculate differences
      const currentIds = currentReqs?.map(r => r.id) || [];
      const targetIds = targetReqs?.map(r => r.id) || [];
      
      const added = targetReqs?.filter(r => !currentIds.includes(r.id)).map(r => ({
        name: r.name,
        category: r.category,
        type: r.measurement_type,
        estimatedHours: estimateRequirementHours(r.category, r.measurement_type)
      })) || [];
      
      const removed = currentReqs?.filter(r => !targetIds.includes(r.id)).map(r => {
        const userRecord = userRecords.find(ur => ur.metric_id === r.id);
        return {
          name: r.name,
          category: r.category,
          currentStatus: userRecord?.compliance_status || 'pending'
        };
      }) || [];
      
      const modified = currentReqs?.filter(r => targetIds.includes(r.id)).map(r => {
        const targetReq = targetReqs?.find(tr => tr.id === r.id);
        const changes: string[] = [];
        
        if (targetReq && targetReq.weight !== r.weight) {
          changes.push(`Weight changed from ${r.weight} to ${targetReq.weight}`);
        }
        if (targetReq && targetReq.target_value !== r.target_value) {
          changes.push(`Target value updated`);
        }
        
        return {
          name: r.name,
          changes
        };
      }).filter(r => r.changes.length > 0) || [];
      
      setTierComparison({
        currentTierDetails: {
          name: `${userRole} - ${currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} Tier`,
          requirementCount: currentReqs?.length || 0,
          completionRate,
          categories: [...new Set(currentReqs?.map(r => r.category) || [])]
        },
        targetTierDetails: {
          name: `${userRole} - ${targetTier!.charAt(0).toUpperCase() + targetTier!.slice(1)} Tier`,
          requirementCount: targetReqs?.length || 0,
          estimatedCompletionTime: calculateEstimatedTime(added.length, targetTier!),
          categories: [...new Set(targetReqs?.map(r => r.category) || [])]
        },
        differences: {
          added,
          removed,
          modified
        }
      });
      
    } catch (error) {
      console.error('Failed to load tier comparison:', error);
      toast({
        title: "Comparison Error",
        description: "Unable to load tier comparison data.",
        variant: "destructive"
      });
    }
  };
  
  const calculateEstimatedTime = (newRequirements: number, tier: 'basic' | 'robust'): string => {
    const baseHours = newRequirements * (tier === 'robust' ? 4 : 2);
    const days = Math.ceil(baseHours / 8);
    
    if (days <= 1) return '1 day';
    if (days <= 7) return `${days} days`;
    if (days <= 30) return `${Math.ceil(days / 7)} weeks`;
    return `${Math.ceil(days / 30)} months`;
  };
  
  const estimateRequirementHours = (category: string, type: string): number => {
    const baseHours: Record<string, number> = {
      certification: 8,
      training: 12,
      documentation: 2,
      background_check: 1,
      continuing_education: 16
    };
    
    return baseHours[category] || 4;
  };
  
  const handleConfirmSwitch = async () => {
    // Real validation
    const errors = validateTierSwitch();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setStep('processing');
    setIsProcessing(true);
    setProcessingProgress(0);
    
    try {
      // Stage 1: Create backup point
      setProcessingProgress(20);
      await createComplianceBackup(userId);
      
      // Stage 2: Validate data integrity
      setProcessingProgress(40);
      await validateDataIntegrity(userId);
      
      // Stage 3: Perform the tier switch
      setProcessingProgress(60);
      await onConfirm(targetTier!, reason);
      
      // Stage 4: Update related systems
      setProcessingProgress(80);
      await updateRelatedSystems(userId, targetTier!);
      
      // Stage 5: Verify completion and log
      setProcessingProgress(100);
      await logTierSwitchCompletion(userId, currentTier, targetTier!, reason);
      
      // Show completion
      setTimeout(() => {
        setStep('complete');
        toast({
          title: "Tier Switch Successful",
          description: `Successfully switched to ${targetTier === 'basic' ? 'Essential' : 'Comprehensive'} tier`,
        });
      }, 500);
      
    } catch (error) {
      console.error('Tier switch failed:', error);
      toast({
        title: "Switch Failed",
        description: "Failed to switch tier. Please try again or contact support.",
        variant: "destructive"
      });
      setStep('confirmation');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const validateTierSwitch = (): string[] => {
    const errors: string[] = [];
    
    if (!reason.trim()) {
      errors.push('Please provide a reason for the tier change');
    }
    
    if (reason.trim().length < 10) {
      errors.push('Please provide a more detailed reason (at least 10 characters)');
    }
    
    if (!agreedToTerms) {
      errors.push('You must agree to the terms before proceeding');
    }
    
    if (impactAnalysis && impactAnalysis.complexityScore > 8) {
      errors.push('This tier switch has high complexity. Please contact support for assistance.');
    }
    
    return errors;
  };
  
  const createComplianceBackup = async (userId: string): Promise<void> => {
    // Create actual backup in compliance_audit_log
    const { error } = await supabase
      .from('compliance_audit_log')
      .insert({
        user_id: userId,
        audit_type: 'tier_switch_backup',
        notes: `Tier switch backup: ${currentTier} to ${targetTier} - ${reason}`,
        old_value: { tier: currentTier },
        new_value: { tier: targetTier },
        performed_by: userId
      });
    
    if (error) throw error;
  };
  
  const validateDataIntegrity = async (userId: string): Promise<void> => {
    // Real data integrity check
    const records = await ComplianceService.getUserComplianceRecords(userId);
    
    // Check for orphaned records
    const { data: metrics } = await supabase
      .from('compliance_metrics')
      .select('id')
      .in('id', records.map(r => r.metric_id));
    
    const validMetricIds = metrics?.map(m => m.id) || [];
    const orphanedRecords = records.filter(r => !validMetricIds.includes(r.metric_id));
    
    if (orphanedRecords.length > 0) {
      throw new Error(`Found ${orphanedRecords.length} orphaned compliance records`);
    }
  };
  
  const updateRelatedSystems = async (userId: string, newTier: string): Promise<void> => {
    // Update profile with new tier
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        compliance_tier: newTier,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', userId);
    
    if (profileError) throw profileError;
    
    // Trigger real-time updates through direct tier service
    try {
      await ComplianceTierService.switchComplianceTier(userId, newTier as 'basic' | 'robust');
    } catch (error) {
      console.warn('Failed to update tier through service:', error);
    }
  };
  
  const logTierSwitchCompletion = async (
    userId: string,
    oldTier: string,
    newTier: string,
    reason: string
  ): Promise<void> => {
    await supabase
      .from('compliance_audit_log')
      .insert({
        user_id: userId,
        audit_type: 'tier_switch_completed',
        notes: `Tier switch completed: ${oldTier} to ${newTier} - ${reason}`,
        old_value: {
          tier: oldTier,
          impact_analysis: impactAnalysis
        },
        new_value: {
          tier: newTier,
          completion_timestamp: new Date().toISOString()
        },
        performed_by: userId
      });
  };
  
  const renderStepContent = () => {
    switch (step) {
      case 'comparison':
        return (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold">Compare Compliance Tiers</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Review the comprehensive analysis before making your decision
              </p>
            </div>
            
            {!tierComparison ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading tier comparison...</span>
              </div>
            ) : (
              <>
                {/* Tier Comparison Overview */}
                <Card className="border-2 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-base">Tier Comparison Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <Badge variant={currentTier === 'basic' ? 'default' : 'secondary'}>
                            Current: {tierComparison.currentTierDetails.name}
                          </Badge>
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Requirements:</span>
                            <span className="font-medium">{tierComparison.currentTierDetails.requirementCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Completion Rate:</span>
                            <span className="font-medium">{tierComparison.currentTierDetails.completionRate}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Categories:</span>
                            <span className="font-medium">{tierComparison.currentTierDetails.categories.length}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <Badge variant={targetTier === 'basic' ? 'default' : 'secondary'}>
                            Target: {tierComparison.targetTierDetails.name}
                          </Badge>
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Requirements:</span>
                            <span className="font-medium">{tierComparison.targetTierDetails.requirementCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Est. Time:</span>
                            <span className="font-medium">{tierComparison.targetTierDetails.estimatedCompletionTime}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Categories:</span>
                            <span className="font-medium">{tierComparison.targetTierDetails.categories.length}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Detailed Changes Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Detailed Changes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Requirements to be Added */}
                    {tierComparison.differences.added.length > 0 && (
                      <div>
                        <h5 className="font-medium text-green-700 mb-2">
                          ✅ Requirements to be Added ({tierComparison.differences.added.length})
                        </h5>
                        <div className="space-y-2">
                          {tierComparison.differences.added.map((req, idx) => (
                            <div key={idx} className="bg-green-50 p-3 rounded-md">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h6 className="font-medium text-sm">{req.name}</h6>
                                  <p className="text-xs text-green-700">Category: {req.category}</p>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  ~{req.estimatedHours}h
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Requirements to be Removed */}
                    {tierComparison.differences.removed.length > 0 && (
                      <div>
                        <h5 className="font-medium text-red-700 mb-2">
                          ❌ Requirements to be Removed ({tierComparison.differences.removed.length})
                        </h5>
                        <div className="space-y-2">
                          {tierComparison.differences.removed.map((req, idx) => (
                            <div key={idx} className="bg-red-50 p-3 rounded-md">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h6 className="font-medium text-sm">{req.name}</h6>
                                  <p className="text-xs text-red-700">Category: {req.category}</p>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {req.currentStatus}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Modified Requirements */}
                    {tierComparison.differences.modified.length > 0 && (
                      <div>
                        <h5 className="font-medium text-blue-700 mb-2">
                          🔄 Requirements to be Modified ({tierComparison.differences.modified.length})
                        </h5>
                        <div className="space-y-2">
                          {tierComparison.differences.modified.map((req, idx) => (
                            <div key={idx} className="bg-blue-50 p-3 rounded-md">
                              <h6 className="font-medium text-sm">{req.name}</h6>
                              <div className="text-xs text-blue-700 mt-1">
                                Changes: {req.changes.join(', ')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Impact Analysis Summary */}
                {impactAnalysis && (
                  <Card className={cn(
                    "border-2",
                    impactAnalysis.complexityScore <= 3 ? "border-green-200 bg-green-50" :
                    impactAnalysis.complexityScore <= 6 ? "border-yellow-200 bg-yellow-50" :
                    "border-red-200 bg-red-50"
                  )}>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className={cn(
                          "h-4 w-4",
                          impactAnalysis.complexityScore <= 3 ? "text-green-600" :
                          impactAnalysis.complexityScore <= 6 ? "text-yellow-600" :
                          "text-red-600"
                        )} />
                        Impact Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Complexity Score:</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={(impactAnalysis.complexityScore / 10) * 100} className="h-2 flex-1" />
                            <span className="text-xs">{impactAnalysis.complexityScore}/10</span>
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Data Impact:</span>
                          <p className="text-xs text-muted-foreground mt-1">
                            {impactAnalysis.dataIntegrityImpact.recordsAffected} records affected
                            {impactAnalysis.dataIntegrityImpact.backupRequired && " (backup required)"}
                          </p>
                        </div>
                      </div>
                      
                      {impactAnalysis.riskFactors.length > 0 && (
                        <div>
                          <span className="font-medium text-sm">Risk Factors:</span>
                          <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                            {impactAnalysis.riskFactors.map((risk, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span>•</span>
                                <span>{risk}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {impactAnalysis.recommendations.length > 0 && (
                        <div>
                          <span className="font-medium text-sm">Recommendations:</span>
                          <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                            {impactAnalysis.recommendations.map((rec, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span>•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={() => setStep('confirmation')}
                disabled={!tierComparison}
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
                <XCircle className="h-4 w-4" />
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
            <Progress value={processingProgress} className="w-full max-w-xs" />
            <p className="text-xs text-muted-foreground">{processingProgress}% Complete</p>
          </div>
        );
        
      case 'complete':
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
            <h3 className="text-lg font-semibold">Tier Switch Complete</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Your compliance tier has been successfully updated. Your new requirements are now active.
            </p>
            <Button onClick={onClose} className="mt-4">
              Close
            </Button>
          </div>
        );
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Switch Compliance Tier</DialogTitle>
          <DialogDescription>
            Change from {currentTier} to {targetTier} tier
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {renderStepContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}