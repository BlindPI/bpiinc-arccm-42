
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DateInputsProps {
  issueDate: string;
  expiryDate: string;
  onIssueDateChange: (value: string) => void;
  onExpiryDateChange: (value: string) => void;
}

export function DateInputs({ 
  issueDate, 
  expiryDate, 
  onIssueDateChange, 
  onExpiryDateChange 
}: DateInputsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="issueDate">Issue Date</Label>
        <Input
          id="issueDate"
          type="text"
          value={issueDate}
          onChange={(e) => onIssueDateChange(e.target.value)}
          required
          placeholder="MM/DD/YYYY"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="expiryDate">Expiry Date</Label>
        <Input
          id="expiryDate"
          type="text"
          value={expiryDate}
          onChange={(e) => onExpiryDateChange(e.target.value)}
          required
          placeholder="MM/DD/YYYY"
        />
      </div>
    </>
  );
}
