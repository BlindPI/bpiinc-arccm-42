/**
 * COMPLIANCE ONBOARDING MODAL
 * 
 * Phase 4: User Experience Polish
 * Provides guided onboarding experience for new compliance users
 * 
 * Features:
 * - Welcome modal for first-time users
 * - Tier selection guide with clear comparisons
 * - Step-by-step setup process
 * - Role-specific onboarding content
 * - Mobile-responsive design
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Clock, 
  FileText, 
  Shield, 
  Award, 
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  Star,
  Zap,
  Target
} from 'lucide-react';
import { ComplianceRequirementsService } from '@/services/compliance/complianceRequirementsService';
import { ComplianceTierService } from '@/services/compliance/complianceTierService';
import type { RoleComplianceTemplate } from '@/services/compliance/complianceRequirementsService';

interface ComplianceOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userRole: 'AP' | 'IC' | 'IP' | 'IT';
  displayName: string;
  onComplete: (selectedTier: 'basic' | 'robust') => void;
}

type OnboardingStep = 'welcome' | 'role-intro' | 'tier-selection' | 'requirements-preview' | 'getting-started';

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'AP': return Award;
    case 'IC': return GraduationCap;
    case 'IP': return FileText;
    case 'IT': return Shield;
    default: return FileText;
  }
};

const getRoleDescription = (role: string) => {
  switch (role) {
    case 'AP': return 'Authorized Provider - You manage compliance for your organization and team members';
    case 'IC': return 'Instructor Certified - You are a certified instructor with full teaching privileges';
    case 'IP': return 'Instructor Provisional - You are working toward full instructor certification';
    case 'IT': return 'Instructor Trainee - You are beginning your instructor training journey';
    default: return 'Compliance user with specific requirements';
  }
};

const TierComparisonCard: React.FC<{
  tier: 'basic' | 'robust';
  template: RoleComplianceTemplate | null;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ tier, template, isSelected, onSelect }) => {
  if (!template) return null;

  const isBasic = tier === 'basic';
  const requirementCount = template.requirements.length;
  const estimatedTime = isBasic ? '2-3 days' : '1-2 weeks';
  
  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {isBasic ? <Zap className="h-5 w-5 text-green-600" /> : <Target className="h-5 w-5 text-blue-600" />}
            <span className="capitalize">{tier} Tier</span>
          </CardTitle>
          {isSelected && <CheckCircle className="h-5 w-5 text-blue-600" />}
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-gray-600">{template.description}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {requirementCount} requirements
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {estimatedTime}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="space-y-2">
            {template.requirements.slice(0, 3).map((req, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                <span>{req.name}</span>
              </div>
            ))}
            {requirementCount > 3 && (
              <div className="text-xs text-gray-500 ml-5">
                +{requirementCount - 3} more requirements...
              </div>
            )}
          </div>
          
          <div className="pt-2 border-t">
            <Badge className={isBasic ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
              {isBasic ? 'Quick Start' : 'Comprehensive'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const ComplianceOnboardingModal: React.FC<ComplianceOnboardingModalProps> = ({
  isOpen,
  onClose,
  userId,
  userRole,
  displayName,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [selectedTier, setSelectedTier] = useState<'basic' | 'robust'>('basic');
  const [isLoading, setIsLoading] = useState(false);

  const templates = ComplianceRequirementsService.getAllTemplatesForRole(userRole);
  
  const steps: OnboardingStep[] = ['welcome', 'role-intro', 'tier-selection', 'requirements-preview', 'getting-started'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const RoleIcon = getRoleIcon(userRole);

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await ComplianceTierService.assignComplianceTier(userId, userRole, selectedTier);
      onComplete(selectedTier);
      onClose();
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="text-center space-y-6 py-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to Compliance Dashboard
              </h2>
              <p className="text-gray-600 max-w-md mx-auto">
                Let's get you set up with the right compliance requirements for your role. 
                This will only take a few minutes.
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Hello, {displayName}!</strong> We'll guide you through choosing your compliance tier 
                and show you exactly what you need to get started.
              </p>
            </div>
          </div>
        );

      case 'role-intro':
        return (
          <div className="space-y-6 py-4">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <RoleIcon className="h-8 w-8 text-gray-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Your Role: {userRole}
              </h2>
              <p className="text-gray-600 max-w-md mx-auto">
                {getRoleDescription(userRole)}
              </p>
            </div>
            
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-4">
                <h3 className="font-medium text-gray-900 mb-3">What this means for you:</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>You'll have role-specific compliance requirements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>You can choose between Basic or Robust compliance tiers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>You can upgrade your tier at any time</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        );

      case 'tier-selection':
        return (
          <div className="space-y-6 py-4">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Choose Your Compliance Tier
              </h2>
              <p className="text-gray-600">
                Select the tier that best fits your needs. You can always upgrade later.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TierComparisonCard
                tier="basic"
                template={templates.basic}
                isSelected={selectedTier === 'basic'}
                onSelect={() => setSelectedTier('basic')}
              />
              <TierComparisonCard
                tier="robust"
                template={templates.robust}
                isSelected={selectedTier === 'robust'}
                onSelect={() => setSelectedTier('robust')}
              />
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Recommendation:</strong> Start with Basic tier to get up and running quickly, 
                then upgrade to Robust when you're ready for comprehensive compliance.
              </p>
            </div>
          </div>
        );

      case 'requirements-preview':
        const selectedTemplate = selectedTier === 'basic' ? templates.basic : templates.robust;
        return (
          <div className="space-y-6 py-4">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Your {selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} Tier Requirements
              </h2>
              <p className="text-gray-600">
                Here's what you'll need to complete for {selectedTier} tier compliance:
              </p>
            </div>
            
            {selectedTemplate && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{selectedTemplate.role_name}</CardTitle>
                  <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedTemplate.requirements.map((req, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <FileText className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-gray-900">{req.name}</h4>
                          <p className="text-xs text-gray-600 mt-1">{req.description}</p>
                          {req.document_requirements && (
                            <div className="mt-2 text-xs text-gray-500">
                              Files: {req.document_requirements.required_file_types.join(', ')} 
                              (max {req.document_requirements.max_file_size_mb}MB)
                            </div>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {req.weight}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'getting-started':
        return (
          <div className="text-center space-y-6 py-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                You're All Set!
              </h2>
              <p className="text-gray-600 max-w-md mx-auto">
                We'll create your {selectedTier} tier compliance profile and show you exactly 
                what documents to upload first.
              </p>
            </div>
            
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h3 className="font-medium text-blue-900 mb-2">What happens next:</h3>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• Your compliance requirements will be set up</li>
                  <li>• You'll see your personalized dashboard</li>
                  <li>• Upload your first document to get started</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Compliance Setup</span>
            <div className="text-sm text-gray-500">
              Step {currentStepIndex + 1} of {steps.length}
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Progress value={progress} className="w-full" />
          
          {renderStepContent()}
          
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStepIndex === 0}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>
            
            {currentStep === 'getting-started' ? (
              <Button
                onClick={handleComplete}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? 'Setting up...' : 'Complete Setup'}
                <CheckCircle className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="flex items-center gap-2"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ComplianceOnboardingModal;