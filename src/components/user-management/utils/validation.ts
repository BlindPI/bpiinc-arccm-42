
import zxcvbn from "zxcvbn";

export interface PasswordValidationResult {
  score: number;
  isValid: boolean;
}

export const validatePassword = (password: string): PasswordValidationResult => {
  if (!password) {
    return {
      score: 0,
      isValid: false
    };
  }
  const result = zxcvbn(password);
  return {
    score: result.score,
    isValid: result.score >= 3
  };
};

export const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
