
import { cn } from '@/lib/utils';
import { Shield } from 'lucide-react';

interface PasswordStrengthMeterProps {
  strength: number;
}

export const PasswordStrengthMeter = ({ strength }: PasswordStrengthMeterProps) => {
  const getStrengthLabel = (strength: number) => {
    if (strength === 0) return 'Very Weak';
    if (strength === 1) return 'Weak';
    if (strength === 2) return 'Fair';
    if (strength === 3) return 'Good';
    return 'Strong';
  };

  const getStrengthColor = (strength: number) => {
    if (strength === 0) return 'bg-red-500';
    if (strength === 1) return 'bg-orange-500';
    if (strength === 2) return 'bg-yellow-500';
    if (strength === 3) return 'bg-lime-500';
    return 'bg-green-500';
  };

  const bars = Array.from({ length: 4 }, (_, index) => (
    <div
      key={index}
      className={cn(
        'h-2 w-full rounded transition-all',
        index <= strength ? getStrengthColor(strength) : 'bg-gray-200'
      )}
    />
  ));

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-gray-700">
          Password Strength: {getStrengthLabel(strength)}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1">{bars}</div>
    </div>
  );
};
