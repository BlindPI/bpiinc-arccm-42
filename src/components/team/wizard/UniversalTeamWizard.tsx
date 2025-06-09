
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StepBasicInfo } from './steps/StepBasicInfo';
import { StepLocationProvider } from './steps/StepLocationProvider';
import { StepPermissions } from './steps/StepPermissions';
import { StepReview } from './steps/StepReview';

// Simple team creation hook
function useTeamCreation() {
  const [isLoading, setIsLoading] = useState(false);
  
  const createTeam = async (teamData: any) => {
    setIsLoading(true);
    try {
      // Team creation logic would go here
      console.log('Creating team:', teamData);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      return { success: true };
    } catch (error) {
      console.error('Error creating team:', error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };
  
  return { createTeam, isLoading };
}

export function UniversalTeamWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [teamData, setTeamData] = useState({});
  const { createTeam, isLoading } = useTeamCreation();

  const steps = [
    { id: 1, title: 'Basic Information', component: StepBasicInfo },
    { id: 2, title: 'Location & Provider', component: StepLocationProvider },
    { id: 3, title: 'Permissions', component: StepPermissions },
    { id: 4, title: 'Review', component: StepReview }
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    const result = await createTeam(teamData);
    if (result.success) {
      console.log('Team created successfully');
    }
  };

  const CurrentStepComponent = steps[currentStep - 1]?.component;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Team</CardTitle>
        <div className="flex items-center space-x-2">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`h-2 flex-1 rounded ${
                step.id === currentStep
                  ? 'bg-blue-500'
                  : step.id < currentStep
                  ? 'bg-green-500'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          {CurrentStepComponent && (
            <CurrentStepComponent
              data={teamData}
              onChange={setTeamData}
            />
          )}
        </div>
        
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          
          {currentStep === steps.length ? (
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Team'}
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
