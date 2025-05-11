
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface ValidationSectionProps {
  confirmations: boolean[];
  setConfirmations: React.Dispatch<React.SetStateAction<boolean[]>>;
}

export function ValidationSection({ confirmations, setConfirmations }: ValidationSectionProps) {
  const handleCheckboxChange = (index: number, checked: boolean) => {
    const newConfirmations = [...confirmations];
    newConfirmations[index] = checked;
    setConfirmations(newConfirmations);
  };

  return (
    <div className="space-y-4">
      <Alert variant="outline" className="bg-blue-50 dark:bg-blue-950 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm">
          Please review and confirm the following items before submitting the batch.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-3">
        <div className="flex items-start space-x-2">
          <Checkbox 
            id="confirm-data" 
            checked={confirmations[0]} 
            onCheckedChange={(checked) => handleCheckboxChange(0, checked === true)}
          />
          <label htmlFor="confirm-data" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            I have reviewed the data and confirm it is accurate
          </label>
        </div>
        
        <div className="flex items-start space-x-2">
          <Checkbox 
            id="confirm-course" 
            checked={confirmations[1]} 
            onCheckedChange={(checked) => handleCheckboxChange(1, checked === true)}
          />
          <label htmlFor="confirm-course" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            The correct course and information is associated with these records
          </label>
        </div>
        
        <div className="flex items-start space-x-2">
          <Checkbox 
            id="confirm-consent" 
            checked={confirmations[2]} 
            onCheckedChange={(checked) => handleCheckboxChange(2, checked === true)}
          />
          <label htmlFor="confirm-consent" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            I have consent to submit certificates on behalf of these individuals
          </label>
        </div>
      </div>
    </div>
  );
}
