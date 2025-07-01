import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { 
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Star,
  Target,
  BookOpen,
  Users,
  Award,
  Lightbulb,
  Play,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ComplianceService } from '@/services/compliance/complianceService';
import { ComplianceTierService } from '@/services/compliance/complianceTierService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface IntelligentOnboardingSystemProps {
  userId: string;
  userRole: string;
  tier: string;
  isNewUser?: boolean;
  onComplete?: () => void;
}

interface OnboardingStep {
  id: string;
  type: 'welcome' | 'profile_setup' | 'system_tour' | 'requirements_overview' | 'hands_on_practice' | 'goal_setting';
  title: string;
  description: string;
  content: string;
  estimatedMinutes: number;
  required: boolean;
  dependencies?: string[];
}

interface OnboardingProfile {
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  learningStyle: 'visual' | 'hands_on' | 'structured' | 'collaborative';
  timeAvailable: 'limited' | 'moderate' | 'flexible';
  previousExperience: boolean;
  recommendedGoals: string[];
  completedSteps: string[];
}

interface StepComponentProps {
  step: OnboardingStep;
  onComplete: (stepId: string, data?: any) => void;
  userRole: string;
  tier: string;
}

function WelcomeStep({ step, onComplete, userRole, tier }: StepComponentProps) {
  const handleContinue = () => {
    onComplete(step.id, { startTime: new Date().toISOString() });
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Star className="h-8 w-8 text-blue-600" />
        </div>
        <CardTitle className="text-2xl">{step.title}</CardTitle>
        <p className="text-muted-foreground">{step.description}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Your Current Setup</h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{userRole}</Badge>
            <Badge variant="outline">{tier} Tier</Badge>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm">Personalized compliance tracking</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm">Real-time progress monitoring</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm">Automated workflow assistance</span>
          </div>
        </div>
        
        <div className="text-center pt-4">
          <Button onClick={handleContinue} size="lg" className="w-full sm:w-auto">
            Get Started
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileSetupStep({ step, onComplete }: StepComponentProps) {
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [learningStyle, setLearningStyle] = useState<'visual' | 'hands_on' | 'structured' | 'collaborative'>('structured');
  const [timeAvailable, setTimeAvailable] = useState<'limited' | 'moderate' | 'flexible'>('moderate');
  const [previousExperience, setPreviousExperience] = useState<boolean>(false);

  const handleComplete = () => {
    const profileData = {
      experienceLevel,
      learningStyle,
      timeAvailable,
      previousExperience,
      completedAt: new Date().toISOString()
    };
    
    onComplete(step.id, profileData);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          {step.title}
        </CardTitle>
        <p className="text-muted-foreground">{step.description}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-3 block">Experience Level</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {['beginner', 'intermediate', 'advanced'].map((level) => (
                <Button
                  key={level}
                  variant={experienceLevel === level ? 'default' : 'outline'}
                  onClick={() => setExperienceLevel(level as any)}
                  className="justify-start h-auto p-3"
                >
                  <div className="text-left">
                    <div className="font-medium capitalize">{level}</div>
                    <div className="text-xs text-muted-foreground">
                      {level === 'beginner' && 'New to compliance'}
                      {level === 'intermediate' && 'Some experience'}
                      {level === 'advanced' && 'Very experienced'}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-3 block">Learning Style</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'visual', label: 'Visual', desc: 'Charts and diagrams' },
                { key: 'hands_on', label: 'Hands-on', desc: 'Practice and examples' },
                { key: 'structured', label: 'Structured', desc: 'Step-by-step guides' },
                { key: 'collaborative', label: 'Collaborative', desc: 'Team interaction' }
              ].map((style) => (
                <Button
                  key={style.key}
                  variant={learningStyle === style.key ? 'default' : 'outline'}
                  onClick={() => setLearningStyle(style.key as any)}
                  className="justify-start h-auto p-3"
                >
                  <div className="text-left">
                    <div className="font-medium">{style.label}</div>
                    <div className="text-xs text-muted-foreground">{style.desc}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-3 block">Time Available</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { key: 'limited', label: 'Limited', desc: '15-30 min/week' },
                { key: 'moderate', label: 'Moderate', desc: '1-2 hours/week' },
                { key: 'flexible', label: 'Flexible', desc: '3+ hours/week' }
              ].map((time) => (
                <Button
                  key={time.key}
                  variant={timeAvailable === time.key ? 'default' : 'outline'}
                  onClick={() => setTimeAvailable(time.key as any)}
                  className="justify-start h-auto p-3"
                >
                  <div className="text-left">
                    <div className="font-medium">{time.label}</div>
                    <div className="text-xs text-muted-foreground">{time.desc}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="previous-experience"
              checked={previousExperience}
              onChange={(e) => setPreviousExperience(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="previous-experience" className="text-sm">
              I have previous compliance management experience
            </label>
          </div>
        </div>

        <Button onClick={handleComplete} className="w-full">
          Continue Setup
        </Button>
      </CardContent>
    </Card>
  );
}

function SystemTourStep({ step, onComplete }: StepComponentProps) {
  const [tourStep, setTourStep] = useState(0);
  const tourSteps = [
    {
      title: 'Dashboard Overview',
      description: 'Your central hub for tracking compliance progress and key metrics.',
      icon: <Target className="h-8 w-8 text-blue-600" />
    },
    {
      title: 'Requirements Management',
      description: 'View, complete, and track all your compliance requirements.',
      icon: <BookOpen className="h-8 w-8 text-green-600" />
    },
    {
      title: 'Progress Tracking',
      description: 'Monitor your advancement and milestone achievements.',
      icon: <Award className="h-8 w-8 text-purple-600" />
    },
    {
      title: 'Notifications',
      description: 'Stay updated with reminders and important updates.',
      icon: <Lightbulb className="h-8 w-8 text-orange-600" />
    }
  ];

  const handleNext = () => {
    if (tourStep < tourSteps.length - 1) {
      setTourStep(tourStep + 1);
    } else {
      onComplete(step.id, { 
        tourCompleted: true,
        stepsViewed: tourSteps.length,
        completedAt: new Date().toISOString()
      });
    }
  };

  const handlePrevious = () => {
    if (tourStep > 0) {
      setTourStep(tourStep - 1);
    }
  };

  const currentStep = tourSteps[tourStep];

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-6 w-6" />
          {step.title}
        </CardTitle>
        <p className="text-muted-foreground">{step.description}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            {currentStep.icon}
          </div>
          <h3 className="text-xl font-semibold mb-2">{currentStep.title}</h3>
          <p className="text-muted-foreground">{currentStep.description}</p>
        </div>

        <div className="flex justify-center">
          <div className="flex space-x-2">
            {tourSteps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-3 h-3 rounded-full transition-colors",
                  index === tourStep ? "bg-blue-600" : 
                  index < tourStep ? "bg-green-600" : "bg-gray-300"
                )}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={tourStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <Button onClick={handleNext}>
            {tourStep === tourSteps.length - 1 ? 'Complete Tour' : 'Next'}
            {tourStep !== tourSteps.length - 1 && <ChevronRight className="h-4 w-4 ml-2" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RequirementsOverviewStep({ step, onComplete, userRole, tier }: StepComponentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [requirements, setRequirements] = useState<any[]>([]);

  useEffect(() => {
    const loadRequirements = async () => {
      try {
        const metrics = await ComplianceService.getComplianceMetricsForRole(userRole);
        const filteredMetrics = metrics.filter(metric => 
          metric.applicable_tiers?.includes(tier.toLowerCase()) || 
          !metric.applicable_tiers
        );
        setRequirements(filteredMetrics.slice(0, 5)); // Show first 5 as example
      } catch (error) {
        console.error('Error loading requirements:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRequirements();
  }, [userRole, tier]);

  const handleComplete = () => {
    onComplete(step.id, {
      requirementsViewed: requirements.length,
      role: userRole,
      tier,
      completedAt: new Date().toISOString()
    });
  };

  if (isLoading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          {step.title}
        </CardTitle>
        <p className="text-muted-foreground">{step.description}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Your Compliance Requirements</h4>
          <p className="text-sm text-blue-700">
            Based on your role ({userRole}) and tier ({tier}), here are your key requirements:
          </p>
        </div>

        <div className="space-y-3">
          {requirements.map((requirement, index) => (
            <div key={requirement.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h5 className="font-medium">{requirement.name}</h5>
                  <p className="text-sm text-muted-foreground mt-1">
                    {requirement.description}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {requirement.category}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {requirement.measurement_type}
                    </Badge>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  #{index + 1}
                </div>
              </div>
            </div>
          ))}
        </div>

        {requirements.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No specific requirements found for your role and tier.</p>
          </div>
        )}

        <div className="text-center">
          <Button onClick={handleComplete} className="w-full sm:w-auto">
            Continue to Practice
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function GoalSettingStep({ step, onComplete }: StepComponentProps) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [customGoal, setCustomGoal] = useState('');

  const predefinedGoals = [
    'Complete all basic requirements within 30 days',
    'Achieve 90% compliance score',
    'Submit all documentation on time',
    'Improve quality rating to 4+ stars',
    'Complete advanced tier requirements',
    'Maintain consistent weekly progress'
  ];

  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const handleComplete = () => {
    const goals = [...selectedGoals];
    if (customGoal.trim()) {
      goals.push(customGoal.trim());
    }

    onComplete(step.id, {
      selectedGoals: goals,
      customGoal: customGoal.trim(),
      completedAt: new Date().toISOString()
    });
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-6 w-6" />
          {step.title}
        </CardTitle>
        <p className="text-muted-foreground">{step.description}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-medium mb-3">Choose your goals:</h4>
          <div className="space-y-2">
            {predefinedGoals.map((goal) => (
              <Button
                key={goal}
                variant={selectedGoals.includes(goal) ? 'default' : 'outline'}
                onClick={() => toggleGoal(goal)}
                className="w-full justify-start h-auto p-3 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-4 h-4 rounded border-2 flex items-center justify-center",
                    selectedGoals.includes(goal) ? "bg-white border-white" : "border-current"
                  )}>
                    {selectedGoals.includes(goal) && (
                      <CheckCircle className="h-3 w-3 text-blue-600" />
                    )}
                  </div>
                  <span className="text-sm">{goal}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Add custom goal (optional):</label>
          <input
            type="text"
            value={customGoal}
            onChange={(e) => setCustomGoal(e.target.value)}
            placeholder="Enter your personal compliance goal..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <Button 
          onClick={handleComplete} 
          className="w-full"
          disabled={selectedGoals.length === 0 && !customGoal.trim()}
        >
          Complete Setup
        </Button>
      </CardContent>
    </Card>
  );
}

export function IntelligentOnboardingSystem({
  userId,
  userRole,
  tier,
  isNewUser = false,
  onComplete
}: IntelligentOnboardingSystemProps) {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [onboardingPath, setOnboardingPath] = useState<OnboardingStep[]>([]);
  const [userProfile, setUserProfile] = useState<OnboardingProfile | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<number>(0);
  const [showExitDialog, setShowExitDialog] = useState(false);

  // Initialize onboarding path based on user analysis
  useEffect(() => {
    const initializeOnboardingPath = async () => {
      try {
        // Get user's current compliance status
        const summary = await ComplianceService.getUserComplianceSummary(userId);
        const hasExistingRecords = summary.total_metrics > 0;

        // Generate adaptive onboarding path
        const path: OnboardingStep[] = [
          {
            id: 'welcome',
            type: 'welcome',
            title: 'Welcome to Compliance Management',
            description: 'Let\'s get you started with your compliance journey',
            content: 'Welcome content',
            estimatedMinutes: 2,
            required: true
          },
          {
            id: 'profile_setup',
            type: 'profile_setup',
            title: 'Set Up Your Profile',
            description: 'Help us personalize your experience',
            content: 'Profile setup content',
            estimatedMinutes: 5,
            required: true
          },
          {
            id: 'system_tour',
            type: 'system_tour',
            title: 'System Tour',
            description: 'Explore the key features and navigation',
            content: 'System tour content',
            estimatedMinutes: 8,
            required: !hasExistingRecords
          },
          {
            id: 'requirements_overview',
            type: 'requirements_overview',
            title: 'Your Requirements',
            description: 'Review your specific compliance requirements',
            content: 'Requirements overview content',
            estimatedMinutes: 10,
            required: true
          },
          {
            id: 'goal_setting',
            type: 'goal_setting',
            title: 'Set Your Goals',
            description: 'Define your compliance objectives',
            content: 'Goal setting content',
            estimatedMinutes: 5,
            required: true
          }
        ];

        // Filter required steps for existing users
        const filteredPath = isNewUser ? path : path.filter(step => step.required);
        setOnboardingPath(filteredPath);

        // Initialize user profile
        setUserProfile({
          experienceLevel: hasExistingRecords ? 'intermediate' : 'beginner',
          learningStyle: 'structured',
          timeAvailable: 'moderate',
          previousExperience: hasExistingRecords,
          recommendedGoals: [],
          completedSteps: []
        });

      } catch (error) {
        console.error('Failed to initialize onboarding:', error);
        // Fallback to basic path
        setOnboardingPath([
          {
            id: 'welcome',
            type: 'welcome',
            title: 'Welcome',
            description: 'Get started',
            content: '',
            estimatedMinutes: 2,
            required: true
          }
        ]);
      }
    };

    initializeOnboardingPath();
  }, [userId, userRole, tier, isNewUser]);

  // Handle step completion
  const handleStepComplete = async (stepId: string, data?: any) => {
    try {
      setCompletedSteps(prev => new Set(prev).add(stepId));

      // Log step completion to audit log
      await supabase.from('compliance_audit_log').insert({
        user_id: userId,
        audit_type: 'onboarding_step_completed',
        notes: `Completed onboarding step: ${stepId}`,
        new_value: { stepId, data },
        performed_by: userId
      });

      // Update user profile if profile data received
      if (stepId === 'profile_setup' && data) {
        setUserProfile(prev => prev ? { ...prev, ...data } : data);
      }

      // Move to next step or complete onboarding
      if (currentStep < onboardingPath.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        await handleOnboardingComplete();
      }

      // Update progress
      const newProgress = ((completedSteps.size + 1) / onboardingPath.length) * 100;
      setProgress(newProgress);

    } catch (error) {
      console.error('Failed to complete step:', error);
      toast.error('Failed to save progress. Please try again.');
    }
  };

  // Handle onboarding completion
  const handleOnboardingComplete = async () => {
    try {
      // Mark onboarding as complete in user preferences
      await supabase.from('user_preferences').upsert({
        user_id: userId,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        profile_data: userProfile
      });

      // Log completion
      await supabase.from('compliance_audit_log').insert({
        user_id: userId,
        audit_type: 'onboarding_completed',
        notes: 'User completed onboarding process',
        new_value: {
          totalSteps: onboardingPath.length,
          completedSteps: Array.from(completedSteps),
          profile: userProfile
        },
        performed_by: userId
      });

      toast.success('Onboarding completed successfully!');
      onComplete?.();

    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      toast.error('Failed to complete onboarding. Please try again.');
    }
  };

  // Render current step component
  const renderCurrentStep = () => {
    if (!onboardingPath[currentStep]) return null;

    const step = onboardingPath[currentStep];
    const commonProps = {
      step,
      onComplete: handleStepComplete,
      userRole,
      tier
    };

    switch (step.type) {
      case 'welcome':
        return <WelcomeStep {...commonProps} />;
      case 'profile_setup':
        return <ProfileSetupStep {...commonProps} />;
      case 'system_tour':
        return <SystemTourStep {...commonProps} />;
      case 'requirements_overview':
        return <RequirementsOverviewStep {...commonProps} />;
      case 'goal_setting':
        return <GoalSettingStep {...commonProps} />;
      default:
        return <div>Unknown step type: {step.type}</div>;
    }
  };

  if (onboardingPath.length === 0) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Preparing your onboarding experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-auto">
      {/* Progress Header */}
      <div className="sticky top-0 bg-background border-b z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold">Getting Started</h1>
              <Badge variant="outline">
                Step {currentStep + 1} of {onboardingPath.length}
              </Badge>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowExitDialog(true)}
            >
              Exit
            </Button>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {renderCurrentStep()}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="sticky bottom-0 bg-background border-t">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {onboardingPath.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-3 h-3 rounded-full transition-colors",
                    index === currentStep
                      ? "bg-blue-600"
                      : index < currentStep
                      ? "bg-green-600"
                      : "bg-gray-300"
                  )}
                />
              ))}
            </div>

            <div className="w-24"> {/* Spacer to balance layout */}
              {/* Navigation is handled by individual step components */}
            </div>
          </div>
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exit Onboarding?</DialogTitle>
            <DialogDescription>
              Are you sure you want to exit the onboarding process? Your progress will be saved 
              and you can continue later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExitDialog(false)}>
              Continue Onboarding
            </Button>
            <Button onClick={onComplete}>
              Exit and Continue Later
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}