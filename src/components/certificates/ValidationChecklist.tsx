
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export interface ValidationChecklistProps {
  name: string;
  email: string;
  selectedCourseId: string;
  issueDate: string;
  expiryDate: string;
  isValidated: boolean;
  onValidationChange: (isValid: boolean) => void;
}

export function ValidationChecklist({ onValidationChange }: ValidationChecklistProps) {
  const [validations, setValidations] = React.useState({
    duration: false,
    completion: false,
    attendance: false,
    teaching: false
  });

  React.useEffect(() => {
    const isAllChecked = Object.values(validations).every(v => v);
    onValidationChange(isAllChecked);
  }, [validations, onValidationChange]);

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
      <h3 className="font-medium mb-2">Validation Checklist</h3>
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="duration"
            checked={validations.duration}
            onCheckedChange={(checked) => 
              setValidations(prev => ({ ...prev, duration: checked === true }))
            }
          />
          <Label htmlFor="duration">
            I confirm the course duration requirements have been met
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="completion"
            checked={validations.completion}
            onCheckedChange={(checked) => 
              setValidations(prev => ({ ...prev, completion: checked === true }))
            }
          />
          <Label htmlFor="completion">
            I confirm all required content has been completed
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="attendance"
            checked={validations.attendance}
            onCheckedChange={(checked) => 
              setValidations(prev => ({ ...prev, attendance: checked === true }))
            }
          />
          <Label htmlFor="attendance">
            I confirm attendance and participation requirements have been met
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="teaching"
            checked={validations.teaching}
            onCheckedChange={(checked) => 
              setValidations(prev => ({ ...prev, teaching: checked === true }))
            }
          />
          <Label htmlFor="teaching">
            I confirm all teaching components have been successfully delivered
          </Label>
        </div>
      </div>
    </div>
  );
}
