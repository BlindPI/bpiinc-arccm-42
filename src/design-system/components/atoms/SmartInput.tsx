
import React, { forwardRef } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface SmartInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helpText?: string;
  error?: string;
  success?: string;
  validationState?: 'none' | 'valid' | 'invalid';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const SmartInput = forwardRef<HTMLInputElement, SmartInputProps>(({
  label,
  helpText,
  error,
  success,
  validationState = 'none',
  leftIcon,
  rightIcon,
  className = '',
  ...props
}, ref) => {
  const hasError = error || validationState === 'invalid';
  const hasSuccess = success || validationState === 'valid';

  const inputStyles = `
    w-full px-3 py-2 border rounded-lg text-base
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-1
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    ${leftIcon ? 'pl-10' : ''}
    ${rightIcon || hasError || hasSuccess ? 'pr-10' : ''}
    ${hasError 
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
      : hasSuccess 
        ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
    }
  `;

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="h-5 w-5 text-gray-400">
              {leftIcon}
            </div>
          </div>
        )}
        
        <input
          ref={ref}
          className={`${inputStyles} ${className}`}
          {...props}
        />
        
        {(rightIcon || hasError || hasSuccess) && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {hasError ? (
              <AlertCircle className="h-5 w-5 text-red-500" />
            ) : hasSuccess ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              rightIcon && <div className="h-5 w-5 text-gray-400">{rightIcon}</div>
            )}
          </div>
        )}
      </div>
      
      {(helpText || error || success) && (
        <div className="text-sm">
          {error && <p className="text-red-600">{error}</p>}
          {success && <p className="text-green-600">{success}</p>}
          {helpText && !error && !success && <p className="text-gray-500">{helpText}</p>}
        </div>
      )}
    </div>
  );
});

SmartInput.displayName = 'SmartInput';
