
import { useState, useEffect } from 'react';
import { Check, CircleCheck, Circle } from 'lucide-react';

interface ValidationChecklistProps {
  name: string;
  email: string;
  selectedCourseId: string;
  issueDate: string;
  expiryDate: string;
  isValidated: boolean;
  setIsValidated?: (v: boolean) => void;
}

export function ValidationChecklist({
  name,
  email,
  selectedCourseId,
  issueDate,
  expiryDate,
  isValidated,
  setIsValidated
}: ValidationChecklistProps) {
  const [checks, setChecks] = useState({
    courseDuration: false,
    contentCompletion: false,
    attendanceParticipation: false,
    teachingConfirmation: false,
  });

  useEffect(() => {
    const courseDurationValid = selectedCourseId !== '';
    const contentCompletionValid = name.trim() !== '' && email.trim() !== '';
    const attendanceParticipationValid = issueDate !== '';
    const teachingConfirmationValid = expiryDate !== '';
    
    setChecks({
      courseDuration: courseDurationValid,
      contentCompletion: contentCompletionValid,
      attendanceParticipation: attendanceParticipationValid,
      teachingConfirmation: teachingConfirmationValid,
    });
    
    // Auto-validate if all checks pass
    const allValid = courseDurationValid && 
                     contentCompletionValid && 
                     attendanceParticipationValid && 
                     teachingConfirmationValid;
    
    if (setIsValidated) {
      setIsValidated(allValid);
    }
  }, [name, email, selectedCourseId, issueDate, expiryDate, setIsValidated]);

  const allChecksValid = Object.values(checks).every(check => check);

  return (
    <div className="space-y-4 border rounded-lg border-muted p-4 bg-muted/20">
      <div className="flex items-center gap-2 pb-2 border-b border-muted">
        <Check className="h-5 w-5 text-primary" />
        <h3 className="font-medium">Validation Checklist</h3>
      </div>
      
      <ul className="space-y-2">
        <li className="flex items-center gap-2">
          {checks.courseDuration ? 
            <CircleCheck className="h-5 w-5 text-green-500" /> : 
            <Circle className="h-5 w-5 text-muted-foreground" />
          }
          <span className={checks.courseDuration ? "text-gray-900" : "text-muted-foreground"}>
            Course duration verified
          </span>
        </li>
        
        <li className="flex items-center gap-2">
          {checks.contentCompletion ? 
            <CircleCheck className="h-5 w-5 text-green-500" /> : 
            <Circle className="h-5 w-5 text-muted-foreground" />
          }
          <span className={checks.contentCompletion ? "text-gray-900" : "text-muted-foreground"}>
            Course content completion confirmed
          </span>
        </li>
        
        <li className="flex items-center gap-2">
          {checks.attendanceParticipation ? 
            <CircleCheck className="h-5 w-5 text-green-500" /> : 
            <Circle className="h-5 w-5 text-muted-foreground" />
          }
          <span className={checks.attendanceParticipation ? "text-gray-900" : "text-muted-foreground"}>
            Attendance and participation verified
          </span>
        </li>
        
        <li className="flex items-center gap-2">
          {checks.teachingConfirmation ? 
            <CircleCheck className="h-5 w-5 text-green-500" /> : 
            <Circle className="h-5 w-5 text-muted-foreground" />
          }
          <span className={checks.teachingConfirmation ? "text-gray-900" : "text-muted-foreground"}>
            Teaching confirmation completed
          </span>
        </li>
      </ul>
      
      <div className={`flex items-center gap-2 pt-2 border-t border-muted ${allChecksValid ? "text-green-600" : "text-muted-foreground"}`}>
        {allChecksValid ? 
          <Check className="h-5 w-5" /> : 
          <Circle className="h-5 w-5" />
        }
        <span className="font-medium">
          {allChecksValid ? "All validation checks passed" : "Complete all required fields"}
        </span>
      </div>
    </div>
  );
}
