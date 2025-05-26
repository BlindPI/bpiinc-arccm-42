
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText } from 'lucide-react';

interface BasicDetailsSectionProps {
  name: string;
  description: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

export function BasicDetailsSection({
  name,
  description,
  onNameChange,
  onDescriptionChange,
}: BasicDetailsSectionProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-500" />
          Course Name
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          required
          placeholder="Enter course name"
          className="transition-colors focus:border-primary"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description" className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-500" />
          Description
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Enter course description (optional)"
          className="min-h-[100px] transition-colors focus:border-primary"
        />
      </div>
    </>
  );
}
