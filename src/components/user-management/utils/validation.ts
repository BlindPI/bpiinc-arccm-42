
import { PasswordValidationResult } from "@/types/auth";
import zxcvbn from "zxcvbn";

export const validatePassword = (password: string): PasswordValidationResult => {
  if (!password) {
    return {
      valid: false,
      message: "Password is required",
      strength: 0,
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
  
  return {
    valid: allRequirementsMet && result.score >= 3,
    message: allRequirementsMet ? undefined : "Password does not meet all requirements",
    strength: result.score,
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
