import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Shield, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Zap,
  Target,
  ArrowRight,
  Users,
  GraduationCap,
  FileCheck,
  Award
} from 'lucide-react';
import { ComplianceTierService, ComplianceTierInfo } from '@/services/compliance/complianceTierService';
import { ComplianceRequirementsService } from '@/services/compliance/complianceRequirementsService';

interface TierComparisonMatrixProps {
  currentUserId: string;
  currentUserRole: 'SA' | 'AD' | 'AP' | 'IC' | 'IP' | 'IT';
  onTierSelect?: (tier: 'basic' | 'robust') => void;
  showUpgradeOption?: boolean;
}

interface RequirementComparison {
  name: string;
  category: string;
  inBasic: boolean;
  inRobust: boolean;
  description: string;
  isCompleted?: boolean;
}

export function TierComparisonMatrix({ 
  currentUserId, 
  currentUserRole,
  onTierSelect,
  showUpgradeOption = true 
}: TierComparisonMatrixProps) {
  const [currentTierInfo, setCurrentTierInfo] = useState<ComplianceTierInfo | null>(null);
  const [requirementComparison, setRequirementComparison] = useState<RequirementComparison[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showImpactPreview, setShowImpactPreview] = useState(false);

  useEffect(() => {
    loadComparisonData();
  }, [currentUserId, currentUserRole]);

  const loadComparisonData = async () => {
    try {
      setIsLoading(true);
      
      // Get current tier info
      const tierInfo = await ComplianceTierService.getUserComplianceTierInfo(currentUserId);
      setCurrentTierInfo(tierInfo);

      // Handle admin roles (SA, AD) by using AP templates for demonstration
      // Admin roles don't have compliance requirements themselves
      const roleForTemplates = (currentUserRole === 'SA' || currentUserRole === 'AD') ? 'AP' : currentUserRole as 'AP' | 'IC' | 'IP' | 'IT';
      
      // Get requirements for both tiers
      const basicTemplate = ComplianceRequirementsService.getRequirementsTemplateByTier(roleForTemplates, 'basic');
      const robustTemplate = ComplianceRequirementsService.getRequirementsTemplateByTier(roleForTemplates, 'robust');

      if (!basicTemplate || !robustTemplate) {
        console.warn('Could not load tier templates for role:', roleForTemplates);
        return;
      }

      // Create comparison matrix
      const allRequirements = new Map<string, RequirementComparison>();

      // Add basic requirements
      basicTemplate.requirements.forEach(req => {
        allRequirements.set(req.name, {
          name: req.name,
          category: req.category,
          inBasic: true,
          inRobust: false,
          description: req.description || `${req.name} requirement`,
          isCompleted: false
        });
      });

      // Add robust requirements
      robustTemplate.requirements.forEach(req => {
        const existing = allRequirements.get(req.name);
        if (existing) {
          existing.inRobust = true;
        } else {
          allRequirements.set(req.name, {
            name: req.name,
            category: req.category,
            inBasic: false,
            inRobust: true,
            description: req.description || `${req.name} requirement`,
            isCompleted: false
          });
        }
      });

      setRequirementComparison(Array.from(allRequirements.values()));
    } catch (error) {
      console.error('Error loading comparison data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTierStats = (tier: 'basic' | 'robust') => {
    const tierRequirements = requirementComparison.filter(req => 
      tier === 'basic' ? req.inBasic : req.inRobust
    );
    
    return {
      total: tierRequirements.length,
      categories: [...new Set(tierRequirements.map(req => req.category))].length,
      completedByCurrentUser: tierRequirements.filter(req => req.isCompleted).length
    };
  };

  const getRequirementIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'documents':
      case 'documentation':
        return <FileCheck className="h-4 w-4" />;
      case 'training':
      case 'education':
        return <GraduationCap className="h-4 w-4" />;
      case 'certification':
      case 'certificates':
        return <Award className="h-4 w-4" />;
      case 'background':
      case 'verification':
        return <Shield className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const basicStats = getTierStats('basic');
  const robustStats = getTierStats('robust');
  const additionalRequirements = robustStats.total - basicStats.total;

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 animate-spin" />
            Loading Tier Comparison...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded-md animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Compliance Tier Comparison</h2>
        <p className="text-muted-foreground">
          Compare Basic and Robust compliance tiers to choose what's right for you
        </p>
      </div>

      {/* Current Status Alert */}
      {currentTierInfo && (
        <Alert className="border-blue-200 bg-blue-50">
          <Users className="h-4 w-4" />
          <AlertDescription>
            You are currently on the <strong>{currentTierInfo.tier.charAt(0).toUpperCase() + currentTierInfo.tier.slice(1)} tier</strong> 
            {' '}with {currentTierInfo.completion_percentage}% completion 
            ({currentTierInfo.completed_requirements} of {currentTierInfo.total_requirements} requirements)
          </AlertDescription>
        </Alert>
      )}

      {/* Tier Comparison Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Tier Card */}
        <Card className={`relative ${currentTierInfo?.tier === 'basic' ? 'ring-2 ring-blue-500' : ''}`}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Basic Tier
              </CardTitle>
              {currentTierInfo?.tier === 'basic' && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">Current</Badge>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Quick Start (2-3 days)</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Essential requirements only. Ideal for quick onboarding and temporary assignments.
              </p>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-blue-600">{basicStats.total}</div>
                <div className="text-xs text-muted-foreground">Requirements</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-blue-600">{basicStats.categories}</div>
                <div className="text-xs text-muted-foreground">Categories</div>
              </div>
            </div>

            {/* Key Requirements */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Key Requirements:</h4>
              {requirementComparison
                .filter(req => req.inBasic)
                .slice(0, 4)
                .map((req, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>{req.name}</span>
                  </div>
                ))}
              {basicStats.total > 4 && (
                <div className="text-xs text-muted-foreground">
                  + {basicStats.total - 4} more requirements
                </div>
              )}
            </div>

            {/* Action Button */}
            {showUpgradeOption && (
              <Button 
                variant={currentTierInfo?.tier === 'basic' ? 'secondary' : 'outline'} 
                className="w-full"
                disabled={currentTierInfo?.tier === 'basic'}
                onClick={() => onTierSelect?.('basic')}
              >
                {currentTierInfo?.tier === 'basic' ? 'Current Tier' : 'Select Basic'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Robust Tier Card */}
        <Card className={`relative ${currentTierInfo?.tier === 'robust' ? 'ring-2 ring-green-500' : ''}`}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                Robust Tier
              </CardTitle>
              {currentTierInfo?.tier === 'robust' && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">Current</Badge>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Full Certification</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Comprehensive requirements including training, certifications, and ongoing education.
              </p>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-600">{robustStats.total}</div>
                <div className="text-xs text-muted-foreground">Requirements</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-600">{robustStats.categories}</div>
                <div className="text-xs text-muted-foreground">Categories</div>
              </div>
            </div>

            {/* Includes Everything from Basic */}
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Includes everything in Basic tier + {additionalRequirements} additional requirements
              </AlertDescription>
            </Alert>

            {/* Key Additional Requirements */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Additional Requirements:</h4>
              {requirementComparison
                .filter(req => req.inRobust && !req.inBasic)
                .slice(0, 4)
                .map((req, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>{req.name}</span>
                  </div>
                ))}
            </div>

            {/* Action Button */}
            {showUpgradeOption && (
              <Dialog open={showImpactPreview} onOpenChange={setShowImpactPreview}>
                <DialogTrigger asChild>
                  <Button 
                    variant={currentTierInfo?.tier === 'robust' ? 'secondary' : 'default'}
                    className="w-full"
                    disabled={currentTierInfo?.tier === 'robust'}
                  >
                    {currentTierInfo?.tier === 'robust' ? 'Current Tier' : (
                      <>
                        Upgrade to Robust <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </DialogTrigger>
                
                {/* Impact Preview Modal */}
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Upgrade to Robust Tier</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Upgrading to Robust tier will add {additionalRequirements} new requirements to your compliance profile.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                      <h4 className="font-medium">New requirements you'll need to complete:</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {requirementComparison
                          .filter(req => req.inRobust && !req.inBasic)
                          .map((req, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                              {getRequirementIcon(req.category)}
                              <div className="flex-1">
                                <div className="font-medium text-sm">{req.name}</div>
                                <div className="text-xs text-muted-foreground">{req.description}</div>
                                <Badge variant="outline" className="mt-1">{req.category}</Badge>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        onClick={() => {
                          setShowImpactPreview(false);
                          onTierSelect?.('robust');
                        }}
                        className="flex-1"
                      >
                        Confirm Upgrade
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowImpactPreview(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Requirements Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...new Set(requirementComparison.map(req => req.category))].map(category => (
              <div key={category} className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  {getRequirementIcon(category)}
                  {category}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {requirementComparison
                    .filter(req => req.category === category)
                    .map((req, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded text-sm">
                        <span>{req.name}</span>
                        <div className="flex gap-2">
                          {req.inBasic && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">Basic</Badge>
                          )}
                          {req.inRobust && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Robust</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}