interface AlertProps {
  className?: string;
  children: any;
}

export function Alert({ className = "", children }: AlertProps) {
  return (
    <div
      className={`relative w-full rounded-lg border p-4 ${className}`}
      role="alert"
    >
      {children}
    </div>
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
