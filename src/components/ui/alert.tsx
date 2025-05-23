
interface AlertProps {
  className?: string;
  children: any;
  variant?: string;
}

export function Alert({ className = "", children, variant }: AlertProps) {
  const variantClasses = variant === 'destructive' ? 'border-red-200 bg-red-50 text-red-800' : '';
  
  return (
    <div
      className={`relative w-full rounded-lg border p-4 ${variantClasses} ${className}`}
      role="alert"
    >
      {children}
    </div>
  );
}

interface AlertTitleProps {
  className?: string;
  children: any;
}

export function AlertTitle({ className = "", children }: AlertTitleProps) {
  return (
    <h5 className={`mb-1 font-medium leading-none tracking-tight ${className}`}>
      {children}
    </h5>
  );
}

interface AlertDescriptionProps {
  className?: string;
  children: any;
}

export function AlertDescription({ className = "", children }: AlertDescriptionProps) {
  return (
    <div className={`text-sm ${className}`}>
      {children}
    </div>
  );
}
