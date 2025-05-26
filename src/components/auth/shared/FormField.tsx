
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FormFieldProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
}

export const FormField = ({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  required = true,
  autoComplete,
}: FormFieldProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-semibold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        className="h-12 text-base bg-white/80 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg shadow-sm transition-all duration-200 hover:bg-white focus:bg-white"
      />
    </div>
  );
};
