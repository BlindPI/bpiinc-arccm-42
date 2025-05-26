
import React from "react";

interface PageTransitionProps {
  children: React.ReactNode;
  isTransitioning: boolean;
}

export function PageTransition({ children, isTransitioning }: PageTransitionProps) {
  return (
    <div
      className={`w-full transition-all duration-300 ease-out ${
        isTransitioning 
          ? "opacity-0 translate-y-2" 
          : "opacity-100 translate-y-0"
      }`}
    >
      {children}
    </div>
  );
}
