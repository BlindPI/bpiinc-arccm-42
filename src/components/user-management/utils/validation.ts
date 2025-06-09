
import { PasswordValidationResult } from '@/types/auth';

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  const requirements: string[] = [];
  
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  if (!hasMinLength) {
    errors.push('Password must be at least 8 characters long');
    requirements.push('At least 8 characters');
  }

  if (!hasUppercase) {
    errors.push('Password must contain at least one uppercase letter');
    requirements.push('One uppercase letter');
  }

  if (!hasLowercase) {
    errors.push('Password must contain at least one lowercase letter');
    requirements.push('One lowercase letter');
  }

  if (!hasNumber) {
    errors.push('Password must contain at least one number');
    requirements.push('One number');
  }

  if (!hasSpecialChar) {
    errors.push('Password must contain at least one special character');
    requirements.push('One special character');
  }

  const valid = errors.length === 0;
  const strength = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecialChar].filter(Boolean).length;

  return {
    valid,
    errors,
    requirements,
    strength: (strength / 5) * 100,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar
  };
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
