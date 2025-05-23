
import { PasswordValidationResult } from "@/types/auth";
import zxcvbn from "zxcvbn";

export const validatePassword = (password: string): PasswordValidationResult => {
  if (!password) {
    return {
      valid: false,
      errors: ["Password is required"],
      strength: 'weak',
      message: "Password is required",
      requirements: {
        hasMinLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecialChar: false
      }
    };
  }
  
  // Check password strength
  const result = zxcvbn(password);
  
  // Specific checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
  
  const allRequirementsMet = 
    hasMinLength && 
    hasUppercase && 
    hasLowercase && 
    hasNumber && 
    hasSpecialChar;

  const errors = [];
  if (!hasMinLength) errors.push("Password must be at least 8 characters long");
  if (!hasUppercase) errors.push("Password must contain at least one uppercase letter");
  if (!hasLowercase) errors.push("Password must contain at least one lowercase letter");
  if (!hasNumber) errors.push("Password must contain at least one number");
  if (!hasSpecialChar) errors.push("Password must contain at least one special character");
  
  let strengthLabel: 'weak' | 'medium' | 'strong' = 'weak';
  if (result.score >= 3) strengthLabel = 'strong';
  else if (result.score >= 2) strengthLabel = 'medium';
  
  return {
    valid: allRequirementsMet && result.score >= 3,
    errors,
    strength: strengthLabel,
    message: allRequirementsMet ? undefined : "Password does not meet all requirements",
    requirements: {
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecialChar
    }
  };
};

export const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
