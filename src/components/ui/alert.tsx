import * as React from "react";

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive";
  className?: string;
  children?: React.ReactNode;
}

export function Alert({
  variant = "default",
  className,
  children,
  ...props
}: AlertProps) {
  const variantClasses = {
    default: "border-blue-200 bg-blue-50 text-blue-800",
    destructive: "border-red-200 bg-red-50 text-red-800"
  };

  return (
    <div
      className={`relative rounded-lg border p-4 ${variantClasses[variant]} ${className || ""}`}
      role="alert"
      {...props}
    >
      {children}
    </div>
  );
}

interface AlertTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  className?: string;
  children?: React.ReactNode;
}

export function AlertTitle({ className, children, ...props }: AlertTitleProps) {
  return (
    <h5
      className={`mb-1 font-medium leading-none tracking-tight ${className || ""}`}
      {...props}
    >
      {children}
    </h5>
  );
}

interface AlertDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  className?: string;
  children?: React.ReactNode;
}

export function AlertDescription({ className, children, ...props }: AlertDescriptionProps) {
  return (
    <div
      className={`text-sm [&:not(:last-child)]:mb-2 ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  );
}