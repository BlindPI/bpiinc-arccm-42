
import { CourseSelector } from '../CourseSelector';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface FormFieldsProps {
  selectedCourseId: string;
  setSelectedCourseId: (id: string) => void;
  issueDate: string;
  setIssueDate: (date: string) => void;
  disabled?: boolean;
}

export function FormFields({
  selectedCourseId,
  setSelectedCourseId,
  issueDate,
  setIssueDate,
  disabled = false
}: FormFieldsProps) {
  return (
    <div className="flex flex-col space-y-4">
      <CourseSelector 
        selectedCourseId={selectedCourseId} 
        onCourseSelect={setSelectedCourseId} 
      />
      <div>
        <Label htmlFor="issueDate">Issue Date</Label>
        <Input 
          id="issueDate" 
          type="date" 
          value={issueDate} 
          onChange={e => setIssueDate(e.target.value)} 
          required 
          placeholder="yyyy-mm-dd"
          className="mt-1"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
