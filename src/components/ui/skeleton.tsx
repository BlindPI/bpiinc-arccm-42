import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  [key: string]: any;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
      {...props}
    />
  );
}
