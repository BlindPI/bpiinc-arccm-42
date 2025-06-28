
import React from 'react';
import { SmartInput } from '../atoms/SmartInput';

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  helpText,
  required = false,
  disabled = false,
  placeholder,
  leftIcon,
  rightIcon,
}: FormFieldProps) {
  return (
    <div className="space-y-1">
      <SmartInput
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        label={required ? `${label} *` : label}
        error={error}
        helpText={helpText}
        disabled={disabled}
        placeholder={placeholder}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        validationState={error ? 'invalid' : 'none'}
      />
    </div>
  );
}
