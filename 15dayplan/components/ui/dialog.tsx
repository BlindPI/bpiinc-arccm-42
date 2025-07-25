import * as React from "react";

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => onOpenChange?.(false)}
      />
      <div className="relative z-50">
        {children}
      </div>
    </div>
  );
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

export function DialogContent({ className, children, ...props }: DialogContentProps) {
  return (
    <div 
      className={`bg-white rounded-lg shadow-lg w-full max-w-md mx-auto overflow-auto p-6 ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

export function DialogHeader({ className, children, ...props }: DialogHeaderProps) {
  return (
    <div 
      className={`flex flex-col space-y-1.5 text-center sm:text-left mb-4 ${className || ""}`} 
      {...props}
    >
      {children}
    </div>
  );
}

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  className?: string;
  children?: React.ReactNode;
}

export function DialogTitle({ className, children, ...props }: DialogTitleProps) {
  return (
    <h3 
      className={`text-lg font-semibold leading-none tracking-tight ${className || ""}`} 
      {...props}
    >
      {children}
    </h3>
  );
}

interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  className?: string;
  children?: React.ReactNode;
}

export function DialogDescription({ className, children, ...props }: DialogDescriptionProps) {
  return (
    <p 
      className={`text-sm text-muted-foreground ${className || ""}`} 
      {...props}
    >
      {children}
    </p>
  );
}