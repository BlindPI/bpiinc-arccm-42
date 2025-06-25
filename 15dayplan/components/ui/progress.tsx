import * as React from "react";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
}

export function Progress({
  value = 0,
  max = 100,
  className,
  indicatorClassName,
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max(0, (value / max) * 100), 100);

  return (
    <div
      className={`relative h-2 w-full overflow-hidden rounded-full bg-gray-200 ${className || ""}`}
      {...props}
    >
      <div
        className={`h-full w-full flex-1 bg-blue-600 transition-all ${indicatorClassName || ""}`}
        style={{ transform: `translateX(-${100 - percentage}%)` }}
      />
    </div>
  );
}