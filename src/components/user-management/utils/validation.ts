
import zxcvbn from "zxcvbn";

export const validatePassword = (password: string) => {
  if (!password) return false;
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
