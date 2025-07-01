
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HelpTooltipProps {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({ 
  content, 
  children, 
  side = 'top' 
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="inline-flex items-center gap-1 cursor-help">
          {children}
          <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
        </div>
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-xs">
        <p className="text-sm">{content}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

interface OnboardingStep {
  title: string;
  content: string;
  target?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface OnboardingTourProps {
  steps: OnboardingStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  steps,
  isOpen,
  onClose,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {currentStepData.title}
            <span className="text-sm text-muted-foreground">
              {currentStep + 1} of {steps.length}
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {currentStepData.content}
          </p>
          
          {currentStepData.action && (
            <Button 
              variant="outline" 
              onClick={currentStepData.action.onClick}
              className="w-full"
            >
              {currentStepData.action.label}
            </Button>
          )}
          
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              size="sm"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <div className="flex space-x-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "h-2 w-2 rounded-full",
                    index === currentStep ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>
            
            <Button onClick={nextStep} size="sm">
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
              {currentStep < steps.length - 1 && (
                <ChevronRight className="h-4 w-4 ml-1" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface ContextualHelpPanelProps {
  title: string;
  sections: {
    title: string;
    content: string;
    links?: { label: string; href: string }[];
  }[];
}

export const ContextualHelpPanel: React.FC<ContextualHelpPanelProps> = ({
  title,
  sections
}) => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="outline" size="sm" className="gap-2">
        <HelpCircle className="h-4 w-4" />
        Help
      </Button>
    </DialogTrigger>
    <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      
      <div className="space-y-6">
        {sections.map((section, index) => (
          <div key={index} className="space-y-2">
            <h3 className="font-medium">{section.title}</h3>
            <p className="text-sm text-muted-foreground">{section.content}</p>
            {section.links && (
              <div className="space-y-1">
                {section.links.map((link, linkIndex) => (
                  <a
                    key={linkIndex}
                    href={link.href}
                    className="block text-sm text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </DialogContent>
  </Dialog>
);
