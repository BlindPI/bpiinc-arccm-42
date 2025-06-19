import { useState } from 'react';

interface Toast {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (toastData: Toast) => {
    // For now, just log to console
    // In a real implementation, this would show a toast notification
    console.log(`🍞 Toast: ${toastData.title}`, toastData.description);
    
    if (toastData.variant === 'destructive') {
      console.error(`❌ Error: ${toastData.title}`, toastData.description);
    } else {
      console.log(`✅ Success: ${toastData.title}`, toastData.description);
    }

    setToasts(prev => [...prev, toastData]);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.slice(1));
    }, 3000);
  };

  return { toast, toasts };
}

// Export the toast function directly for compatibility
export const toast = (toastData: { title: string; description?: string; variant?: 'default' | 'destructive' }) => {
  console.log(`🍞 Toast: ${toastData.title}`, toastData.description);
  
  if (toastData.variant === 'destructive') {
    console.error(`❌ Error: ${toastData.title}`, toastData.description);
  } else {
    console.log(`✅ Success: ${toastData.title}`, toastData.description);
  }
};
