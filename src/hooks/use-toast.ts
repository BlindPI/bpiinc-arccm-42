
import { useToast as useToastOriginal, toast as toastOriginal } from "@/hooks/use-toast";

// Re-export types and functionality for backward compatibility
export { useToastOriginal as useToast, toastOriginal as toast };
export type { ToastVariant } from "@/hooks/use-toast";
