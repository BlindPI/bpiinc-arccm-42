
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium shadow-sm ring-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-primary-600 shadow-md",
        destructive: "bg-destructive text-white hover:bg-destructive/90 shadow-md",
        outline: "border border-input bg-background hover:bg-muted hover:text-primary",
        secondary: "bg-secondary text-white hover:bg-secondary/95 shadow-sm",
        ghost: "hover:bg-accent/40 hover:text-primary",
        link: "text-primary underline underline-offset-4 hover:text-primary/80",
        success: "bg-success text-white hover:bg-success/90 shadow-md",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-6 text-base",
        xl: "h-12 rounded-md px-8 text-base",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
