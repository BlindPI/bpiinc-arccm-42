
import * as React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "destructive" | "link" | "ghost" | "success" | "warning";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
  asChild?: boolean;
}

// Export buttonVariants function for use in other components
export function buttonVariants({
  variant = "default",
  size = "default"
}: {
  variant?: "default" | "secondary" | "outline" | "destructive" | "link" | "ghost" | "success" | "warning";
  size?: "default" | "sm" | "lg" | "icon";
} = {}) {
  const variantClasses = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-purple-600 text-white hover:bg-purple-700",
    outline: "border border-gray-300 bg-transparent hover:bg-gray-100 text-gray-800",
    destructive: "bg-red-600 text-white hover:bg-red-700",
    link: "bg-transparent text-blue-600 hover:underline hover:bg-transparent",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-800",
    success: "bg-green-600 text-white hover:bg-green-700",
    warning: "bg-yellow-600 text-white hover:bg-yellow-700"
  };

  const sizeClasses = {
    default: "h-10 px-4 py-2",
    sm: "h-8 px-3 py-1 text-sm",
    lg: "h-12 px-6 py-3",
    icon: "h-10 w-10 p-0"
  };

  return `inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${sizeClasses[size]} ${variantClasses[variant]}`;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = "default",
  size = "default",
  className,
  children,
  asChild = false,
  ...props
}, ref) => {
  const variantClasses = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-purple-600 text-white hover:bg-purple-700",
    outline: "border border-gray-300 bg-transparent hover:bg-gray-100 text-gray-800",
    destructive: "bg-red-600 text-white hover:bg-red-700",
    link: "bg-transparent text-blue-600 hover:underline hover:bg-transparent",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-800",
    success: "bg-green-600 text-white hover:bg-green-700",
    warning: "bg-yellow-600 text-white hover:bg-yellow-700"
  };

  const sizeClasses = {
    default: "h-10 px-4 py-2",
    sm: "h-8 px-3 py-1 text-sm",
    lg: "h-12 px-6 py-3",
    icon: "h-10 w-10 p-0"
  };

  if (asChild) {
    return (
      <span className={`inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${sizeClasses[size]} ${variantClasses[variant]} ${className || ""}`}>
        {children}
      </span>
    );
  }

  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${sizeClasses[size]} ${variantClasses[variant]} ${className || ""}`}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = "Button";
