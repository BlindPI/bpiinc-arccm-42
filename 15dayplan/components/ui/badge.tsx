import * as React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "destructive";
  className?: string;
  children?: React.ReactNode;
}

export function Badge({ 
  variant = "default", 
  className, 
  children, 
  ...props 
}: BadgeProps) {
  const variantClasses = {
    default: "bg-blue-100 text-blue-800",
    secondary: "bg-purple-100 text-purple-800",
    outline: "border border-gray-200 text-gray-700",
    destructive: "bg-red-100 text-red-800"
  };

  return (
    <div
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variantClasses[variant]} ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  );
}