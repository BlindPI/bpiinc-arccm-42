
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export const RememberMe = () => {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox id="remember" />
      <Label htmlFor="remember" className="text-sm text-gray-600">
        Remember me
      </Label>
    </div>
  );
};
