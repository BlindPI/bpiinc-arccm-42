
import React from "react";
import { cn } from "@/lib/utils";

type GradientTextProps = React.HTMLAttributes<HTMLSpanElement>;

export function GradientText({ className, children, ...props }: GradientTextProps) {
  return (
    <span
      className={cn("text-gradient-primary font-bold", className)}
      {...props}
    >
      {children}
    </span>
  );
}
