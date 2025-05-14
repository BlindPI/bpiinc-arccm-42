
import * as React from "react";
import { toast as sonnerToast, Toaster as SonnerToaster } from "sonner";

// Define toast variants
export type ToastVariant = "default" | "success" | "error" | "warning" | "info" | "destructive";

// Toast props interface
export interface ToastProps {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  action?: React.ReactNode;
  duration?: number;
}

// Interface for toast state
export interface Toast extends ToastProps {
  id: string | number;
}

// Main toast function with consistent styling
export function toast({
  title,
  description,
  variant = "default",
  action,
  duration = 5000,
}: ToastProps) {
  const variantStyles = {
    success: {
      className: "bg-green-50 border-green-300 text-green-800",
    },
    error: {
      className: "bg-red-50 border-red-300 text-red-800",
    },
    warning: {
      className: "bg-amber-50 border-amber-300 text-amber-800",
    },
    info: {
      className: "bg-blue-50 border-blue-300 text-blue-800",
    },
    destructive: {
      className: "bg-red-50 border-red-300 text-red-800",
    },
    default: {
      className: "bg-white border-gray-200 text-gray-800",
    },
  };

  return sonnerToast(title, {
    description,
    action,
    duration,
    className: `border shadow-md ${variantStyles[variant].className}`,
  });
}

// Mock implementation of toasts array for shadcn compatibility
const toastsState: Toast[] = [];

// Hook for using toast functionality
export function useToast() {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
    error: (title: string, description?: string) => 
      toast({ title, description, variant: "error" }),
    success: (title: string, description?: string) => 
      toast({ title, description, variant: "success" }),
    warning: (title: string, description?: string) => 
      toast({ title, description, variant: "warning" }),
    info: (title: string, description?: string) => 
      toast({ title, description, variant: "info" }),
    // Add empty toasts array for compatibility with shadcn/ui toast
    toasts: toastsState
  };
}
