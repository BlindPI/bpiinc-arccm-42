
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        // Add unread dot and accessible contrast for destructive, success, info, warnings
        let statusColor = "";
        if (props.variant === "destructive") statusColor = "border-red-400";
        // You can add more statuses here if your notification system has more

        return (
          <Toast key={id} {...props} className={
            `mb-2 shadow-lg border-l-4 ${statusColor} bg-white/95` +
            " rounded-lg transition-all"
          }>
            <div className="flex items-start gap-2">
              {/* Unread dot indicator */}
              <span className="inline-flex h-2 w-2 mt-2 rounded-full bg-blue-500 animate-pulse" aria-hidden="true" />
              <div className="grid gap-1">
                {title && <ToastTitle className="text-blue-800 ml-1 font-semibold">{title}</ToastTitle>}
                {description && (
                  <ToastDescription className="ml-1">{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport className="fixed top-4 right-4 z-[100] w-full max-w-xs sm:max-w-sm" />
    </ToastProvider>
  )
}
