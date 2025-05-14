
// Re-export toast functionality from the hooks implementation
import { useToast, toast, type ToastVariant, type ToastProps, type Toast } from "@/hooks/use-toast";

// Use export type for re-exporting types when isolatedModules is enabled
export { useToast, toast };
export type { ToastVariant, ToastProps, Toast };
